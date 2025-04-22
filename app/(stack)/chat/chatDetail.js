import { StyleSheet, View, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { Text, XStack, YStack, Image } from 'tamagui'
import { useLocalSearchParams } from 'expo-router'
import HeaderChatDetail from '../../../components/header/HeaderChatDetail'
import { Ionicons, FontAwesome } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import socketService from '../../../service/socket.service'
import { sendMessage, fetchMessages } from '../../../redux/thunks/chat'
import { addMessage, setCurrentChat } from '../../../redux/slices/chatSlice';

const ChatDetail = () => {
    const dispatch = useDispatch();
    const { socket, messages } = useSelector(state => state.chat);
    const { groupId, profileId } = useLocalSearchParams();
    const [message, setMessage] = useState('');
    const scrollViewRef = useRef();
    const { goBack } = useLocalSearchParams();

    useEffect(() => {
        const socket = socketService.getSocket();
        if (socket && groupId && profileId) {
            // Đăng ký socket với profile
            socket.emit('register', { profileId });

            // Mở cuộc trò chuyện
            socket.emit('open', { profileId, groupId });

            // Đánh dấu đã đọc
            socket.emit('markAsRead', { profileId, groupId });

            // Lắng nghe các sự kiện
            socket.on('send', (data) => {
                // Xử lý tin nhắn mới
                dispatch(addMessage(data));
            });

            socket.on('recall', (data) => {
                // Xử lý thu hồi tin nhắn
                dispatch(updateMessage({ id: data.messageId, recalled: true }));
            });

            socket.on('delete', (data) => {
                // Xử lý xóa tin nhắn
                dispatch(deleteMessage(data.messageId));
            });

            return () => {
                // Cleanup khi rời khỏi màn hình chat
                socket.emit('leave', { profileId, groupId });
                socket.off('send');
                socket.off('recall');
                socket.off('delete');
            };
        }
    }, [groupId, profileId]);

    // Fetch messages khi vào màn hình
    useEffect(() => {
        if (groupId) {
            dispatch(fetchMessages({ groupId }));
        }
    }, [groupId]);

    useEffect(() => {
        dispatch(setCurrentChat({ groupId, profileId }));
        return () => {
            dispatch(setCurrentChat(null));
        };
    }, [groupId, profileId]);



    const handleSendMessage = () => {
        if (message.trim()) {
            const messageData = {
                message: message.trim(),
                groupId: groupId,
                senderId: profileId,
                type: 'TEXT' // Default type for text messages
            };

            console.log('Sending message data:', messageData);

            if (!messageData.groupId || !messageData.senderId) {
                console.error('Missing required fields:', messageData);
                return;
            }

            // Thêm message vào store để UI cập nhật ngay
            dispatch(addMessage({
                ...messageData,
                id: Date.now().toString(),
                isMyMessage: true
            }));

            // Gửi lên server
            dispatch(sendMessage(messageData));
            setMessage('');
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '?';

        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const renderMessage = (msg) => {
        const isMyMessage = msg.senderId === profileId;
        return (
            <XStack
                key={msg.id}
                justifyContent={isMyMessage ? 'flex-end' : 'flex-start'}
                paddingHorizontal={10}
                marginVertical={5}
                width="100%"
            >
                {!isMyMessage && (
                    <Image
                        source={{ uri: 'https://placeholder.com/avatar' }}
                        width={30}
                        height={30}
                        borderRadius={15}
                        marginRight={8}
                    />
                )
                }
                <YStack
                    backgroundColor={isMyMessage ? '#0084ff' : '#e4e6eb'}
                    padding={10}
                    borderRadius={15}
                    maxWidth="70%"
                >
                    <Text color={isMyMessage ? 'white' : 'black'}>
                        {msg.message} {/* Chỉ dùng trường message */}
                    </Text>
                    <Text
                        fontSize={12}
                        color={isMyMessage ? '#e4e6eb' : '#65676b'}
                        textAlign="right"
                        marginTop={4}
                    >
                        {formatTime(msg.createdAt)}
                    </Text>
                </YStack>
            </XStack>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <HeaderChatDetail
                goBack={goBack}
                title="Chat Detail"
            />

            <View style={styles.contentContainer}>
                <ScrollView
                    style={styles.messageContainer}
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map(renderMessage)}
                </ScrollView>

                <XStack style={styles.inputContainer}>
                    <XStack space="$2" flex={1} backgroundColor="#f0f2f5" borderRadius={20} alignItems="center" padding={5}>
                        <Ionicons name="happy-outline" size={24} color="#65676b" />
                        <TextInput
                            style={styles.input}
                            placeholder="Tin nhắn"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            maxLength={1000}
                        />
                        <Ionicons name="images-outline" size={24} color="#65676b" />
                        <FontAwesome name="microphone" size={24} color="#65676b" />
                    </XStack>
                    <Pressable onPress={handleSendMessage}>
                        <XStack padding={10}>
                            <Ionicons name="send" size={24} color="#0084ff" />
                        </XStack>
                    </Pressable>
                </XStack>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    contentContainer: {
        flex: 1,
    },
    messageContainer: {
        flex: 1,
        paddingVertical: 10
    },
    inputContainer: {
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#e4e6eb',
        backgroundColor: 'white',
        minHeight: 60
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingHorizontal: 10,
        maxHeight: 100
    }
});