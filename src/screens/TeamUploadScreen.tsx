import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import { Photo, EventItem } from '../types';
import { PhotoGrid } from '../components/PhotoGrid';
import { ArrowLeft, UploadCloud, CheckCircle2, FileCheck, Loader2 } from 'lucide-react';

interface UploadingFile {
  id: string;
  name: string;
  size: string;
  progress: number;
}

export const TeamUploadScreen: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, showNotification } = useApp();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!eventId) return;
      setIsLoading(true);
      try {
        const ev = await api.getEventById(eventId);
        const allPhotos = await api.getEventPhotos(eventId);
        if (isMounted) {
          setEvent(ev);
          // Filter to own uploads or show the event's photographer uploads
          setPhotos(allPhotos);
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

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !eventId) return;

    const fileList = Array.from(files);

    // Create queue items
    const newQueueItems: UploadingFile[] = fileList.map((file, idx) => ({
      id: `queue-${Date.now()}-${idx}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      progress: 15
    }));

    setUploadQueue((prev) => [...prev, ...newQueueItems]);

    // Process each file with progress simulation and actual local ingestion
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const queueItem = newQueueItems[i];

      // Simulate progress ticks
      await new Promise((r) => setTimeout(r, 200));
      setUploadQueue((prev) =>
        prev.map((item) => (item.id === queueItem.id ? { ...item, progress: 65 } : item))
      );

      await new Promise((r) => setTimeout(r, 250));
      setUploadQueue((prev) =>
        prev.map((item) => (item.id === queueItem.id ? { ...item, progress: 100 } : item))
      );

      // Call isolated api service
      const ingestedPhoto = await api.uploadPhoto(eventId, file, user.name);

      setPhotos((prev) => [ingestedPhoto, ...prev]);

      // Remove from queue after slight pause
      setTimeout(() => {
        setUploadQueue((prev) => prev.filter((item) => item.id !== queueItem.id));
      }, 700);
    }

    showNotification(`Successfully ingested ${fileList.length} photographic plate(s).`);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] py-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation & Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/team"
            className="inline-flex items-center gap-2 text-xs font-body uppercase tracking-widest text-[#5d5e66] hover:text-[#1a1c1c] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Assigned Exhibitions</span>
          </Link>

          <span className="font-body text-xs text-[#5d5e66]">
            Contributor: <strong className="text-black font-medium">{user.name}</strong>
          </span>
        </div>

        {/* Title Area */}
        <div className="pb-8 border-b border-[#eeeeee]">
          <span className="font-body text-[10px] uppercase tracking-[0.25em] text-[#77767b] block mb-1">
            Photographic Ingestion · Session Active
          </span>
          <h1 className="font-headline text-3xl md:text-5xl text-[#1a1c1c] font-normal">
            {event?.name || 'Venice Biennale Vernissage'}
          </h1>
          <p className="font-body text-xs text-[#5d5e66] mt-2 max-w-xl">
            Upload uncompressed RAW or archival captures. Assets are processed directly into the curatorial review pipeline.
          </p>
        </div>

        {/* Drag and Drop Upload Zone */}
        <div className="my-8">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,.dng,.cr3,.arw,.nef"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed py-14 px-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
              isDragging
                ? 'border-black bg-[#eeeeee]'
                : 'border-[#dadada] bg-white hover:border-black hover:bg-[#fafafa]'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#f3f3f3] flex items-center justify-center mb-4 text-[#1a1c1c]">
              <UploadCloud className="w-6 h-6 stroke-[1.5]" />
            </div>

            <h3 className="font-headline text-xl text-[#1a1c1c] mb-1">
              Drop raw assets or click to browse
            </h3>
            <p className="font-body text-xs text-[#5d5e66] max-w-md">
              TIFF, DNG, or High-Resolution JPEG up to 100MB per plate. Multi-selection supported.
            </p>

            <button
              type="button"
              className="mt-4 px-5 py-2 bg-black text-white text-[11px] font-body uppercase tracking-[0.15em] hover:bg-[#1a1c1c]"
            >
              Select Files
            </button>
          </div>
        </div>

        {/* Upload Progress Queue */}
        {uploadQueue.length > 0 && (
          <div className="mb-8 p-4 bg-white border border-[#dadada] space-y-3 animate-in fade-in">
            <span className="text-[10px] font-body uppercase tracking-widest text-[#77767b] block">
              Ingesting Photographic Plates ({uploadQueue.length} remaining)
            </span>
            {uploadQueue.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-body">
                  <span className="font-medium text-[#1a1c1c] flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a1c1c]" />
                    {item.name}
                  </span>
                  <span className="text-[#5d5e66]">{item.size} · {item.progress}%</span>
                </div>
                <div className="w-full bg-[#eeeeee] h-1">
                  <div
                    className="bg-black h-1 transition-all duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section: Grid of Own Ingested Uploads */}
        <div className="mt-10">
          <div className="flex items-baseline justify-between pb-4 border-b border-[#eeeeee] mb-8">
            <div>
              <span className="font-body text-[10px] uppercase tracking-widest text-[#77767b] block">
                Session Catalog
              </span>
              <h3 className="font-headline text-2xl text-[#1a1c1c]">
                Deposited Photographic Plates ({photos.length})
              </h3>
            </div>
            <span className="text-xs font-body text-[#5d5e66]">
              Archival Status: <strong className="text-black font-medium">Ready for Curation</strong>
            </span>
          </div>

          <PhotoGrid
            photos={photos}
            mode="team-upload"
            isLoading={isLoading}
            emptyTitle="No plates ingested yet"
            emptySubtitle="Use the upload area above to deposit photographic records for this event."
          />
        </div>
      </div>
    </div>
  );
};
