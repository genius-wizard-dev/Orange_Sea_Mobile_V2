import { StyleSheet, View, KeyboardAvoidingView, Platform, ImageBackground, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native'
import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native';
import ChatHeaderComponent from '../../../components/header/ChatHeaderComponent'
import MessageList from '../../../components/chat/MessageList'
import MessageInput from '../../../components/chat/MessageInput'
import socketService from '../../../service/socket.service'
import { fetchPaginatedMessages, sendMessage } from '../../../redux/thunks/chat'
import { setCurrentChat, clearMessages, setMessages, addMessage, deleteMessage } from '../../../redux/slices/chatSlice'
import { getGroupDetail } from '../../../redux/thunks/group';

const ChatDetail = () => {
    const dispatch = useDispatch();
    const { messages } = useSelector(state => state.chat);
    const { profile } = useSelector(state => state.profile);
    const { groupId, profileId } = useLocalSearchParams();
    const { goBack } = useLocalSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const messageListRef = React.useRef(null);
    const { groupDetails } = useSelector((state) => state.group);
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
                    p => p?.userId !== profile?.id
                )?.user;
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
            const { messageId, groupId: deletedGroupId } = data;

            // Chỉ xử lý nếu tin nhắn thuộc về nhóm hiện tại
            if (deletedGroupId === groupId && messageId) {
                console.log('Xóa tin nhắn khỏi UI:', messageId);
                dispatch(deleteMessage(messageId));

                // Force re-render nếu cần
                setRefreshKey(prev => prev + 1);
            }
        };

        // Xử lý sự kiện thu hồi tin nhắn
        const handleMessageRecall = (data) => {
            console.log('ChatDetail nhận sự kiện messageRecall:', data);
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

                console.log('Đã cập nhật tin nhắn thu hồi trong ChatDetail:', messageId);
                // Force re-render nếu cần
                setRefreshKey(prev => prev + 1);
            }
        };

        socket.on('connect', () => console.log('Socket connected successfully chatdetail'));
        socket.on('disconnect', () => console.log('Socket disconnected'));
        socket.on('error', (error) => console.log('Socket error:', error));

        // Đăng ký lắng nghe các sự kiện
        socket.on('messageDelete', handleMessageDelete);
        socket.on('messageRecall', handleMessageRecall);

        // Dọn dẹp khi component unmount
        return () => {

            // if (socket?.connected) {
            //         socketService.leaveChat(profileId, groupId);
            //     }

            socket.off('messageDelete', handleMessageDelete);
            socket.off('messageRecall', handleMessageRecall);
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
                        const apiMessages = response.data.messages.map(msg => ({
                            id: msg.id,
                            message: msg.content,
                            senderId: msg.senderId,
                            groupId: msg.groupId,
                            createdAt: msg.createdAt,
                            type: msg.type,
                            imageUrl: msg.fileUrl,
                            isRecalled: msg.isRecalled,
                            sender: msg.sender,
                            isMyMessage: msg.senderId === profileId,
                            isPending: false,
                        }));

                        const sortedApiMessages = [...apiMessages].sort(
                            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                        );

                        dispatch(setMessages(sortedApiMessages));
                        setNextCursor(response.data.nextCursor || null);
                    }
                } catch (error) {
                    console.error('Lỗi trong quá trình khởi tạo chat:', error);
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
        // Xác định loại dữ liệu và nội dung
        const isTextOnly = typeof messageData === 'string';
        const isObject = typeof messageData === 'object' && messageData !== null;

        // Xác định loại tin nhắn và nội dung
        let type = 'TEXT';
        let content = null;

        if (isTextOnly) {
            type = 'TEXT';
            content = messageData;
        } else if (isObject) {
            type = messageData.type || 'TEXT';
            content = messageData.content || null;
        }

        // Kiểm tra nội dung
        if (!content && type === 'TEXT') {
            console.error('Không có nội dung tin nhắn');
            return { error: true, message: 'Không có nội dung tin nhắn' };
        }

        // Kiểm tra dữ liệu ảnh
        if (type === 'IMAGE' && (!content || !content.uri)) {
            console.error('Không có dữ liệu ảnh');
            return { error: true, message: 'Không có dữ liệu ảnh' };
        }

        // Tạo ID tạm thời cho tin nhắn
        const tempId = `${profileId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Tạo tin nhắn tạm thời để hiển thị ngay lập tức
        let pendingMessage = {
            tempId,
            id: tempId,
            senderId: profileId,
            groupId: groupId,
            type: type,
            createdAt: new Date().toISOString(),
            sender: profile,
            isMyMessage: true,
            isPending: true
        };

        // Bổ sung thông tin theo loại tin nhắn
        if (type === 'TEXT') {
            pendingMessage.message = content;
        } else if (type === 'IMAGE') {
            pendingMessage.imageUrl = content.uri;
        }

        // Thêm tin nhắn pending vào danh sách
        dispatch(addMessage(pendingMessage));

        try {
            // Đảm bảo socket đã kết nối
            await socketService.registerProfile(profileId);
            let response;

            if (type === 'TEXT') {
                // Gửi tin nhắn văn bản
                response = await dispatch(sendMessage({
                    message: content,
                    groupId: groupId,
                    senderId: profileId,
                    type: 'TEXT'
                })).unwrap();
            } else if (type === 'IMAGE') {
                // Tạo FormData để gửi ảnh
                const formData = new FormData();
                formData.append('file', {
                    uri: content.uri,
                    type: content.type || 'image/jpeg',
                    name: content.name || `image-${Date.now()}.jpg`
                });
                formData.append('groupId', groupId);
                formData.append('senderId', profileId);
                formData.append('type', 'IMAGE');
                formData.append('content', '');

                // Gửi ảnh lên server
                response = await dispatch(sendMessage(formData)).unwrap();
            }

            if (response?.statusCode === 200 && response?.data) {
                // Lấy messageId từ response
                const messageId = response.data.messageId;

                // Tạo tin nhắn chính thức từ phản hồi server
                const newMessage = {
                    ...pendingMessage,
                    id: messageId,
                    tempId: undefined,
                    isPending: false,
                    createdAt: response.data.createdAt || new Date().toISOString(),
                };

                // Cập nhật URL ảnh từ server nếu là tin nhắn ảnh
                if (type === 'IMAGE' && response.data.fileUrl) {
                    newMessage.imageUrl = response.data.fileUrl;
                }

                // Cập nhật tin nhắn
                dispatch({
                    type: 'chat/updateMessageStatus',
                    payload: { tempId, newMessage }
                });

                // Thông báo qua socket
                socketService.emitNewMessage(messageId);

                return { success: true, messageId };
            } else {
                console.log("res API gửi tin nhắn thất bại", response);
                // Xóa tin nhắn pending nếu API không thành công
                dispatch({
                    type: 'chat/deleteMessage',
                    payload: tempId
                });
                return { error: true, message: 'Gửi tin nhắn thất bại', response };
            }
        } catch (error) {
            console.error(`Lỗi khi gửi tin nhắn ${type}:`, error);

            // Xóa tin nhắn pending nếu gửi thất bại
            dispatch({
                type: 'chat/deleteMessage',
                payload: tempId
            });

            return {
                error: true,
                message: `Không thể gửi ${type === 'TEXT' ? 'tin nhắn' : 'ảnh'}. Vui lòng thử lại sau.`,
                originalError: error
            };
        }
    };

    const handleLoadMoreMessages = (data) => {
        if (data?.messages?.length > 0) {
            const formattedMessages = data.messages.map(msg => ({
                id: msg.id,
                message: msg.content,
                senderId: msg.senderId,
                groupId: msg.groupId,
                createdAt: msg.createdAt,
                type: msg.type,
                imageUrl: msg.fileUrl,
                isRecalled: msg.isRecalled,
                sender: msg.sender,
                isMyMessage: msg.senderId === profileId,
                isPending: false
            }));

            // Lọc tin nhắn trùng lặp dựa trên ID
            const existingIds = new Set(messages.map(msg => msg.id));
            const newMessages = formattedMessages.filter(msg => !existingIds.has(msg.id));

            if (newMessages.length > 0) {
                // Thêm tin nhắn mới vào đầu danh sách (vì inverted)
                const updatedMessages = [...newMessages, ...messages];
                dispatch(setMessages(updatedMessages));
            }
        }
    };

    const handleInputFocus = () => {
        messageListRef.current?.scrollToEnd({ animated: true });
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: 'white',
        },
        backgroundImage: {
            flex: 1,
            width: '100%',
        }
    });

    const dynamicStyles = {
        contentContainer: {
            flex: 1,
            paddingBottom: activeTab ? bottomSheetHeight + 65 : 65
        }
    };

    // Debug function to log current messages
    const debugMessages = () => {
        console.log('Current messages in state:', messages.map(m => ({ id: m.id, message: m.message?.substring(0, 15) })));
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ImageBackground
                    source={require('../../../assets/bgr_mess.jpg')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                >
                    <ChatHeaderComponent
                        dataDetail={currentGroupDetail}
                        goBack={goBack}
                        title={partnerName}
                        refreshKey={refreshKey}
                        groupId={groupId}
                        onDebug={debugMessages} // Thêm debug nếu cần
                    />
                    <View style={dynamicStyles.contentContainer}>
                        <MessageList
                            ref={messageListRef}
                            messages={messages}
                            profileId={profileId}
                            isLoading={isLoading}
                            groupId={groupId}
                            nextCursor={nextCursor}
                            setNextCursor={setNextCursor}
                            onLoadMoreMessages={handleLoadMoreMessages}
                            key={refreshKey} // Force re-render when refreshKey changes
                        />
                        <MessageInput
                            onSendMessage={handleSendMessage}
                            onFocusInput={handleInputFocus}
                            onTabChange={setActiveTab}
                        />
                    </View>
                </ImageBackground>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default ChatDetail;