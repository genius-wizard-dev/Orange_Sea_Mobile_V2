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
