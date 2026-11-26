import { Link, NavLink, Outlet, useOutletContext } from 'react-router-dom'
import { ArrowLeft, ClipboardList, Clock, FileCheck, LayoutDashboard, LogOut, MapPin, Search, Send, User } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.js'
import { Avatar, LanguagePill, Logo } from './ui.jsx'

const NAV = {
  client: {
    initials: 'YB',
    items: [
      ['/client', 'Dashboard', LayoutDashboard],
      ['/client/workers', 'Find workers', Search],
      ['/client/requests', 'My Requests', ClipboardList],
    ],
  },
  worker: {
    initials: 'AB',
    items: [
      ['/worker', 'Dashboard', LayoutDashboard],
      ['/worker/profile', 'My Profile', User],
      ['/worker/nearby', 'Nearby Requests', MapPin],
      ['/worker/applications', 'My Applications', Send],
    ],
  },
  staff: {
    initials: 'ST',
    items: [
      ['/staff', 'Dashboard', LayoutDashboard],
      ['/staff/pending', 'Pending Posts', FileCheck],
      ['/staff/history', 'Review History', Clock],
    ],
  },
}

export function AppLayout({ role }) {
  const { initials, items } = NAV[role]
  const { logout } = useAuth()
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <span className="sidebar-logo"><Logo /></span>
        <nav aria-label="Main">
          {items.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to.split('/').length === 2}>
              <Icon size={22} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="logout" onClick={logout}><LogOut size={22} /><span>Log Out</span></button>
      </aside>
      <main className="main"><Outlet context={{ initials }} /></main>
    </div>
  )
}

export function Page({ title, subtitle, back, actions, children }) {
  const { initials } = useOutletContext()
  return (
    <>
      <header className="topbar">
        <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
        <div className="topbar-actions">{actions}<LanguagePill compact /><Avatar initials={initials} size="sm" /></div>
      </header>
      {back && <Link className="back-link" to={back.to}><ArrowLeft size={20} />{back.label}</Link>}
      {children}
    </>
  )
}
