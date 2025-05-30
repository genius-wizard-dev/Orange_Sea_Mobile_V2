import io from 'socket.io-client';
import Constants from 'expo-constants';
import { markGroupAsRead, setMessages, addMessage, setError } from '../redux/slices/chatSlice';
import { getDeviceId } from '../utils/fingerprint';

class SocketService {
    socket = null;
    isRegistered = false;

    // --- SOCKET CONNECTION MANAGEMENT ---

    connect() {
        const link_socket = `${Constants.expoConfig?.extra?.API_BASE_URL_SOCKET}`;
        console.log("SOCKET URL ", link_socket);

        if (!link_socket || link_socket === 'undefined') {
            console.error('URL socket không hợp lệ:', link_socket);
            return null;
        }

        this.socket = io(link_socket, {
            transports: ['websocket'],
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected successfully with ID:', this.socket.id);
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

    // --- EMIT EVENTS (CLIENT TO SERVER) ---




    /**
     * Register user profile with the socket server
     * @param {string} profileId - User profile ID
     * @returns {Promise<boolean>} - Registration success status
     */
    async registerProfile(profileId) {
        return new Promise(async (resolve, reject) => {
            if (!this.socket) {
                console.log('Socket not initialized, creating new connection');
                this.socket = this.connect();
            }

            if (!this.socket?.connected) {
                console.log('Socket not connected, waiting for connection...');

                const connectionTimeout = setTimeout(() => {
                    reject(new Error('Socket connection timeout after 5 seconds'));
                }, 5000);

                await new Promise((connResolve) => {
                    this.socket.once('connect', () => {
                        clearTimeout(connectionTimeout);
                        connResolve();
                    });

                    // Đảm bảo socket bắt đầu kết nối
                    this.socket.connect();
                });
            }

            // Lấy deviceId từ phương thức getDeviceId
            const deviceId = await getDeviceId();
            console.log("Sending register event with:", { profileId, deviceId });

            this.socket?.emit('register', { profileId, deviceId }, (response) => {
                console.log('Register response:', response);
                if (response?.success) {
                    this.isRegistered = true;
                    resolve(true);
                    console.log("reg oke")
                } else {
                    this.isRegistered = false;
                    reject(new Error('Failed to register profile'));
                }
            });
        });
    }

    /**
     * Open a chat group
     * @param {string} profileId - User profile ID
     * @param {string} groupId - Chat group ID
     * @returns {Promise<Object>} - Server response
     */
    async openChat(profileId, groupId) {
        console.log('Opening chat:', { profileId, groupId });

        if (!this.socket?.connected) {
            console.log('Socket not connected for openChat');
            return { status: 'error', message: 'Socket not connected' };
        }

        return new Promise((resolve, reject) => {
            this.socket.emit('open', { profileId, groupId }, (response) => {
                if (response?.success) {
                    resolve(response);
                } else {
                    reject(response || { status: 'error', message: 'Unknown error' });
                }
            });
        });
    }

    /**
     * Handle a chat group (mark as read)
     * @param {string} profileId - User profile ID
     * @param {string} groupId - Chat group ID
     * @param {Function} dispatch - Redux dispatch function
     * @returns {Promise<Object>} - Server response
     */
    async handleGroup(profileId, groupId, dispatch) {
        if (!this.socket?.connected) return;

        return new Promise((resolve) => {
            this.socket.emit('handleGroup', { profileId, groupId }, (response) => {
                console.log('handleGroup response:', response);
                if (response?.success) {
                    dispatch(markGroupAsRead({ groupId }));
                }
                resolve(response);
            });
        });
    }

    /**
     * Send message notification to other clients
     * @param {string} messageId - Message ID to notify about
     */
    emitNewMessage(messageId) {
        if (!this.socket?.connected) {
            console.log('Socket not connected, cannot emit new message');
            return;
        }
        console.log('Emitting message event with messageId:', messageId);
        this.socket.emit('sendMessage', { messageId });
    }

    /**
     * Emit event to recall (unsend) a message
     * @param {string} messageId - Message ID to recall
     */
    emitRecallMessage(messageId) {
        if (!this.socket?.connected) {
            console.log('Socket không kết nối, không thể thu hồi tin nhắn');
            return;
        }
        console.log('Emitting recall message event với messageId:', messageId);
        this.socket.emit('recallMessage', { messageId });
    }

    /**
     * Emit event to delete a message
     * @param {string} messageId - Message ID to delete
     */
    emitDeleteMessage(messageId) {
        if (!this.socket?.connected) {
            console.log('Socket không kết nối, không thể xóa tin nhắn');
            return;
        }
        console.log('Emitting delete message event với messageId:', messageId);
        this.socket.emit('deleteMessage', { messageId });
    }


    // Thêm tham số newContent vào emitEditMessage trong socket.service.js
    /**
     * Emit event để chỉnh sửa tin nhắn
     * @param {string} messageId - ID của tin nhắn cần chỉnh sửa
     * @param {string} newContent - Nội dung mới của tin nhắn (tùy chọn)
     */
    emitEditMessage(messageId, newContent) {
        if (!this.socket?.connected) {
            console.log('Socket không kết nối, không thể emit sự kiện chỉnh sửa tin nhắn');
            return false;
        }

        // Lưu nội dung mới vào cache global nếu có
        if (newContent) {
            if (!globalThis.EDITED_MESSAGES) {
                globalThis.EDITED_MESSAGES = {};
            }
            globalThis.EDITED_MESSAGES[messageId] = { content: newContent };
            console.log('Đã lưu nội dung chỉnh sửa vào cache:', messageId, newContent);
        }

        console.log('Emitting editMessage event với messageId:', messageId);
        this.socket.emit('editMessage', { messageId });
        return true;
    }
    /**
     * Leave a chat group
     * @param {string} profileId - User profile ID
     * @param {string} groupId - Chat group ID to leave
     */
    emitLeaveChat(profileId, groupId) {
        if (!this.socket?.connected) {
            console.log('Socket not connected, cannot leave chat');
            return;
        }
        console.log('Leaving chat:', { profileId, groupId });
        this.socket.emit('close', { profileId, groupId });
    }

    // Thêm vào phần "EMIT EVENTS (CLIENT TO SERVER)"

    /**
     * Emit event để hủy lời mời kết bạn
     * @param {string} friendshipId - ID của lời mời kết bạn cần hủy
     * @returns {Promise<Object>} - Kết quả từ server
     */
    emitCancelFriendRequest(friendshipId) {
        if (!this.socket?.connected) {
            console.log('Socket không kết nối, không thể hủy lời mời kết bạn');
            return Promise.reject(new Error('Socket chưa kết nối'));
        }

        console.log('Emitting deleteFriend event với friendShipId:', friendshipId);

        return new Promise((resolve, reject) => {
            this.socket.emit("deleteFriend", {
                friendShipId: friendshipId
            }, (response) => {
                console.log('Server response for cancelFriendRequest:', response);
                if (response?.success) {
                    resolve({
                        success: true,
                        message: "Đã hủy lời mời kết bạn thành công",
                        friendshipId
                    });
                } else {
                    reject(response?.message || "Không thể hủy lời mời kết bạn");
                }
            });
        });
    }

    /**
     * Register for a chat (combined register + handleGroup)
     * @param {string} profileId - User profile ID
     * @param {string} groupId - Chat group ID
     * @param {Function} dispatch - Redux dispatch function
     * @returns {Promise<Object>} - Server response
     */
    async registerChat(profileId, groupId, dispatch) {
        console.log('Registering chat:', { profileId, groupId });

        if (!this.socket?.connected) {
            console.log('Socket not connected for registerChat');
            return { status: 'error', message: 'Socket not connected' };
        }

        try {
            await this.registerProfile(profileId);
            const resHanleGroup = await this.handleGroup(profileId, groupId, dispatch);
            return resHanleGroup;
        } catch (error) {
            console.error('Register chat error:', error);
            return error;
        }
    }

    // --- SOCKET INITIALIZATION AND LISTENERS ---

    /**
     * Initialize chat and fetch messages
     * @param {string} profileId - User profile ID
     * @param {string} groupId - Chat group ID
     * @param {Function} dispatch - Redux dispatch function
     * @param {Function} fetchPaginatedMessages - Function to fetch messages
     * @returns {Promise<Object>} - Initialization results
     */
    async initializeChat(profileId, groupId, dispatch, fetchPaginatedMessages) {
        try {
            console.log('Đang bắt đầu mở chat.');
            console.log("thông tin gửi, ", profileId, groupId);

            // Đợi kết quả register
            const registerResult = await this.registerChat(profileId, groupId, dispatch);

            console.log("registerResult ", registerResult)

            if (registerResult?.success === true) {
                // Chỉ mở chat nếu register thành công
                const openResult = await this.openChat(profileId, groupId);

                console.log("openResult ", openResult);

                if (openResult?.success === true) {
                    // Nếu openResult thành công, gọi API fetchPaginatedMessages
                    console.log('openResult thành công, gọi API fetchPaginatedMessages');
                    try {
                        return await dispatch(fetchPaginatedMessages({
                            groupId,
                            cursor: "" // Cursor rỗng để lấy tin nhắn mới nhất
                        })).unwrap();
                    } catch (apiError) {
                        console.error('Lỗi khi tải tin nhắn qua API:', apiError);
                        return { error: true, message: 'Lỗi khi tải tin nhắn' };
                    }
                } else {
                    // Nếu openResult không thành công
                    console.log('openResult không thành công');
                    return { error: true, message: 'Không thể mở chat' };
                }
            }

            // Nếu registerResult không thành công
            console.log('❌ Failed to initialize chat - Register failed');
            return { error: true, message: 'Đăng ký chat thất bại' };
        } catch (error) {
            console.error('❌ Chat initialization error:', error);
            return { error: true, message: error.message || 'Lỗi khởi tạo chat' };
        }
    }

    // --- SOCKET LISTENERS SETUP ---

    /**
     * Set up common socket listeners for app
     * @param {string} profileId - User profile ID
     * @param {Function} dispatch - Redux dispatch function
     * @returns {Function} - Cleanup function to remove listeners
     */
    setupCommonListeners(profileId, dispatch) {
        if (!this.socket || !profileId) return;

        // Đăng ký và keep-alive socket
        const registerSocket = async () => {
            const deviceId = await getDeviceId();
            this.socket.emit('register', { profileId, deviceId });
        };

        // Register ngay lập tức và setup interval để giữ kết nối
        registerSocket();
        const keepAliveInterval = setInterval(registerSocket, 30000);

        // Lấy số tin nhắn chưa đọc
        this.socket.emit('getUnreadCounts', { profileId });

        // --- SERVER TO CLIENT EVENTS ---

        // Receive new message event
        this.socket.on('receiveMessage', (message) => {
            console.log('New message received:', message);
            dispatch({
                type: 'chat/messageReceived',
                payload: {
                    ...message,
                    content: message.content || message.message,
                    createdAt: message.createdAt || new Date().toISOString(),
                    updatedAt: message.updatedAt || new Date().toISOString()
                }
            });
        });

        // Unread count updates
        this.socket.on('unreadCountUpdated', (updates) => {
            console.log('Unread count updated:', updates);
            dispatch({
                type: 'chat/unreadCountsUpdated',
                payload: updates
            });
        });

        // Message recall notifications
        this.socket.on('messageRecall', (data) => {
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

        // Message deletion notifications
        this.socket.on('messageDelete', (data) => {
            console.log('🔄 Nhận sự kiện delete:', data);
            if (data?.messageId && data?.groupId) {
                // Trước khi dispatch, lấy về state hiện tại để kiểm tra
                const state = store.getState();
                const messages = state.chat.messages;

                // Tìm tin nhắn trong nhóm để biết ID gốc
                const originalMessage = messages.find(msg =>
                    msg.groupId === data.groupId &&
                    (msg.content === data.content || msg.createdAt === data.createdAt)
                );

                if (originalMessage) {
                    console.log('Tìm thấy tin nhắn gốc có ID:', originalMessage.id);
                    // Dispatch action với ID gốc
                    dispatch(deleteMessage(originalMessage.id));
                } else {
                    // Nếu không tìm thấy, thử dispatch với ID từ server
                    console.log('Không tìm thấy tin nhắn gốc, xóa với ID từ server:', data.messageId);
                    dispatch({
                        type: 'chat/messageDeleted',
                        payload: {
                            messageId: data.messageId,
                            groupId: data.groupId
                        }
                    });
                }
            }
        });




        this.socket.on('messageEdit', (data) => {
            console.log('🔄 Nhận sự kiện messageEdit:', data);

            // Cập nhật store khi nhận được event từ socket
            if (data?.messageId && data?.groupId) {
                // Kiểm tra xem có dữ liệu tin nhắn đã lưu không
                const editedMessage = globalThis.EDITED_MESSAGES?.[data.messageId];

                if (editedMessage) {
                    console.log('Sử dụng tin nhắn từ cache:', editedMessage);

                    // Lấy nội dung từ cache đã lưu
                    const cachedContent = editedMessage.content || editedMessage.message;

                    // Dispatch với nội dung từ cache
                    dispatch({
                        type: 'chat/messageEdited',
                        payload: {
                            messageId: data.messageId,
                            groupId: data.groupId,
                            newContent: cachedContent
                        }
                    });

                    // Xóa khỏi cache sau khi đã sử dụng
                    delete globalThis.EDITED_MESSAGES[data.messageId];
                } else {
                    console.log('Không tìm thấy dữ liệu cache cho tin nhắn:', data.messageId);

                    // Chỉ đánh dấu là đã chỉnh sửa mà không thay đổi nội dung
                    dispatch({
                        type: 'chat/markMessageAsEdited',
                        payload: {
                            messageId: data.messageId,
                            groupId: data.groupId
                        }
                    });
                }
            }
        });




        // User status updates
        this.socket.on('userStatusUpdate', (data) => {
            // console.log('User status update:', data);
            const { profileId, isOnline, isActive, groupId } = data;
            dispatch({
                type: 'chat/statusUpdated',
                payload: { profileId, isOnline, isActive, groupId }
            });
        });

        // Socket error handling
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

    /**
     * Set up chat detail specific listeners
     * @param {string} groupId - Chat group ID
     * @param {string} profileId - User profile ID
     * @param {Function} dispatch - Redux dispatch function
     * @returns {Function} - Cleanup function to remove listeners
     */
    setupChatDetailListeners(groupId, profileId, dispatch) {
        if (!this.socket || !profileId || !groupId) return null;

        // Socket event handlers
        this.socket.on('connect', () => console.log('Socket connected successfully'));
        this.socket.on('disconnect', () => console.log('Socket disconnected'));
        this.socket.on('error', (error) => console.log('Socket error:', error));

        // New message handler for specific chat
        this.socket.on('receiveMessage', (message) => {
            if (message.groupId === groupId) {
                const isMyMessage = message.senderId === profileId;
                const formattedMessage = {
                    id: message.id,
                    message: message.content,
                    senderId: message.senderId,
                    groupId: message.groupId,
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt,
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

        // Xử lý sự kiện messageRecalled trong chat
        this.socket.on('notifyRecallMessage', (data) => {
            console.log('Nhận sự kiện messageRecalled trong chatDetail:', data);
            const { messageId, groupId: recalledGroupId } = data;

            // Chỉ xử lý nếu tin nhắn thuộc về nhóm hiện tại
            if (recalledGroupId === groupId && messageId) {
                // Cập nhật tin nhắn thu hồi
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

        this.socket.on('notifyMessageDelete', (data) => {
            console.log('Nhận sự kiện messageDel trong chatDetail:', data);
            const { messageId, groupId: delGroupId } = data;

            // Chỉ xử lý nếu tin nhắn thuộc về nhóm hiện tại
            if (delGroupId === groupId && messageId) {
                // Cập nhật tin nhắn thu hồi
                dispatch({
                    type: 'chat/messageDeleted',
                    payload: {
                        messageId,
                        groupId: delGroupId
                    }
                });

                // Thông báo cập nhật giao diện
                console.log('Đã cập nhật tin nhắn đ xoá:', messageId);
            }
        });

        // Xử lý sự kiện thu hồi tin nhắn trong chat
        this.socket.on('messageRecall', (data) => {
            console.log('Nhận sự kiện messageRecall trong chatDetail:', data);
            const { messageId, groupId: recalledGroupId } = data;

            // Chỉ xử lý nếu tin nhắn thuộc về nhóm hiện tại
            if (recalledGroupId === groupId && messageId) {
                // Cập nhật tin nhắn thu hồi
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

        // Xử lý sự kiện xóa tin nhắn trong chat (đã xóa bản trùng lặp)
        this.socket.on('messageDelete', (data) => {
            console.log('🔄 Nhận sự kiện delete:', data);
            if (data?.messageId && data?.groupId) {
                // Trước khi dispatch, lấy về state hiện tại để kiểm tra
                const state = store.getState();
                const messages = state.chat.messages;

                // Tìm tin nhắn trong nhóm để biết ID gốc
                const originalMessage = messages.find(msg =>
                    msg.groupId === data.groupId &&
                    (msg.content === data.content || msg.createdAt === data.createdAt)
                );

                if (originalMessage) {
                    console.log('Tìm thấy tin nhắn gốc có ID:', originalMessage.id);
                    // Dispatch action với ID gốc
                    dispatch(deleteMessage(originalMessage.id));
                } else {
                    // Nếu không tìm thấy, thử dispatch với ID từ server
                    console.log('Không tìm thấy tin nhắn gốc, xóa với ID từ server:', data.messageId);
                    dispatch({
                        type: 'chat/messageDeleted',
                        payload: {
                            messageId: data.messageId,
                            groupId: data.groupId
                        }
                    });
                }
            }
        });



        const handleMessageEdit = (data) => {
            console.log('📱 ChatDetail nhận sự kiện messageEdit:', data);
            const { messageId, groupId: editedGroupId, newContent } = data;

            // Chỉ xử lý nếu tin nhắn thuộc về nhóm hiện tại
            if (editedGroupId === groupId && messageId) {
                console.log('Cập nhật nội dung tin nhắn:', messageId, newContent);

                // Dispatch action để cập nhật nội dung tin nhắn
                dispatch({
                    type: 'chat/messageEdited',
                    payload: {
                        messageId,
                        groupId: editedGroupId,
                        newContent
                    }
                });
            }
        };

        this.socket.on('messageEdit', handleMessageEdit);
        this.socket.on('notifyMessageEdit', handleMessageEdit);
        // Trả về hàm cleanup để remove event listeners
        return () => {
            if (this.socket?.connected) {
                this.emitLeaveChat(profileId, groupId);
            }
            this.socket.off('connect');
            this.socket.off('disconnect');
            this.socket.off('error');
            this.socket.off('receiveMessage');
            this.socket.off('notifyRecallMessage');
            this.socket.off('messageRecall');
            this.socket.off('messageDelete');
            this.socket.off('messageEdit', handleMessageEdit);
            this.socket.off('notifyMessageEdit', handleMessageEdit);
        };
    }
}

export default new SocketService();