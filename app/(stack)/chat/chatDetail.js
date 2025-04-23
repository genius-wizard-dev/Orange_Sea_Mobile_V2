import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import HeaderChatDetail from '../../../components/header/HeaderChatDetail'
import MessageList from '../../../components/chat/MessageList'
import MessageInput from '../../../components/chat/MessageInput'
import socketService from '../../../service/socket.service'
import { sendMessage } from '../../../redux/thunks/chat'
import { addMessage, setCurrentChat, clearMessages, setMessages, addPendingMessage, updateMessageStatus } from '../../../redux/slices/chatSlice'

const ChatDetail = () => {
    const dispatch = useDispatch();
    const { socket, messages } = useSelector(state => state.chat);
    const { profile } = useSelector(state => state.profile);
    const { groupId, profileId } = useLocalSearchParams();
    const { goBack } = useLocalSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const messageListRef = React.useRef(null);

    useEffect(() => {
        // Clear messages khi vào chat mới
        dispatch(clearMessages());

        const socket = socketService.getSocket();
        console.log('Socket object:', socket);

        if (socket && groupId && profileId) {
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
                if (response?.status === 'success' && response?.lastMessages) {
                    console.log('Processing messages:', response.lastMessages.length);

                    // Cập nhật messages trong store với format đúng
                    const formattedMessages = response.lastMessages.map(msg => ({
                        id: msg.id,
                        message: msg.content,
                        senderId: msg.senderId,
                        groupId: msg.groupId,
                        createdAt: msg.createdAt,
                        type: msg.type,
                        imageUrl: msg.imageUrl,
                        videoUrl: msg.videoUrl,
                        stickerUrl: msg.stickerUrl,
                        isRecalled: msg.isRecalled,
                        sender: msg.sender,
                        isMyMessage: msg.senderId === profileId
                    }));

                    // Set tất cả messages một lần
                    dispatch(setMessages(formattedMessages));
                    console.log('Messages updated in store:', formattedMessages.length);
                }
                setIsLoading(false);
            });

            // Lắng nghe các sự kiện
            socket.on('newMessage', (message) => {
                if (message.groupId === groupId) {
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

        dispatch(addPendingMessage(pendingMessage));

        try {
            const response = await dispatch(sendMessage({
                message: messageText,
                groupId: groupId,
                senderId: profileId,
                type: 'TEXT'
            })).unwrap();

            if (response?.status === 'success') {
                const socket = socketService.getSocket();
                socket.emit('send', {
                    messageId: response.data.messageId,
                    groupId: response.data.groupId,
                    senderId: response.data.senderId,
                });

                // Cập nhật tin nhắn với dữ liệu từ response
                dispatch(updateMessageStatus({
                    tempId,
                    newMessage: {
                        id: response.data.messageId,
                        message: messageText, // Giữ nguyên nội dung tin nhắn
                        senderId: profileId,
                        groupId: groupId,
                        createdAt: response.data.createdAt || new Date().toISOString(),
                        type: 'TEXT',
                        sender: profile,
                        isMyMessage: true,
                        isPending: false
                    }
                }));
            }
        } catch (error) {
            console.error('Error sending message:', error);
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
            <HeaderChatDetail goBack={goBack} title="Chat Detail" />
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
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    contentContainer: {
        flex: 1,
        marginBottom: 0,
        paddingBottom: 0
    }
});

export default ChatDetail;