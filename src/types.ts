export type UserRole = 'admin' | 'team_member' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Photo {
  id: string;
  eventId: string;
  url: string;
  title: string;
  metadata?: string; // e.g. "Hasselblad H6D-100c · 54.2 MB"
  camera?: string;
  fileSize?: string;
  uploadedBy?: string; // Team member name
  uploadedAt: string;
  selected?: boolean; // Admin selection for published gallery
  alt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
}

export interface EventItem {
  id: string;
  name: string;
  date: string;
  photoCount: number;
  teamMembers: TeamMember[];
  isPublished?: boolean;
  publishedPin?: string;
  slug?: string;
  scheduleLabel?: string;
}
