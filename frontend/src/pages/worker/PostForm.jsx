import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ImageIcon, ImagePlus, Info, X } from 'lucide-react'
import { Page } from '../../components/AppLayout.jsx'
import { Button, StatusBadge } from '../../components/ui.jsx'
import { myPosts } from '../../data/mock.js'

// Rules from the architecture document: at least 3 photos per post, real images in
// JPEG, PNG or WebP, and a size limit (5 MB proposed, to confirm with the supervisor).
const MIN_PHOTOS = 3
const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const TITLE_MAX = 120
const DESCRIPTION_MAX = 2000

function validatePost({ title, description, photos }) {
  const errors = {}
  if (!title.trim()) errors.title = 'Give your post a title.'
  else if (title.length > TITLE_MAX) errors.title = `Keep the title under ${TITLE_MAX} characters.`
  if (!description.trim()) errors.description = 'Describe the work you did.'
  else if (description.length > DESCRIPTION_MAX) errors.description = `Keep the description under ${DESCRIPTION_MAX} characters.`
  if (photos.length < MIN_PHOTOS) errors.photos = `Add at least ${MIN_PHOTOS} photos (${photos.length} added).`
  return errors
}

function PhotoUploader({ photos, onAdd, onRemove, rejected, error }) {
  const enough = photos.length >= MIN_PHOTOS
  return (
    <div className="field">
      <div className="photos-head">
        <span id="photos-label">Photos <span className="required">*</span></span>
        <span className={`photo-counter ${enough ? 'ok' : 'short'}`}>
          {enough ? <CheckCircle2 size={14} aria-hidden="true" /> : <AlertCircle size={14} aria-hidden="true" />}
          {photos.length} / {MIN_PHOTOS} minimum
        </span>
      </div>
      <p className="field-hint">JPEG, PNG or WebP, up to {MAX_SIZE_MB} MB each. The first photo is the cover.</p>
      <ul className="photo-grid" aria-labelledby="photos-label">
        {photos.map((photo, index) => (
          <li className="photo-tile" key={photo.id}>
            {photo.url ? <img src={photo.url} alt={photo.name} /> : <span className="tile-placeholder"><ImageIcon size={26} aria-hidden="true" />{photo.name}</span>}
            {index === 0 && <span className="cover-tag">Cover</span>}
            <button type="button" className="remove" aria-label={`Remove ${photo.name}`} onClick={() => onRemove(photo.id)}><X size={16} /></button>
          </li>
        ))}
        <li>
          <label className="photo-tile photo-add-tile">
            <ImagePlus size={26} aria-hidden="true" />
            Add photos
            <input type="file" accept={ALLOWED_TYPES.join(',')} multiple onChange={(event) => { onAdd([...event.target.files]); event.target.value = '' }} />
          </label>
        </li>
      </ul>
      {rejected.length > 0 && (
        <ul className="form-error upload-errors" role="alert">{rejected.map((message) => <li key={message}>{message}</li>)}</ul>
      )}
      {error && !enough && <p className="form-error" role="alert">{error}</p>}
    </div>
  )
}

export default function PostForm({ mode }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = mode === 'edit'
  const post = editing ? myPosts.find((item) => item.id === Number(id)) : null

  const [title, setTitle] = useState(post?.title ?? '')
  const [description, setDescription] = useState(post?.description ?? '')
  // Saved photos come from the API as URLs; the mock has none, so they show as placeholders.
  const [photos, setPhotos] = useState(() => Array.from({ length: post?.photoCount ?? 0 }, (_, index) => ({ id: `saved-${index}`, name: `Photo ${index + 1}`, url: null })))
  const [rejectedFiles, setRejectedFiles] = useState([])
  const [errors, setErrors] = useState({})
  const clearError = (field) => setErrors((current) => ({ ...current, [field]: undefined }))

  // Free the preview URLs of new files when the screen closes.
  const photosRef = useRef(photos)
  useEffect(() => { photosRef.current = photos }, [photos])
  useEffect(() => () => photosRef.current.forEach((photo) => photo.file && URL.revokeObjectURL(photo.url)), [])

  if (editing && !post) return <Navigate to="/worker/profile" replace />

  function addFiles(files) {
    const problems = []
    const accepted = []
    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) problems.push(`${file.name}: use a JPEG, PNG or WebP image.`)
      else if (file.size > MAX_SIZE_MB * 1024 * 1024) problems.push(`${file.name}: larger than ${MAX_SIZE_MB} MB.`)
      else accepted.push({ id: crypto.randomUUID(), name: file.name, url: URL.createObjectURL(file), file })
    })
    setRejectedFiles(problems)
    setPhotos((current) => [...current, ...accepted])
  }

  function removePhoto(photoId) {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === photoId)
      if (removed?.file) URL.revokeObjectURL(removed.url)
      return current.filter((photo) => photo.id !== photoId)
    })
  }

  function submit(event) {
    event.preventDefault()
    const found = validatePost({ title, description, photos })
    setErrors(found)
    if (Object.keys(found).length) return
    // Screens only: POST or PATCH workers/me/posts is connected once backend task B2.1 lands.
    navigate('/worker/profile', { state: { notice: editing ? 'Your changes were sent to staff for review.' : 'Your post was sent to staff for review.' } })
  }

  return (
    <Page
      title={editing ? 'Edit portfolio post' : 'Add portfolio post'}
      subtitle="Show clients the work you are proud of."
      back={{ to: '/worker/profile', label: 'Back to my profile' }}
    >
      <form className="worker-form" onSubmit={submit} noValidate>
        {editing && post.status === 'rejected' && (
          <div className="rejection-banner" role="note">
            <AlertCircle size={20} aria-hidden="true" />
            <div><b>Staff rejected this post.</b><p>{post.rejectionReason}</p><p>Fix it below and resubmit. It stays hidden from clients until it is approved.</p></div>
          </div>
        )}

        <section className="card form-card">
          {editing && <div className="current-status">Current status <StatusBadge status={post.status} /></div>}

          <div className={`field ${errors.title ? 'invalid' : ''}`}>
            <label htmlFor="title">Title <span className="required">*</span></label>
            <input id="title" placeholder="Example: Bathroom pipe installation" value={title} onChange={(event) => { setTitle(event.target.value); clearError('title') }} aria-invalid={Boolean(errors.title)} />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div className={`field ${errors.description ? 'invalid' : ''}`}>
            <label htmlFor="description">Description <span className="required">*</span></label>
            <textarea id="description" rows="5" placeholder="What was the job, what did you do, how long did it take..." value={description} onChange={(event) => { setDescription(event.target.value); clearError('description') }} aria-invalid={Boolean(errors.description)} />
            {errors.description && <p className="form-error">{errors.description}</p>}
          </div>

          <PhotoUploader photos={photos} onAdd={addFiles} onRemove={removePhoto} rejected={rejectedFiles} error={errors.photos} />
        </section>

        <p className="note">
          <Info size={18} aria-hidden="true" />
          {editing
            ? 'Saving sends this post back to staff review. It is hidden from clients until it is approved again.'
            : 'Staff review every post. It appears on your public profile once approved.'}
        </p>
        <div className="form-footer">
          <Button variant="outline" to="/worker/profile">Cancel</Button>
          <Button type="submit">{editing ? 'Save & resubmit' : 'Submit for review'}</Button>
        </div>
      </form>
    </Page>
  )
}
