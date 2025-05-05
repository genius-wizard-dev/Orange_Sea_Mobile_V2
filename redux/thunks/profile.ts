import { createAsyncThunk } from '@reduxjs/toolkit';
import { z } from 'zod';
import { ENDPOINTS } from '~/service/api.endpoint';
import apiService from '~/service/api.service';
import { ProfileResponse, UpdateProfileInput } from '~/types/profile';
import { AxiosError } from 'axios'

export const getProfile = createAsyncThunk('profile/me', async (_, { rejectWithValue }) => {
  try {
    const res = await apiService.get<ProfileResponse>(ENDPOINTS.PROFILE.ME);
    if (res.status === 'fail') {
      throw new Error(`Profile fetch failed with error: ${res.message}`);
    }
    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return rejectWithValue(error.errors);
    }
    const axiosError = error as AxiosError<any>;
    if (axiosError.response?.data) {
      return rejectWithValue(axiosError.response.data);
    }

    return rejectWithValue({ message: (error as Error).message });
  }
});

export const updateProfile = createAsyncThunk(
  'profile/update',
  async (data: FormData | UpdateProfileInput, { rejectWithValue }) => {
    try {
      console.log(typeof data);
      const res = await apiService.put<ProfileResponse>(
        ENDPOINTS.PROFILE.ME,
        data,
        'multipart/form-data'
      );

      return res;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return rejectWithValue(error.errors);
      }
      const axiosError = error as AxiosError<any>;
      if (axiosError.response?.data) {
        return rejectWithValue(axiosError.response.data);
      }

      return rejectWithValue({ message: (error as Error).message });
    }
  }
);
