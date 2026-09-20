import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import { Photo, EventItem } from '../types';
import { PhotoGrid } from '../components/PhotoGrid';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Share2,
  CheckCircle2,
  Lock,
  Copy,
  ExternalLink,
  Check,
  X
} from 'lucide-react';

export const EventDetailAdminScreen: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { showNotification } = useApp();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Add Member State
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  // Publish Dialog State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [galleryPin, setGalleryPin] = useState('4820');
  const [isPublishing, setIsPublishing] = useState(false);

  // Load Event and Photos
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!eventId) return;
      setIsLoading(true);
      try {
        const ev = await api.getEventById(eventId);
        const pts = await api.getEventPhotos(eventId);
        if (isMounted) {
          setEvent(ev);
          setPhotos(pts);
          // Initialize selected IDs
          const initialSelected = new Set(pts.filter((p) => p.selected).map((p) => p.id));
          setSelectedIds(initialSelected);
          if (ev?.publishedPin) {
            setGalleryPin(ev.publishedPin);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const handleToggleSelect = (photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const willSelect = !next.has(photoId);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      api.toggleSelectPhoto(photoId, willSelect).catch(console.error);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set(photos.map((p) => p.id));
    setSelectedIds(allIds);
    photos.forEach((p) => api.toggleSelectPhoto(p.id, true).catch(console.error));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
    photos.forEach((p) => api.toggleSelectPhoto(p.id, false).catch(console.error));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !eventId) return;
    try {
      const member = await api.addTeamMember(eventId, newMemberName);
      if (event) {
        setEvent({
          ...event,
          teamMembers: [...event.teamMembers, member]
        });
      }
      setNewMemberName('');
      setIsAddingMember(false);
      showNotification(`Added team member "${member.name}"`);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublishGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setIsPublishing(true);
    try {
      const result = await api.publishGallery(eventId, galleryPin.trim() || '1234');
      if (event) {
        setEvent({
          ...event,
          isPublished: true,
          publishedPin: result.pin
        });
      }
      setIsPublishModalOpen(false);
      showNotification(`Gallery published! Access PIN: ${result.pin}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  const copyClientLink = () => {
    const origin = window.location.origin;
    const link = `${origin}/access/${eventId}`;
    navigator.clipboard.writeText(link);
    showNotification(`Client link copied to clipboard (${link})`);
  };

  if (!event && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-6 text-center">
        <h2 className="font-headline text-3xl mb-4">Exhibition Not Found</h2>
        <p className="font-body text-sm text-[#5d5e66] mb-6">The requested event record does not exist.</p>
        <Link to="/admin" className="px-6 py-2.5 bg-black text-white text-xs font-body uppercase tracking-wider">
          Return to Admin Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] py-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb & Navigation Back */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-xs font-body uppercase tracking-widest text-[#5d5e66] hover:text-[#1a1c1c] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Curatorial Index</span>
          </Link>

          {event?.isPublished && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-body text-[#5d5e66]">
                PIN: <strong className="text-black font-semibold tracking-widest">{event.publishedPin}</strong>
              </span>
              <button
                type="button"
                onClick={copyClientLink}
                className="px-3 py-1.5 border border-[#dadada] hover:border-black text-[11px] font-body uppercase tracking-wider text-[#1a1c1c] flex items-center gap-1.5 bg-white shadow-xs"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Client Link</span>
              </button>
              <Link
                to={`/gallery/${eventId}`}
                className="px-3 py-1.5 bg-[#1a1c1c] text-white text-[11px] font-body uppercase tracking-wider flex items-center gap-1.5 hover:bg-black shadow-xs"
              >
                <span>View Public Gallery</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Event Header Block */}
        <div className="pb-8 border-b border-[#eeeeee]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-body text-[10px] uppercase tracking-[0.25em] text-[#77767b]">
                  {event?.date || 'Autumn 2025'}
                </span>
                {event?.isPublished ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[9px] font-body uppercase tracking-widest">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Live Published</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-[#eeeeee] text-[#5d5e66] text-[9px] font-body uppercase tracking-widest">
                    Curatorial Review
                  </span>
                )}
              </div>
              <h1 className="font-headline text-3xl md:text-5xl text-[#1a1c1c] font-normal">
                {event?.name || 'Event Detail'}
              </h1>
            </div>

            {/* Ingestion link for team */}
            <div className="flex items-center gap-3">
              <Link
                to={`/team/events/${eventId}/upload`}
                className="px-4 py-2 border border-[#dadada] text-[#1a1c1c] hover:border-black text-xs font-body uppercase tracking-wider bg-white flex items-center gap-2"
              >
                <span>Team Upload View</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Section 1: Assigned Team Members */}
        <div className="py-6 border-b border-[#eeeeee]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#77767b]" />
              <h3 className="font-body text-xs uppercase tracking-[0.2em] text-[#1a1c1c] font-medium">
                Assigned Team Members ({event?.teamMembers?.length || 0})
              </h3>
            </div>

            {!isAddingMember ? (
              <button
                type="button"
                onClick={() => setIsAddingMember(true)}
                className="text-xs font-body uppercase tracking-wider text-[#5d5e66] hover:text-black flex items-center gap-1.5 self-start sm:self-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign Photographer</span>
              </button>
            ) : (
              <form onSubmit={handleAddMember} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Photographer full name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-[#dadada] focus:border-black outline-none w-52"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-black text-white text-xs font-body uppercase tracking-wider"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="p-1.5 text-[#77767b] hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {event?.teamMembers?.map((member) => (
              <div
                key={member.id}
                className="px-3.5 py-2 bg-white border border-[#dadada] flex items-center gap-2 shadow-2xs"
              >
                <div className="w-6 h-6 bg-[#eeeeee] text-[#1a1c1c] text-[10px] font-semibold flex items-center justify-center">
                  {member.name.charAt(0)}
                </div>
                <span className="font-body text-xs text-[#1a1c1c] font-medium">{member.name}</span>
                <span className="text-[10px] text-[#77767b] font-body uppercase tracking-wider">
                  Lead Contributor
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Photo Selection & Curatorial Action Bar */}
        <div className="sticky top-20 z-20 bg-white/95 backdrop-blur-xs border-y border-[#dadada] py-4 px-6 my-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="font-body text-[10px] uppercase tracking-widest text-[#77767b] block">
                Selection Status
              </span>
              <span className="font-headline italic text-lg text-[#1a1c1c]">
                {selectedIds.size} of {photos.length} selected for client portfolio
              </span>
            </div>

            <div className="h-6 w-px bg-[#dadada] hidden sm:block" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-[11px] font-body uppercase tracking-wider text-[#5d5e66] hover:text-black hover:bg-[#f3f3f3]"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1 text-[11px] font-body uppercase tracking-wider text-[#5d5e66] hover:text-black hover:bg-[#f3f3f3]"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="w-full md:w-auto px-6 py-2.5 bg-black hover:bg-[#1a1c1c] text-white text-xs font-body uppercase tracking-[0.18em] flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{event?.isPublished ? 'Update Published Gallery' : 'Publish Gallery'}</span>
            </button>
          </div>
        </div>

        {/* Section 3: Full Photo Grid (Admin View) */}
        <div className="mt-4">
          <PhotoGrid
            photos={photos}
            mode="admin-select"
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            emptyTitle="No plates uploaded to this archive"
            emptySubtitle="Assigned team members can ingest photographs using the team upload portal."
          />
        </div>
      </div>

      {/* Publish Gallery Modal */}
      {isPublishModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white border border-[#dadada] p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-body uppercase tracking-widest text-[#77767b]">
                  Client Delivery
                </span>
                <h3 className="font-headline text-2xl text-[#1a1c1c]">Publish Private Gallery</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="text-[#77767b] hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="font-body text-xs text-[#5d5e66] leading-relaxed mb-6">
              This will create a PIN-protected, client-facing showcase containing the{' '}
              <strong className="text-black font-semibold">{selectedIds.size} selected photographs</strong>.
              Clients will not see curatorial controls, camera raw metadata, or unselected plates.
            </p>

            <form onSubmit={handlePublishGallery} className="space-y-4">
              <div>
                <label className="block text-[11px] font-body uppercase tracking-wider text-[#5d5e66] mb-1.5">
                  Gallery Access PIN (4 digits)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={galleryPin}
                    onChange={(e) => setGalleryPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-[#f9f9f9] border border-[#dadada] focus:border-black focus:bg-white outline-none font-headline text-xl text-center tracking-[0.5em] text-[#1a1c1c]"
                    placeholder="4820"
                  />
                  <Lock className="w-4 h-4 text-[#77767b] absolute left-3 top-3.5" />
                </div>
                <span className="text-[10px] text-[#77767b] block mt-1">
                  Share this PIN along with the private gallery link to the client.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-body uppercase tracking-wider text-[#5d5e66] hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing || selectedIds.size === 0}
                  className="px-6 py-2.5 bg-black hover:bg-[#1a1c1c] text-white text-xs font-body uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isPublishing ? 'Publishing...' : 'Confirm & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
