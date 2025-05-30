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
                if (state.sentRequests && state.sentRequests.data) {
                    state.sentRequests.data.push(action.payload.data);
                } else {
                    // Khởi tạo cấu trúc nếu chưa có
                    state.sentRequests = {
                        data: [action.payload.data]
                    };
                }
            })
            .addCase(sendFriendRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Handle handleFriendRequest
            .addCase(handleFriendRequest.fulfilled, (state, action) => {
                if (action.payload.action === 'ACCEPT') {
                    state.friends.data.push(action.payload);
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
                // Kiểm tra cấu trúc dữ liệu trước khi xử lý
                if (state.friends && state.friends.data) {
                    // Lọc ra các bạn bè không có friendshipId trùng với đối tượng bị xóa
                    state.friends.data = state.friends.data.filter(
                        friend => friend.id !== action.payload.friendshipId
                    );
                }

                // Cập nhật friendshipStatus nếu ID người dùng liên quan đến bạn bè bị xóa
                if (action.payload.profileId && state.friendshipStatus &&
                    state.friendshipStatus.profileId === action.payload.profileId) {
                    state.friendshipStatus.isFriend = false;
                }
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
