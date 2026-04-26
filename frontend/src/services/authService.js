const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

const SIGNUP_ENDPOINT = '/api/auth/signup';
const GOOGLE_AUTH_ENDPOINT = '/api/auth/google';

export async function signupUser(signupPayload) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${SIGNUP_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupPayload),
    });
  } catch {
    throw new Error('Cannot reach the server. Make sure backend is running and try again.');
  }

  let responseData = null;

  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const message = responseData?.message || 'Signup failed. Please try again.';
    throw new Error(message);
  }

  return responseData;
}

export async function authenticateWithGoogle(idToken) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${GOOGLE_AUTH_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    throw new Error('Cannot reach the server. Make sure backend is running and try again.');
  }

  let responseData = null;

  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const message =
      responseData?.message ||
      responseData?.error ||
      'Google sign-in failed. Please try again.';
    throw new Error(message);
  }

  return responseData;
}
