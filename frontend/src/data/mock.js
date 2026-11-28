// Placeholder data shaped after the API in the architecture document.
export const trades = ['Plumber', 'Carpenter', 'Electrician', 'Painter', 'Mason']

export const workers = [
  { id: 1, name: 'Ahmed Belkacem', initials: 'AB', trade: 'Plumber', distance: '2.4 km away', area: 'Bab Ezzouar', score: 4.7, reviews: 18, phone: '0550 12 34 56' },
  { id: 2, name: 'Samir Djemai', initials: 'SD', trade: 'Carpenter', distance: '5.1 km away', area: 'Hydra', score: 4.5, reviews: 11, phone: '0661 23 45 67' },
  { id: 3, name: 'Yacine Boulahya', initials: 'YB', trade: 'Electrician', distance: '3.8 km away', area: 'Algiers', score: 4.8, reviews: 24, phone: '0770 34 56 78' },
]

export const portfolio = [
  { id: 1, title: 'Electrical Installation', description: 'Full panel and wiring for a new apartment.', status: 'approved' },
  { id: 2, title: 'Lighting Setup', description: 'Ceiling and accent lighting for a living room.', status: 'pending' },
  { id: 3, title: 'Socket Installation', description: 'New sockets across a family home.', status: 'rejected', reason: 'Photos are too dark. Please add clearer photos.' },
]

// The logged-in worker's own data, shaped after GET workers/me/profile and GET workers/me/posts (D2.1).
// Exact coordinates are shown only to the worker; clients never see them.
export const myWorkerProfile = {
  bio: 'Plumber with 8 years of experience in homes and small businesses. Leaks, installations and bathroom renovations.',
  trades: ['Plumber'],
  latitude: 36.7213,
  longitude: 3.1876,
  radiusKm: 15,
  score: 4.7,
  reviewCount: 18,
}

export const myPosts = [
  { id: 1, title: 'Bathroom pipe installation', description: 'New supply and drain pipes for a full bathroom renovation.', status: 'approved', photoCount: 4, rejectionReason: '' },
  { id: 2, title: 'Kitchen sink replacement', description: 'Removed an old sink and fitted a new one with a mixer tap.', status: 'pending', photoCount: 3, rejectionReason: '' },
  { id: 3, title: 'Water heater repair', description: 'Replaced the valve and fixed a leak on a wall-mounted heater.', status: 'rejected', photoCount: 3, rejectionReason: 'Photos are too dark. Please add clearer photos of the finished work.' },
  { id: 4, title: 'Shower mixer installation', description: 'Fitted a thermostatic shower mixer and sealed the wall.', status: 'approved', photoCount: 5, rejectionReason: '' },
]

export const reviews = [
  { id: 1, name: 'Yasmine B.', initials: 'YB', rating: 5, comment: 'Great work ! Very professional and on time.' },
  { id: 2, name: 'Karim M.', initials: 'KM', rating: 5, comment: 'Highly recommended. Quality service .' },
]

export const requests = [
  { id: 1, trade: 'Plumber', status: 'open', applicants: 3, description: 'Kitchen sink leak under the cabinet, needs repair this week.', area: 'Bab Ezzouar, Algiers', date: 'Nov 20, 2026' },
  { id: 2, trade: 'Electrician', status: 'worker_confirmed', applicants: 2, description: 'Replace the lighting in the living room and hallway.', area: 'Hydra, Algiers', date: 'Nov 18, 2026' },
  { id: 3, trade: 'Painter', status: 'completed', applicants: 4, description: 'Repaint a two-room apartment before moving in.', area: 'Kouba, Algiers', date: 'Nov 10, 2026' },
]

export const nearbyRequests = [
  { id: 11, title: 'Kitchen sink leak', trade: 'Plumber', status: 'open', description: 'Water leaks under the cabinet when the tap is on.', area: 'Bab Ezzouar', distance: '2.4 km', date: '2 hours ago' },
  { id: 12, title: 'Replace shower mixer', trade: 'Plumber', status: 'open', description: 'The current mixer is broken and needs replacing.', area: 'El Harrach', distance: '4.2 km', date: 'Yesterday' },
  { id: 13, title: 'Bathroom pipe leak', trade: 'Plumber', status: 'open', description: 'Small leak behind the bathroom wall.', area: 'Kouba', distance: '6.8 km', date: '2 days ago' },
]

export const applications = [
  { id: 1, title: 'Kitchen sink leak', trade: 'Plumber', requestStatus: 'open', status: 'applied', area: 'Bab Ezzouar', date: 'Applied Nov 21' },
  { id: 2, title: 'Water heater repair', trade: 'Plumber', requestStatus: 'worker_confirmed', status: 'confirmed', area: 'Hydra', date: 'Applied Nov 19', note: 'The client confirmed you for this job.' },
  { id: 3, title: 'Bathroom pipe leak', trade: 'Plumber', requestStatus: 'worker_confirmed', status: 'not_selected', area: 'Kouba', date: 'Applied Nov 15' },
  { id: 4, title: 'Replace shower mixer', trade: 'Plumber', requestStatus: 'open', status: 'applied', area: 'El Harrach', date: 'Applied Nov 14' },
]

export const moderationPosts = [
  { id: 1, worker: 'Ahmed Belkacem', initials: 'AB', post: 'Bathroom pipe installation', trade: 'Plumber', status: 'pending', photos: 4, date: 'Nov 22', reason: '' },
  { id: 2, worker: 'Yacine Boulahya', initials: 'YB', post: 'Lighting setup', trade: 'Electrician', status: 'pending', photos: 3, date: 'Nov 22', reason: '' },
  { id: 3, worker: 'Samir Djemai', initials: 'SD', post: 'Wooden kitchen cabinets', trade: 'Carpenter', status: 'approved', photos: 5, date: 'Nov 21', reason: '' },
  { id: 4, worker: 'Nadia Rahmani', initials: 'NR', post: 'Living room painting', trade: 'Painter', status: 'rejected', photos: 3, date: 'Nov 20', reason: 'Blurry photos' },
  { id: 5, worker: 'Karim Mansouri', initials: 'KM', post: 'Stone wall repair', trade: 'Mason', status: 'approved', photos: 4, date: 'Nov 19', reason: '' },
]
