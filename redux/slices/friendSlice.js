import { createSlice } from '@reduxjs/toolkit';
import { 
    sendFriendRequest, 
    getFriendList, 
    getReceivedRequests,
    handleFriendRequest,
    deleteFriend,
    getSentRequests
} from '../thunks/friend';

const initialState = {
    loading: false,
    error: null,
    friends: [],
    receivedRequests: [],
    sentRequests: [],
};

const friendSlice = createSlice({
    name: 'friend',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Handle getFriendList
            .addCase(getFriendList.pending, (state) => {
                state.loading = true;
            })
            .addCase(getFriendList.fulfilled, (state, action) => {
                state.loading = false;
                state.friends = action.payload;
            })
            .addCase(getFriendList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Handle getReceivedRequests
            .addCase(getReceivedRequests.fulfilled, (state, action) => {
                state.receivedRequests = action.payload;
            })
            // Handle sendFriendRequest
            .addCase(sendFriendRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(sendFriendRequest.fulfilled, (state, action) => {
                state.loading = false;
                state.sentRequests.push(action.payload);
            })
            .addCase(sendFriendRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Handle handleFriendRequest
            .addCase(handleFriendRequest.fulfilled, (state, action) => {
                if (action.payload.action === 'accept') {
                    state.friends.push(action.payload);
                }
                state.receivedRequests = state.receivedRequests.filter(
                    request => request.id !== action.payload.requestId
                );
            })
            // Handle deleteFriend
            .addCase(deleteFriend.fulfilled, (state, action) => {
                state.friends = state.friends.filter(
                    friend => friend.id !== action.payload.friendshipId
                );
            })
            // Handle getSentRequests
            .addCase(getSentRequests.fulfilled, (state, action) => {
                state.sentRequests = action.payload;
            });
    },
});

export default friendSlice.reducer;
