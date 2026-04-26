const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085').replace(/\/$/, '');
const BOOKING_ENDPOINT = '/api/v1/bookings';
const RESOURCE_ENDPOINT = '/api/v1/resources';
const SESSION_STORAGE_KEY = 'smart-campus-session';

function getSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function resolveCurrentUserId() {
  const session = getSession();
  return session?.username || session?.email || '';
}

function resolveCurrentRole() {
  const session = getSession();
  return (session?.role || '').toUpperCase();
}

function buildHeaders(extraHeaders = {}) {
  const role = resolveCurrentRole();
  const userId = resolveCurrentUserId();

  return {
    ...(role ? { 'X-User-Role': role } : {}),
    ...(userId ? { 'X-User-Id': userId } : {}),
    ...extraHeaders,
  };
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

async function parseResponse(response, fallbackMessage) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || data?.error || fallbackMessage;
    throw new Error(message);
  }

  return data;
}

export async function createBookingRequest(payload) {
  const userId = resolveCurrentUserId();

  if (!userId) {
    throw new Error('Please sign in before creating a booking request.');
  }

  const response = await fetch(`${API_BASE_URL}${BOOKING_ENDPOINT}`, {
    method: 'POST',
    headers: buildHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      ...payload,
      userId,
    }),
  });

  const data = await parseResponse(response, 'Unable to create booking request.');
  return data?.data;
}

export async function getBookings(status) {
  const response = await fetch(
    `${API_BASE_URL}${BOOKING_ENDPOINT}${buildQuery({ status })}`,
    {
      headers: buildHeaders(),
    }
  );

  const data = await parseResponse(response, 'Unable to fetch bookings.');
  return data?.data || [];
}

export async function getBookingById(id) {
  const response = await fetch(`${API_BASE_URL}${BOOKING_ENDPOINT}/${id}`, {
    headers: buildHeaders(),
  });

  const data = await parseResponse(response, 'Unable to fetch booking details.');
  return data?.data;
}

export async function approveBooking(id) {
  const response = await fetch(`${API_BASE_URL}${BOOKING_ENDPOINT}/${id}/approve`, {
    method: 'PUT',
    headers: buildHeaders(),
  });

  const data = await parseResponse(response, 'Unable to approve booking.');
  return data?.data;
}

export async function rejectBooking(id, rejectionReason) {
  const response = await fetch(`${API_BASE_URL}${BOOKING_ENDPOINT}/${id}/reject`, {
    method: 'PUT',
    headers: buildHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({ rejectionReason }),
  });

  const data = await parseResponse(response, 'Unable to reject booking.');
  return data?.data;
}

export async function cancelBooking(id) {
  const response = await fetch(`${API_BASE_URL}${BOOKING_ENDPOINT}/${id}/cancel`, {
    method: 'PUT',
    headers: buildHeaders(),
  });

  const data = await parseResponse(response, 'Unable to cancel booking.');
  return data?.data;
}

export async function updateBookingRequest(id, payload) {
  const userId = resolveCurrentUserId();

  if (!userId) {
    throw new Error('Please sign in before editing a booking request.');
  }

  const response = await fetch(`${API_BASE_URL}${BOOKING_ENDPOINT}/${id}`, {
    method: 'PUT',
    headers: buildHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      ...payload,
      userId,
    }),
  });

  const data = await parseResponse(response, 'Unable to update booking request.');
  return data?.data;
}

export async function getBookingsForResource(resourceId) {
  const response = await fetch(`${API_BASE_URL}${RESOURCE_ENDPOINT}/${resourceId}/bookings`, {
    headers: buildHeaders(),
  });

  const data = await parseResponse(response, 'Unable to fetch resource bookings.');
  return data?.data || [];
}
