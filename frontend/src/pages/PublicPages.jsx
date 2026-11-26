import { Link } from 'react-router-dom'
import { Button, LanguagePill, Logo } from '../components/ui.jsx'

export function Home() {
  return (
    <div className="auth">
      <header><Link to="/" aria-label="SANAA home"><Logo /></Link><LanguagePill /></header>
      <section className="home-copy">
        <h1>SANAA</h1>
        <p>A platform that connects clients with qualified and nearby craftsmen.</p>
        <div><Button to="/login">Login</Button><Button to="/register" variant="outline">Register</Button></div>
      </section>
    </div>
  )
}
