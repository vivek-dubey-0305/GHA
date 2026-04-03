import { apiClient } from './api.utils.js';

export const fetchMyAchievementsApi = async ({ tab, status, page = 1, limit = 20, courseId } = {}) => {
  const params = new URLSearchParams();
  if (tab) params.append('tab', tab);
  if (status) params.append('status', status);
  if (courseId) params.append('courseId', courseId);
  params.append('page', String(page));
  params.append('limit', String(limit));

  const response = await apiClient.get(`/achievements/me?${params.toString()}`);
  return response.data?.data || {};
};
