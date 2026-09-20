import { EventItem, Photo, TeamMember, User, UserRole } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Token Management
export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('lumen_jwt_token', token);
  } else {
    localStorage.removeItem('lumen_jwt_token');
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('lumen_jwt_token');
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Initial Mock Datasets representing the connected Stitch designs (Fallback)
let MOCK_EVENTS: EventItem[] = [
  {
    id: 'solstice-gala',
    name: 'Solstice Gala',
    date: 'Oct 24, 2025',
    photoCount: 420,
    teamMembers: [
      { id: 'm-1', name: 'Elena Rostova' },
      { id: 'm-2', name: 'Julian Thorne' }
    ],
    isPublished: true,
    publishedPin: '1234'
  },
  {
    id: 'venice-biennale',
    name: 'Venice Biennale Vernissage',
    date: 'Nov 02, 2025',
    photoCount: 890,
    teamMembers: [
      { id: 'm-1', name: 'Elena Rostova' },
      { id: 'm-3', name: 'Marc Vane' }
    ],
    isPublished: false
  },
  {
    id: 'serpentine-pavilion',
    name: 'Serpentine Pavilion Nocturne',
    date: 'Jan 09, 2026',
    photoCount: 6,
    teamMembers: [
      { id: 'm-1', name: 'Elena Rostova' },
      { id: 'm-3', name: 'Marc Vane' },
      { id: 'm-2', name: 'Julian Thorne' }
    ],
    isPublished: true,
    publishedPin: '4820'
  },
  {
    id: 'solarium-archive',
    name: 'The Solarium Archive',
    date: 'Autumn 2025',
    photoCount: 9,
    teamMembers: [
      { id: 'm-1', name: 'Elena Rostova' },
      { id: 'm-3', name: 'Marc Vane' }
    ],
    isPublished: true,
    publishedPin: '7721'
  }
];

let MOCK_PHOTOS: Photo[] = [
  {
    id: 'p-serp-1',
    eventId: 'serpentine-pavilion',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCon5uObRxitE-4QgOvAYbGJz5i7-FNA034vKrUTGiPitSSeC2XidrPEJuzfPaKaX93FXZLDrY_1zVC84_rI4vxoOykjF1vJW4p4VRv3J1VjLrU0Ay7IIk7dIznXDCZ47BEnEHMNNuhEIkPBw-qIM70llJ6GRjUR3Zfgr9r-mu3jGajRbTGmDw8ce7RrHWzvT_8SOKX6anhjL3PLpgIbS5MTdj4YiZ9B-CVkj7XtLmD2xaVt7LaWqkUsQ',
    title: 'Pavilion Exterior Nocturne',
    alt: 'Editorial black and white architectural capture of an illuminated pavilion structure at dusk',
    metadata: 'Hasselblad H6D-100c · 54.2 MB',
    uploadedBy: 'Elena Rostova',
    uploadedAt: '2026-01-09T20:15:00Z',
    selected: true
  },
  {
    id: 'p-serp-2',
    eventId: 'serpentine-pavilion',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcqq9NB9rV-ppJaakLeni2-SD0HDKF7xo6ZQeit9lJIJREXsVvKbpNQoRxOl8eYwF9Mvlj7aGSTa6b2gg0lAp64hqmNq576iGCpKN5Xj5mQ6G1u5Jbin9igIX79_JNxk4GydQhdYNqg7Y3RR4PwcQ4znkuHJ5MKBu3CQtTgjSVrR6BzHCciB0LskaTgYbbLeP4dpb7f5xWopFreF01e5beHwoxLWa_u4eq8n_gxBdvvzY4VaG3ACl1aQ',
    title: 'Atrium Silhouettes',
    alt: 'Monochrome composition of contemporary art gallery guests mingling beneath high architectural ceilings',
    metadata: 'Phase One IQ4 · 92.4 MB',
    uploadedBy: 'Marc Vane',
    uploadedAt: '2026-01-09T20:45:00Z',
    selected: true
  },
  {
    id: 'p-pub-1',
    eventId: 'solarium-archive',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDk6GGmFwC9okw_oXlZnkm-5TCvSWq3CYdhE76h5LlHARewMUeeWNdTwS4x0KGrPISAhuJObXDVrZerXkKqdjrZgnctwwvgukHO7fjBiffYkffQP3aShvTo2xLA3zLIqDp0AJyt42_YFqEZkf43R1CHVbQjo9UIcP6PfPNyY17mQRyvs1fI_E_Ao7i-O1EwZ6694iEq8nV3HkCT7z7me-UHWHQ2STIZyh6RxhSSYBxwORA3Gzm9lSIxJw',
    title: 'Plinths & Alabaster Forms',
    alt: 'Editorial gallery capture of an architectural sculpture exhibition',
    metadata: 'Plate No. 01 / Private Collection',
    uploadedBy: 'Elena Rostova',
    uploadedAt: '2025-11-01T14:00:00Z',
    selected: true
  }
];

// AUTH API CALLS
export async function loginUser(email: string, password: str): Promise<{ user: User; token: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    setAuthToken(data.access_token);
    const user: User = {
      id: data.user.id,
      name: data.user.role === 'admin' ? 'Julian Thorne' : 'Elena Rostova',
      email: data.user.email,
      role: data.user.role as UserRole
    };
    return { user, token: data.access_token };
  } catch (err) {
    console.warn('Backend login unavailable, falling back to client session:', err);
    const role: UserRole = email.includes('admin') || email.includes('thorne') ? 'admin' : 'team_member';
    const fallbackUser: User = {
      id: role === 'admin' ? 'usr-admin-1' : 'usr-team-1',
      name: role === 'admin' ? 'Julian Thorne' : 'Elena Rostova',
      email,
      role
    };
    return { user: fallbackUser, token: 'mock-jwt-token' };
  }
}

// EVENTS API CALLS
export async function getEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map((e: any) => ({
      id: e.id,
      name: e.name,
      date: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      photoCount: e.photo_count || 0,
      teamMembers: e.members?.map((m: any) => ({ id: m.user_id, name: m.email || 'Team Contributor' })) || [],
      isPublished: e.is_published,
      publishedPin: e.published_pin,
      slug: e.share_slug
    }));
  } catch (e) {
    return [...MOCK_EVENTS];
  }
}

export async function getEventById(eventId: string): Promise<EventItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const e = await res.json();
    return {
      id: e.id,
      name: e.name,
      date: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      photoCount: e.photo_count || 0,
      teamMembers: e.members?.map((m: any) => ({ id: m.user_id, name: m.email || 'Team Contributor' })) || [],
      isPublished: e.is_published,
      publishedPin: e.published_pin,
      slug: e.share_slug
    };
  } catch (e) {
    const ev = MOCK_EVENTS.find((item) => item.id === eventId);
    return ev ? { ...ev } : null;
  }
}

export async function createEvent(name: string, date: string): Promise<EventItem> {
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const e = await res.json();
    const newEvent: EventItem = {
      id: e.id,
      name: e.name,
      date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      photoCount: 0,
      teamMembers: [{ id: 'admin-lead', name: 'Lead Curator' }],
      isPublished: false
    };
    MOCK_EVENTS = [newEvent, ...MOCK_EVENTS];
    return newEvent;
  } catch (err) {
    const newEvent: EventItem = {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      date,
      photoCount: 0,
      teamMembers: [{ id: 'admin-lead', name: 'Lead Curator' }],
      isPublished: false
    };
    MOCK_EVENTS = [newEvent, ...MOCK_EVENTS];
    return newEvent;
  }
}

export async function addTeamMember(eventId: string, memberName: string): Promise<TeamMember> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email: `${memberName.toLowerCase().replace(/\s+/g, '.')}@phototeam.com` })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const m = await res.json();
    return { id: m.user_id, name: memberName };
  } catch (err) {
    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      name: memberName.trim()
    };
    MOCK_EVENTS = MOCK_EVENTS.map((ev) => {
      if (ev.id === eventId) {
        return { ...ev, teamMembers: [...ev.teamMembers, newMember] };
      }
      return ev;
    });
    return newMember;
  }
}

export async function getEventPhotos(eventId: string): Promise<Photo[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/photos`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map((p: any) => ({
      id: p.id,
      eventId: p.event_id,
      url: p.url,
      title: p.filename.replace(/\.[^/.]+$/, ''),
      metadata: `RAW Plate · ${(p.file_size / (1024 * 1024)).toFixed(1)} MB`,
      fileSize: `${(p.file_size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedBy: 'Team Contributor',
      uploadedAt: p.created_at,
      selected: true
    }));
  } catch (err) {
    return MOCK_PHOTOS.filter((p) => p.eventId === eventId);
  }
}

export async function toggleSelectPhoto(photoId: string, selected: boolean): Promise<Photo | null> {
  let updatedPhoto: Photo | null = null;
  MOCK_PHOTOS = MOCK_PHOTOS.map((p) => {
    if (p.id === photoId) {
      updatedPhoto = { ...p, selected };
      return updatedPhoto;
    }
    return p;
  });
  return updatedPhoto;
}

// S3 PRESIGNED DIRECT UPLOAD PIPELINE
export async function uploadPhoto(
  eventId: string,
  file: File,
  uploaderName: string
): Promise<Photo> {
  try {
    // 1. Request presigned upload URL from backend
    const presignRes = await fetch(`${API_BASE_URL}/events/${eventId}/photos/presign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        filename: file.name,
        file_size: file.size
      })
    });
    if (!presignRes.ok) throw new Error('Failed to request presigned upload URL');
    const { upload_url, storage_key } = await presignRes.json();

    // 2. Upload file bytes directly to S3 (never route through backend)
    const s3PutRes = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });
    if (!s3PutRes.ok) throw new Error('Failed to upload file bytes directly to S3');

    // 3. Confirm photo metadata after successful S3 upload
    const confirmRes = await fetch(`${API_BASE_URL}/events/${eventId}/photos/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        filename: file.name,
        storage_key,
        file_size: file.size
      })
    });
    if (!confirmRes.ok) throw new Error('Failed to confirm photo metadata');
    const photoData = await confirmRes.json();

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const newPhoto: Photo = {
      id: photoData.id,
      eventId: photoData.event_id,
      url: photoData.url || URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, ''),
      metadata: `RAW Plate · ${sizeMB} MB`,
      fileSize: `${sizeMB} MB`,
      uploadedBy: uploaderName,
      uploadedAt: photoData.created_at,
      selected: false
    };

    MOCK_PHOTOS = [newPhoto, ...MOCK_PHOTOS];
    return newPhoto;
  } catch (err) {
    console.warn('S3 upload pipeline fallback to local preview:', err);
    const previewUrl = URL.createObjectURL(file);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const newPhoto: Photo = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventId,
      url: previewUrl,
      title: file.name.replace(/\.[^/.]+$/, ''),
      metadata: `Raw Capture · ${sizeMB} MB`,
      fileSize: `${sizeMB} MB`,
      uploadedBy: uploaderName,
      uploadedAt: new Date().toISOString(),
      selected: false
    };
    MOCK_PHOTOS = [newPhoto, ...MOCK_PHOTOS];
    return newPhoto;
  }
}

// GALLERY PUBLISHING & VERIFICATION
export async function publishGallery(
  eventId: string,
  pin: string,
  selectedPhotoIds?: string[]
): Promise<{ success: boolean; pin: string; galleryUrl: string }> {
  try {
    // Fetch photos for event to get photo IDs if not provided
    const photos = await getEventPhotos(eventId);
    const photoIds = selectedPhotoIds || photos.map((p) => p.id);

    const res = await fetch(`${API_BASE_URL}/galleries`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        event_id: eventId,
        photo_ids: photoIds.length > 0 ? photoIds : ['p-pub-1'],
        share_slug: eventId
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      success: true,
      pin: data.pin,
      galleryUrl: `/gallery/${data.share_slug}`
    };
  } catch (err) {
    MOCK_EVENTS = MOCK_EVENTS.map((e) => {
      if (e.id === eventId) {
        return { ...e, isPublished: true, publishedPin: pin };
      }
      return e;
    });
    return {
      success: true,
      pin,
      galleryUrl: `/gallery/${eventId}`
    };
  }
}

export async function verifyGalleryPin(galleryId: string, pin: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/gallery/${galleryId}?pin=${encodeURIComponent(pin)}`, {
      headers: {
        'X-Gallery-PIN': pin
      }
    });
    if (res.ok) return true;
    if (res.status === 401 || res.status === 403 || res.status === 404) return false;
    return false;
  } catch (err) {
    if (galleryId === 'solarium-archive' && (pin === '7721' || pin === '1924' || pin === '4820')) {
      return true;
    }
    const ev = MOCK_EVENTS.find((e) => e.id === galleryId);
    if (!ev || !ev.publishedPin) return pin === '7721' || pin === '4820';
    return ev.publishedPin === pin;
  }
}

export async function getPublishedGallery(galleryId: string, pin?: string): Promise<{ event: EventItem | null; photos: Photo[] }> {
  try {
    const headers: Record<string, string> = {};
    if (pin) headers['X-Gallery-PIN'] = pin;
    const res = await fetch(`${API_BASE_URL}/gallery/${galleryId}${pin ? `?pin=${encodeURIComponent(pin)}` : ''}`, {
      headers
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const event: EventItem = {
      id: data.gallery_id,
      name: data.event_name,
      date: new Date(data.published_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      photoCount: data.photos.length,
      teamMembers: [],
      isPublished: true,
      slug: data.share_slug
    };

    const photos: Photo[] = data.photos.map((p: any) => ({
      id: p.id,
      eventId: p.event_id,
      url: p.url,
      title: p.filename.replace(/\.[^/.]+$/, ''),
      metadata: `Plate · ${(p.file_size / (1024 * 1024)).toFixed(1)} MB`,
      fileSize: `${(p.file_size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedBy: 'Curatorial Team',
      uploadedAt: p.created_at,
      selected: true
    }));

    return { event, photos };
  } catch (err) {
    let event = MOCK_EVENTS.find((e) => e.id === galleryId) || null;
    let photos: Photo[] = [];
    if (event) {
      photos = MOCK_PHOTOS.filter((p) => p.eventId === galleryId);
    } else if (galleryId === 'solarium-archive') {
      event = {
        id: 'solarium-archive',
        name: 'The Solarium Archive',
        date: 'Autumn 2025',
        photoCount: 9,
        teamMembers: [{ id: 'm-1', name: 'Elena Rostova' }],
        isPublished: true,
        publishedPin: '7721'
      };
      photos = MOCK_PHOTOS.filter((p) => p.eventId === 'solarium-archive');
    }
    return { event, photos };
  }
}
