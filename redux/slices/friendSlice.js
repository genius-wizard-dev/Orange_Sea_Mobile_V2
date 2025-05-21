import { createSlice } from '@reduxjs/toolkit';
import { 
    sendFriendRequest, 
    getFriendList, 
    getReceivedRequests,
    handleFriendRequest,
    deleteFriend,
    getSentRequests,
    checkFriendshipStatus
} from '../thunks/friend';

const initialState = {
    loading: false,
    error: null,
    friends: [],
    receivedRequests: [],
    sentRequests: [],
    friendshipStatus: null,
    sentRequestsLoading: false,
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
                // Thêm request mới vào danh sách đã gửi
                if (action.payload.data) {
                    state.sentRequests.push(action.payload.data);
                }
            })
            .addCase(sendFriendRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Handle handleFriendRequest
            .addCase(handleFriendRequest.fulfilled, (state, action) => {
                if (action.payload.action === 'ACCEPT') {
                    state.friends.push(action.payload);
                    // Cập nhật friendshipStatus khi chấp nhận kết bạn
                    state.friendshipStatus = {
                        isFriend: action.payload.data?.isFriend,
                        // friendshipId: action.payload.data?.id || action.payload.id
                    };
                }
                state.receivedRequests = state.receivedRequests.data.filter(
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
            .addCase(getSentRequests.pending, (state) => {
                state.sentRequestsLoading = true;
            })
            .addCase(getSentRequests.fulfilled, (state, action) => {
                state.sentRequestsLoading = false;
                state.sentRequests = action.payload;
            })
            .addCase(getSentRequests.rejected, (state) => {
                state.sentRequestsLoading = false;
            })
            // Handle checkFriendshipStatus
            .addCase(checkFriendshipStatus.fulfilled, (state, action) => {
                console.log('checkFriendshipStatus raw response:', action.payload);
                // API chỉ trả về { isFriend: true/false }
                state.friendshipStatus = {
                    isFriend: action.payload.data?.isFriend,
                    // Tạm thời bỏ friendshipId vì API không trả về
                };
            })
            .addCase(checkFriendshipStatus.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export default friendSlice.reducer;
