import { apiClient } from './api.utils.js';

export const fetchLeaderboardApi = async ({ type, period, courseId, page = 1, limit = 25 }) => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (period) params.append('period', period);
  if (courseId) params.append('courseId', courseId);
  params.append('page', String(page));
  params.append('limit', String(limit));

  const response = await apiClient.get(`/leaderboard?${params.toString()}`);
  return response.data?.data || {};
};

export const fetchLeaderboardSummaryApi = async ({ type, period, courseId }) => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (period) params.append('period', period);
  if (courseId) params.append('courseId', courseId);

  const response = await apiClient.get(`/leaderboard/summary?${params.toString()}`);
  return response.data?.data || {};
};

export const fetchLeaderboardCoursesApi = async () => {
  const response = await apiClient.get('/leaderboard/filters/courses');
  return response.data?.data || [];
};
