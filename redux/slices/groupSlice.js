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
                state.groups = state.groups.filter(group => group.id !== action.payload.groupId);
                delete state.groupDetails[action.payload.groupId];
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
                const { groupId, participant } = action.payload.data;
                if (state.groupDetails[groupId]) {
                    state.groupDetails[groupId].participants.push(participant);
                }
            })
            .addCase(groupThunks.removeParticipant.fulfilled, (state, action) => {
                const { groupId, participantId } = action.payload.data;
                if (state.groupDetails[groupId]) {
                    state.groupDetails[groupId].participants = 
                        state.groupDetails[groupId].participants.filter(p => p.id !== participantId);
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
