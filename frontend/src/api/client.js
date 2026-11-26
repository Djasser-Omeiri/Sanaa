import { clearTokens, getTokens, setTokens } from '../auth/tokenStorage.js'
import { refreshAccessToken } from './auth.js'

// Base URL of the Django API (see frontend/.env.example).
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

// The backend answers business errors with {"message": ...} and DRF validation errors with {field: [...]}.
function toApiError(status, data) {
  if (data?.message) return new ApiError(data.message, status)
  if (data?.detail) return new ApiError(data.detail, status)
  const fields = Object.fromEntries(Object.entries(data ?? {}).map(([field, value]) => [field, [].concat(value).join(' ')]))
  return new ApiError(fields.non_field_errors ?? 'Something went wrong. Please try again.', status, fields)
}

async function send(path, { body, auth, headers, ...options }) {
  const { access } = getTokens()
  let response
  try {
    response = await fetch(`${API_BASE_URL}/${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && access ? { Authorization: `Bearer ${access}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection.', 0)
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  return { response, data }
}

export async function apiRequest(path, { auth = true, ...options } = {}) {
  let { response, data } = await send(path, { auth, ...options })
  const { refresh } = getTokens()
  if (response.status === 401 && auth && refresh) {
    try {
      setTokens(await refreshAccessToken(refresh))
    } catch {
      clearTokens()
      throw new ApiError('Your session has expired. Please log in again.', 401)
    }
    ;({ response, data } = await send(path, { auth, ...options }))
  }
  if (!response.ok) throw toApiError(response.status, data)
  return data
}
