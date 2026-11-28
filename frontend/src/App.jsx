import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider.jsx'
import { GuestOnly, RequireRole } from './auth/guards.jsx'
import { AppLayout } from './components/AppLayout.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import { Home } from './pages/PublicPages.jsx'
import { ApplicantProfile, BrowseWorkers, ClientHub, LocationPicker, MyRequests, PostRequest, RateReview, RequestDetail, WorkerPublicProfile } from './pages/ClientPages.jsx'
import { MyApplications, NearbyRequests, WorkerDashboard, WorkerRequestDetail } from './pages/WorkerPages.jsx'
import MyProfile from './pages/worker/MyProfile.jsx'
import PostForm from './pages/worker/PostForm.jsx'
import ProfileForm from './pages/worker/ProfileForm.jsx'
import { PendingPosts, PostReview, ReviewHistory, StaffHub } from './pages/StaffPages.jsx'

const SCREENS = {
  Public: [['/', 'Home'], ['/login', 'Login'], ['/register', 'Register']],
  Client: [['/client', 'Client Hub'], ['/client/workers', 'Browse workers'], ['/client/workers/3', 'Worker public profile'], ['/client/requests/new', 'Post a job request'], ['/client/requests/new/location', 'Location picker'], ['/client/requests', 'My job requests'], ['/client/requests/1', 'Request detail + applicants'], ['/client/requests/1/applicants/1', 'Applicant profile'], ['/client/requests/1/review', 'Rate & review worker']],
  Worker: [['/worker', 'Dashboard'], ['/worker/profile', 'My profile & portfolio'], ['/worker/profile/create', 'Create profile'], ['/worker/profile/edit', 'Edit profile'], ['/worker/profile/posts/new', 'Add portfolio post'], ['/worker/profile/posts/3/edit', 'Edit rejected post'], ['/worker/nearby', 'Nearby requests'], ['/worker/nearby/11', 'Request detail'], ['/worker/applications', 'My applications']],
  Staff: [['/staff', 'Staff Hub'], ['/staff/pending', 'Pending posts'], ['/staff/pending/1', 'Post review'], ['/staff/history', 'Review history']],
}

// Lists every screen for the team. Role screens ask for login first (demo accounts in mock mode).
function ScreenIndex() {
  return (
    <div className="browse">
      <h1>SANAA screens</h1>
      <div className="grid-2">
        {Object.entries(SCREENS).map(([group, links]) => (
          <section className="card stack" key={group}>
            <h3>{group}</h3>
            {links.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
          </section>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/screens" element={<ScreenIndex />} />

          <Route element={<GuestOnly />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<RequireRole role="client" />}>
            <Route path="/client/workers" element={<BrowseWorkers />} />
            <Route path="/client/requests/new/location" element={<LocationPicker />} />
            <Route path="/client/requests/:id/review" element={<RateReview />} />
            <Route path="/client" element={<AppLayout role="client" />}>
              <Route index element={<ClientHub />} />
              <Route path="workers/:id" element={<WorkerPublicProfile />} />
              <Route path="requests" element={<MyRequests />} />
              <Route path="requests/new" element={<PostRequest />} />
              <Route path="requests/:id" element={<RequestDetail />} />
              <Route path="requests/:id/applicants/:applicantId" element={<ApplicantProfile />} />
            </Route>
          </Route>

          <Route element={<RequireRole role="worker" />}>
            <Route path="/worker" element={<AppLayout role="worker" />}>
              <Route index element={<WorkerDashboard />} />
              <Route path="profile" element={<MyProfile />} />
              <Route path="profile/create" element={<ProfileForm mode="create" />} />
              <Route path="profile/edit" element={<ProfileForm mode="edit" />} />
              <Route path="profile/posts/new" element={<PostForm mode="new" />} />
              <Route path="profile/posts/:id/edit" element={<PostForm mode="edit" />} />
              <Route path="nearby" element={<NearbyRequests />} />
              <Route path="nearby/:id" element={<WorkerRequestDetail />} />
              <Route path="applications" element={<MyApplications />} />
            </Route>
          </Route>

          <Route element={<RequireRole role="staff" />}>
            <Route path="/staff" element={<AppLayout role="staff" />}>
              <Route index element={<StaffHub />} />
              <Route path="pending" element={<PendingPosts />} />
              <Route path="pending/:id" element={<PostReview />} />
              <Route path="history" element={<ReviewHistory />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
