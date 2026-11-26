import { useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.js'
import { AuthContext } from './AuthContext.js'
import { sessionUser } from './jwt.js'
import { AUTH_CHANGED_EVENT, clearTokens, getTokens, setTokens } from './tokenStorage.js'

export function AuthProvider({ children }) {
  const [tokens, setTokenState] = useState(getTokens)

  // Follows token changes from this tab (login, refresh, logout) and from other tabs.
  useEffect(() => {
    const sync = () => setTokenState(getTokens())
    window.addEventListener(AUTH_CHANGED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const value = useMemo(() => ({
    user: sessionUser(tokens),
    login: async (credentials) => setTokens(await authApi.login(credentials)),
    register: async (details) => setTokens(await authApi.register(details)),
    logout: clearTokens,
  }), [tokens])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
