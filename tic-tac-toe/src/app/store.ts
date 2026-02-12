import { configureStore } from '@reduxjs/toolkit';
import appReducer from '../features/app/appSlice';
import gameReducer from '../features/game/gameSlice';

export const makeStore = () =>
  configureStore({
    reducer: {
      app: appReducer,
      game: gameReducer,
    },
  });

export const store = makeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
