import { createSlice } from '@reduxjs/toolkit';
import { editMessageThunk } from '../thunks/chat';

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
  editingMessage: null,
  groupMedia: {
    // Cấu trúc: { groupId: { IMAGE: [...], VIDEO: [...], RAW: [...] } }
  },
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
    notificationReceived: (state, action) => {
      const message = action.payload;

      // Cập nhật tin nhắn cuối cùng cho nhóm chat
      if (message.groupId) {
        state.lastMessages[message.groupId] = message;
      }

      // Nếu không phải tin nhắn của người dùng hiện tại thì cập nhật thông báo
      if (message.senderId !== state.currentChat.profileId) {
        // Thêm vào danh sách thông báo
        state.notifications.push({
          id: message.id || `notification-${Date.now()}`,
          groupId: message.groupId,
          message: message.content || message.message,
          senderId: message.senderId,
          senderName: message.sender?.name || 'Người dùng',
          createdAt: message.createdAt || new Date().toISOString(),
          isRead: false
        });

        // Giới hạn số lượng thông báo lưu trong state để tối ưu bộ nhớ
        if (state.notifications.length > 20) {
          state.notifications.shift(); // Loại bỏ thông báo cũ nhất
        }
      }
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
    setEditingMessage: (state, action) => {
      state.editingMessage = action.payload;
    },
    updateMessageContent: (state, action) => {
      const { messageId, content } = action.payload;

      console.log('Cập nhật nội dung tin nhắn:', messageId, content);

      // Tìm tin nhắn cần cập nhật
      const messageIndex = state.messages.findIndex(msg => msg.id === messageId);

      if (messageIndex !== -1) {
        const originalContent = state.messages[messageIndex].message;

        // Kiểm tra nếu nội dung thực sự thay đổi
        if (originalContent !== content) {
          // Cập nhật nội dung tin nhắn
          state.messages[messageIndex].message = content;
          state.messages[messageIndex].isEdited = true;

          console.log('Nội dung tin nhắn đã thay đổi:',
            'Từ', originalContent,
            'Thành', content);
        } else {
          console.log('Nội dung tin nhắn không thay đổi');
        }

        // Force update UI
        state.messages = [...state.messages];
      } else {
        console.warn('Không tìm thấy tin nhắn:', messageId);
      }

      // Reset editingMessage
      state.editingMessage = null;
    },


    markMessageAsEdited: (state, action) => {
      const { messageId, groupId } = action.payload;

      // Tìm tin nhắn cần đánh dấu
      const messageIndex = state.messages.findIndex(msg =>
        msg.id === messageId && (!groupId || msg.groupId === groupId)
      );

      if (messageIndex !== -1) {
        // Chỉ đánh dấu là đã chỉnh sửa mà không thay đổi nội dung
        state.messages[messageIndex].isEdited = true;

        // Cập nhật mảng messages để kích hoạt re-render
        state.messages = [...state.messages];

        console.log('Đã đánh dấu tin nhắn là đã chỉnh sửa:', messageId);
      }
    },



    deleteMessage: (state, action) => {
      const messageId = action.payload;
      console.log('Đang xóa tin nhắn với ID:', messageId);
      console.log('Danh sách msg.id hiện tại:', state.messages.map(msg => msg.id));

      // Kiểm tra trước khi xóa
      const messageToDelete = state.messages.find(msg => msg.id === messageId);

      if (messageToDelete) {
        console.log('Đã tìm thấy tin nhắn cần xóa:', messageToDelete);

        // Lọc tin nhắn khỏi danh sách
        state.messages = state.messages.filter(msg => msg.id !== messageId);

        console.log('Số lượng tin nhắn trước khi xóa:', state.messages.length + 1);
        console.log('Số lượng tin nhắn sau khi xóa:', state.messages.length);
      } else {
        console.warn('Không tìm thấy tin nhắn với ID:', messageId);
        console.log('Kiểm tra xem có tempId không...');

        // Thử tìm và xóa theo tempId (cho tin nhắn đang gửi)
        const pendingMessage = state.messages.find(msg => msg.tempId === messageId);
        if (pendingMessage) {
          console.log('Đã tìm thấy tin nhắn theo tempId:', pendingMessage);
          state.messages = state.messages.filter(msg => msg.tempId !== messageId);
        } else {
          console.error('Không tìm thấy tin nhắn nào để xóa với ID hoặc tempId:', messageId);
        }
      }
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
        // console.log('Updated Redux messages:', state.messages);
      }
    },
    updateMessageStatus: (state, action) => {
      const { tempId, newMessage } = action.payload;
      console.log('updateMessageStatus called with:', { tempId, newMessage });

      const index = state.messages.findIndex(msg => msg.tempId === tempId);

      if (index !== -1) {
        const oldMessage = state.messages[index];

        // SỬA: Ưu tiên giữ imageUrl từ temp message nếu newMessage không có
        const updatedMessage = {
          ...oldMessage, // Giữ lại dữ liệu cũ (bao gồm imageUrl từ temp)
          ...newMessage, // Override với dữ liệu mới
          // Đảm bảo các field quan trọng không bị undefined
          id: newMessage.id || oldMessage.id,
          message: newMessage.message || newMessage.content || oldMessage.message || '',
          createdAt: newMessage.createdAt || oldMessage.createdAt,
          updatedAt: newMessage.updatedAt || oldMessage.updatedAt,
          senderId: newMessage.senderId || oldMessage.senderId,
          groupId: newMessage.groupId || oldMessage.groupId,
          type: newMessage.type || oldMessage.type,
          sender: newMessage.sender || oldMessage.sender || {
            id: newMessage.senderId,
            name: 'Unknown',
            avatar: null
          },
          // SỬA: Ưu tiên imageUrl từ server, nhưng fallback về temp message
          imageUrl: newMessage.imageUrl ||
            newMessage.fileUrl ||
            newMessage.url ||
            newMessage.image ||
            newMessage.attachmentUrl ||
            newMessage.file ||
            newMessage.media ||
            newMessage.src ||
            newMessage.path ||
            newMessage.link ||
            oldMessage.imageUrl, // QUAN TRỌNG: Giữ imageUrl từ temp message
          fileName: newMessage.fileName || oldMessage.fileName,
          fileSize: newMessage.fileSize || oldMessage.fileSize
        };

        state.messages[index] = updatedMessage;
        state.messages = [...state.messages];
      } else {
        console.warn('Không tìm thấy tin nhắn với tempId:', tempId);

        // SỬA: Đảm bảo newMessage có đầy đủ thông tin trước khi thêm
        const safeNewMessage = {
          ...newMessage,
          message: newMessage.message || newMessage.content || '',
          createdAt: newMessage.createdAt || new Date().toISOString(),
          updatedAt: newMessage.updatedAt || new Date().toISOString(),
          sender: newMessage.sender || {
            id: newMessage.senderId,
            name: 'Unknown',
            avatar: null
          },
          imageUrl: newMessage.imageUrl ||
            newMessage.fileUrl ||
            newMessage.url ||
            newMessage.image ||
            newMessage.attachmentUrl
        };

        state.messages = [safeNewMessage, ...state.messages];
      }
    },
    setUnreadCounts: (state, action) => {
      state.unreadCounts = action.payload;
    },
    updateUnreadCounts: (state, action) => {
      const { groupId, increment, count } = action.payload;

      if (groupId) {
        // Nếu có count cụ thể, sử dụng nó
        if (count !== undefined) {
          state.unreadCounts[groupId] = count;
        }
        // Ngược lại, tăng giá trị hiện tại
        else if (increment !== undefined) {
          // Khởi tạo nếu chưa có
          if (!state.unreadCounts[groupId]) {
            state.unreadCounts[groupId] = 0;
          }
          state.unreadCounts[groupId] += increment;
        }

        // Log để debug
        console.log(`Updated unreadCount for ${groupId}: ${state.unreadCounts[groupId]}`);
      }
    },
    updateLastMessage: (state, action) => {
      const { groupId, message } = action.payload;

      if (groupId && message) {
        // Cập nhật trực tiếp thay vì kiểm tra thời gian
        // Tin nhắn từ notifyMessage luôn là tin nhắn mới nhất
        state.lastMessages[groupId] = {
          ...message,
          // Đảm bảo các trường bắt buộc luôn có giá trị
          content: message.content || message.message || "",
          createdAt: message.createdAt || new Date().toISOString(),
          updatedAt: message.updatedAt || message.createdAt || new Date().toISOString(),
          sender: message.sender || {}
        };

        // Log để debug
        console.log(`Updated lastMessages for ${groupId}:`, state.lastMessages[groupId]);
      }
    },
    markGroupAsRead: (state, action) => {
      const { groupId } = action.payload;
      state.unreadCounts[groupId] = 0;
    },
    statusUpdated: (state, action) => {
      const { profileId, isOnline, isActive, lastSeen } = action.payload;

      // Xử lý trường hợp chỉ có người dùng đơn lẻ
      if (profileId) {
        state.userStatuses[profileId] = {
          isOnline,
          isActive,
          lastSeen: lastSeen || new Date().toISOString()
        };
      }
      // Xử lý trường hợp cập nhật hàng loạt
      else if (action.payload.online || action.payload.offline) {
        const { online, offline } = action.payload;

        // Cập nhật trạng thái online
        if (Array.isArray(online)) {
          online.forEach(id => {
            state.userStatuses[id] = {
              isOnline: true,
              isActive: true,
              lastSeen: new Date().toISOString()
            };
          });
        }

        // Cập nhật trạng thái offline
        if (Array.isArray(offline)) {
          offline.forEach(id => {
            if (state.userStatuses[id]) {
              state.userStatuses[id] = {
                ...state.userStatuses[id],
                isOnline: false,
                isActive: false,
                lastSeen: new Date().toISOString()
              };
            } else {
              state.userStatuses[id] = {
                isOnline: false,
                isActive: false,
                lastSeen: new Date().toISOString()
              };
            }
          });
        }
      }
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
    setGroupMedia: (state, action) => {
      const { groupId, mediaType, data } = action.payload;

      if (!state.groupMedia[groupId]) {
        state.groupMedia[groupId] = {};
      }

      // Cập nhật theo format mới: data.media thay vì data.items
      state.groupMedia[groupId][mediaType] = data.media || [];

      // Lưu cursor cho phân trang
      state.groupMedia[groupId][`${mediaType}_cursor`] = data.nextCursor || null;

      // Lưu thêm thông tin hasMore để biết có thể load thêm không
      state.groupMedia[groupId][`${mediaType}_hasMore`] = data.hasMore || false;
    },

    appendGroupMedia: (state, action) => {
      const { groupId, mediaType, data } = action.payload;

      if (!state.groupMedia[groupId]) {
        state.groupMedia[groupId] = {};
      }

      if (!state.groupMedia[groupId][mediaType]) {
        state.groupMedia[groupId][mediaType] = [];
      }

      // Thêm media mới vào danh sách hiện tại, sử dụng data.media thay vì data.items
      state.groupMedia[groupId][mediaType] = [
        ...state.groupMedia[groupId][mediaType],
        ...(data.media || [])
      ];

      // Cập nhật cursor
      state.groupMedia[groupId][`${mediaType}_cursor`] = data.nextCursor || null;

      // Cập nhật hasMore
      state.groupMedia[groupId][`${mediaType}_hasMore`] = data.hasMore || false;
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
            updatedAt: message.updatedAt,
            groupId: message.groupId,
            sender: message.sender,
            isRecalled: message.isRecalled,
            fileName: message.fileName,
            fileSize: message.fileSize,
            type: message.type,
            originalContent: message.originalContent,
          };
          if (state.currentChat?.groupId !== message.groupId) {
            state.unreadCounts[message.groupId] =
              (state.unreadCounts[message.groupId] || 0) + 1;
          }
        }
      })
      .addCase('chat/messageDeleted', (state, action) => {
        const { messageId, groupId } = action.payload;
        console.log('Xử lý messageDeleted với ID:', messageId);

        // Tìm tin nhắn tương ứng trong nhóm
        const messagesInGroup = state.messages.filter(msg => msg.groupId === groupId);
        console.log('Tin nhắn trong nhóm:', messagesInGroup.length);

        // Kiểm tra xem có messageId khớp không
        const messageExists = messagesInGroup.some(msg => msg.id === messageId);

        if (messageExists) {
          // Nếu tìm thấy, xóa tin nhắn đó
          state.messages = state.messages.filter(msg => msg.id !== messageId);
          console.log('Đã xóa tin nhắn với ID:', messageId);
        } else {
          // Nếu không tìm thấy, có thể là ID từ server và ID local khác nhau
          // Thử tìm tin nhắn gần nhất trong nhóm đó
          console.log('Không tìm thấy tin nhắn, có thể ID khác giữa server và client');

          // Nếu không tìm được, chỉ ghi log
          console.warn('Không thể xóa tin nhắn: messageId không khớp với bất kỳ tin nhắn nào trong state');
        }

        // Cập nhật state để kích hoạt re-render
        state.messages = [...state.messages];
      })
      .addCase('chat/messageRecalled', (state, action) => {
        const { messageId, groupId } = action.payload;
        const recallAction = {
          type: 'recallMessage',
          payload: { messageId, groupId }
        };
        chatSlice.caseReducers.recallMessage(state, recallAction);
      })





      .addCase(editMessageThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editMessageThunk.fulfilled, (state, action) => {
        state.loading = false;

        // Nếu API trả về thành công, không cần cập nhật state ở đây
        // Vì sẽ nhận được sự kiện messageEdit từ socket để cập nhật state
      })
      .addCase(editMessageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Lỗi khi chỉnh sửa tin nhắn';
      })

      // Xử lý sự kiện messageEdit từ socket
      .addCase('chat/messageEdited', (state, action) => {
        const { messageId, groupId, newContent } = action.payload;
        console.log('Xử lý messageEdited với ID:', messageId, 'New content:', newContent);

        // Tìm tin nhắn cần cập nhật
        const messageIndex = state.messages.findIndex(msg =>
          msg.id === messageId && msg.groupId === groupId
        );

        if (messageIndex !== -1) {
          // Cập nhật nội dung tin nhắn
          state.messages[messageIndex].message = newContent;
          state.messages[messageIndex].isEdited = true;

          // Đảm bảo update UI bằng cách tạo mảng mới
          state.messages = [...state.messages];

          console.log('Đã cập nhật tin nhắn từ socket:', messageId);
        } else {
          console.warn('Không tìm thấy tin nhắn để cập nhật:', messageId);
        }
      })

      .addCase('friend/statusUpdated', (state, action) => {
        const { online, offline } = action.payload;

        // Cập nhật trạng thái online cho tất cả người dùng trong danh sách online
        if (Array.isArray(online)) {
          online.forEach(profileId => {
            state.userStatuses[profileId] = {
              isOnline: true,
              isActive: true,
              lastSeen: new Date().toISOString()
            };
          });
        }

        // Cập nhật trạng thái offline cho tất cả người dùng trong danh sách offline
        if (Array.isArray(offline)) {
          offline.forEach(profileId => {
            // Chỉ cập nhật nếu người dùng đã có trong trạng thái hoặc đặt trạng thái mới
            if (state.userStatuses[profileId]) {
              state.userStatuses[profileId] = {
                ...state.userStatuses[profileId],
                isOnline: false,
                isActive: false,
                lastSeen: new Date().toISOString()
              };
            } else {
              state.userStatuses[profileId] = {
                isOnline: false,
                isActive: false,
                lastSeen: new Date().toISOString()
              };
            }
          });
        }
      })

      .addCase('chat/userStatusUpdated', (state, action) => {
        const { profileId, isOnline, isActive, lastSeen } = action.payload;
        state.userStatuses[profileId] = {
          isOnline,
          isActive,
          lastSeen: lastSeen || new Date().toISOString()
        };
      })




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
  setEditingMessage,
  updateMessageContent,

  setGroupMedia,
  appendGroupMedia,
} = chatSlice.actions;

export default chatSlice.reducer;