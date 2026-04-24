import apiClient from './apiClient';

export async function getNotifications(page = 0, size = 10) {
  const response = await apiClient.get('/api/v1/notifications', {
    params: { page, size },
  });
  return response.data;
}

export async function markNotificationAsRead(notificationId) {
  const response = await apiClient.put(`/api/v1/notifications/${notificationId}/read`);
  return response.data;
}

export async function markAllNotificationsAsRead() {
  const response = await apiClient.put('/api/v1/notifications/read-all');
  return response.data;
}

export async function deleteNotification(notificationId) {
  await apiClient.delete(`/api/v1/notifications/${notificationId}`);
}
