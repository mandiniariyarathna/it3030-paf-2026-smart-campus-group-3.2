const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085';
const TECHNICIAN_ENDPOINT = '/api/v1/technicians';

async function parseResponse(response, errorMessage) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorMessage);
  }
  return response.json();
}

export async function loginTechnician(email, password) {
  const response = await fetch(`${API_BASE_URL}${TECHNICIAN_ENDPOINT}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseResponse(response, 'Unable to login technician.');
  return data;
}

export async function getTechnicians(activeOnly = false) {
  const url = `${API_BASE_URL}${TECHNICIAN_ENDPOINT}${activeOnly ? '?activeOnly=true' : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await parseResponse(response, 'Unable to fetch technicians.');
  return data;
}

export async function getTechnicianById(id) {
  const response = await fetch(`${API_BASE_URL}${TECHNICIAN_ENDPOINT}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await parseResponse(response, 'Unable to fetch technician.');
  return data;
}

export async function createTechnician(technician) {
  const response = await fetch(`${API_BASE_URL}${TECHNICIAN_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(technician),
  });

  const data = await parseResponse(response, 'Unable to create technician.');
  return data;
}

export async function updateTechnician(id, technician) {
  const response = await fetch(`${API_BASE_URL}${TECHNICIAN_ENDPOINT}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(technician),
  });

  const data = await parseResponse(response, 'Unable to update technician.');
  return data;
}

export async function updateTechnicianStatus(id, status) {
  const response = await fetch(`${API_BASE_URL}${TECHNICIAN_ENDPOINT}/${id}/status?status=${status}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await parseResponse(response, 'Unable to update technician status.');
  return data;
}

export async function deleteTechnician(id) {
  const response = await fetch(`${API_BASE_URL}${TECHNICIAN_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Unable to delete technician.');
  }
}
