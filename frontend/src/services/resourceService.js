const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const RESOURCE_ENDPOINT = '/api/v1/resources';

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

export async function getResources(filters = {}) {
  const response = await fetch(`${API_BASE_URL}${RESOURCE_ENDPOINT}${buildQuery(filters)}`);
  const data = await parseResponse(response, 'Unable to fetch resources.');
  return data?.data || [];
}

export async function getResourceById(id) {
  const response = await fetch(`${API_BASE_URL}${RESOURCE_ENDPOINT}/${id}`);
  const data = await parseResponse(response, 'Unable to fetch resource details.');
  return data?.data;
}

export async function createResource(payload) {
  const response = await fetch(`${API_BASE_URL}${RESOURCE_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': 'ADMIN',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response, 'Unable to create resource.');
  return data?.data;
}

export async function updateResource(id, payload) {
  const response = await fetch(`${API_BASE_URL}${RESOURCE_ENDPOINT}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': 'ADMIN',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response, 'Unable to update resource.');
  return data?.data;
}

export async function softDeleteResource(id) {
  const response = await fetch(`${API_BASE_URL}${RESOURCE_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: {
      'X-User-Role': 'ADMIN',
    },
  });

  const data = await parseResponse(response, 'Unable to remove resource.');
  return data?.data;
}

export async function getResourceAvailability(id) {
  const response = await fetch(`${API_BASE_URL}${RESOURCE_ENDPOINT}/${id}/availability`);
  const data = await parseResponse(response, 'Unable to fetch availability windows.');
  return data?.data || [];
}
