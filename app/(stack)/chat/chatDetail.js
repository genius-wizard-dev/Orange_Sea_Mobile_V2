import { StyleSheet, View, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import ChatHeaderComponent from '../../../components/header/ChatHeaderComponent'
import MessageList from '../../../components/chat/MessageList'
import MessageInput from '../../../components/chat/MessageInput'
import socketService from '../../../service/socket.service'
import { sendMessage } from '../../../redux/thunks/chat'
import { addMessage, setCurrentChat, clearMessages, setMessages, addPendingMessage, updateMessageStatus, markGroupAsRead, deleteMessage } from '../../../redux/slices/chatSlice'

const ChatDetail = () => {
    const dispatch = useDispatch();
    const { socket, messages, currentChat } = useSelector(state => state.chat);
    const { profile } = useSelector(state => state.profile);
    const { groupId, profileId } = useLocalSearchParams();
    const { goBack } = useLocalSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const messageListRef = React.useRef(null);
    const { groups, groupDetails } = useSelector((state) => state.group);
    const [partnerName, setPartnerName] = useState('Chat');

    useEffect(() => {
        if (groupDetails && groupId) {
            const groupDetail = groupDetails[groupId];
            if (groupDetail?.participants) {
                const otherParticipant = groupDetail.participants.find(
                    p => p?.userId !== profileId
                )?.user;
                setPartnerName(otherParticipant?.name || 'Chat');
            }
        }
    }, [groupDetails, groupId, profileId]);

    useEffect(() => {
        // Clear messages khi vào chat mới
        dispatch(clearMessages());

        const socket = socketService.getSocket();
        // console.log('Socket object:', socket);

        if (socket && groupId && profileId) {
            // Đăng ký socket và mở chat
            socket.emit('register', { profileId }, (response) => {
                console.log('Register event callback:', response);
                if (response?.status === 'success') {
                    // Đánh dấu đã đọc khi vào chat
                    socket.emit('markAsRead', { 
                        profileId, 
                        groupId 
                    }, (markResponse) => {
                        console.log('Mark as read response:', markResponse);
                        if (markResponse?.status === 'success') {
                            // Cập nhật state để xóa badge số tin nhắn chưa đọc
                            dispatch(markGroupAsRead({ groupId }));
                        }
                    });
                }
            });

            // Kiểm tra socket listeners hiện tại
            console.log('Current socket listeners:', socket._events);

            // Đăng ký event handlers trước khi emit
            socket.on('connect', () => {
                console.log('Socket connected successfully');
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            socket.on('error', (error) => {
                console.log('Socket error:', error);
            });

            // Emit events sau khi đã setup listeners
            console.log('About to emit register event...');
            socket.emit('register', { profileId }, (response) => {
                console.log('Register event callback:', response);
            });

            console.log('About to emit open event...');
            socket.emit('open', { profileId, groupId }, (response) => {
                // console.log('Open event callback:', response);
                if (response?.status === 'success' && response?.messages) {
                    console.log('Processing messages:', response.messages.length);

                    // Định dạng lại messages từ response
                    const formattedMessages = response.messages.map(msg => ({
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

                    // console.log('Formatted messages:', formattedMessages);
                    dispatch(setMessages(formattedMessages));
                }
                setIsLoading(false);
            });

            // Lắng nghe các sự kiện
            socket.on('newMessage', (message) => {
                console.log('Socket newMessage event triggered');
                console.log('Received message:', message);
                console.log('Current groupId:', groupId);
                console.log('Message groupId:', message.groupId);

                if (message.groupId === groupId) {
                    console.log('Message matches current group');
                    // Kiểm tra xem có phải tin nhắn của chính mình không
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

                    // Nếu là tin nhắn của người khác, thêm trực tiếp vào store
                    if (!isMyMessage) {
                        dispatch(addMessage(formattedMessage));
                    }
                } else {
                    console.log('Message does not match current group');
                }
            });

            socket.on('messageRecalled', (data) => {
                if (data.messageId && data.groupId === groupId) {
                    console.log("nhận được dữ liệu thu hồi:", data);
                    // Cập nhật tin nhắn trong redux store
                    dispatch({
                        type: 'chat/updateMessage',
                        payload: {
                            id: data.messageId,
                            isRecalled: true,
                        }
                    });
                }
            });

            socket.on('messageDeleted', (data) => {
                if (data.messageId && data.groupId === groupId) {
                    dispatch({
                        type: 'chat/messageDeleted',
                        payload: {
                            messageId: data.messageId,
                            groupId: data.groupId
                        }
                    });
                }
            });

            return () => {
                console.log('Cleaning up socket connections');
                if (socket.connected) {
                    socket.emit('leave', { profileId, groupId });
                }
                socket.off('connect');
                socket.off('disconnect');
                socket.off('error');
                socket.off('open');
                socket.off('send');
                socket.off('recall');
                socket.off('delete');
                socket.off('messageRecalled');
                socket.off('messageDeleted');
            };
        } else {
            console.log('Socket or required params missing:', {
                socketExists: !!socket,
                groupId,
                profileId
            });
        }
    }, [socket, groupId, profileId, dispatch]);

    useEffect(() => {
        dispatch(setCurrentChat({ groupId, profileId }));
        return () => {
            dispatch(setCurrentChat(null));
        };
    }, [groupId, profileId]);

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

                // Emit socket event
                socket.emit('send', {
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
        messageListRef.current?.scrollToEnd();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { marginBottom: 0 }]}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            enabled
        >
            <ChatHeaderComponent 
                goBack={goBack} 
                title={partnerName} 
            />
            <ImageBackground 
                source={require('../../../assets/bgr_mess.jpg')} // hoặc có thể dùng màu solid
                // Hoặc dùng màu nền solid nếu chưa có ảnh
                // style={[styles.backgroundImage, { backgroundColor: '#f5f5f5' }]}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
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
        marginBottom: 0,
        paddingBottom: 0,
    }
});

export default ChatDetail;