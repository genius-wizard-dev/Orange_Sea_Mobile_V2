import { createAsyncThunk } from '@reduxjs/toolkit';
import { ENDPOINTS } from '../../service/api.endpoint';
import apiService from '../../service/api.service';
import { setLoading, setError, addMessage, deleteMessage, updateMessage, setSocket, setSocketConnected, setMessages } from '../slices/chatSlice';
import io from 'socket.io-client';
import socketService from '../../service/socket.service';

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiService.post(ENDPOINTS.CHAT.SEND, {
        groupId: messageData.groupId,
        message: messageData.message,
        type: messageData.type,
        senderId: messageData.senderId
      });

      // Đảm bảo response có ID thật trước khi trả về
      if (response?.status === 'success' && response?.data?.id) {
        return {
          ...response,
          data: {
            ...response.data,
            id: response.data.id, // Đảm bảo có id thật
            tempId: undefined // Xóa tempId nếu có
          }
        };
      }

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadSticker = createAsyncThunk(
  'chat/uploadSticker',
  async (stickerData, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const formData = new FormData();
      formData.append('sticker', stickerData);
      const response = await apiService.post(ENDPOINTS.CHAT.UPLOAD_STICKER, formData);
      return response;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const recallMessage = createAsyncThunk(
  'chat/recallMessage',
  async (messageId, { dispatch }) => {
    try {
      const response = await apiService.put(ENDPOINTS.CHAT.RECALL(messageId));
      // Trả về trực tiếp response để xử lý ở component
      return response;
    } catch (error) {
      // Ném lỗi với message từ API hoặc message mặc định
      throw error.response?.data || { 
        status: 'error',
        message: 'Không thể thu hồi tin nhắn' 
      };
    }
  }
);

export const deleteMessageThunk = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId, { dispatch, getState }) => {
    try {
      dispatch(setLoading(true));
      const response = await apiService.delete(ENDPOINTS.CHAT.DELETE(messageId));

      if (response.status === 'success') {
        // Emit socket event để thông báo cho người khác
        const socket = socketService.getSocket();
        if (socket) {
          socket.emit('delete', { messageId });
        }

        dispatch(deleteMessage(messageId));
        return response;
      }

      throw new Error('Xóa tin nhắn thất bại');
    } catch (error) {
      console.log('Lỗi xóa tin nhắn:', error.message);
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const forwardMessage = createAsyncThunk(
  'chat/forwardMessage',
  async ({ messageId, targetId }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await apiService.post(ENDPOINTS.CHAT.FORWARD, {
        messageId,
        targetId
      });
      return response;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ groupId }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await apiService.get(ENDPOINTS.CHAT.GET_MESSAGES(groupId));
      dispatch(setMessages(response)); // Thay thế toàn bộ messages bằng data mới
      return response;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const initializeSocket = createAsyncThunk(
  'chat/initializeSocket',
  async (_, { dispatch }) => {
    try {
      const socket = socketService.connect();

      socket.on('connect', () => {
        dispatch(setSocketConnected(true));
      });

      socket.on('disconnect', () => {
        dispatch(setSocketConnected(false));
      });

      return true;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  }
);

export const connectSocket = createAsyncThunk(
  'chat/connectSocket',
  async (_, { dispatch, getState }) => {
    try {
      const { socket } = getState().chat;
      if (!socket) {
        await dispatch(initializeSocket());
      } else {
        socket.connect();
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  }
);

export const disconnectSocket = createAsyncThunk(
  'chat/disconnectSocket',
  async (_, { dispatch, getState }) => {
    try {
      const { socket } = getState().chat;
      if (socket) {
        socket.disconnect();
        dispatch(setSocketConnected(false));
      }
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    }
  }
);
