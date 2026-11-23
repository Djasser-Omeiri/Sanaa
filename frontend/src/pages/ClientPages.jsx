import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, Bell, ChevronDown, Clipboard, FilePlus, HelpCircle, House, LocateFixed, MapPin, MessageSquare, Phone, Plus, Search, Settings, ShieldCheck, Star, User, Wrench } from 'lucide-react'
import { Page } from '../components/AppLayout.jsx'
import { Avatar, Badge, Button, Field, LanguagePill, Logo, MapPreview, PhotoSlot, Stars, StatusBadge, Tabs } from '../components/ui.jsx'
import { portfolio, requests, reviews, trades, workers } from '../data/mock.js'

const findById = (list, id) => list.find((item) => item.id === Number(id)) ?? list[0]

export function ClientHub() {
  const actions = [
    [Search, 'Search Workers', 'Find qualified workers for your needs', 'Search Now', '/client/workers'],
    [FilePlus, 'Post a Request', 'Publish your job request', 'Post Request', '/client/requests/new'],
    [Clipboard, 'Follow Requests', 'Track the status of your job requests', 'View Requests', '/client/requests'],
  ]
  const quick = [[User, 'My Profile'], [Bell, 'Notifications'], [MessageSquare, 'Messages'], [HelpCircle, 'Help & Support'], [Settings, 'Settings']]
  return (
    <Page title="Client Hub">
      <section className="banner"><div><h2>Welcome to SANAA 👋</h2><p>Find skilled workers near you and manage your requests easily</p></div><Wrench size={92} /></section>
      <div className="grid-3">
        {actions.map(([Icon, title, text, cta, to]) => (
          <article className="card action-card" key={title}><Icon size={44} /><h3>{title}</h3><p>{text}</p><Button to={to}>{cta} →</Button></article>
        ))}
      </div>
      <h2 className="section-title">Quick Access</h2>
      <div className="quick-grid">{quick.map(([Icon, label]) => <button type="button" className="card" key={label}><Icon size={38} />{label}</button>)}</div>
    </Page>
  )
}

export function BrowseWorkers() {
  const [query, setQuery] = useState('')
  const [trade, setTrade] = useState('')
  const found = workers.filter((worker) => (!trade || worker.trade === trade) && worker.name.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="browse">
      <header className="browse-nav">
        <Link to="/client"><Logo /></Link>
        <div><LanguagePill /><User size={28} /><Button to="/client"><House size={18} />Client Hub</Button></div>
      </header>
      <h1>Browse / Search Workers</h1>
      <p>Search for skilled workers and find the nearest professional for your needs.</p>
      <div className="filters">
        <label className="filter"><Search size={22} /><input placeholder="Search workers..." aria-label="Search workers" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="filter"><Settings size={22} /><select aria-label="Select Trade" value={trade} onChange={(event) => setTrade(event.target.value)}><option value="">Select Trade</option>{trades.map((item) => <option key={item}>{item}</option>)}</select></label>
        <span className="filter"><MapPin size={22} />Distance<ChevronDown size={20} /></span>
        <span className="filter"><ArrowDown size={20} />sort by proximity<ChevronDown size={20} /></span>
      </div>
      <h2 className="section-title">Workers Found</h2>
      <div className="stack">
        {found.map((worker) => (
          <Link className="card worker-row" to={`/client/workers/${worker.id}`} key={worker.id}>
            <Avatar initials={worker.initials} size="lg" /><strong>{worker.name}</strong><span><Wrench size={20} />{worker.trade}</span><span><MapPin size={18} />{worker.distance}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function PortfolioGrid({ items = portfolio.slice(0, 3) }) {
  return <div className="grid-3">{items.map((post) => <article className="card post-card" key={post.id}><PhotoSlot /><h3>{post.title}</h3><p>{post.description}</p></article>)}</div>
}

function ReviewList() {
  return <div className="grid-2">{reviews.map((review) => <article className="card review" key={review.id}><Avatar initials={review.initials} /><div><strong>{review.name}</strong><Stars value={review.rating} /><p>{review.comment}</p></div></article>)}</div>
}

export function WorkerPublicProfile() {
  const worker = findById(workers, useParams().id)
  return (
    <Page title="Worker’s public profile">
      <section className="profile-banner"><Avatar initials={worker.initials} size="xl" /><div><h2>{worker.name}</h2><p><Wrench size={17} />{worker.trade}</p><p><MapPin size={17} />{worker.area}</p><p><Star size={17} />{worker.score} ({worker.reviews} reviews)</p></div></section>
      <h2 className="section-title">Approved Portfolio Posts</h2>
      <PortfolioGrid items={portfolio.map((post) => ({ ...post, status: 'approved' }))} />
      <h2 className="section-title">Ratings & Reviews</h2>
      <ReviewList />
    </Page>
  )
}

export function PostRequest() {
  return (
    <Page title="Post a Job Request" subtitle="Describe your need and workers of the matching trade will apply.">
      <form className="card form-grid" onSubmit={(event) => event.preventDefault()}>
        <div className="stack">
          <Field label="Trade"><select defaultValue=""><option value="" disabled>Select a trade</option>{trades.map((trade) => <option key={trade}>{trade}</option>)}</select></Field>
          <Field label="Description"><textarea rows="5" placeholder="Describe the job you need done..." /></Field>
          <div className="field"><span>Photos (optional)</span><div className="photo-row"><PhotoSlot label="Add photo" add /><PhotoSlot label="Add photo" add /><PhotoSlot label="Add photo" add /></div></div>
        </div>
        <div className="stack">
          <div className="field"><span>Location</span><MapPreview /></div>
          <Button variant="soft" to="/client/requests/new/location"><LocateFixed size={18} />Detected automatically · Adjust pin manually</Button>
          <Field label="General area"><input placeholder="Example: Bab Ezzouar, Algiers" /></Field>
          <p className="note"><ShieldCheck size={18} />Workers see only your general area, never your exact location.</p>
        </div>
        <div className="form-actions"><Button variant="outline" to="/client/requests">Cancel</Button><Button type="submit">Publish request</Button></div>
      </form>
    </Page>
  )
}

export function MyRequests() {
  const [filter, setFilter] = useState('all')
  const shown = requests.filter((request) => filter === 'all' || request.status === filter)
  return (
    <Page title="My Job Requests" subtitle="Follow your requests and their applicants." actions={<Button to="/client/requests/new"><Plus size={18} />Post request</Button>}>
      <Tabs value={filter} onChange={setFilter} options={[['all', 'All'], ['open', 'Open'], ['worker_confirmed', 'Worker confirmed'], ['completed', 'Completed']]} />
      <div className="stack">
        {shown.map((request) => (
          <article className="card list-card" key={request.id}>
            <div><h3>{request.trade} <StatusBadge status={request.status} /></h3><p>{request.description}</p><small><MapPin size={14} />{request.area} · {request.date}</small></div>
            <div className="list-side"><span>{request.applicants} applicants</span><Button to={`/client/requests/${request.id}`}>View</Button></div>
          </article>
        ))}
      </div>
    </Page>
  )
}

export function RequestDetail() {
  const { id } = useParams()
  const request = findById(requests, id)
  const [confirmedId, setConfirmedId] = useState(null)
  return (
    <Page title="Request detail" subtitle="Review the request and choose a worker." back={{ to: '/client/requests', label: 'My requests' }}>
      <section className="card detail-split">
        <div><h3>{request.trade} <StatusBadge status={request.status} /></h3><p>{request.description}</p><small><MapPin size={14} />{request.area} · {request.date}</small><div className="photo-row"><PhotoSlot /><PhotoSlot /><PhotoSlot /></div></div>
        <MapPreview />
      </section>
      <div className="section-heading"><h2>Applicants ({workers.length})</h2><small><ShieldCheck size={15} />Phone numbers are visible only to you</small></div>
      <div className="stack">
        {workers.map((worker) => (
          <article className="card list-card" key={worker.id}>
            <div className="person"><Avatar initials={worker.initials} /><div><strong>{worker.name}</strong> <Badge>{worker.trade}</Badge><Stars value={worker.score} /><small><Phone size={14} />{worker.phone}</small></div></div>
            <div className="list-side row"><Button variant="outline" to={`/client/requests/${request.id}/applicants/${worker.id}`}>View profile</Button><Button variant={confirmedId === worker.id ? 'success' : 'primary'} onClick={() => setConfirmedId(worker.id)}>{confirmedId === worker.id ? 'Confirmed' : 'Confirm'}</Button></div>
          </article>
        ))}
      </div>
      <div className="form-actions"><Button variant="navy">Mark job completed</Button><Button variant="outline" to={`/client/requests/${request.id}/review`}>Rate worker</Button></div>
    </Page>
  )
}

export function ApplicantProfile() {
  const { id, applicantId } = useParams()
  const worker = findById(workers, applicantId)
  return (
    <Page title="Worker profile" subtitle="Applicant for your request." back={{ to: `/client/requests/${id}`, label: 'Back to applicants' }}>
      <section className="card list-card">
        <div className="person"><Avatar initials={worker.initials} size="lg" /><div><strong>{worker.name}</strong> <Badge>{worker.trade}</Badge><Stars value={worker.score} /><small><MapPin size={14} />{worker.distance}</small></div></div>
        <div className="list-side row"><Button variant="outline"><Phone size={16} />{worker.phone}</Button><Button>Confirm this worker</Button></div>
      </section>
      <h2 className="section-title">Approved portfolio posts</h2>
      <PortfolioGrid />
      <h2 className="section-title">Ratings & reviews</h2>
      <ReviewList />
    </Page>
  )
}

export function LocationPicker() {
  const navigate = useNavigate()
  const done = () => navigate('/client/requests/new')
  return (
    <div className="overlay">
      <section className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="location-title">
        <h2 id="location-title">Choose your location</h2>
        <div className="consent"><ShieldCheck size={22} /><p>Allow SANAA to detect your location? Workers only ever see your general area.</p><Button onClick={done}>Allow</Button><Button variant="outline" onClick={done}>Not now</Button></div>
        <MapPreview tall radius label="Drag the pin to your location" />
        <Field label="General area"><input defaultValue="Bab Ezzouar, Algiers" /></Field>
        <div className="form-actions"><Button variant="soft"><LocateFixed size={18} />Use my location</Button><Button variant="outline" onClick={done}>Cancel</Button><Button onClick={done}>Confirm location</Button></div>
      </section>
    </div>
  )
}

export function RateReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState(4)
  const close = () => navigate(`/client/requests/${id}`)
  return (
    <div className="overlay">
      <form className="modal center" role="dialog" aria-modal="true" aria-labelledby="review-title" onSubmit={(event) => { event.preventDefault(); close() }}>
        <Avatar initials="AB" size="lg" />
        <h2 id="review-title">Rate Ahmed Belkacem</h2>
        <p>Plumber · Kitchen sink repair</p>
        <div className="rating-input">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} aria-label={`${n} stars`} onClick={() => setRating(n)}><Star size={34} fill={n <= rating ? 'currentColor' : 'none'} /></button>)}</div>
        <Field label="Comment (optional)"><textarea rows="4" placeholder="Share your experience..." /></Field>
        <div className="form-actions"><Button variant="outline" onClick={close}>Cancel</Button><Button type="submit">Submit review</Button></div>
      </form>
    </div>
  )
}
