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
    const [refreshKey, setRefreshKey] = useState(0); // Thêm state này để force re-render
    const navigation = useNavigation();

    // Bắt sự kiện khi screen được focus
    useFocusEffect(
        React.useCallback(() => {
            console.log('Screen focused - Fetching latest group details');
            // Fetch group details mới nhất khi màn hình được focus
            if (groupId) {
                dispatch(getGroupDetail(groupId));
                setRefreshKey(prev => prev + 1); // Cập nhật key để force re-render
            }
            
            return () => {
                // Cleanup khi screen unfocus
            };
        }, [groupId, dispatch])
    );

    // Thêm event listener cho navigation state change
    useEffect(() => {
        const unsubscribe = navigation.addListener('state', (e) => {
            // Khi state navigation thay đổi và màn hình này là current screen
            if (e.data.state.routes[e.data.state.index].name.includes('chat/chatDetail')) {
                console.log('Navigation state changed - Refreshing group data');
                if (groupId) {
                    dispatch(getGroupDetail(groupId));
                    setRefreshKey(prev => prev + 1);
                }
            }
        });

        return unsubscribe;
    }, [navigation, groupId]);

    // Lấy chi tiết nhóm trực tiếp từ Redux store
    const currentGroupDetail = useMemo(() => {
        return groupDetails[groupId] || null;
    }, [groupDetails, groupId, refreshKey]); // Thêm refreshKey vào dependencies

    // Tính toán tên người nhận tin nhắn dựa trên dữ liệu hiện tại từ store
    const partnerName = useMemo(() => {
        if (currentGroupDetail) {
            if (currentGroupDetail.isGroup) {
                // Nếu là nhóm thì lấy tên nhóm
                return currentGroupDetail.name || 'Nhóm chat';
            } else if (currentGroupDetail.participants) {
                // Nếu là chat 1-1 thì lấy tên người kia
                const otherParticipant = currentGroupDetail.participants.find(
                    p => p?.userId !== profile?.id
                )?.user;
                return otherParticipant?.name || 'Chat';
            }
        }
        return 'Chat';
    }, [currentGroupDetail, profile?.id, refreshKey]); // Thêm refreshKey vào dependencies

    // Tạo thêm một effect để component luôn cập nhật khi có thay đổi trong groupDetails
    useEffect(() => {
        if (groupId && groupDetails[groupId]) {
            // Cập nhật force re-render
            // (Không cần làm gì vì useMemo sẽ tự động tính lại partnerName)
            console.log("Group details updated:", groupDetails[groupId].name);
        }
    }, [groupDetails, groupId]);

    // Đảm bảo luôn có thông tin mới nhất của nhóm
    useEffect(() => {
        if (groupId) {
            dispatch(getGroupDetail(groupId));
        }
    }, [groupId, dispatch]);

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
                        key={`chat-header-${refreshKey}`} // Thêm key để force re-render
                        dataDetail={currentGroupDetail}
                        goBack={goBack}
                        title={partnerName}
                        refreshKey={refreshKey} // Truyền refreshKey sang component con
                    />
                    <View style={dynamicStyles.contentContainer}>
                        <MessageList
                            ref={messageListRef}
                            messages={messages}
                            profileId={profileId}
                            isLoading={isLoading}
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