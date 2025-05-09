import { StyleSheet, View, KeyboardAvoidingView, Platform, ImageBackground, TouchableWithoutFeedback, Keyboard } from 'react-native'
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ChatHeaderComponent from '../../../components/header/ChatHeaderComponent'
import MessageList from '../../../components/chat/MessageList'
import MessageInput from '../../../components/chat/MessageInput'
import socketService from '../../../service/socket.service'
import { sendMessage } from '../../../redux/thunks/chat'
import { addMessage, setCurrentChat, clearMessages, setMessages, markGroupAsRead, deleteMessage, updateMessage } from '../../../redux/slices/chatSlice'
import { getGroupDetail } from '../../../redux/thunks/group';

const ChatDetail = () => {
    const dispatch = useDispatch();
    const { socket, messages, currentChat } = useSelector(state => state.chat);
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


    useEffect(() => {
        // console.log('Messages in ChatDetail:', messages);
    }, [messages]);

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

    // Đảm bảo luôn có thông tin mới nhất của nhóm - Chỉ gọi một lần khi component mount
    useEffect(() => {
        if (groupId && !hasLoadedGroupDetailRef.current) {
            console.log('Initial group detail fetch');
            dispatch(getGroupDetail(groupId));
            hasLoadedGroupDetailRef.current = true;
        }
    }, [groupId, dispatch]);

    // Khởi tạo chat - Chỉ chạy một lần khi component mount
    useEffect(() => {
        if (hasInitializedRef.current) return;

        dispatch(clearMessages());
        const socket = socketService.getSocket();
        setIsLoading(true);

        if (socket && groupId && profileId) {
            const initializeChat = async () => {
                try {
                    console.log('Starting chat initialization...');

                    // Đợi kết quả register
                    const registerResult = await socketService.registerChat(profileId, groupId, dispatch);

                    if (registerResult?.status === 'success') {
                        // Chỉ mở chat nếu register thành công
                        const openResult = await socketService.openChat(profileId, groupId, dispatch);

                        // console.log("aaaa  ", openResult)

                        if (openResult.messages) {
                            const sortedMessages = [...openResult.messages].sort(
                                (a, b) => new Date(b.createdAt) - new Date(a.createdAt) // Sắp xếp giảm dần
                            );
                            dispatch(setMessages(sortedMessages));
                        }
                        setNextCursor(openResult.nextCursor);
                        setIsLoading(false);
                        hasInitializedRef.current = true;
                        return;
                    }

                    // Nếu có lỗi
                    console.log('❌ Failed to initialize chat');
                    setIsLoading(false);
                } catch (error) {
                    console.error('❌ Chat initialization error:', error);
                    setIsLoading(false);
                }
            };

            initializeChat();

            // Socket event handlers
            socket.on('connect', () => console.log('Socket connected successfully'));
            socket.on('disconnect', () => console.log('Socket disconnected'));
            socket.on('error', (error) => console.log('Socket error:', error));

            // New message handler
            socket.on('newMessage', (message) => {
                // console.log("nhan duoc tin nhan", message);
                if (message.groupId === groupId) {
                    const isMyMessage = message.senderId === profileId;
                    const formattedMessage = {
                        id: message.id,
                        message: message.content,
                        senderId: message.senderId,
                        groupId: message.groupId,
                        createdAt: message.createdAt,
                        type: message.type,
                        imageUrl: message.imageUrl,
                        videoUrl: message.videoUrl,
                        stickerUrl: message.stickerUrl,
                        isRecalled: message.isRecalled,
                        sender: message.sender,
                        isMyMessage: isMyMessage,
                        isPending: false
                    };

                    if (!isMyMessage) {
                        dispatch(addMessage(formattedMessage));
                    }
                }
            });

            // Thêm xử lý sự kiện messageRecalled
            socket.on('messageRecalled', (data) => {
                console.log('Nhận sự kiện messageRecalled trong chatDetail:', data);
                const { messageId, groupId: recalledGroupId } = data;

                // Chỉ xử lý nếu tin nhắn thuộc về nhóm hiện tại
                if (recalledGroupId === groupId && messageId) {
                    // Buộc cập nhật tin nhắn thu hồi
                    dispatch({
                        type: 'chat/messageRecalled',
                        payload: {
                            messageId,
                            groupId: recalledGroupId
                        }
                    });

                    // Thông báo cập nhật giao diện
                    console.log('Đã cập nhật tin nhắn thu hồi:', messageId);
                }
            });

            // Thêm listener cho messageDeleted
            socket.on('messageDeleted', (data) => {
                console.log('Nhận sự kiện messageDeleted trong chatDetail:', data);
                const { messageId, groupId: deletedGroupId, userId } = data;

                // Chỉ xử lý nếu tin nhắn thuộc về nhóm hiện tại
                if (deletedGroupId === groupId && messageId) {
                    // Xử lý xóa tin nhắn khỏi UI
                    dispatch({
                        type: 'chat/messageDeleted',
                        payload: { messageId, userId }
                    });
                    console.log('Đã xóa tin nhắn:', messageId);
                }
            });

            return () => {
                // Sử dụng leaveChat từ socketService
                if (socket?.connected) {
                    socketService.leaveChat(profileId, groupId);
                }
                socket.off('connect');
                socket.off('disconnect');
                socket.off('error');
                socket.off('newMessage');
                socket.off('messageRecalled');
                socket.off('messageDeleted');
            };
        }
    }, [socket, groupId, profileId, dispatch]);

    // Set current chat
    useEffect(() => {
        dispatch(setCurrentChat({ groupId, profileId }));
        return () => {
            dispatch(setCurrentChat(null));
        };
    }, [groupId, profileId, dispatch]);

    const handleSendMessage = async (messageText) => {
        const socket = socketService.getSocket();
        const tempId = `${profileId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const pendingMessage = {
            tempId,
            id: tempId,
            message: messageText,
            senderId: profileId,
            groupId: groupId,
            type: 'TEXT',
            createdAt: new Date().toISOString(),
            sender: profile,
            isMyMessage: true,
            isPending: true
        };

        // Thêm tin nhắn pending vào messages array
        dispatch(setMessages([...messages, pendingMessage]));

        try {
            await socketService.registerProfile(profileId);
            const response = await dispatch(sendMessage({
                message: messageText,
                groupId: groupId,
                senderId: profileId,
                type: 'TEXT'
            })).unwrap();


            if (response?.status === 'success' && response?.data) {
                const newMessage = {
                    ...pendingMessage,
                    id: response.data.id,
                    tempId: undefined,
                    isPending: false,
                    createdAt: response.data.createdAt || new Date().toISOString(),
                };

                // Cập nhật messages array với tin nhắn mới
                const updatedMessages = messages.map(msg =>
                    msg.tempId === tempId ? newMessage : msg
                );

                dispatch(setMessages([...updatedMessages, newMessage]));

                // Emit socket event thông qua socketService
                socketService.sendMessage({
                    messageId: response.data.id,
                    groupId: groupId,
                    senderId: profileId,
                    content: messageText
                });
            }
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            // Xóa tin nhắn pending nếu gửi thất bại
            const filteredMessages = messages.filter(msg => msg.tempId !== tempId);
            dispatch(setMessages(filteredMessages));
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

    // console.log("messages ", messages);


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
                    />
                    <View style={dynamicStyles.contentContainer}>
                        <MessageList
                            ref={messageListRef}
                            messages={messages}
                            profileId={profileId}
                            isLoading={isLoading}
                            groupId={groupId}
                            nextCursor={nextCursor} // Truyền nextCursor xuống MessageList
                            setNextCursor={setNextCursor}
                            onLoadMoreMessages={handleLoadMoreMessages}
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