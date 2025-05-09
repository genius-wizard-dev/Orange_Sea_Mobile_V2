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
      const exists = state.messages.some(msg =>
        msg.id === action.payload.id ||
        (msg.tempId && msg.tempId === action.payload.tempId)
      );
      if (!exists) {
        state.messages = [action.payload, ...state.messages];
      }
    },
    deleteMessage: (state, action) => {
      const messageId = action.payload;
      state.messages = state.messages.filter(msg => msg.id !== messageId && msg.tempId !== messageId);
    },
    updateMessage: (state, action) => {
      const { id, tempId, ...updates } = action.payload;
      const index = state.messages.findIndex(msg => msg.id === id || msg.tempId === tempId);
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...updates };
        state.messages = [...state.messages];
      }
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
      if (Array.isArray(action.payload)) {
        const uniqueMessages = new Map();
        action.payload.forEach(msg => {
          const key = msg.id || msg.tempId;
          if (key) {
            uniqueMessages.set(key, msg);
          }
        });
        state.messages = [...uniqueMessages.values()].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        console.log('Updated Redux messages:', state.messages);
      }
    },
    updateMessageStatus: (state, action) => {
      const { tempId, newMessage } = action.payload;
      const index = state.messages.findIndex(msg => msg.tempId === tempId);
      if (index !== -1) {
        state.messages[index] = { ...newMessage, tempId: undefined };
        state.messages = [...state.messages];
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
      state.unreadCounts[groupId] = 0;
    },
    statusUpdated: (state, action) => {
      const { profileId, isOnline, isActive } = action.payload;
      state.userStatuses[profileId] = { isOnline, isActive };
    },
    recallMessage: (state, action) => {
      const { messageId, groupId } = action.payload;
      const messageIndex = state.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        state.messages[messageIndex] = {
          ...state.messages[messageIndex],
          isRecalled: true
        };
        state.messages = [...state.messages];
      }
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
        if (message.groupId) {
          state.lastMessages[message.groupId] = {
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
            groupId: message.groupId,
            sender: message.sender,
            isRecalled: message.isRecalled,
          };
          if (state.currentChat?.groupId !== message.groupId) {
            state.unreadCounts[message.groupId] =
              (state.unreadCounts[message.groupId] || 0) + 1;
          }
        }
      })
      .addCase('chat/messageDeleted', (state, action) => {
        const { messageId } = action.payload;
        state.messages = state.messages.filter(msg => msg.id !== messageId);
        state.messages = [...state.messages];
        console.log('Đã xóa tin nhắn:', messageId);
      })
      .addCase('chat/messageRecalled', (state, action) => {
        const { messageId, groupId } = action.payload;
        const recallAction = {
          type: 'recallMessage',
          payload: { messageId, groupId }
        };
        chatSlice.caseReducers.recallMessage(state, recallAction);
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