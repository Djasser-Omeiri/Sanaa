import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, ClipboardList, Info, MapPin, Send, Star } from 'lucide-react'
import { Page } from '../components/AppLayout.jsx'
import { Badge, Button, MapPreview, PhotoSlot, StatusBadge, Tabs } from '../components/ui.jsx'
import { applications, nearbyRequests } from '../data/mock.js'

export function WorkerDashboard() {
  const stats = [[ClipboardList, nearbyRequests.length, 'Nearby requests'], [Send, applications.length, 'Applications'], [Star, '4.7', 'Your score']]
  return (
    <Page title="Dashboard" subtitle="Your activity at a glance.">
      <section className="banner solid"><div><h2>Welcome back, Ahmed</h2><p>New requests matching your trade are waiting.</p></div></section>
      <div className="grid-3">{stats.map(([Icon, value, label]) => <article className="card stat" key={label}><Icon size={28} /><strong>{value}</strong><span>{label}</span></article>)}</div>
      <div className="section-heading"><h2>Latest nearby requests</h2><Button variant="soft" to="/worker/nearby">View all</Button></div>
      <div className="stack">{nearbyRequests.slice(0, 2).map((request) => <NearbyCard request={request} key={request.id} />)}</div>
    </Page>
  )
}

function NearbyCard({ request }) {
  return (
    <article className="card nearby-card">
      <h3>{request.title} <StatusBadge status={request.status} /></h3>
      <p>{request.description}</p>
      <small><MapPin size={14} />{request.area} · {request.distance} · {request.date}</small>
      <Button className="btn-block" to={`/worker/nearby/${request.id}`}>View request</Button>
    </article>
  )
}

export function NearbyRequests() {
  const [radius, setRadius] = useState(15)
  return (
    <Page title="Nearby job requests" subtitle="Open requests that match your trade.">
      <div className="filters compact">
        <label className="filter">Radius: {radius} km<input type="range" min="1" max="50" value={radius} aria-label="Search radius" onChange={(event) => setRadius(Number(event.target.value))} /></label>
        <Badge tone="navy">Trade: Plumber</Badge>
        <span className="muted">{nearbyRequests.length} requests found</span>
      </div>
      <div className="split">
        <div className="stack">{nearbyRequests.map((request) => <NearbyCard request={request} key={request.id} />)}</div>
        <MapPreview tall radius label="General areas only" />
      </div>
    </Page>
  )
}

export function WorkerRequestDetail() {
  const { id } = useParams()
  const request = nearbyRequests.find((item) => item.id === Number(id)) ?? nearbyRequests[0]
  const [applied, setApplied] = useState(false)
  return (
    <Page title="Request detail" subtitle="Review the job before you apply." back={{ to: '/worker/nearby', label: 'Back to nearby requests' }}>
      <div className="split">
        <section className="card stack">
          <h3>{request.title} <StatusBadge status={request.status} /></h3>
          <p>{request.description}</p>
          <small><MapPin size={14} />{request.area} · {request.distance} · {request.date}</small>
          <div className="photo-row"><PhotoSlot /><PhotoSlot /><PhotoSlot /></div>
          <MapPreview label="General area only" />
        </section>
        <aside className="card stack apply-card">
          <h3>Apply to this request</h3>
          <p><CheckCircle2 size={16} />Your profile matches this trade</p>
          <p><CheckCircle2 size={16} />The client will see your portfolio and score</p>
          <p><CheckCircle2 size={16} />You can apply once per request</p>
          <Button variant={applied ? 'success' : 'primary'} className="btn-block" onClick={() => setApplied(true)}>{applied ? 'Applied' : 'Apply to this request'}</Button>
          <p className="note"><Info size={18} />You see only the general area of this request.</p>
        </aside>
      </div>
    </Page>
  )
}

export function MyApplications() {
  const [filter, setFilter] = useState('all')
  const shown = applications.filter((item) => filter === 'all' || item.status === filter)
  return (
    <Page title="My applications" subtitle="Track the requests you applied to.">
      <Tabs value={filter} onChange={setFilter} options={[['all', 'All'], ['applied', 'Applied'], ['confirmed', 'Confirmed'], ['not_selected', 'Not selected']]} />
      <div className="stack">
        {shown.map((item) => (
          <article className="card list-card" key={item.id}>
            <div><h3>{item.title} <StatusBadge status={item.requestStatus} /> <StatusBadge status={item.status} /></h3><small><MapPin size={14} />{item.trade} · {item.area} · {item.date}</small>{item.note && <p className="success-text">{item.note}</p>}</div>
            <Button variant="outline" to={`/worker/nearby/${nearbyRequests[0].id}`}>View request</Button>
          </article>
        ))}
      </div>
    </Page>
  )
}
