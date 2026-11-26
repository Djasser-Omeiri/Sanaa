import { useState } from 'react'
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react'

export function AuthField({ id, label, icon: Icon, error, trailing, ...inputProps }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className={`auth-input ${error ? 'invalid' : ''}`}>
        <Icon size={20} aria-hidden="true" />
        <input id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...inputProps} />
        {trailing}
      </div>
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}

export function PasswordField(props) {
  const [visible, setVisible] = useState(false)
  return (
    <AuthField
      {...props}
      icon={Lock}
      type={visible ? 'text' : 'password'}
      trailing={(
        <button type="button" className="auth-eye" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(!visible)}>
          {visible ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      )}
    />
  )
}

export function FormAlert({ children }) {
  if (!children) return null
  return <div className="auth-alert" role="alert"><AlertCircle size={18} aria-hidden="true" />{children}</div>
}
