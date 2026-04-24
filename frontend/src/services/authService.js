import apiClient from './apiClient';

export async function authenticateWithGoogle(idToken) {
  try {
    const response = await apiClient.post('/api/auth/google', { idToken });
    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Google sign-in failed. Please try again.';
    throw new Error(message);
  }
}

export async function getCurrentUserProfile() {
  const response = await apiClient.get('/api/v1/auth/me');
  return response.data;
}

export async function logoutUser() {
  const response = await apiClient.post('/api/v1/auth/logout');
  return response.data;
}
