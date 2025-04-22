import { combineReducers } from '@reduxjs/toolkit';
import profileReducer from './profile';
import groupReducer from './groupSlice';
const rootReducer = combineReducers({
  profile: profileReducer,
  group: groupReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
