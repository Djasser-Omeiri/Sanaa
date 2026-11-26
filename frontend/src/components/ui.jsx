import { Link } from 'react-router-dom'
import { Globe, ImagePlus, MapPin, Star } from 'lucide-react'
import logoUrl from '../assets/sanaa-logo.png'

const STATUS = {
  open: ['Open', 'blue'],
  worker_confirmed: ['Worker confirmed', 'green'],
  completed: ['Completed', 'gray'],
  applied: ['Applied', 'blue'],
  confirmed: ['Confirmed', 'green'],
  not_selected: ['Not selected', 'gray'],
  pending: ['Pending', 'amber'],
  approved: ['Approved', 'green'],
  rejected: ['Rejected', 'red'],
}

export function Button({ variant = 'primary', to, className = '', children, ...props }) {
  const classes = `btn btn-${variant} ${className}`
  if (to) return <Link to={to} className={classes} {...props}>{children}</Link>
  return <button type="button" className={classes} {...props}>{children}</button>
}

export function Badge({ tone = 'blue', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function StatusBadge({ status }) {
  const [label, tone] = STATUS[status] ?? [status, 'gray']
  return <Badge tone={tone}>{label}</Badge>
}

export function Avatar({ initials, size = 'md' }) {
  return <span className={`avatar avatar-${size}`}>{initials}</span>
}

export function Stars({ value = 5 }) {
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={15} fill={n <= Math.round(value) ? 'currentColor' : 'none'} />)}
    </span>
  )
}

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>
}

export function Tabs({ options, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {options.map(([key, label]) => (
        <button key={key} type="button" role="tab" aria-selected={value === key} className={value === key ? 'active' : ''} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  )
}

export function LanguagePill({ compact = false }) {
  return <span className="language-pill"><Globe size={18} />{compact ? 'EN' : 'FR | AR | EN'}</span>
}

// SANAA logo exported from Figma.
export function Logo() {
  return <img className="logo" src={logoUrl} alt="SANAA" width="480" height="160" />
}

export function PhotoSlot({ label, add = false }) {
  return <div className={`photo-slot ${add ? 'photo-add' : ''}`}><ImagePlus size={24} />{label && <span>{label}</span>}</div>
}

export function MapPreview({ label = 'Map · Algiers', tall = false, radius = false }) {
  return (
    <div className={`map ${tall ? 'map-tall' : ''}`} role="img" aria-label={label}>
      {radius && <span className="map-radius" />}
      <MapPin className="map-pin" size={32} fill="currentColor" stroke="white" />
      <span className="map-label">{label}</span>
    </div>
  )
}
