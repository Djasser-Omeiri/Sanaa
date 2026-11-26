import { Link } from 'react-router-dom'
import { MapPin, ShieldCheck, Star } from 'lucide-react'
import { LanguagePill, Logo } from '../../components/ui.jsx'

const PERKS = [
  [ShieldCheck, 'Portfolios approved by our staff'],
  [MapPin, 'Skilled workers close to you'],
  [Star, 'Honest ratings after every job'],
]

// The Figma hero (src/assets/auth-hero.png) is the page background; the form sits on its empty side.
export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <header className="auth-top">
        <Link to="/" aria-label="SANAA home"><Logo /></Link>
        <LanguagePill />
      </header>
      <main className="auth-main">
        <section className="auth-card">
          <h1>{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </section>
        <ul className="auth-perks">
          {PERKS.map(([Icon, text]) => <li key={text}><Icon size={18} aria-hidden="true" />{text}</li>)}
        </ul>
      </main>
    </div>
  )
}
