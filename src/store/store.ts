import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/productsSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
