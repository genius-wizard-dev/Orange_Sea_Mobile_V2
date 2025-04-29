import { createSlice } from '@reduxjs/toolkit';
import io from 'socket.io-client';

const initialState = {
  messages: [],
  loading: false,
  error: null,
  currentChat: {
    groupId: null,
    members: [],
    messages: []
  },
  isConnected: false,
  unreadCounts: {},
  notifications: [],
  lastMessages: {}
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addMessage: (state, action) => {
      // Chỉ thêm tin nhắn nếu chưa tồn tại
      const exists = state.messages.some(msg => 
        msg.id === action.payload.id || 
        (msg.tempId && msg.tempId === action.payload.tempId)
      );
      if (!exists) {
        state.messages.push(action.payload);
      }
    },
    deleteMessage: (state, action) => {
      // Xóa tin nhắn khỏi mảng messages
      state.messages = state.messages.filter(msg => msg.id !== action.payload);
      // Force update để trigger re-render
      state.messages = [...state.messages];
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex(msg => msg.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = {
          ...state.messages[index],
          ...action.payload
        };
      }
      // Force update để trigger re-render
      state.messages = [...state.messages];
    },
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    setSocketConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    handleSocketMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action) => {
      // Đảm bảo không mất tin nhắn khi cập nhật
      if (Array.isArray(action.payload)) {
        // Lọc ra các tin nhắn unique dựa trên id hoặc tempId
        const uniqueMessages = action.payload.reduce((acc, curr) => {
          const key = curr.id || curr.tempId;
          if (!acc.has(key)) {
            acc.set(key, curr);
          }
          return acc;
        }, new Map());
        
        state.messages = Array.from(uniqueMessages.values())
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
    },
    addPendingMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateMessageStatus: (state, action) => {
      const { tempId, newMessage } = action.payload;
      const index = state.messages.findIndex(msg => msg.tempId === tempId);
      if (index !== -1) {
        state.messages[index] = {
          ...state.messages[index],
          ...newMessage,
          tempId: undefined // Xóa tempId khi đã có ID thật
        };
      }
    },
    setUnreadCounts: (state, action) => {
      const unreadData = {};
      action.payload.forEach(item => {
        unreadData[item.groupId] = item.unreadCount;
      });
      state.unreadCounts = unreadData;
    },
    updateUnreadCounts: (state, action) => {
      action.payload.forEach(update => {
        state.unreadCounts[update.groupId] = update.unreadCount;
      });
    },
    updateLastMessage: (state, action) => {
      const { groupId } = action.payload;
      state.lastMessages[groupId] = action.payload;
    },
    updateChatNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    markGroupAsRead: (state, action) => {
      const { groupId } = action.payload;
      // Reset unread count cho group
      state.unreadCounts[groupId] = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase('chat/messageReceived', (state, action) => {
        const message = action.payload;
        
        // Cập nhật tin nhắn mới nhất và unread count
        if (message.groupId) {
          // Cập nhật tin nhắn mới
          state.lastMessages[message.groupId] = {
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
            groupId: message.groupId,
            sender: message.sender
          };

          // Tăng unread count nếu không phải current chat
          if (state.currentChat?.groupId !== message.groupId) {
            state.unreadCounts[message.groupId] = 
              (state.unreadCounts[message.groupId] || 0) + 1;
          }
        }
      })
      .addCase('chat/unreadCountsUpdated', (state, action) => {
        action.payload.forEach(update => {
          state.unreadCounts[update.groupId] = update.unreadCount;
        });
      })
      .addCase('chat/messageDeleted', (state, action) => {
        const { messageId, groupId } = action.payload;
        if (groupId === state.currentChat?.groupId) {
          // Xóa tin nhắn nếu đang ở trong chat hiện tại
          state.messages = state.messages.filter(msg => msg.id !== messageId);
          state.messages = [...state.messages];
        }
      });
  }
});

export const {
  setLoading,
  setError,
  addMessage,
  deleteMessage,
  updateMessage,
  setCurrentChat,
  clearMessages,
  setSocket,
  setSocketConnected,
  handleSocketMessage,
  setMessages,
  addPendingMessage,
  updateMessageStatus,
  setUnreadCounts,
  updateUnreadCounts,
  updateLastMessage,
  updateChatNotification,
  markGroupAsRead
} = chatSlice.actions;

export default chatSlice.reducer;
