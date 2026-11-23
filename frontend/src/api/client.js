// Base URL of the Django API. Screens use mock data until the endpoints are connected.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

export async function apiRequest(path, { token, headers, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message ?? `Request failed (${response.status})`)
  return data
}
