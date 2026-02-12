import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

type AppState = {
  isDarkMode: boolean;
};

const initialState: AppState = {
  isDarkMode: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
  },
});

export const { setDarkMode, toggleDarkMode } = appSlice.actions;

export const selectAppState = (state: RootState) => state.app;
export const selectIsDarkMode = (state: RootState) => state.app.isDarkMode;

export default appSlice.reducer;
