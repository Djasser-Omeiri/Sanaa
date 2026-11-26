import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, Mail } from 'lucide-react'
import { USE_MOCK_AUTH } from '../../api/auth.js'
import { DEMO_PASSWORD } from '../../api/mockAuth.js'
import { useAuth } from '../../auth/AuthContext.js'
import { validateLogin } from '../../auth/validation.js'
import { Button } from '../../components/ui.jsx'
import { AuthField, FormAlert, PasswordField } from './AuthFields.jsx'
import { AuthLayout } from './AuthLayout.jsx'

export default function Login() {
  const { login } = useAuth()
  const [values, setValues] = useState({ identifier: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const change = (event) => setValues({ ...values, [event.target.name]: event.target.value })

  async function submit(event) {
    event.preventDefault()
    const found = validateLogin(values)
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return
    setSubmitting(true)
    try {
      // On success the GuestOnly guard sends the user to the page for their role.
      await login({ identifier: values.identifier.trim(), password: values.password })
    } catch (error) {
      setFormError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome Back !" subtitle="Log in to your SANAA account.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <FormAlert>{formError}</FormAlert>
        <AuthField id="identifier" label="Email or Phone Number" icon={Mail} placeholder="you@example.com or 0550…" autoComplete="username" value={values.identifier} onChange={change} error={errors.identifier} />
        <PasswordField id="password" label="Password" placeholder="Your password" autoComplete="current-password" value={values.password} onChange={change} error={errors.password} />
        <Button type="submit" className="btn-block auth-submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Log In'}</Button>
        <p className="auth-switch">Don't have an account? <Link to="/register">Register</Link></p>
        {USE_MOCK_AUTH && (
          <p className="auth-demo"><Info size={16} aria-hidden="true" /><span>Demo mode until the accounts API is ready: <b>client@sanaa.dz</b>, <b>worker@sanaa.dz</b> or <b>staff@sanaa.dz</b> with password <b>{DEMO_PASSWORD}</b>.</span></p>
        )}
      </form>
    </AuthLayout>
  )
}
