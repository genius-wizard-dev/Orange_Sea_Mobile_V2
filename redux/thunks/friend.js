import { createAsyncThunk } from '@reduxjs/toolkit';
import { ENDPOINTS } from '../../service/api.endpoint';
import apiService from '../../service/api.service';

export const getSearchByPhone = createAsyncThunk(
    'friend/search',
    async (keyword, { rejectWithValue }) => {
        try {
            const res = await apiService.get(ENDPOINTS.FRIEND.SEARCH_BY_PHONE(keyword));
            if (res.status === 'fail') {
                throw new Error(`Friend search failed with error: ${res.message}`);
            }
            return res;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const sendFriendRequest = createAsyncThunk(
    'friend/sendRequest',
    async (userId, { rejectWithValue }) => {
        try {
            const res = await apiService.post(ENDPOINTS.FRIEND.SEND_REQUEST, {
                receiverId: userId  // gửi _id của user
            });
            if (res.status === 'fail') {
                throw new Error(res.message || 'Gửi lời mời kết bạn thất bại');
            }
            return res;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getFriendList = createAsyncThunk(
    'friend/list',
    async (_, { rejectWithValue }) => {
        try {
            const res = await apiService.get(ENDPOINTS.FRIEND.LIST);
            if (res.status === 'fail') {
                throw new Error(res.message);
            }
            return res;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getReceivedRequests = createAsyncThunk(
    'friend/receivedRequests',
    async (_, { rejectWithValue }) => {
        try {
            const res = await apiService.get(ENDPOINTS.FRIEND.LIST_RECEIVED_REQUESTS);
            if (res.status === 'fail') {
                throw new Error(res.message);
            }
            return res;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const handleFriendRequest = createAsyncThunk(
    'friend/handleRequest',
    async ({ requestId, action }, { rejectWithValue }) => {
        try {
            const res = await apiService.put(ENDPOINTS.FRIEND.HANDLE_REQUEST(requestId), { action });
            if (res.status === 'fail') {
                throw new Error(res.message);
            }
            return { ...res, requestId, action };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const deleteFriend = createAsyncThunk(
    'friend/delete',
    async (friendshipId, { rejectWithValue }) => {
        try {
            const res = await apiService.delete(ENDPOINTS.FRIEND.DELETE(friendshipId));
            if (res.status === 'fail') {
                throw new Error(res.message);
            }
            return { ...res, friendshipId };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getSentRequests = createAsyncThunk(
    'friend/sentRequests',
    async (_, { rejectWithValue }) => {
        try {
            const res = await apiService.get(ENDPOINTS.FRIEND.LIST_SENT_REQUESTS);
            if (res.status === 'fail') {
                throw new Error(res.message);
            }
            return res; // Trả về toàn bộ res thay vì chỉ res.data
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const checkFriendshipStatus = createAsyncThunk(
    'friend/checkStatus',
    async (profileId, { rejectWithValue }) => {
        try {
            const res = await apiService.get(ENDPOINTS.FRIEND.CHECK_FRIENDSHIP(profileId));
            if (res.status === 'fail') {
                throw new Error(res.message);
            }
            return res;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Xóa getFriendshipStatus thunk vì không cần thiết nữa
