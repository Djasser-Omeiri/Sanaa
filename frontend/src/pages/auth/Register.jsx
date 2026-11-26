import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HardHat, Mail, User } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.js'
import { validateRegister } from '../../auth/validation.js'
import { Button } from '../../components/ui.jsx'
import { AuthField, FormAlert, PasswordField } from './AuthFields.jsx'
import { AuthLayout } from './AuthLayout.jsx'

// Staff accounts are created in Django admin, so only these two roles can sign up (A1.1).
const ROLES = [
  ['client', User, 'Client', 'I need a job done'],
  ['worker', HardHat, 'Worker', 'I offer my skills'],
]

// Maps backend field names to the form fields.
const FIELD_NAMES = { full_name: 'fullName', email: 'identifier', phone: 'identifier', password: 'password', role: 'role' }

export default function Register() {
  const { register } = useAuth()
  const [values, setValues] = useState({ role: 'client', fullName: '', identifier: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const change = (event) => setValues({ ...values, [event.target.name]: event.target.value })

  async function submit(event) {
    event.preventDefault()
    const found = validateRegister(values)
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return
    setSubmitting(true)
    try {
      await register({ ...values, fullName: values.fullName.trim(), identifier: values.identifier.trim() })
    } catch (error) {
      const fieldErrors = Object.fromEntries(Object.entries(error.fields ?? {}).filter(([name]) => FIELD_NAMES[name]).map(([name, message]) => [FIELD_NAMES[name], message]))
      setErrors(fieldErrors)
      setFormError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Create an Account" subtitle="Join SANAA in less than a minute.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <FormAlert>{formError}</FormAlert>
        <fieldset className="role-choice">
          <legend>I am joining as</legend>
          {ROLES.map(([value, Icon, label, hint]) => (
            <label key={value} className={values.role === value ? 'selected' : ''}>
              <input type="radio" name="role" value={value} checked={values.role === value} onChange={change} />
              <Icon size={22} aria-hidden="true" />
              <span><b>{label}</b><small>{hint}</small></span>
            </label>
          ))}
        </fieldset>
        <AuthField id="fullName" label="Full name" icon={User} placeholder="Your full name" autoComplete="name" value={values.fullName} onChange={change} error={errors.fullName} />
        <AuthField id="identifier" label="Email or Phone Number" icon={Mail} placeholder="you@example.com or 0550…" autoComplete="username" value={values.identifier} onChange={change} error={errors.identifier} />
        <PasswordField id="password" label="Password" placeholder="At least 8 characters" autoComplete="new-password" value={values.password} onChange={change} error={errors.password} />
        <Button type="submit" className="btn-block auth-submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create Account'}</Button>
        <p className="auth-switch">Already have an account? <Link to="/login">Log In</Link></p>
      </form>
    </AuthLayout>
  )
}
