import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.js'
import { homeFor, landingPath } from './roles.js'

// Protects a group of routes: logged-out users go to login, other roles go to their own home.
export function RequireRole({ role }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (!user.roles.includes(role)) return <Navigate to={homeFor(user)} replace />
  return <Outlet />
}

// Login and register are for logged-out users; a logged-in user is sent on to their pages.
export function GuestOnly() {
  const { user } = useAuth()
  const location = useLocation()
  if (user) return <Navigate to={landingPath(user, location.state?.from)} replace />
  return <Outlet />
}
