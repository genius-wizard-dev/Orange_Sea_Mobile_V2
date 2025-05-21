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
      dispatch(setLoading(true));

      const isFormData = messageData instanceof FormData;
      let response;

      if (isFormData) {
        // Nếu là FormData (upload ảnh)
        response = await apiService.post(ENDPOINTS.CHAT.SEND, messageData);
      } else {
        // Nếu là tin nhắn thường
        response = await apiService.post(ENDPOINTS.CHAT.SEND, {
          groupId: messageData.groupId,
          message: messageData.message,
          type: messageData.type || 'TEXT',
          senderId: messageData.senderId
        });
      }

      console.log("res send message", response);

      // Đảm bảo response có messageId hoặc id trước khi trả về
      if (response?.statusCode === 200 && response?.data?.messageId) {
        return {
          ...response,
          data: {
            ...response.data,
            id: response.data.messageId || response.data.id,
            tempId: undefined
          }
        };
      }

      return response;
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      dispatch(setError(error.message || 'Không thể gửi tin nhắn'));
      return rejectWithValue(error.response?.data || { message: 'Không thể gửi tin nhắn' });
    } finally {
      dispatch(setLoading(false));
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
  async (messageId, { rejectWithValue }) => {
    try {
      console.log('Recalling message with ID:', messageId);
      const response = await apiService.put(ENDPOINTS.CHAT.RECALL(messageId));
      console.log('Recall API full response:', response);

      // Nếu thành công thì trả về data
      return response;
    } catch (error) {
      console.error('Recall message API error details:', error);
      return rejectWithValue(error.response?.data || { message: 'Có lỗi xảy ra khi thu hồi tin nhắn' });
    }
  }
);

export const deleteMessageThunk = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      console.log('Deleting message with ID:', messageId);
      const response = await apiService.delete(ENDPOINTS.CHAT.DELETE(messageId));
      console.log('Delete message API response:', response);

      return response;
    } catch (error) {
      console.error('Delete message API error details:', error);
      return rejectWithValue(error.response?.data || { message: 'Có lỗi xảy ra khi xoá tin nhắn' });
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


export const fetchPaginatedMessages = createAsyncThunk(
  'chat/fetchPaginatedMessages',
  async ({ groupId, cursor }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await apiService.get(
        ENDPOINTS.CHAT.GET_MESSAGES(groupId),
        { cursor }
      );
      return response;
    } catch (error) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const editMessageThunk = createAsyncThunk(
  'chat/editMessage',
  async ({ messageId, newContent }, { rejectWithValue, dispatch }) => {
    try {
      console.log('Editing message with ID:', messageId, 'New content:', newContent);

      // Gọi API để chỉnh sửa tin nhắn
      const response = await apiService.put(
        ENDPOINTS.CHAT.EDIT_MESSAGE(messageId),
        { newContent }
      );

      console.log('Edit message API response:', response);

      if (response.statusCode === 200) {
        // LƯU Ý: Server trả về response.data là đối tượng tin nhắn đã cập nhật
        const updatedMessage = response.data;

        // Cập nhật UI ngay lập tức (không đợi socket)
        if (updatedMessage) {
          // Khởi tạo và lưu tin nhắn đã cập nhật vào global cache
          if (!globalThis.EDITED_MESSAGES) {
            globalThis.EDITED_MESSAGES = {};
          }
          globalThis.EDITED_MESSAGES[messageId] = updatedMessage;

          // Dispatch action cập nhật UI
          dispatch({
            type: 'chat/messageEdited',
            payload: {
              messageId,
              groupId: updatedMessage.groupId,
              newContent: updatedMessage.content || updatedMessage.message
            }
          });
        }

        // Emit socket event
        socketService.emitEditMessage(messageId);
      }

      return response;
    } catch (error) {
      console.error('Error editing message:', error);
      return rejectWithValue(error.response?.data || { message: 'Lỗi khi chỉnh sửa tin nhắn' });
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
