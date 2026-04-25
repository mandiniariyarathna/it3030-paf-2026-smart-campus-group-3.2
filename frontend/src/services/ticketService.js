const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085').replace(/\/$/, '');
const TICKET_ENDPOINT = '/api/v1/tickets';
const SESSION_STORAGE_KEY = 'smart-campus-session';
const ACTOR_STORAGE_KEY = 'smart-campus-ticket-actor';

function readSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function readActorOverride() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(ACTOR_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setActor(actor) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!actor) {
    window.localStorage.removeItem(ACTOR_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(ACTOR_STORAGE_KEY, JSON.stringify(actor));
}

function createFallbackUserId(session) {
  if (!session) {
    return null;
  }

  if (session.username) {
    return session.username;
  }

  if (session.email) {
    return session.email;
  }

  return null;
}

export function getCurrentActor() {
  const session = readSession();
  const override = readActorOverride();

  const role = (override?.role || session?.role || '').toUpperCase();
  const userId = override?.userId || createFallbackUserId(session);

  return {
    role,
    userId,
    displayName: override?.displayName || session?.displayName || 'Campus Member',
  };
}

function buildActorHeaders(includeUserId = true) {
  const actor = getCurrentActor();
  const headers = {};

  if (actor.role) {
    headers['X-User-Role'] = actor.role;
  }

  if (includeUserId && actor.userId) {
    headers['X-User-Id'] = actor.userId;
  }

  return headers;
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

export async function createTicket(payload, files = []) {
  const formData = new FormData();
  formData.append(
    'ticket',
    new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    })
  );

  files.forEach((file) => {
    formData.append('attachments', file);
  });

  const response = await fetch(`${API_BASE_URL}${TICKET_ENDPOINT}`, {
    method: 'POST',
    headers: {
      ...buildActorHeaders(true),
    },
    body: formData,
  });

  const data = await parseResponse(response, 'Unable to create ticket.');
  return data?.data;
}

export async function getTickets(filters = {}) {
  const response = await fetch(`${API_BASE_URL}${TICKET_ENDPOINT}${buildQuery(filters)}`, {
    headers: {
      ...buildActorHeaders(true),
    },
  });

  const data = await parseResponse(response, 'Unable to fetch tickets.');
  return data?.data || [];
}

export async function getTicketById(ticketId) {
  const response = await fetch(`${API_BASE_URL}${TICKET_ENDPOINT}/${ticketId}`, {
    headers: {
      ...buildActorHeaders(true),
    },
  });

  const data = await parseResponse(response, 'Unable to fetch ticket details.');
  return data?.data;
}

export async function updateTicketStatus(ticketId, payload) {
  const response = await fetch(`${API_BASE_URL}${TICKET_ENDPOINT}/${ticketId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildActorHeaders(false),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response, 'Unable to update ticket status.');
  return data?.data;
}

export async function assignTechnician(ticketId, technicianId) {
  const response = await fetch(`${API_BASE_URL}${TICKET_ENDPOINT}/${ticketId}/assign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildActorHeaders(false),
    },
    body: JSON.stringify({ technicianId }),
  });

  const data = await parseResponse(response, 'Unable to assign technician.');
  return data?.data;
}

export async function closeTicket(ticketId) {
  const response = await fetch(`${API_BASE_URL}${TICKET_ENDPOINT}/${ticketId}`, {
    method: 'DELETE',
    headers: {
      ...buildActorHeaders(false),
    },
  });

  const data = await parseResponse(response, 'Unable to close ticket.');
  return data?.data;
}

export async function addComment(ticketId, payload) {
  const response = await fetch(`${API_BASE_URL}${TICKET_ENDPOINT}/${ticketId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildActorHeaders(true),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response, 'Unable to add comment.');
  return data?.data;
}

export async function editComment(ticketId, commentId, payload) {
  const response = await fetch(`${API_BASE_URL}${TICKET_ENDPOINT}/${ticketId}/comments/${commentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildActorHeaders(true),
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response, 'Unable to edit comment.');
  return data?.data;
}

export async function deleteComment(ticketId, commentId) {
  const response = await fetch(`${API_BASE_URL}${TICKET_ENDPOINT}/${ticketId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      ...buildActorHeaders(true),
    },
  });

  const data = await parseResponse(response, 'Unable to delete comment.');
  return data?.data;
}
