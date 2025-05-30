import { createAsyncThunk } from '@reduxjs/toolkit';
import { z } from 'zod';
import { ENDPOINTS } from '../../service/api.endpoint';
import apiService from '../../service/api.service';

export const updatePassword = createAsyncThunk(
  'account/updatePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      // Gọi API không cần truyền ID (ID sẽ được xác định từ token)
      const res = await apiService.put(
        ENDPOINTS.ACCOUNT.PASSWORD,
        { currentPassword, newPassword }
      );
      
      if (res.status === 'fail' || res.status === 'error') {
        throw new Error(res.message || 'Mật khẩu cũ không chính xác');
      }
      return res;
    } catch (error) {
      return rejectWithValue(error.message || 'Đã có lỗi xảy ra');
    }
  }
);