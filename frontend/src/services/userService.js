import apiClient from './apiClient';

export async function getAllUsers() {
  const response = await apiClient.get('/api/v1/users');
  return response.data;
}

export async function updateUserRole(userId, role) {
  const response = await apiClient.put(`/api/v1/users/${userId}/role`, { role });
  return response.data;
}
