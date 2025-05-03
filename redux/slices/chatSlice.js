import { createSlice } from '@reduxjs/toolkit';

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
  lastMessages: {},
  userStatuses: {},
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
      const messageId = action.payload;
      state.messages = state.messages.filter(msg => msg.id !== messageId);
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
    setSocketConnected: (state, action) => {
      state.isConnected = action.payload;
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
    markGroupAsRead: (state, action) => {
      const { groupId } = action.payload;
      // Reset unread count cho group
      state.unreadCounts[groupId] = 0;
    },
    statusUpdated: (state, action) => {
      const { profileId, isOnline, isActive } = action.payload;
      state.userStatuses[profileId] = { isOnline, isActive };
    },
    recallMessage: (state, action) => {
      const { messageId, groupId } = action.payload;
      
      // Tìm và cập nhật tin nhắn trong mảng messages
      const messageIndex = state.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        state.messages[messageIndex] = {
          ...state.messages[messageIndex],
          isRecalled: true
        };
        
        // Gán lại để đảm bảo re-render
        state.messages = [...state.messages];
      }
      
      // Cập nhật tin nhắn mới nhất nếu cần
      if (state.lastMessages[groupId]?.id === messageId) {
        state.lastMessages[groupId] = {
          ...state.lastMessages[groupId],
          isRecalled: true,
          content: 'Tin nhắn đã được thu hồi'
        };
      }
    },
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
      .addCase('chat/messageDeleted', (state, action) => {
        const { messageId } = action.payload;
        
        // Xóa tin nhắn khỏi danh sách messages
        state.messages = state.messages.filter(msg => msg.id !== messageId);

        // Force update để trigger re-render
        state.messages = [...state.messages];

        console.log('Đã xóa tin nhắn:', messageId);
      })
      .addCase('chat/messageRecalled', (state, action) => {
        const { messageId, groupId } = action.payload;
        
        // Sử dụng reducer đã định nghĩa sẵn để tái sử dụng logic
        const recallAction = {
          type: 'recallMessage',
          payload: { messageId, groupId }
        };
        
        chatSlice.caseReducers.recallMessage(state, recallAction);
        
        // Thêm log để debug
        console.log('📱 Tin nhắn đã được cập nhật trạng thái thu hồi:', messageId);
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
  setSocketConnected,
  setMessages,
  updateMessageStatus,
  setUnreadCounts,
  updateUnreadCounts,
  updateLastMessage,
  markGroupAsRead,
  statusUpdated,
  recallMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
