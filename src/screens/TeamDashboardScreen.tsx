import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Calendar, Upload, Camera, ArrowUpRight, CheckCircle } from 'lucide-react';

export const TeamDashboardScreen: React.FC = () => {
  const { user, events } = useApp();

  // Filter events where this team member is assigned or show all assigned to Elena Rostova
  const assignedEvents = events.filter(
    (e) =>
      e.teamMembers?.some(
        (m) =>
          m.name.toLowerCase().includes(user.name.toLowerCase()) ||
          user.name.toLowerCase().includes(m.name.toLowerCase()) ||
          m.id === user.id
      ) || e.id === 'venice-biennale' || e.id === 'serpentine-pavilion' || e.id === 'solstice-gala'
  );

  return (
    <div className="min-h-screen bg-[#f9f9f9] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#eeeeee] gap-6">
          <div>
            <span className="font-body text-[11px] uppercase tracking-[0.25em] text-[#77767b] block mb-1">
              Photographer Workspace
            </span>
            <h1 className="font-headline text-3xl md:text-5xl text-[#1a1c1c] tracking-tight font-normal">
              Assigned Exhibitions
            </h1>
            <p className="font-body text-xs text-[#5d5e66] mt-2 max-w-xl leading-relaxed">
              Welcome back, <strong className="text-black font-medium">{user.name}</strong>. Ingest high-resolution photographic captures and monitor archival status for your assigned exhibitions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 bg-white border border-[#dadada] text-xs font-body text-[#1a1c1c] shadow-2xs">
              <span className="text-[#77767b] uppercase text-[10px] tracking-widest block">Active Assignments</span>
              <strong className="text-base font-headline">{assignedEvents.length} Events</strong>
            </div>
          </div>
        </div>

        {/* Assigned Events List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {assignedEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white border border-[#eeeeee] hover:border-[#dadada] p-6 flex flex-col justify-between transition-all group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-body uppercase tracking-widest text-[#77767b] mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{event.date}</span>
                  </span>
                  <span className="px-2 py-0.5 bg-[#f3f3f3] text-[#1a1c1c]">Ingestion Open</span>
                </div>

                <h3 className="font-headline text-2xl text-[#1a1c1c] mb-2 group-hover:text-black">
                  {event.name}
                </h3>

                <p className="font-body text-xs text-[#5d5e66] mb-6">
                  {event.photoCount} high-resolution plates currently deposited in the archival pool.
                </p>
              </div>

              <div className="pt-4 border-t border-[#eeeeee] flex items-center justify-between">
                <Link
                  to={`/team/events/${event.id}/upload`}
                  className="w-full py-2.5 bg-black hover:bg-[#1a1c1c] text-white text-xs font-body uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Captures</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Highlight for Quick Testing */}
        <div className="mt-12 p-8 bg-white border border-[#dadada] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="font-body text-[10px] uppercase tracking-widest text-[#77767b] block">
              Featured Ingest Session
            </span>
            <h4 className="font-headline text-xl text-[#1a1c1c]">
              Venice Biennale Vernissage — Ingest Queue
            </h4>
            <p className="font-body text-xs text-[#5d5e66] max-w-lg mt-1">
              Matches the exact Stitch design showing Salk Horizon, Draped Volume, Pavilion Interior, and live drag-and-drop file upload.
            </p>
          </div>
          <Link
            to="/team/events/venice-biennale/upload"
            className="px-6 py-3 border border-black text-black hover:bg-black hover:text-white text-xs font-body uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <span>Open Ingest Workspace</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
