import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

type AppState = {
  isDarkMode: boolean;
  gameMode: 'single' | 'multi';
};

const initialState: AppState = {
  isDarkMode: true,
  gameMode: 'multi',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setGameMode: (state, action: PayloadAction<AppState['gameMode']>) => {
      state.gameMode = action.payload;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
  },
});

export const { setGameMode, setDarkMode, toggleDarkMode } = appSlice.actions;

export const selectAppState = (state: RootState) => state.app;
export const selectIsDarkMode = (state: RootState) => state.app.isDarkMode;
export const selectGameMode = (state: RootState) => state.app.gameMode;

export default appSlice.reducer;
