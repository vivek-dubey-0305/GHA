import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/auth.slice.js';
import adminReducer from '../slices/admin.slice.js';
import instructorReducer from '../slices/instructor.slice.js';
import courseReducer from '../slices/course.slice.js';
import moduleReducer from '../slices/module.slice.js';
import lessonReducer from '../slices/lesson.slice.js';
import enrollmentReducer from '../slices/enrollment.slice.js';
import paymentReducer from '../slices/payment.slice.js';
import reviewReducer from '../slices/review.slice.js';
import assignmentReducer from '../slices/assignment.slice.js';
import submissionReducer from '../slices/submission.slice.js';
import certificateReducer from '../slices/certificate.slice.js';
import liveClassReducer from '../slices/liveclass.slice.js';
import videoPackageReducer from '../slices/videopackage.slice.js';
import materialReducer from '../slices/material.slice.js';
import progressReducer from '../slices/progress.slice.js';
import dashboardReducer from '../slices/dashboard.slice.js';
import walletReducer from '../slices/wallet.slice.js';
import payoutReducer from '../slices/payout.slice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    instructor: instructorReducer,
    course: courseReducer,
    module: moduleReducer,
    lesson: lessonReducer,
    enrollment: enrollmentReducer,
    payment: paymentReducer,
    review: reviewReducer,
    assignment: assignmentReducer,
    submission: submissionReducer,
    certificate: certificateReducer,
    liveclass: liveClassReducer,
    videopackage: videoPackageReducer,
    material: materialReducer,
    progress: progressReducer,
    dashboard: dashboardReducer,
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
