// Development stand-in for the accounts API. Tokens are unsigned and only work in this mock.
import { ApiError } from './client.js'
import { decodeJwt, isExpired } from '../auth/jwt.js'

const USERS_KEY = 'sanaa.mockUsers'
export const DEMO_PASSWORD = 'sanaa1234'
const DEMO_USERS = [
  { id: 1, full_name: 'Yasmine Benali', email: 'client@sanaa.dz', password: DEMO_PASSWORD, roles: ['client'] },
  { id: 2, full_name: 'Ahmed Belkacem', email: 'worker@sanaa.dz', password: DEMO_PASSWORD, roles: ['worker'] },
  { id: 3, full_name: 'Staff Member', email: 'staff@sanaa.dz', password: DEMO_PASSWORD, roles: ['staff'] },
]

const wait = () => new Promise((resolve) => setTimeout(resolve, 450))
const savedUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')
const allUsers = () => [...DEMO_USERS, ...savedUsers()]
const normalize = (value = '') => value.trim().toLowerCase().replace(/[\s-]/g, '')

function base64url(value) {
  let binary = ''
  new TextEncoder().encode(JSON.stringify(value)).forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function token(user, type, seconds) {
  const payload = { token_type: type, user_id: user.id, full_name: user.full_name, roles: user.roles, exp: Math.floor(Date.now() / 1000) + seconds }
  return `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url(payload)}.mock`
}

const issueTokens = (user) => ({ access: token(user, 'access', 30 * 60), refresh: token(user, 'refresh', 7 * 24 * 3600) })

export async function login({ identifier, password }) {
  await wait()
  const key = normalize(identifier)
  const user = allUsers().find((item) => normalize(item.email) === key || normalize(item.phone) === key)
  // One generic error, so the form never reveals which accounts exist (A1.1).
  if (!user || user.password !== password) throw new ApiError('Incorrect email, phone number or password.', 401)
  return issueTokens(user)
}

export async function register({ full_name, email, phone, password, role }) {
  await wait()
  if (!['client', 'worker'].includes(role)) throw new ApiError('You can register as a client or a worker only.', 400)
  const key = normalize(email ?? phone)
  if (allUsers().some((item) => normalize(item.email) === key || normalize(item.phone) === key)) {
    const field = email ? 'email' : 'phone'
    throw new ApiError('Please fix the highlighted field.', 400, { [field]: `An account with this ${field === 'email' ? 'email' : 'phone number'} already exists.` })
  }
  const user = { id: Date.now(), full_name, email, phone, password, roles: [role] }
  localStorage.setItem(USERS_KEY, JSON.stringify([...savedUsers(), user]))
  return issueTokens(user)
}

export async function refresh(refreshToken) {
  await wait()
  const payload = decodeJwt(refreshToken)
  const user = allUsers().find((item) => item.id === payload?.user_id)
  if (!user || payload.token_type !== 'refresh' || isExpired(payload)) throw new ApiError('Token is invalid or expired', 401)
  return { access: token(user, 'access', 30 * 60) }
}
