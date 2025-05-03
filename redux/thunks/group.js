import { createAsyncThunk } from '@reduxjs/toolkit';
import { ENDPOINTS } from '../../service/api.endpoint';
import apiService from '../../service/api.service';

export const getListGroup = createAsyncThunk('group/list', async (_, { rejectWithValue }) => {
    try {
        const res = await apiService.get(ENDPOINTS.GROUP.LIST);
        if (res.status === 'fail') throw new Error(res.message);
        return res;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const createGroup = createAsyncThunk('group/create', async (data, { rejectWithValue }) => {
    try {
        const res = await apiService.post(ENDPOINTS.GROUP.CREATE, data);
        if (res.status === 'fail') throw new Error(res.message);
        return res;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const getGroupDetail = createAsyncThunk('group/detail', async (groupId, { rejectWithValue }) => {
    try {
        const res = await apiService.get(ENDPOINTS.GROUP.DETAIL(groupId));
        if (res.status === 'fail') throw new Error(res.message);
        return res;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const searchGroups = createAsyncThunk('group/search', async (keyword, { rejectWithValue }) => {
    try {
        const res = await apiService.get(ENDPOINTS.GROUP.SEARCH(keyword));
        if (res.status === 'fail') throw new Error(res.message);
        return res;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const addParticipant = createAsyncThunk('group/addParticipant', async ({ groupId, participantId }, { rejectWithValue }) => {
    try {
        const res = await apiService.put(ENDPOINTS.GROUP.ADD_PARTICIPANT(groupId), { participantId });
        if (res.status === 'fail') throw new Error(res.message);
        return res;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const removeParticipant = createAsyncThunk('group/removeParticipant', async ({ groupId, participantId }, { rejectWithValue }) => {
    try {
        const res = await apiService.delete(ENDPOINTS.GROUP.REMOVE_PARTICIPANT(groupId), { data: { participantId } });
        if (res.status === 'fail') throw new Error(res.message);
        return res;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const deleteGroup = createAsyncThunk('group/delete', async (groupId, { rejectWithValue }) => {
    try {
        const res = await apiService.delete(ENDPOINTS.GROUP.DELETE(groupId));
        if (res.status === 'fail') throw new Error(res.message);
        return { groupId, ...res };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const leaveGroup = createAsyncThunk('group/leave', async (groupId, { rejectWithValue }) => {
    try {
        const res = await apiService.delete(ENDPOINTS.GROUP.LEAVE(groupId));
        if (res.status === 'fail') throw new Error(res.message);
        return { groupId, ...res };
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const transferOwnership = createAsyncThunk('group/transferOwner', async ({ groupId, newOwnerId }, { rejectWithValue }) => {
    try {
        const res = await apiService.put(ENDPOINTS.GROUP.TRANSFER_OWNER(groupId), { newOwnerId });
        if (res.status === 'fail') throw new Error(res.message);
        return res;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

export const renameGroup = createAsyncThunk('group/rename', async ({ groupId, newName }, { rejectWithValue }) => {
    try {
        const res = await apiService.post(ENDPOINTS.GROUP.RENAME(groupId), { name: newName });
        if (res.status === 'fail') throw new Error(res.message);
        return res;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});
