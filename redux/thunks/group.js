import { createAsyncThunk } from '@reduxjs/toolkit';
import { ENDPOINTS } from '../../service/api.endpoint';
import apiService from '../../service/api.service';

export const getListGroup = createAsyncThunk('group/list', async (_, { rejectWithValue }) => {
    try {
        const res = await apiService.get(ENDPOINTS.GROUP.LIST);
        if (res.status === 'fail') {
            throw new Error(`Group list fetch failed with error: ${res.message}`);
        }
        return res;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const getGroupDetail = createAsyncThunk(
    'group/detail',
    async (groupId, { rejectWithValue }) => {
        try {
            const res = await apiService.get(ENDPOINTS.GROUP.DETAIL(groupId));
            if (res.status === 'fail') {
                throw new Error(`Group detail fetch failed: ${res.message}`);
            }
            return res;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);
