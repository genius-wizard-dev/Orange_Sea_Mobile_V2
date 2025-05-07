import io from 'socket.io-client';
import Constants from 'expo-constants';
import { markGroupAsRead, setMessages } from '../redux/slices/chatSlice';


class SocketService {
    socket = null;
    isRegistered = false;

    connect() {

        // console.log("link socket ",`wss://${Constants.expoConfig?.extra?.API_BASE_URL.substr(8)}/chat`); 

        this.socket = io(`wss://${Constants.expoConfig?.extra?.API_BASE_URL.substr(8)}/chat`, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected successfully');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            console.log('Manually disconnecting socket');
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }

    // --- CLIENT TO SERVER EVENTS ---

    // register: { profileId: string }
    async registerProfile(profileId) {
        return new Promise((resolve, reject) => {
            if (!this.socket?.connected) {
                this.socket?.connect();
            }

            this.socket?.emit('register', { profileId }, (response) => {
                console.log('Register response:', response);
                if (response?.status === 'success') {
                    this.isRegistered = true;
                    resolve(true);
                } else {
                    this.isRegistered = false;
                    reject(new Error('Failed to register profile'));
                }
            });
        });
    }

    // open: { profileId: string, groupId: string }
    async openChat(profileId, groupId, dispatch) {
        console.log('Opening chat:', { profileId, groupId });
        if (!this.socket?.connected) {
            console.log('Socket not connected for openChat');
            return { status: 'error', message: 'Socket not connected' };
        }

        return new Promise((resolve, reject) => {
            this.socket.emit('open', { profileId, groupId }, (response) => {
                // console.log('Open chat response:', response);
                if (response?.status === 'success' && response?.messages) {
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

                    dispatch(setMessages(formattedMessages));
                    resolve({ status: 'success', messages: formattedMessages });
                } else {
                    reject(new Error('Failed to open chat'));
                }
            });
        });
    }

    // markAsRead: { profileId: string, groupId: string }
    async markChatAsRead(profileId, groupId, dispatch) {
        if (!this.socket?.connected) return;

        return new Promise((resolve) => {
            this.socket.emit('markAsRead', { profileId, groupId }, (response) => {
                console.log('Mark as read response:', response);
                if (response?.status === 'success') {
                    dispatch(markGroupAsRead({ groupId }));
                }
                resolve(response);
            });
        });
    }

    // send: { messageId: string, groupId: string, senderId: string, content: string }
    sendMessage(messageData) {
        if (!this.socket?.connected) return;

        console.log('Sending message:', messageData);
        this.socket.emit('send', messageData);
    }

    // recall: { messageId: string, groupId: string }
    recallMessage(messageId, groupId) {
        if (!this.socket?.connected) {
            console.log('Socket không kết nối, không thể thu hồi tin nhắn');
            return;
        }

        console.log('Gửi sự kiện thu hồi tin nhắn:', { messageId, groupId });

        // Gửi yêu cầu thu hồi tin nhắn đến server
        this.socket.emit('recall', { messageId, groupId }, (response) => {
            console.log('Phản hồi thu hồi từ server:', response);

            // Nếu server xác nhận thành công, phát sóng sự kiện đến tất cả client
            if (response?.status === 'success') {
                console.log('Thu hồi thành công, thông báo cho tất cả client');
            }
        });
    }

    // delete: { messageId: string, groupId: string, userId: string }
    deleteMessage(messageId, groupId, userId) {
        if (!this.socket?.connected) return;

        console.log('Deleting message:', { messageId, groupId, userId });
        this.socket.emit('delete', { messageId, groupId, userId });
    }

    // leave: { profileId: string, groupId: string }
    leaveChat(profileId, groupId) {
        if (!this.socket?.connected) return;

        console.log('Leaving chat:', { profileId, groupId });
        this.socket.emit('leave', { profileId, groupId });
    }

    // Thêm phương thức registerChat lại vào
    async registerChat(profileId, groupId, dispatch) {
        console.log('Registering chat:', { profileId, groupId });
        if (!this.socket?.connected) {
            console.log('Socket not connected for registerChat');
            return { status: 'error', message: 'Socket not connected' };
        }

        try {
            await this.registerProfile(profileId);
            const markReadResult = await this.markChatAsRead(profileId, groupId, dispatch);
            return { status: 'success', markReadResult };
        } catch (error) {
            console.error('Register chat error:', error);
            return { status: 'error', message: error.message };
        }
    }

    setupCommonListeners(profileId, dispatch) {
        if (!this.socket || !profileId) return;

        // Đăng ký và keep-alive socket
        const registerSocket = () => {
            this.socket.emit('register', { profileId });
        };

        // Register ngay lập tức và setup interval để giữ kết nối
        registerSocket();
        const keepAliveInterval = setInterval(registerSocket, 30000);

        // Lấy số tin nhắn chưa đọc
        this.socket.emit('getUnreadCounts', { profileId });

        // --- SERVER TO CLIENT EVENTS ---

        // newMessage: MessageObject
        this.socket.on('newMessage', (message) => {
            console.log('New message received:', message);
            dispatch({
                type: 'chat/messageReceived',
                payload: {
                    ...message,
                    content: message.content || message.message,
                    createdAt: message.createdAt || new Date().toISOString()
                }
            });
        });

        // unreadCountUpdated: [{ groupId: string, unreadCount: number }]
        this.socket.on('unreadCountUpdated', (updates) => {
            console.log('Unread count updated:', updates);
            dispatch({
                type: 'chat/unreadCountsUpdated',
                payload: updates
            });
        });

        // messageRecalled: { messageId: string, groupId: string }
        this.socket.on('messageRecalled', (data) => {
            console.log('🔄 Nhận sự kiện messageRecalled:', data);

            // Cập nhật store khi nhận được event từ socket
            if (data?.messageId && data?.groupId) {
                dispatch({
                    type: 'chat/messageRecalled',
                    payload: {
                        messageId: data.messageId,
                        groupId: data.groupId,
                        isRecalled: true
                    }
                });
            }
        });

        // messageDeleted: { messageId: string, userId: string }
        this.socket.on('messageDeleted', (data) => {
            console.log('Message deleted:', data);
            if (data?.messageId) {
                dispatch({
                    type: 'chat/messageDeleted',
                    payload: {
                        messageId: data.messageId,
                        groupId: data.groupId,
                        userId: data.userId
                    }
                });
            }
        });

        // userStatusUpdate: { profileId: string, isOnline: boolean, isActive: boolean }
        this.socket.on('userStatusUpdate', (data) => {
            // console.log('User status update:', data);
            const { profileId, isOnline, isActive, groupId } = data;
            dispatch({
                type: 'chat/statusUpdated',
                payload: { profileId, isOnline, isActive, groupId }
            });
        });

        // socketError: { message: string, error: string }
        this.socket.on('socketError', (error) => {
            console.error('Socket error from server:', error);
            dispatch({
                type: 'chat/setError',
                payload: error.message || 'Socket error'
            });
        });

        return () => {
            clearInterval(keepAliveInterval);
            this.socket.off('newMessage');
            this.socket.off('unreadCountUpdated');
            this.socket.off('messageRecalled');
            this.socket.off('messageDeleted');
            this.socket.off('userStatusUpdate');
            this.socket.off('socketError');
        };
    }

    // Thêm method mới để emit socket event recall
    emitRecallMessage(messageId, groupId) {
        if (!this.socket?.connected) {
            console.log('Socket không kết nối');
            return;
        }

        this.socket.emit('recall', { messageId, groupId });
    }

    emitDeleteMessage(messageId, groupId, userId) {
        if (!this.socket?.connected) {
            console.log('Socket không kết nối');
            return;
        }
        console.log('Emitting delete event:', { messageId, groupId, userId });
        this.socket.emit('delete', { messageId, groupId, userId });
    }
}

export default new SocketService();