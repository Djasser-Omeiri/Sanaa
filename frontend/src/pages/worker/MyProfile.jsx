import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Camera, CheckCircle2, Clock, ImageIcon, Images, MapPin, Pencil, Plus, Radar, Star, UserRound, XCircle } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.js'
import { Page } from '../../components/AppLayout.jsx'
import { Avatar, Badge, Button, StatusBadge, Tabs } from '../../components/ui.jsx'
import { myPosts, myWorkerProfile } from '../../data/mock.js'
import { formatCoordinates, initialsOf } from './format.js'

// What each moderation status means for the worker (FP3, FP4).
const STATUS_INFO = {
  approved: [CheckCircle2, 'Visible to clients'],
  pending: [Clock, 'Waiting for staff review'],
  rejected: [XCircle, 'Hidden from clients until you edit and resubmit'],
}

const FILTERS = [['all', 'All'], ['approved', 'Approved'], ['pending', 'Pending'], ['rejected', 'Rejected']]

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="card empty-state">
      <span className="empty-icon"><Icon size={30} aria-hidden="true" /></span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}

function PostCard({ post }) {
  const [Icon, text] = STATUS_INFO[post.status]
  const rejected = post.status === 'rejected'
  return (
    <article className="card portfolio-card">
      <div className="portfolio-cover">
        <ImageIcon size={34} aria-hidden="true" />
        <span className="cover-badge"><StatusBadge status={post.status} /></span>
        <span className="photo-count"><Camera size={13} aria-hidden="true" />{post.photoCount} photos</span>
      </div>
      <div className="portfolio-body">
        <h3>{post.title}</h3>
        <p>{post.description}</p>
        <small className={`status-line status-${post.status}`}><Icon size={14} aria-hidden="true" />{text}</small>
        {rejected && <p className="alert"><b>Reason:</b> {post.rejectionReason}</p>}
        <Button variant={rejected ? 'primary' : 'outline'} to={`/worker/profile/posts/${post.id}/edit`}>
          <Pencil size={16} aria-hidden="true" />{rejected ? 'Edit & resubmit' : 'Edit post'}
        </Button>
      </div>
    </article>
  )
}

export default function MyProfile() {
  const { user } = useAuth()
  const { state } = useLocation()
  const [filter, setFilter] = useState('all')
  const profile = myWorkerProfile
  const name = user?.fullName || 'Your name'

  if (!profile) {
    return (
      <Page title="My profile & portfolio" subtitle="Manage what clients see about you.">
        <EmptyState
          icon={UserRound}
          title="Create your worker profile"
          text="Add your trades, your base location and how far you travel. You need a profile to see nearby requests and publish your work."
          action={<Button to="/worker/profile/create"><Plus size={18} aria-hidden="true" />Create profile</Button>}
        />
      </Page>
    )
  }

  const counts = Object.fromEntries(FILTERS.map(([key]) => [key, myPosts.filter((post) => key === 'all' || post.status === key).length]))
  const shown = myPosts.filter((post) => filter === 'all' || post.status === filter)

  return (
    <Page
      title="My profile & portfolio"
      subtitle="Manage what clients see about you."
      actions={<Button className="hide-mobile" to="/worker/profile/posts/new"><Plus size={18} aria-hidden="true" />Add post</Button>}
    >
      {state?.notice && <p className="flash" role="status"><CheckCircle2 size={18} aria-hidden="true" />{state.notice}</p>}

      <section className="card profile-hero" aria-label="Your profile">
        <div className="profile-cover" aria-hidden="true" />
        <div className="profile-hero-body">
          <Avatar initials={initialsOf(name)} size="xl" />
          <div className="profile-hero-info">
            <h2>{name}</h2>
            <div className="chip-row">{profile.trades.map((trade) => <Badge key={trade}>{trade}</Badge>)}</div>
          </div>
          <Button variant="outline" to="/worker/profile/edit"><Pencil size={16} aria-hidden="true" />Edit profile</Button>
        </div>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        <dl className="profile-facts">
          <div>
            <dt><Star size={15} aria-hidden="true" />Score</dt>
            <dd>{profile.reviewCount ? <>{profile.score.toFixed(1)} <span>({profile.reviewCount} reviews)</span></> : <span>No reviews yet</span>}</dd>
          </div>
          <div>
            <dt><MapPin size={15} aria-hidden="true" />Base location</dt>
            <dd className="small">{formatCoordinates(profile.latitude, profile.longitude)}</dd>
          </div>
          <div>
            <dt><Radar size={15} aria-hidden="true" />Search radius</dt>
            <dd>{profile.radiusKm} km</dd>
          </div>
          <div>
            <dt><Images size={15} aria-hidden="true" />Approved posts</dt>
            <dd>{counts.approved}</dd>
          </div>
        </dl>
      </section>

      <div className="section-heading">
        <div>
          <h2>My portfolio</h2>
          <p className="muted">Clients only see approved posts. New and edited posts wait for staff review.</p>
        </div>
        <Button className="show-mobile btn-block" to="/worker/profile/posts/new"><Plus size={18} aria-hidden="true" />Add post</Button>
      </div>

      <Tabs value={filter} onChange={setFilter} options={FILTERS.map(([key, label]) => [key, `${label} (${counts[key]})`])} />

      {shown.length > 0 ? (
        <div className="portfolio-grid">{shown.map((post) => <PostCard post={post} key={post.id} />)}</div>
      ) : (
        <EmptyState
          icon={Images}
          title={filter === 'all' ? 'No posts yet' : 'Nothing here'}
          text={filter === 'all' ? 'Show clients your best work. Each post needs at least 3 photos.' : 'You have no posts with this status.'}
          action={filter === 'all' && <Button to="/worker/profile/posts/new"><Plus size={18} aria-hidden="true" />Add your first post</Button>}
        />
      )}
    </Page>
  )
}
