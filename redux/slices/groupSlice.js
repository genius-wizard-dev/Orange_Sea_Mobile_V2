import { createSlice } from '@reduxjs/toolkit';
import { getListGroup } from '../thunks/group';

const initialState = {
    loading: false,
    error: null,
    groups: [],
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
            });
    },
});

export const { clearGroupError, clearGroups } = groupSlice.actions;
export default groupSlice.reducer;
