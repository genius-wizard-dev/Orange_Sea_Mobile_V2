import { createSlice } from '@reduxjs/toolkit';
import io from 'socket.io-client';

const initialState = {
  messages: [],
  loading: false,
  error: null,
  currentChat: null,
  isConnected: false
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
      state.messages = state.messages.filter(msg => msg.id !== action.payload);
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex(msg => msg.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
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
      // Thay vì gán trực tiếp, đảm bảo là array và sắp xếp theo thời gian
      state.messages = Array.isArray(action.payload) ?
        action.payload.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        : [];
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
    }
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
  updateMessageStatus
} = chatSlice.actions;

export default chatSlice.reducer;
