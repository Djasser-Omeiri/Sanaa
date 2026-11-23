import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HardHat, House, Lock, Mail, User, Wrench } from 'lucide-react'
import { Button, IconInput, LanguagePill, Logo, PasswordInput } from '../components/ui.jsx'

function HeroArt() {
  return <div className="hero-art" role="img" aria-label="Illustration placeholder"><House size={190} /><HardHat size={92} /><Wrench size={70} /></div>
}

function AuthShell({ children, home = false }) {
  return (
    <div className={`auth ${home ? 'auth-home' : ''}`}>
      <header><Link to="/" aria-label="SANAA home"><Logo /></Link><LanguagePill /></header>
      {home ? <>{children}<HeroArt /></> : <><HeroArt />{children}</>}
    </div>
  )
}

export function Home() {
  return (
    <AuthShell home>
      <section className="home-copy">
        <h1>SANAA</h1>
        <p>A platform that connects clients with qualified and nearby craftsmen.</p>
        <div><Button to="/login">Login</Button><Button to="/register" variant="outline">Register</Button></div>
      </section>
    </AuthShell>
  )
}

export function Login() {
  const navigate = useNavigate()
  return (
    <AuthShell>
      <form className="auth-card" onSubmit={(event) => { event.preventDefault(); navigate('/client') }}>
        <h1>Welcome Back !</h1>
        <p>Log in to your SANAA account.</p>
        <IconInput icon={Mail} placeholder="Email or Phone Number" aria-label="Email or Phone Number" />
        <PasswordInput icon={Lock} placeholder="Password" aria-label="Password" />
        <Button type="submit" className="btn-block">Log In</Button>
        <small>Don't have an account? <Link to="/register">Register</Link></small>
      </form>
    </AuthShell>
  )
}

export function Register() {
  const navigate = useNavigate()
  const [role, setRole] = useState('client')
  return (
    <AuthShell>
      <form className="auth-card" onSubmit={(event) => { event.preventDefault(); navigate(`/${role}`) }}>
        <h1>Create an Account</h1>
        <div className="role-toggle">
          <button type="button" className={role === 'client' ? 'active' : ''} onClick={() => setRole('client')}><User size={20} />Client</button>
          <button type="button" className={role === 'worker' ? 'active' : ''} onClick={() => setRole('worker')}><HardHat size={20} />Worker</button>
        </div>
        <IconInput icon={User} placeholder="Name" aria-label="Name" />
        <IconInput icon={Mail} placeholder="Email or Phone Number" aria-label="Email or Phone Number" />
        <PasswordInput icon={Lock} placeholder="Password" aria-label="Password" />
        <Button type="submit" className="btn-block">Create Account</Button>
        <small>Already have an account? <Link to="/login">Log In</Link></small>
      </form>
    </AuthShell>
  )
}
