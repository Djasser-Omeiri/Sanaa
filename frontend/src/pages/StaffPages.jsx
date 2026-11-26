import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, CheckCircle2, Clock, X, XCircle } from 'lucide-react'
import { Page } from '../components/AppLayout.jsx'
import { Avatar, Button, Field, PhotoSlot, Stars, StatusBadge, Tabs } from '../components/ui.jsx'
import { moderationPosts } from '../data/mock.js'

const pending = moderationPosts.filter((post) => post.status === 'pending')

export function StaffHub() {
  const stats = [[Clock, 7, 'Pending posts', 'amber'], [CheckCircle2, 12, 'Approved this week', 'green'], [XCircle, 3, 'Rejected this week', 'red']]
  return (
    <Page title="Staff Hub" subtitle="Moderate worker portfolio posts.">
      <section className="banner solid"><div><h2>Welcome back, moderator</h2><p>Review new posts so approved work becomes visible to clients.</p></div></section>
      <div className="grid-3">{stats.map(([Icon, value, label, tone]) => <article className={`card stat stat-${tone}`} key={label}><Icon size={28} /><strong>{value}</strong><span>{label}</span></article>)}</div>
      <div className="section-heading"><h2>Oldest pending posts</h2><Button variant="soft" to="/staff/pending">Open queue</Button></div>
      <div className="stack">
        {pending.map((post) => (
          <article className="card list-card" key={post.id}>
            <div className="person"><Avatar initials={post.initials} /><div><strong>{post.post}</strong><small>{post.worker} · {post.trade} · {post.date}</small></div></div>
            <Button to={`/staff/pending/${post.id}`}>Review</Button>
          </article>
        ))}
      </div>
    </Page>
  )
}

function WorkerCell({ post }) {
  return <span className="person"><Avatar initials={post.initials} size="sm" />{post.worker}</span>
}

export function PendingPosts() {
  return (
    <Page title="Pending posts" subtitle="Posts waiting for a decision, oldest first.">
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Worker</th><th>Post</th><th>Trade</th><th>Photos</th><th>Date</th><th /></tr></thead>
          <tbody>{pending.map((post) => <tr key={post.id}><td><WorkerCell post={post} /></td><td>{post.post}</td><td><StatusBadge status={post.status} /></td><td>{post.photos}</td><td>{post.date}</td><td><Button variant="soft" to={`/staff/pending/${post.id}`}>Review</Button></td></tr>)}</tbody>
        </table>
      </div>
    </Page>
  )
}

export function PostReview() {
  const { id } = useParams()
  const post = moderationPosts.find((item) => item.id === Number(id)) ?? pending[0]
  const [decision, setDecision] = useState(null)
  return (
    <Page title="Post review" subtitle="Check the post before you decide." back={{ to: '/staff/pending', label: 'Back to queue' }}>
      <div className="split">
        <section className="card stack">
          <div className="person"><Avatar initials={post.initials} /><div><strong>{post.worker}</strong> <StatusBadge status={decision ?? post.status} /><Stars value={4.7} /></div></div>
          <h3>{post.post}</h3>
          <p>Work completed for a client, with before and after photos of the installation.</p>
          <div className="field"><span>Photos ({post.photos})</span><div className="photo-row two">{Array.from({ length: post.photos }, (_, index) => <PhotoSlot key={index} />)}</div></div>
        </section>
        <aside className="card stack apply-card">
          <h3>Decision</h3>
          <Button variant="success" className="btn-block" onClick={() => setDecision('approved')}><Check size={18} />Approve post</Button>
          <Field label="Rejection reason"><textarea rows="4" placeholder="Explain what the worker should fix..." /></Field>
          <Button variant="danger" className="btn-block" onClick={() => setDecision('rejected')}><X size={18} />Reject post</Button>
          <small>The worker sees the reason and can edit and resubmit the post.</small>
        </aside>
      </div>
    </Page>
  )
}

export function ReviewHistory() {
  const [filter, setFilter] = useState('all')
  const decided = moderationPosts.filter((post) => post.status !== 'pending' && (filter === 'all' || post.status === filter))
  return (
    <Page title="Review history" subtitle="Posts that have already been decided.">
      <Tabs value={filter} onChange={setFilter} options={[['all', 'All'], ['approved', 'Approved'], ['rejected', 'Rejected']]} />
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Worker</th><th>Post</th><th>Decision</th><th>Date</th><th>Reason</th></tr></thead>
          <tbody>{decided.map((post) => <tr key={post.id}><td><WorkerCell post={post} /></td><td>{post.post}</td><td><StatusBadge status={post.status} /></td><td>{post.date}</td><td>{post.reason || '—'}</td></tr>)}</tbody>
        </table>
      </div>
    </Page>
  )
}
