import io from 'socket.io-client';
import Constants from 'expo-constants';
class SocketService {
  socket = null;
  isRegistered = false;

  connect() {
    this.socket = io(`ws://${Constants.expoConfig?.extra?.API_BASE_URL.substr(7)}/chat`, {
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

  isSocketRegistered() {
    return this.isRegistered;
  }

  setupCommonListeners(profileId, dispatch) {
    if (!this.socket || !profileId) return;

    // Đăng ký và keep-alive socket
    const registerSocket = () => {
      this.socket.emit('register', { profileId }, (response) => {
        console.log('Register response in socket service:', response);
      });
    };

    // Register ngay lập tức và setup interval để giữ kết nối
    registerSocket();
    const keepAliveInterval = setInterval(registerSocket, 30000);

    // Lắng nghe tin nhắn mới
    this.socket.on('newMessage', (message) => {
      console.log('New message received in socket service:', message);
      dispatch({
        type: 'chat/messageReceived',
        payload: {
          ...message,
          content: message.content || message.message,
          createdAt: message.createdAt || new Date().toISOString()
        }
      });
    });

    // Lấy và lắng nghe số tin nhắn chưa đọc
    this.socket.emit('getUnreadCounts', { profileId });
    this.socket.on('unreadCountUpdated', (updates) => {
      console.log('Unread count updated:', updates);
      dispatch({ type: 'chat/unreadCountsUpdated', payload: updates });
    });

    return () => {
      clearInterval(keepAliveInterval);
      this.socket.off('newMessage');
      this.socket.off('unreadCountUpdated');
    };
  }
}

export default new SocketService;
