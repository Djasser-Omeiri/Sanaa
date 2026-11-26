// Keeps the JWT pair returned by auth/login, auth/register and auth/refresh.
const STORAGE_KEY = 'sanaa.auth'
export const AUTH_CHANGED_EVENT = 'sanaa:auth-changed'

export function getTokens() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

export function setTokens({ access, refresh }) {
  const current = getTokens()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ access, refresh: refresh ?? current.refresh }))
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}
