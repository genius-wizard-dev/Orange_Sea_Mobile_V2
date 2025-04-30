import { combineReducers } from '@reduxjs/toolkit';
import profileReducer from './profile';
import groupReducer from './groupSlice';
import friendReducer from './friendSlice';
import chatReducer from './chatSlice';

const rootReducer = combineReducers({
  profile: profileReducer,
  group: groupReducer,
  friend: friendReducer,
  chat: chatReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
