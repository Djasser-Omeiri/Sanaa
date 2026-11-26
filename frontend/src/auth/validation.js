const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^\+?\d{9,13}$/

export const isEmailOrPhone = (value) => EMAIL.test(value.trim()) || PHONE.test(value.replace(/[\s-]/g, ''))

export function validateLogin({ identifier, password }) {
  const errors = {}
  if (!identifier.trim()) errors.identifier = 'Enter your email or phone number.'
  else if (!isEmailOrPhone(identifier)) errors.identifier = 'Enter a valid email or phone number.'
  if (!password) errors.password = 'Enter your password.'
  return errors
}

// Mirrors Django's default password validators (minimum length, not only digits).
export function validateRegister({ fullName, identifier, password, role }) {
  const errors = {}
  if (fullName.trim().length < 2) errors.fullName = 'Enter your full name.'
  if (!identifier.trim()) errors.identifier = 'Enter your email or phone number.'
  else if (!isEmailOrPhone(identifier)) errors.identifier = 'Enter a valid email or phone number.'
  if (password.length < 8) errors.password = 'Use at least 8 characters.'
  else if (/^\d+$/.test(password)) errors.password = 'Your password cannot be only numbers.'
  if (!['client', 'worker'].includes(role)) errors.role = 'Choose how you will use SANAA.'
  return errors
}
