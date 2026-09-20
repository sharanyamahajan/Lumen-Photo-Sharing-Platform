import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import { Plus, Calendar, Image as ImageIcon, Users, ArrowUpRight, X, Lock } from 'lucide-react';

export const AdminDashboardScreen: React.FC = () => {
  const { events, refreshEvents, showNotification } = useApp();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;

    setIsCreating(true);
    try {
      const created = await api.createEvent(
        newEventName.trim(),
        newEventDate.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      );
      await refreshEvents();
      setIsModalOpen(false);
      setNewEventName('');
      setNewEventDate('');
      showNotification(`Event "${created.name}" created successfully.`);
      navigate(`/admin/events/${created.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#eeeeee] gap-6">
          <div>
            <span className="font-body text-[11px] uppercase tracking-[0.25em] text-[#77767b] block mb-1">
              Curatorial Index
            </span>
            <h1 className="font-headline text-3xl md:text-5xl text-[#1a1c1c] tracking-tight font-normal">
              Exhibitions & Events
            </h1>
            <p className="font-body text-xs text-[#5d5e66] mt-2 max-w-xl leading-relaxed">
              Central catalog of photographic records, team assignments, curatorial reviews, and published client portfolios.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="self-start md:self-auto px-6 py-3 bg-black hover:bg-[#1a1c1c] text-white text-xs font-body uppercase tracking-[0.18em] flex items-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>

        {/* Events Table / Editorial Grid */}
        <div className="mt-8 bg-white border border-[#eeeeee]">
          <div className="hidden md:grid grid-cols-12 px-6 py-3.5 bg-[#f3f3f3] text-[10px] font-body uppercase tracking-wider text-[#5d5e66] border-b border-[#eeeeee]">
            <span className="col-span-5">Exhibition / Event</span>
            <span className="col-span-2">Date</span>
            <span className="col-span-2">Photographs</span>
            <span className="col-span-2">Team</span>
            <span className="col-span-1 text-right">Access</span>
          </div>

          <div className="divide-y divide-[#eeeeee]">
            {events.map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-1 md:grid-cols-12 px-6 py-5 hover:bg-[#fafafa] transition-colors items-center gap-3 md:gap-0"
              >
                {/* Event Name & Status */}
                <div className="md:col-span-5 pr-4">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/admin/events/${event.id}`}
                      className="font-headline text-lg md:text-xl text-[#1a1c1c] hover:underline flex items-center gap-1.5"
                    >
                      <span>{event.name}</span>
                    </Link>
                    {event.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1a1c1c] text-white text-[9px] font-body uppercase tracking-widest">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Published</span>
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-[#f3f3f3] text-[#5d5e66] text-[9px] font-body uppercase tracking-widest">
                        Draft
                      </span>
                    )}
                  </div>
                  {event.publishedPin && (
                    <span className="font-body text-[11px] text-[#77767b] mt-0.5 block">
                      Client PIN: <strong className="text-black font-medium">{event.publishedPin}</strong>
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="md:col-span-2 flex items-center gap-1.5 text-xs font-body text-[#5d5e66]">
                  <Calendar className="w-3.5 h-3.5 text-[#77767b] md:hidden" />
                  <span>{event.date}</span>
                </div>

                {/* Photo Count */}
                <div className="md:col-span-2 flex items-center gap-1.5 text-xs font-body text-[#1a1c1c]">
                  <ImageIcon className="w-3.5 h-3.5 text-[#77767b]" />
                  <span>{event.photoCount} plates</span>
                </div>

                {/* Team Members */}
                <div className="md:col-span-2 flex items-center gap-1.5 text-xs font-body text-[#5d5e66]">
                  <Users className="w-3.5 h-3.5 text-[#77767b]" />
                  <span className="truncate">
                    {event.teamMembers?.map((m) => m.name.split(' ')[0]).join(', ') || 'Unassigned'}
                  </span>
                </div>

                {/* Action Link */}
                <div className="md:col-span-1 flex md:justify-end">
                  <Link
                    to={`/admin/events/${event.id}`}
                    className="inline-flex items-center gap-1 text-xs font-body font-medium text-[#1a1c1c] hover:underline"
                  >
                    <span>Manage</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick highlight banner to guide tester */}
        <div className="mt-8 p-6 bg-[#ffffff] border border-[#dadada] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-body text-[10px] uppercase tracking-widest text-[#77767b] block">
              Reference Event
            </span>
            <h3 className="font-headline text-lg text-[#1a1c1c]">
              Serpentine Pavilion Nocturne
            </h3>
            <p className="font-body text-xs text-[#5d5e66]">
              Configured with full multi-select grid and Elena Rostova, Marc Vane, Julian Thorne team records.
            </p>
          </div>
          <Link
            to="/admin/events/serpentine-pavilion"
            className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white text-xs font-body uppercase tracking-wider transition-all"
          >
            Open Serpentine Detail &rarr;
          </Link>
        </div>
      </div>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white border border-[#dadada] p-6 md:p-8 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-body uppercase tracking-widest text-[#77767b]">New Record</span>
                <h3 className="font-headline text-2xl text-[#1a1c1c]">Create Event</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#77767b] hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-[11px] font-body uppercase tracking-wider text-[#5d5e66] mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zurich Kunsthalle Preview"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f9f9f9] border border-[#dadada] focus:border-black focus:bg-white outline-none text-xs font-body text-[#1a1c1c]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-body uppercase tracking-wider text-[#5d5e66] mb-1">
                  Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. Feb 14, 2026"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f9f9f9] border border-[#dadada] focus:border-black focus:bg-white outline-none text-xs font-body text-[#1a1c1c]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-body uppercase tracking-wider text-[#5d5e66] hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2.5 bg-black hover:bg-[#1a1c1c] text-white text-xs font-body uppercase tracking-wider transition-all"
                >
                  {isCreating ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
