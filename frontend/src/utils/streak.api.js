import { apiClient } from './api.utils.js';

export const fetchMyStreakApi = async () => {
  const response = await apiClient.get('/streaks/me');
  return response.data?.data || {};
};

export const markStreakActivityApi = async () => {
  const response = await apiClient.post('/streaks/mark-activity', {});
  return response.data?.data || {};
};
