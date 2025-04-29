import { createSlice } from '@reduxjs/toolkit';
import { getListGroup, getGroupDetail } from '../thunks/group';

const initialState = {
    loading: false,
    error: null,
    groups: [],
    groupDetails: {}, // Thêm object để lưu chi tiết từng group
    detailLoading: false,
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
            // Nếu là array thì cập nhật toàn bộ groups
            if (Array.isArray(action.payload)) {
                state.groups = action.payload;
            } 
            // Nếu là object thì cập nhật một group
            else {
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
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getListGroup.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getListGroup.fulfilled, (state, action) => {
                state.loading = false;
                state.groups = action.payload;
                console.log(action.payload)
            })
            .addCase(getListGroup.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getGroupDetail.pending, (state) => {
                state.detailLoading = true;
            })
            .addCase(getGroupDetail.fulfilled, (state, action) => {
                state.detailLoading = false;
                const detail = action.payload.data || action.payload;
                // console.log('Processing group detail:', JSON.stringify(detail, null, 2));
                
                // Lưu detail và đảm bảo user object được giữ nguyên
                state.groupDetails[detail.id] = detail;
            })
            .addCase(getGroupDetail.rejected, (state, action) => {
                state.detailLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearGroupError, clearGroups, updateGroup, updateGroupMessages } = groupSlice.actions;
export default groupSlice.reducer;
