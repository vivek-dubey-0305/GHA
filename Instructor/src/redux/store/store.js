import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/auth.slice.js';
import instructorReducer from '../slices/instructor.slice.js';
import dashboardReducer from '../slices/dashboard.slice.js';
import courseReducer from '../slices/course.slice.js';
import studentReducer from '../slices/student.slice.js';
import assignmentReducer from '../slices/assignment.slice.js';
import liveclassReducer from '../slices/liveclass.slice.js';
import earningsReducer from '../slices/earnings.slice.js';
import couponReducer from '../slices/coupon.slice.js';
import announcementReducer from '../slices/announcement.slice.js';
import discussionReducer from '../slices/discussion.slice.js';
import notificationReducer from '../slices/notification.slice.js';
import analyticsReducer from '../slices/analytics.slice.js';
import doubtTicketReducer from '../slices/doubtTicket.slice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    instructor: instructorReducer,
    dashboard: dashboardReducer,
    course: courseReducer,
    student: studentReducer,
    assignment: assignmentReducer,
    liveclass: liveclassReducer,
    earnings: earningsReducer,
    coupon: couponReducer,
    announcement: announcementReducer,
    discussion: discussionReducer,
    notification: notificationReducer,
    analytics: analyticsReducer,
    doubtTicket: doubtTicketReducer,
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
