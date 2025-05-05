import { StyleSheet, View, KeyboardAvoidingView, Platform, ImageBackground, TouchableWithoutFeedback, Keyboard } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
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
    const { groups, groupDetails, detailLoading } = useSelector((state) => state.group);
    const [partnerName, setPartnerName] = useState('Chat');

    useEffect(() => {
        if (groupDetails && groupId) {
            const groupDetail = groupDetails[groupId];
            // console.log("groupDetail ", groupDetail)
            if (groupDetail) {
                if (groupDetail.isGroup) {
                    // Nếu là nhóm thì lấy tên nhóm
                    setPartnerName(groupDetail.name || 'Nhóm chat');
                } else if (groupDetail.participants) {
                    // Nếu là chat 1-1 thì lấy tên người kia
                    const otherParticipant = groupDetail.participants.find(
                        p => p?.userId !== profile?.id // Sửa profileId thành profile?.id
                    )?.user;
                    setPartnerName(otherParticipant?.name || 'Chat');
                }
            }
        }
    }, [groupDetails, groupId, profile?.id]); // Thêm profile?.id vào dependencies

    useEffect(() => {
        dispatch(clearMessages());
        const socket = socketService.getSocket();
        setIsLoading(true);

        if (socket && groupId && profileId) {
            const initializeChat = async () => {
                try {
                    console.log('Starting chat initialization...');

                    // Đợi kết quả register
                    const registerResult = await socketService.registerChat(profileId, groupId, dispatch);
                    // console.log('🔄 Register chat result:', registerResult);

                    if (registerResult?.status === 'success') {
                        // Chỉ mở chat nếu register thành công
                        const openResult = await socketService.openChat(profileId, groupId, dispatch);
                        // console.log('📖 Open chat result:', openResult);

                        if (openResult?.status === 'success') {
                            console.log('✅ Chat initialized successfully');
                            setIsLoading(false);
                            return;
                        }
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

            // Basic socket handlers
            socket.on('connect', () => console.log('Socket connected successfully'));
            socket.on('disconnect', () => console.log('Socket disconnected'));
            socket.on('error', (error) => console.log('Socket error:', error));

            // New message handler
            socket.on('newMessage', (message) => {
                console.log("nhan duoc tin nhan", message);
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
                socket.off('messageDeleted'); // Thêm dòng này
            };
        }
    }, [socket, groupId, profileId, dispatch]);

    useEffect(() => {
        dispatch(setCurrentChat({ groupId, profileId }));
        return () => {
            dispatch(setCurrentChat(null));
        };
    }, [groupId, profileId]);

    useEffect(() => {
        if (groupId && !groupDetails[groupId]) {
            dispatch(getGroupDetail(groupId));
        }
    }, [groupId, dispatch]);

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

    const handleInputFocus = () => {
        messageListRef.current?.scrollToEnd({ animated: true });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ImageBackground
                    source={require('../../../assets/bgr_mess.jpg')} // hoặc có thể dùng màu solid
                    // Hoặc dùng màu nền solid nếu chưa có ảnh
                    // style={[styles.backgroundImage, { backgroundColor: '#f5f5f5' }]}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                >
                    <ChatHeaderComponent
                        dataDetail={groupDetails[groupId]}
                        goBack={goBack}
                        title={partnerName}
                    />
                    <View style={styles.contentContainer}>
                        <MessageList
                            ref={messageListRef}
                            messages={messages}
                            profileId={profileId}
                            isLoading={isLoading}
                        />
                        <MessageInput
                            onSendMessage={handleSendMessage}
                            onFocusInput={handleInputFocus}
                        />
                    </View>
                </ImageBackground>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
    },
    contentContainer: {
        flex: 1,
        paddingBottom: 65,
    }
});

export default ChatDetail;