import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Info, LocateFixed, MapPin, Radar, ShieldCheck } from 'lucide-react'
import { Page } from '../../components/AppLayout.jsx'
import { Button } from '../../components/ui.jsx'
import { myWorkerProfile, trades } from '../../data/mock.js'
import { formatCoordinates } from './format.js'

const BIO_MAX = 500
const RADIUS_MIN = 1
const RADIUS_MAX = 100
const EMPTY_PROFILE = { bio: '', trades: [], latitude: '', longitude: '', radiusKm: 15 }

// Mirrors the WorkerProfile rules: at least one trade, a base location and a search radius (B1.1).
function validateProfile({ bio, trades: chosen, latitude, longitude, radiusKm }) {
  const errors = {}
  if (bio.length > BIO_MAX) errors.bio = `Keep your bio under ${BIO_MAX} characters.`
  if (!chosen.length) errors.trades = 'Choose at least one trade.'
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (latitude === '' || longitude === '') errors.location = 'Set your base location.'
  else if (!(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180)) errors.location = 'Latitude must be between -90 and 90, longitude between -180 and 180.'
  if (!(radiusKm >= RADIUS_MIN && radiusKm <= RADIUS_MAX)) errors.radiusKm = `Choose a radius between ${RADIUS_MIN} and ${RADIUS_MAX} km.`
  return errors
}

export default function ProfileForm({ mode }) {
  const navigate = useNavigate()
  const editing = mode === 'edit'
  const [values, setValues] = useState(() => ({ ...EMPTY_PROFILE, ...(editing ? myWorkerProfile : {}) }))
  const [errors, setErrors] = useState({})
  const [locating, setLocating] = useState(false)
  const [locationNote, setLocationNote] = useState('')

  // Changing a field clears its error; latitude and longitude share the location error.
  const set = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [['latitude', 'longitude'].includes(field) ? 'location' : field]: undefined }))
  }
  const toggleTrade = (trade) => set('trades', values.trades.includes(trade) ? values.trades.filter((item) => item !== trade) : [...values.trades, trade])

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationNote('Location is not available on this device. Enter it manually below.')
      return
    }
    setLocating(true)
    setLocationNote('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValues((current) => ({ ...current, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) }))
        setErrors((current) => ({ ...current, location: undefined }))
        setLocating(false)
      },
      () => {
        setLocationNote('We could not get your location. Allow location access or enter it manually below.')
        setLocating(false)
      },
      { timeout: 10000 },
    )
  }

  function submit(event) {
    event.preventDefault()
    const found = validateProfile(values)
    setErrors(found)
    if (Object.keys(found).length) return
    // Screens only: POST or PATCH workers/me/profile is connected once backend task B1.1 lands.
    navigate('/worker/profile', { state: { notice: editing ? 'Your profile was updated.' : 'Your profile was created.' } })
  }

  const hasLocation = values.latitude !== '' && values.longitude !== ''
  const circle = 70 + Math.min(values.radiusKm, RADIUS_MAX) * 2.2

  return (
    <Page
      title={editing ? 'Edit profile' : 'Create your profile'}
      subtitle={editing ? 'Keep your trades, location and radius up to date.' : 'You create your worker profile once, then edit it anytime.'}
      back={{ to: '/worker/profile', label: 'Back to my profile' }}
    >
      <form className="worker-form" onSubmit={submit} noValidate>
        <div className="form-layout">
          <section className="card form-card" aria-labelledby="about-title">
            <h2 id="about-title"><Briefcase size={19} aria-hidden="true" />About you</h2>

            <fieldset className="trade-picker">
              <legend>Your trades <span className="required">*</span></legend>
              <p className="field-hint">You will see requests and appear in searches for these trades.</p>
              <div>
                {trades.map((trade) => (
                  <label key={trade} className={values.trades.includes(trade) ? 'selected' : ''}>
                    <input type="checkbox" checked={values.trades.includes(trade)} onChange={() => toggleTrade(trade)} />
                    {trade}
                  </label>
                ))}
              </div>
              {errors.trades && <p className="form-error" role="alert">{errors.trades}</p>}
            </fieldset>

            <div className={`field ${errors.bio ? 'invalid' : ''}`}>
              <label htmlFor="bio">Bio</label>
              <textarea id="bio" rows="6" maxLength={BIO_MAX + 50} placeholder="Your experience, the jobs you do best, your working hours..." value={values.bio} onChange={(event) => set('bio', event.target.value)} aria-describedby="bio-count" aria-invalid={Boolean(errors.bio)} />
              <span className="field-hint counter" id="bio-count">{values.bio.length} / {BIO_MAX}</span>
              {errors.bio && <p className="form-error">{errors.bio}</p>}
            </div>
          </section>

          <section className="card form-card" aria-labelledby="area-title">
            <h2 id="area-title"><MapPin size={19} aria-hidden="true" />Work area</h2>

            <div className="consent-note">
              <ShieldCheck size={20} aria-hidden="true" />
              <p>Your base location is used to match you with nearby requests. Clients never see your exact location.</p>
            </div>
            <Button variant="soft" onClick={detectLocation} disabled={locating}>
              <LocateFixed size={18} aria-hidden="true" />{locating ? 'Detecting…' : 'Use my current location'}
            </Button>
            {locationNote && <p className="form-error" role="alert">{locationNote}</p>}

            <div className="coords">
              <div className="field">
                <label htmlFor="latitude">Latitude</label>
                <input id="latitude" inputMode="decimal" placeholder="36.7213" value={values.latitude} onChange={(event) => set('latitude', event.target.value)} aria-invalid={Boolean(errors.location)} />
              </div>
              <div className="field">
                <label htmlFor="longitude">Longitude</label>
                <input id="longitude" inputMode="decimal" placeholder="3.1876" value={values.longitude} onChange={(event) => set('longitude', event.target.value)} aria-invalid={Boolean(errors.location)} />
              </div>
            </div>
            {errors.location && <p className="form-error" role="alert">{errors.location}</p>}

            <div className="map radius-map" role="img" aria-label={`Search area of ${values.radiusKm} km around your base`}>
              <span className="map-radius" style={{ width: circle, height: circle }} />
              <MapPin className="map-pin" size={32} fill="currentColor" stroke="white" aria-hidden="true" />
              <span className="map-label">{hasLocation ? formatCoordinates(values.latitude, values.longitude) : 'No location yet'}</span>
            </div>

            <div className="radius-control">
              <label htmlFor="radius"><Radar size={16} aria-hidden="true" />Search radius <b>{values.radiusKm} km</b></label>
              <input id="radius" type="range" min={RADIUS_MIN} max={RADIUS_MAX} value={values.radiusKm} onChange={(event) => set('radiusKm', Number(event.target.value))} />
              <div className="range-scale" aria-hidden="true"><span>{RADIUS_MIN} km</span><span>{RADIUS_MAX} km</span></div>
              {errors.radiusKm && <p className="form-error">{errors.radiusKm}</p>}
            </div>
          </section>
        </div>

        <p className="note"><Info size={18} aria-hidden="true" />Your score and reviews are added automatically after clients rate your jobs.</p>
        <div className="form-footer">
          <Button variant="outline" to="/worker/profile">Cancel</Button>
          <Button type="submit">{editing ? 'Save changes' : 'Create profile'}</Button>
        </div>
      </form>
    </Page>
  )
}
