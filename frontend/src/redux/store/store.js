import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/auth.slice.js';
import walletReducer from '../slices/wallet.slice.js';
import payoutReducer from '../slices/payout.slice.js';
import courseReducer from '../slices/course.slice.js';
import instructorReducer from '../slices/instructor.slice.js';
import paymentReducer from '../slices/payment.slice.js';
import enrollmentReducer from '../slices/enrollment.slice.js';
import leaderboardReducer from '../slices/leaderboard.slice.js';
import streakReducer from '../slices/streak.slice.js';
import achievementReducer from '../slices/achievement.slice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    wallet: walletReducer,
    payout: payoutReducer,
    course: courseReducer,
    instructor: instructorReducer,
    payment: paymentReducer,
    enrollment: enrollmentReducer,
    leaderboard: leaderboardReducer,
    streak: streakReducer,
    achievement: achievementReducer,
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
