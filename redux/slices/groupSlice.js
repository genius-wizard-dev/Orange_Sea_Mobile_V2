import { createSlice } from '@reduxjs/toolkit';
import * as groupThunks from '../thunks/group';

const initialState = {
    loading: false,
    error: null,
    groups: [],
    groupDetails: {},
    searchResults: [],
    currentOperation: null
};

const groupSlice = createSlice({
    name: 'group',
    initialState,
    reducers: {
        clearGroupError: (state) => {
            state.error = null;
        },
        clearGroups: (state) => {
            state.groups = [];
        },
        updateGroup: (state, action) => {
            if (Array.isArray(action.payload)) {
                state.groups = action.payload;
            } else {
                const index = state.groups.findIndex(g => g.id === action.payload.id);
                if (index !== -1) {
                    state.groups[index] = action.payload;
                }
            }
        },
        updateGroupMessages: (state, action) => {
            const { groupId, message } = action.payload;
            const groupIndex = state.groups.findIndex(g => g.id === groupId);
            if (groupIndex !== -1) {
                const group = state.groups[groupIndex];
                state.groups[groupIndex] = {
                    ...group,
                    messages: [message, ...(group.messages || [])]
                };
            }
        },
        resetSearchResults: (state) => {
            state.searchResults = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(groupThunks.getListGroup.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(groupThunks.getListGroup.fulfilled, (state, action) => {
                state.loading = false;
                state.groups = action.payload.data || action.payload;
            })
            .addCase(groupThunks.getListGroup.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(groupThunks.getGroupDetail.pending, (state) => {
                state.detailLoading = true;
            })
            .addCase(groupThunks.getGroupDetail.fulfilled, (state, action) => {
                state.detailLoading = false;
                const detail = action.payload.data || action.payload;
                state.groupDetails[detail.id] = detail;
            })
            .addCase(groupThunks.getGroupDetail.rejected, (state, action) => {
                state.detailLoading = false;
                state.error = action.payload;
            })
            .addCase(groupThunks.createGroup.fulfilled, (state, action) => {
                state.groups.unshift(action.payload.data);
            })
            .addCase(groupThunks.searchGroups.fulfilled, (state, action) => {
                state.searchResults = action.payload.data;
            })
            .addCase(groupThunks.deleteGroup.fulfilled, (state, action) => {

                const groupIdToDelete = action.payload.groupId || action.payload.id;

                // Nếu có groupId hoặc id, xóa khỏi danh sách và chi tiết
                if (groupIdToDelete) {
                    state.groups = state.groups.filter(group => group.id !== groupIdToDelete);
                    delete state.groupDetails[groupIdToDelete];
                }
            })
            .addCase(groupThunks.leaveGroup.fulfilled, (state, action) => {
                state.groups = state.groups.filter(group => group.id !== action.payload.groupId);
                delete state.groupDetails[action.payload.groupId];
            })
            .addCase(groupThunks.renameGroup.fulfilled, (state, action) => {
                const { groupId, name } = action.payload.data;
                const group = state.groups.find(g => g.id === groupId);
                if (group) {
                    group.name = name;
                }
                if (state.groupDetails[groupId]) {
                    state.groupDetails[groupId].name = name;
                }
            })
            .addCase(groupThunks.addParticipant.fulfilled, (state, action) => {
                console.log("Xử lý thành công thêm thành viên:", action.payload);

                // Kiểm tra xem action.payload có hợp lệ không
                if (!action.payload || !action.payload.id) {
                    console.error("Payload không hợp lệ hoặc không có id");
                    return;
                }

                const groupId = action.payload.id || action.payload.groupId;

                if (!groupId) {
                    console.error("Không tìm thấy group ID trong payload");
                    return;
                }

                // Cập nhật thông tin nhóm trong state với dữ liệu mới nhất từ API
                state.groupDetails[groupId] = {
                    ...action.payload,
                    needsRefresh: false, // Không cần refresh nữa vì đã có dữ liệu mới nhất
                    lastUpdated: Date.now()
                };

                console.log("Đã cập nhật thông tin nhóm với thành viên mới:", groupId);
            })
            .addCase(groupThunks.removeParticipant.fulfilled, (state, action) => {
                console.log("Reducer removeParticipant.fulfilled với payload:", action.payload);

                // Trích xuất thông tin từ payload
                const groupId = action.payload.groupId;
                const participantIds = action.payload.participantIds || [];

                // Kiểm tra xem có thông tin nhóm trong state không
                if (groupId && state.groupDetails[groupId]) {
                    console.log("Đang cập nhật danh sách thành viên cho nhóm:", groupId);
                    console.log("Danh sách thành viên sẽ bị xóa:", participantIds);

                    // Lấy ra danh sách participants hiện tại
                    const currentParticipants = state.groupDetails[groupId].participants || [];

                    // Lọc bỏ các thành viên có user.id nằm trong participantIds
                    state.groupDetails[groupId].participants = currentParticipants.filter(
                        participant => !participantIds.includes(participant.user?.id)
                    );

                    console.log("Đã cập nhật xong state, số thành viên còn lại:",
                        state.groupDetails[groupId].participants.length);
                } else {
                    console.log("Không tìm thấy thông tin nhóm với ID:", groupId);
                }
            })
            .addCase(groupThunks.transferOwnership.fulfilled, (state, action) => {
                const { groupId, newOwnerId } = action.payload.data;
                if (state.groupDetails[groupId]) {
                    state.groupDetails[groupId].ownerId = newOwnerId;
                }
            });
    }
});

export const { clearGroupError, clearGroups, updateGroup, updateGroupMessages, resetSearchResults } = groupSlice.actions;
export default groupSlice.reducer;
