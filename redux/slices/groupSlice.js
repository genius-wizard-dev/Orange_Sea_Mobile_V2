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
            const index = state.groups.findIndex(g => g.id === action.payload.id);
            if (index !== -1) {
                state.groups[index] = action.payload;
            }
        },
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
                console.log('Processing group detail:', JSON.stringify(detail, null, 2));
                
                // Lưu detail và đảm bảo user object được giữ nguyên
                state.groupDetails[detail.id] = detail;
            })
            .addCase(getGroupDetail.rejected, (state, action) => {
                state.detailLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearGroupError, clearGroups, updateGroup } = groupSlice.actions;
export default groupSlice.reducer;
