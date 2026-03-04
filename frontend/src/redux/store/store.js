import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/auth.slice.js';
import walletReducer from '../slices/wallet.slice.js';
import payoutReducer from '../slices/payout.slice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    wallet: walletReducer,
    payout: payoutReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export default store;
