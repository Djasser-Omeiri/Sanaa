// Where each role lands after login. A user with several roles goes to the first match.
export const ROLE_HOME = { staff: '/staff', worker: '/worker', client: '/client' }

export function homeFor(user) {
  const role = Object.keys(ROLE_HOME).find((name) => user?.roles.includes(name))
  return role ? ROLE_HOME[role] : '/'
}

// Sends the user back to the page that asked them to log in, if their role may open it.
export function landingPath(user, from) {
  const allowed = from && Object.entries(ROLE_HOME).some(([role, path]) => user.roles.includes(role) && (from === path || from.startsWith(`${path}/`)))
  return allowed ? from : homeFor(user)
}
