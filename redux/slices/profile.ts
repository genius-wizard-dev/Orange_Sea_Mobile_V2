import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Profile, ProfileResponse } from '~/types/profile';
import { BaseState } from '~/types/store.redux';
import { getProfile } from '../thunks/profile';

interface ProfileState extends BaseState {
  profile: Profile | null;
  showPasswordUpdatedModal: boolean;
}

const initialState: ProfileState = {
  status: 'idle',
  profile: null,
  error: null,
  showPasswordUpdatedModal: false,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Thêm reducers để điều khiển modal
    showPasswordUpdatedModal: (state) => {
      state.showPasswordUpdatedModal = true;
    },
    hidePasswordUpdatedModal: (state) => {
      state.showPasswordUpdatedModal = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action: PayloadAction<ProfileResponse>) => {
        state.status = 'succeeded';
        state.profile = action.payload.data;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});
// Export các actions để sử dụng trong components
export const { showPasswordUpdatedModal, hidePasswordUpdatedModal } = profileSlice.actions;


export default profileSlice.reducer;
