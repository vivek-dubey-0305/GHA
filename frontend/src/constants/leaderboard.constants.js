//leaderboard.constants.js
export const LEADERBOARD_TYPES = {
  GLOBAL: 'global',
  COURSE: 'course',
  ASSIGNMENT: 'assignment',
  STREAK: 'streak',
};

export const LEADERBOARD_PERIODS = {
  ALL_TIME: 'all-time',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export const LEADERBOARD_TAB_CONFIG = [
  { key: LEADERBOARD_TYPES.GLOBAL, label: 'Global' },
  { key: LEADERBOARD_TYPES.COURSE, label: 'Course' },
  { key: LEADERBOARD_TYPES.ASSIGNMENT, label: 'Assignment' },
  { key: LEADERBOARD_TYPES.STREAK, label: 'Streak' },
];

export const LEADERBOARD_PERIOD_OPTIONS = [
  { value: LEADERBOARD_PERIODS.ALL_TIME, label: 'All Time' },
  { value: LEADERBOARD_PERIODS.WEEKLY, label: 'Weekly' },
  { value: LEADERBOARD_PERIODS.MONTHLY, label: 'Monthly' },
];
