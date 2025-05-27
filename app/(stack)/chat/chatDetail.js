import { StyleSheet, View, KeyboardAvoidingView, Platform, ImageBackground, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native'
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native';
import ChatHeaderComponent from '../../../components/header/ChatHeaderComponent'
import MessageList from '../../../components/chat/MessageList'
import MessageInput from '../../../components/chat/MessageInput'
import socketService from '../../../service/socket.service'
import { editMessageThunk, fetchPaginatedMessages, sendMessage } from '../../../redux/thunks/chat'
import { setCurrentChat, clearMessages, setMessages, addMessage, deleteMessage, updateMessageContent, setEditingMessage, updateMessageStatus } from '../../../redux/slices/chatSlice'
import { getGroupDetail } from '../../../redux/thunks/group';
import MessageListSkeleton from '../../../components/loading/messages/MessageListSkeleton';
import { YStack } from 'tamagui';

const ChatDetail = () => {
    const dispatch = useDispatch();
    const { profile } = useSelector(state => state.profile);
    const { groupId, profileId } = useLocalSearchParams();
    const { goBack } = useLocalSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const messageListRef = React.useRef(null);
    const { groupDetails } = useSelector((state) => state.group);


    const { messages, editingMessage } = useSelector(state => state.chat);

    const [activeTab, setActiveTab] = useState(null);
    const bottomSheetHeight = 300;
    const [refreshKey, setRefreshKey] = useState(0);
    const navigation = useNavigation();
    const hasInitializedRef = useRef(false);
    const hasLoadedGroupDetailRef = useRef(false);
    const lastFetchTimeRef = useRef(0);
    const isFetchingRef = useRef(false);
    const [nextCursor, setNextCursor] = useState(null);
    const cleanupListenersRef = useRef(null);

    // Lấy chi tiết nhóm chat
    useEffect(() => {
        if (groupId && !hasLoadedGroupDetailRef.current && !isFetchingRef.current) {
            console.log('Initial group detail fetch');
            isFetchingRef.current = true;
            lastFetchTimeRef.current = Date.now();

            dispatch(getGroupDetail(groupId))
                .then(() => {
                    hasLoadedGroupDetailRef.current = true;
                    isFetchingRef.current = false;
                })
                .catch(() => {
                    isFetchingRef.current = false;
                });
        }
    }, [groupId, dispatch]);

    const currentGroupDetail = useMemo(() => {
        return groupDetails[groupId] || null;
    }, [groupDetails, groupId]);

    const partnerName = useMemo(() => {


        if (currentGroupDetail) {
            if (currentGroupDetail.isGroup) {
                return currentGroupDetail.name || 'Nhóm chat';
            } else if (currentGroupDetail.participants) {

                const otherParticipant = currentGroupDetail.participants.find(
                    p => p?.profileId !== profile?.id
                );

                return otherParticipant?.name || 'Chat';
            }
        }
        return 'Chat';
    }, [currentGroupDetail, profile?.id]);

    // Thiết lập socket event listeners cho ChatDetail
    useEffect(() => {
        if (!groupId || !profileId || !socketService.socket) return;

        const socket = socketService.getSocket();

        // Xử lý sự kiện xóa tin nhắn
        const handleMessageDelete = (data) => {
            console.log('📱 ChatDetail nhận sự kiện messageDelete:', data);
            const { messageId, groupId: deletedGroupId, newContent } = data;

            // Nếu có newContent, có thể đây thực sự là sự kiện edit nhưng bị gửi nhầm
            if (newContent !== undefined) {
                console.log('Phát hiện sự kiện edit được gửi dưới dạng delete:', messageId, newContent);

                // Xử lý như là edit thay vì delete
                if (deletedGroupId === groupId && messageId) {
                    console.log('Cập nhật tin nhắn thay vì xóa:', messageId, newContent);

                    // Dispatch action để cập nhật tin nhắn
                    dispatch(updateMessageContent({
                        messageId,
                        content: newContent
                    }));

                    // Force re-render component
                    setRefreshKey(prev => prev + 1);

                    // Dừng xử lý ở đây, không xóa tin nhắn
                    return;
                }
            }

            // Nếu không có newContent, xử lý như sự kiện delete thông thường
            if (deletedGroupId === groupId && messageId) {
                console.log('Xóa tin nhắn khỏi UI:', messageId);
                dispatch(deleteMessage(messageId));
                setRefreshKey(prev => prev + 1);
            }
        };

        // Xử lý sự kiện thu hồi tin nhắn
        const handleMessageRecall = (data) => {
            const { messageId, groupId: recalledGroupId } = data;

            // Chỉ xử lý nếu tin nhắn thuộc về nhóm hiện tại
            if (recalledGroupId === groupId && messageId) {
                dispatch({
                    type: 'chat/messageRecalled',
                    payload: {
                        messageId,
                        groupId: recalledGroupId
                    }
                });

                // Force re-render nếu cần
                setRefreshKey(prev => prev + 1);
            }
        };

        const handleMessageEdit = (data) => {
            console.log('📱 ChatDetail nhận sự kiện messageEdit trực tiếp:', data);
            const { messageId, groupId: editedGroupId, newContent } = data;

            // Chỉ xử lý nếu tin nhắn thuộc về nhóm hiện tại
            if (editedGroupId === groupId && messageId) {
                console.log('Cập nhật tin nhắn từ socket event:', messageId, newContent);

                // Dispatch action để cập nhật tin nhắn trong store
                dispatch(updateMessageContent({
                    messageId,
                    content: newContent
                }));

                // Force re-render component nếu cần
                setRefreshKey(prev => prev + 1);
            }
        };

        socket.on('connect', () => console.log('Socket connected successfully chatdetail'));
        socket.on('disconnect', () => console.log('Socket disconnected'));
        socket.on('error', (error) => console.log('Socket error:', error));

        // Đăng ký lắng nghe các sự kiện
        socket.on('messageDelete', handleMessageDelete);
        socket.on('messageRecall', handleMessageRecall);
        socket.on('messageEdit', handleMessageEdit);

        // Dọn dẹp khi component unmount
        return () => {

            // if (socket?.connected) {
            //         socketService.leaveChat(profileId, groupId);
            //     }

            socket.off('messageDelete', handleMessageDelete);
            socket.off('messageRecall', handleMessageRecall);
            socket.off('messageEdit', handleMessageEdit);
        };
    }, [groupId, profileId, dispatch, socketService.socket]);

    // Khởi tạo chat - Sử dụng socketService.initializeChat
    useEffect(() => {
        if (hasInitializedRef.current) return;

        dispatch(clearMessages());
        setIsLoading(true);

        if (groupId && profileId) {
            const initChat = async () => {
                try {
                    const response = await socketService.initializeChat(
                        profileId,
                        groupId,
                        dispatch,
                        fetchPaginatedMessages
                    );

                    if (response?.error) {
                        console.error('Lỗi khởi tạo chat:', response.message);
                        dispatch(setMessages([]));
                    } else if (response?.data?.messages) {
                        const apiMessages = response.data.messages.map(msg => {
                            const imageUrl = msg.fileUrl ||
                                msg.imageUrl ||
                                msg.url ||
                                msg.image ||
                                msg.attachmentUrl ||
                                msg.file ||
                                msg.media ||
                                msg.src ||
                                msg.path ||
                                msg.link;

                            return {
                                id: msg.id,
                                message: msg.content,
                                senderId: msg.senderId,
                                groupId: msg.groupId,
                                createdAt: msg.createdAt,
                                updatedAt: msg.updatedAt,
                                type: msg.type,
                                imageUrl: imageUrl, // SỬA: Mapping đúng imageUrl
                                isRecalled: msg.isRecalled,
                                fileName: msg.fileName,
                                fileSize: msg.fileSize,
                                sender: msg.sender,
                                isMyMessage: msg.senderId === profileId,
                                originalContent: msg.originalContent,
                                isPending: false,
                            };
                        });

                        const sortedApiMessages = [...apiMessages].sort(
                            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                        );

                        console.log('=== INITIAL MESSAGES LOADED ===');
                        console.log('Messages count:', sortedApiMessages.length);
                        console.log('NextCursor:', response.data.nextCursor);

                        dispatch(setMessages(sortedApiMessages));
                        setNextCursor(response.data.nextCursor || null);
                    } else {
                        // Không có tin nhắn
                        dispatch(setMessages([]));
                        setNextCursor(null);
                    }
                } catch (error) {
                    console.error('Lỗi trong quá trình khởi tạo chat:', error);
                    dispatch(setMessages([]));
                    setNextCursor(null);
                } finally {
                    setIsLoading(false);
                    hasInitializedRef.current = true;
                }
            };

            // Thiết lập socket listeners cho ChatDetail
            cleanupListenersRef.current = socketService.setupChatDetailListeners(
                groupId,
                profileId,
                dispatch
            );

            initChat();
        }

        return () => {
            // Dọn dẹp socket listeners khi component unmount
            if (typeof cleanupListenersRef.current === 'function') {
                cleanupListenersRef.current();
                cleanupListenersRef.current = null;
            }
        };
    }, [groupId, profileId, dispatch]);

    // Set current chat
    useEffect(() => {
        dispatch(setCurrentChat({ groupId, profileId }));
        return () => {
            dispatch(setCurrentChat(null));
        };
    }, [groupId, profileId, dispatch]);

    /**
     * Handle sending a new message via API and Socket
     * @param {string|Object} messageData - Message content or message data object
     * @returns {Promise<Object>} - Result of the send operation
     */
    const handleSendMessage = async (messageData) => {
        console.log('=== handleSendMessage được gọi ===');
        console.log('messageData nhận được:', messageData);

        const { type, content, mediaData } = messageData;

        if (!type) {
            console.error('Thiếu type:', { type, content, mediaData });
            Alert.alert('Lỗi', 'Dữ liệu tin nhắn không hợp lệ');
            return;
        }

        // Kiểm tra mediaData cho IMAGE/VIDEO
        if ((type === 'IMAGE' || type === 'VIDEO') && (!mediaData || !mediaData.uri)) {
            console.error('Thiếu mediaData cho IMAGE/VIDEO:', { type, mediaData });
            Alert.alert('Lỗi', 'Không có dữ liệu ảnh/video');
            return;
        }

        console.log('Type:', type);
        console.log('Content:', content);
        console.log('MediaData:', mediaData);

        // Tạo tin nhắn tạm thời
        const tempId = `${profileId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const tempMessage = {
            id: tempId,
            tempId: tempId,
            message: type === 'TEXT' ? content : '',
            imageUrl: (type === 'IMAGE' || type === 'VIDEO') ? mediaData?.uri : undefined,
            fileName: type === 'RAW' ? mediaData?.name : undefined,
            fileSize: mediaData?.fileSize || undefined,
            senderId: profileId,
            groupId: groupId,
            type: type,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPending: true,
            isMyMessage: true,
            sender: {
                id: profileId,
                name: profile?.name || 'You',
                avatar: profile?.avatar,
            }
        };

        console.log('Tin nhắn tạm thời được tạo:', tempMessage);

        // Thêm tin nhắn tạm thời vào UI
        dispatch(addMessage(tempMessage));

        try {
            // Đảm bảo socket đã kết nối
            await socketService.registerProfile(profileId);
            let response;

            if (type === 'TEXT') {
                console.log('Gửi tin nhắn TEXT');
                response = await dispatch(sendMessage({
                    message: content,
                    groupId: groupId,
                    senderId: profileId,
                    type: 'TEXT'
                })).unwrap();
            } else if (type === 'IMAGE') {
                console.log('Gửi tin nhắn IMAGE');
                const formData = new FormData();
                formData.append('file', {
                    uri: mediaData.uri,
                    type: mediaData.type || 'image/jpeg',
                    name: mediaData.name || `image-${Date.now()}.jpg`
                });
                formData.append('groupId', groupId);
                formData.append('senderId', profileId);
                formData.append('type', 'IMAGE');
                formData.append('content', ''); // Content rỗng

                console.log('FormData cho IMAGE:', {
                    uri: mediaData.uri,
                    type: mediaData.type,
                    name: mediaData.name,
                    groupId: groupId,
                    senderId: profileId
                });

                response = await dispatch(sendMessage(formData)).unwrap();
            } else if (type === 'VIDEO') {
                console.log('Gửi tin nhắn VIDEO');
                const formData = new FormData();
                formData.append('file', {
                    uri: mediaData.uri,
                    type: mediaData.type || 'video/mp4',
                    name: mediaData.name || `video-${Date.now()}.mp4`
                });
                formData.append('groupId', groupId);
                formData.append('senderId', profileId);
                formData.append('type', 'VIDEO');
                formData.append('content', ''); // Content rỗng

                console.log('FormData cho VIDEO:', {
                    uri: mediaData.uri,
                    type: mediaData.type,
                    name: mediaData.name,
                    groupId: groupId,
                    senderId: profileId
                });

                response = await dispatch(sendMessage(formData)).unwrap();
            } else if (type === 'RAW') {
                // SỬA: Thêm xử lý cho type RAW
                console.log('Gửi tin nhắn RAW');
                const formData = new FormData();
                formData.append('file', {
                    uri: mediaData.uri,
                    type: mediaData.type || 'application/octet-stream',
                    name: mediaData.name || `file-${Date.now()}.txt`
                });
                formData.append('groupId', groupId);
                formData.append('senderId', profileId);
                formData.append('type', 'RAW');
                formData.append('content', '');

                console.log('FormData cho RAW:', {
                    uri: mediaData.uri,
                    type: mediaData.type,
                    name: mediaData.name,
                    fileSize: mediaData.fileSize,
                    groupId: groupId,
                    senderId: profileId
                });

                response = await dispatch(sendMessage(formData)).unwrap();
            }

            console.log('Response từ API:', response);

            if (response?.statusCode === 200 && response?.data) {
                const serverMessage = response.data;

                console.log('=== DEBUG SERVER RESPONSE FULL ===');
                console.log('Raw response:', JSON.stringify(response, null, 2));
                console.log('Server message:', JSON.stringify(serverMessage, null, 2));
                console.log('Server message keys:', Object.keys(serverMessage));

                // SỬA: Kiểm tra tất cả các field có thể chứa URL ảnh
                const possibleImageFields = [
                    'imageUrl', 'fileUrl', 'url', 'image', 'attachmentUrl',
                    'file', 'media', 'src', 'path', 'link'
                ];

                console.log('=== CHECKING IMAGE FIELDS ===');
                possibleImageFields.forEach(field => {
                    if (serverMessage[field]) {
                        console.log(`Found ${field}:`, serverMessage[field]);
                    }
                });

                // SỬA: Mapping với kiểm tra tất cả field có thể
                const formattedServerMessage = {
                    id: serverMessage.id,
                    tempId: tempId,
                    message: serverMessage.content || serverMessage.message || '',
                    senderId: serverMessage.senderId || profileId,
                    groupId: serverMessage.groupId || groupId,
                    createdAt: serverMessage.createdAt || new Date().toISOString(),
                    updatedAt: serverMessage.updatedAt || new Date().toISOString(),
                    type: serverMessage.type || type,
                    // SỬA: Thử tất cả các field có thể chứa URL
                    imageUrl: serverMessage.imageUrl ||
                        serverMessage.fileUrl ||
                        serverMessage.url ||
                        serverMessage.image ||
                        serverMessage.attachmentUrl ||
                        serverMessage.file ||
                        serverMessage.media ||
                        serverMessage.src ||
                        serverMessage.path ||
                        serverMessage.link,
                    fileName: serverMessage.fileName,
                    fileSize: serverMessage.fileSize,
                    isRecalled: serverMessage.isRecalled || false,
                    isEdited: serverMessage.isEdited || false,
                    originalContent: serverMessage.originalContent,
                    sender: {
                        id: profileId,
                        name: profile?.name || 'You',
                        avatar: profile?.avatar,
                    },
                    isMyMessage: true,
                    isPending: false,
                    hasError: false
                };

                // console.log('=== FORMATTED MESSAGE ===');
                // console.log('Formatted message:', JSON.stringify(formattedServerMessage, null, 2));
                // console.log('Final imageUrl:', formattedServerMessage.imageUrl);

                // Cập nhật tin nhắn thành công
                dispatch(updateMessageStatus({
                    tempId: tempId,
                    newMessage: formattedServerMessage
                }));

                console.log('Tin nhắn đã được gửi thành công');

                // Gửi qua socket
                socketService.getSocket()?.emit('sendMessage', {
                    ...serverMessage,
                    groupId: groupId,
                    senderId: profileId
                });

                return { success: true, data: response.data };
            } else {
                throw new Error(response?.message || 'Gửi tin nhắn thất bại');
            }
        } catch (error) {
            console.error(`Lỗi khi gửi tin nhắn ${type}:`, error);

            // Cập nhật tin nhắn với lỗi
            dispatch(updateMessageStatus({
                tempId: tempId,
                newMessage: {
                    ...tempMessage,
                    isPending: false,
                    hasError: true,
                    errorMessage: error.message || 'Gửi tin nhắn thất bại'
                }
            }));

            return { success: false, error: error.message };
        }
    };

    const handleLoadMoreMessages = useCallback((data) => {
        console.log('=== HANDLE LOAD MORE MESSAGES ===');
        console.log('Data received:', data);

        if (!data?.messages?.length) {
            console.log('No messages in data');
            return;
        }

        // SỬA: Mapping imageUrl đúng cho tất cả tin nhắn
        const formattedMessages = data.messages.map(msg => {
            const imageUrl = msg.fileUrl ||
                msg.imageUrl ||
                msg.url ||
                msg.image ||
                msg.attachmentUrl ||
                msg.file ||
                msg.media ||
                msg.src ||
                msg.path ||
                msg.link;

            return {
                id: msg.id,
                message: msg.content,
                senderId: msg.senderId,
                groupId: msg.groupId,
                createdAt: msg.createdAt,
                updatedAt: msg.updatedAt,
                type: msg.type,
                imageUrl: imageUrl, // SỬA: Sử dụng imageUrl đã detect
                isRecalled: msg.isRecalled,
                fileName: msg.fileName,
                fileSize: msg.fileSize,
                sender: msg.sender,
                isMyMessage: msg.senderId === profileId,
                originalContent: msg.originalContent,
                isPending: false
            };
        });

        if (data.refresh) {
            // Refresh - replace toàn bộ messages
            console.log('Refreshing messages, total:', formattedMessages.length);
            dispatch(setMessages(formattedMessages));
        } else {
            // Load more - append vào đầu danh sách
            console.log('Loading more messages, new count:', formattedMessages.length);
            console.log('Current messages count:', messages.length);

            // Lọc tin nhắn trùng lặp dựa trên ID
            const existingIds = new Set(messages.map(msg => msg.id));
            const newMessages = formattedMessages.filter(msg => !existingIds.has(msg.id));

            console.log('New unique messages:', newMessages.length);

            if (newMessages.length > 0) {
                // Thêm tin nhắn mới vào cuối danh sách (vì inverted=true, sẽ hiện ở đầu)
                const updatedMessages = [...messages, ...newMessages];
                console.log('Updated total messages:', updatedMessages.length);
                dispatch(setMessages(updatedMessages));
            }
        }

        // Cập nhật nextCursor nếu có
        if (data.nextCursor !== undefined) {
            console.log('Updating nextCursor from', nextCursor, 'to', data.nextCursor);
            setNextCursor(data.nextCursor);
        }
    }, [messages, profileId, dispatch, nextCursor, setNextCursor]);

    const handleInputFocus = () => {
        messageListRef.current?.scrollToEnd({ animated: true });
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#FF7A1E',

        },
        backgroundImage: {
            flex: 1,
            width: '100%',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            overflow: 'hidden',
            marginTop: 10,

        }
    });

    const dynamicStyles = {
        contentContainer: {
            flex: 1,
            backgroundColor: '#FF7A1E',
            position: 'relative',

        }
    };

    // Debug function to log current messages
    const debugMessages = () => {
        console.log('Current messages in state:', messages.map(m => ({ id: m.id, message: m.message?.substring(0, 15) })));
    }



    const handleEditComplete = async (editData) => {
        if (!editData) {
            // Người dùng hủy chỉnh sửa
            dispatch(setEditingMessage(null));
            return;
        }

        const { messageId, content } = editData;
        console.log('Hoàn thành chỉnh sửa tin nhắn:', messageId, 'Nội dung mới:', content);

        try {
            // Lưu trước vào cache global để đảm bảo UI luôn có dữ liệu
            if (!globalThis.EDITED_MESSAGES) {
                globalThis.EDITED_MESSAGES = {};
            }
            globalThis.EDITED_MESSAGES[messageId] = {
                content,
                groupId,
                messageId
            };

            // Gọi API với tên tham số đúng là newContent
            const result = await dispatch(editMessageThunk({
                messageId,
                newContent: content
            })).unwrap();

            console.log('Kết quả chỉnh sửa tin nhắn:', result);

            if (result && result.statusCode === 200) {
                // Cập nhật UI ngay lập tức không cần đợi socket
                dispatch(updateMessageContent({
                    messageId,
                    content
                }));

                // Reset editing state
                dispatch(setEditingMessage(null));

                // Giả lập event socket để đảm bảo UI được cập nhật
                setTimeout(() => {
                    console.log('Tự gửi fake socket event sau 500ms để đảm bảo UI cập nhật');
                    dispatch({
                        type: 'chat/messageEdited',
                        payload: {
                            messageId,
                            groupId,
                            newContent: content
                        }
                    });

                    // Force re-render
                    setRefreshKey(prev => prev + 1);
                }, 500);
            } else {
                console.error('Lỗi chỉnh sửa tin nhắn:', result);
                Alert.alert('Thông báo', result?.message || 'Có lỗi xảy ra khi chỉnh sửa tin nhắn');
            }
        } catch (error) {
            console.error('Lỗi khi chỉnh sửa tin nhắn:', error);
            Alert.alert('Thông báo', error?.message || 'Có lỗi xảy ra khi chỉnh sửa tin nhắn');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
            elevation={1}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} elevation={1}>
                <YStack style={{ flex: 1, }}>
                    <ChatHeaderComponent
                        dataDetail={currentGroupDetail}
                        goBack={goBack}
                        title={partnerName}
                        refreshKey={refreshKey}
                        groupId={groupId}
                        onDebug={debugMessages} // Thêm debug nếu cần
                    />
                    <YStack style={dynamicStyles.contentContainer} elevation={1}>

                        <ImageBackground
                            source={require('../../../assets/bgr_mess.jpg')}
                            style={styles.backgroundImage}
                            resizeMode="cover"

                        >

                            <MessageList
                                ref={messageListRef}
                                messages={messages}
                                profileId={profileId}
                                isLoading={isLoading}
                                groupId={groupId}
                                nextCursor={nextCursor}
                                setNextCursor={setNextCursor}
                                onLoadMoreMessages={handleLoadMoreMessages}
                                key={refreshKey}
                            />
                            <MessageInput
                                onSendMessage={handleSendMessage}
                                onFocusInput={handleInputFocus}
                                onTabChange={setActiveTab}
                                editingMessage={editingMessage} // Thêm dòng này
                                onEditComplete={handleEditComplete}
                            />
                        </ImageBackground>


                    </YStack>
                </YStack>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default ChatDetail;