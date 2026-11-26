import { apiRequest } from './client.js'
import * as mock from './mockAuth.js'

// The accounts endpoints arrive with backend task A1.1. Until then the mock answers in the same shape.
export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== 'false'

export function login({ identifier, password }) {
  if (USE_MOCK_AUTH) return mock.login({ identifier, password })
  return apiRequest('auth/login', { method: 'POST', auth: false, body: { identifier, password } })
}

export async function register({ fullName, identifier, password, role }) {
  const contact = identifier.includes('@') ? { email: identifier } : { phone: identifier }
  const body = { full_name: fullName, ...contact, password, role }
  if (USE_MOCK_AUTH) return mock.register(body)
  const data = await apiRequest('auth/register', { method: 'POST', auth: false, body })
  // If register returns the new user instead of tokens, log in right away.
  return data?.access ? data : login({ identifier, password })
}

export function refreshAccessToken(refresh) {
  if (USE_MOCK_AUTH) return mock.refresh(refresh)
  return apiRequest('auth/refresh', { method: 'POST', auth: false, body: { refresh } })
}
