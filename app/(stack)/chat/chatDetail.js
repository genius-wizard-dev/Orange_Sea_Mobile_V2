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

    const registerProfile = async () => {
        return new Promise((resolve, reject) => {
            const socket = socketService.getSocket();
            socket.emit('register', { profileId }, (response) => {
                console.log('Register response in chat:', response);
                if (response?.status === 'success') {
                    resolve(true);
                } else {
                    reject(new Error('Failed to register profile'));
                }
            });
        });
    };

    const handleSendMessage = async (messageText) => {
        const socket = socketService.getSocket();
        const tempId = `${profileId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Thêm vào store để hiển thị loading
        dispatch(addPendingMessage({
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
        }));

        try {
            // Kiểm tra kết nối socket và đăng ký lại nếu cần
            if (!socket.connected) {
                await new Promise((resolve) => {
                    socket.connect();
                    socket.once('connect', resolve);
                });
            }

            console.log(profileId, " pf")

            // Đảm bảo profile được đăng ký
            // await new Promise((resolve, reject) => {
            //     socket.emit('register', { profileId }, (registerResponse) => {
            //         console.log('Register response:', registerResponse);
            //         if (registerResponse?.status === 'success') {
            //             resolve();
            //         } else {
            //             // Thử đăng ký lại một lần nữa
            //             socket.emit('register', { profileId }, (retryResponse) => {
            //                 if (retryResponse?.status === 'success') {
            //                     resolve();
            //                 } else {
            //                     reject(new Error('Failed to register profile after retry'));
            //                 }
            //             });
            //         }
            //     });
            // });
            socket.emit('register', { profileId }, (response) => {
                console.log('Register event callback:', response);
            });


            // Gửi tin nhắn qua API
            const response = await dispatch(sendMessage({
                message: messageText,
                groupId: groupId,
                senderId: profileId,
                type: 'TEXT'
            })).unwrap();

            if (response?.status === 'success') {
                console.log('API Response:', response.data);
                
                // Gửi socket event
                await new Promise((resolve) => {
                    socket.emit('send', {
                        
                        messageId: response.data.id,
                        groupId: groupId,
                        senderId: profileId,
                        content: messageText

                    }, (acknowledgement) => {
                        console.log('Socket acknowledgement:', acknowledgement);
                        resolve(acknowledgement);
                        // Cập nhật UI bất kể kết quả socket
                        dispatch(updateMessageStatus({
                            tempId,
                            newMessage: {
                                id: response.data.id,
                                message: messageText,
                                senderId: profileId,
                                groupId: groupId,
                                createdAt: response.data.createdAt || new Date().toISOString(),
                                type: 'TEXT',
                                sender: profile,
                                isMyMessage: true,
                                isPending: false
                            }
                        }));
                    });
                });
            }
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            dispatch(updateMessageStatus({
                tempId,
                newMessage: {
                    id: tempId,
                    message: messageText,
                    senderId: profileId,
                    groupId: groupId,
                    createdAt: new Date().toISOString(),
                    type: 'TEXT',
                    sender: profile,
                    isMyMessage: true,
                    isPending: false,
                    error: 'Không thể gửi tin nhắn'
                }
            }));
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