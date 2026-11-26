// Reads the JWT payload in the browser. The backend still verifies every token.
export function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (char) => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

export function isExpired(payload) {
  return !payload?.exp || payload.exp * 1000 <= Date.now()
}

// The session lasts as long as the refresh token; roles travel in the access token (A1.1).
export function sessionUser({ access, refresh } = {}) {
  if (!access || isExpired(decodeJwt(refresh ?? ''))) return null
  const payload = decodeJwt(access) ?? {}
  return { id: payload.user_id, fullName: payload.full_name ?? '', roles: payload.roles ?? [] }
}
