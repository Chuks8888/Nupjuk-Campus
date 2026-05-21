import { apiRequest, getAuthToken } from './http';

const CURRENT_USER_KEY = 'currentUser';

function normalizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    student_id: user.studentId ?? user.student_id ?? null,
    kaist_email: user.kaistEmail ?? user.kaist_email,
    display_name: user.displayName ?? user.display_name ?? null,
    created_at: user.createdAt ?? user.created_at,
  };
}

export async function sendVerificationCode(email) {
  return apiRequest('/auth/send-code', {
    method: 'POST',
    token: null,
    body: {
      kaistEmail: email,
    },
  });
}

export async function signup({ email, password, code }) {
  const user = await apiRequest('/auth/signup', {
    method: 'POST',
    token: null,
    body: {
      kaistEmail: email,
      password,
      code,
    },
  });

  return normalizeUser(user);
}

export async function login({ email, password }) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    token: null,
    body: {
      kaistEmail: email,
      password,
    },
  });

  return {
    token: response.token,
    user: normalizeUser(response.user),
  };
}

export async function getCurrentUser() {
  const user = await apiRequest('/me');
  return normalizeUser(user);
}

export function storeSession({ token, user }) {
  localStorage.setItem('authToken', token);

  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

export function clearSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function hasSession() {
  return Boolean(getAuthToken());
}
