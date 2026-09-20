import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { Photo } from '../types';
import { PhotoCard } from './PhotoCard';

export interface PhotoGridProps {
  photos: Photo[];
  mode: 'admin-select' | 'team-upload' | 'public-gallery';
  isLoading?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (photoId: string) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  mode,
  isLoading = false,
  selectedIds = new Set<string>(),
  onToggleSelect,
  emptyTitle = 'No photographs recorded',
  emptySubtitle = 'Archival captures will appear here once deposited by assigned team members.'
}) => {
  const [activeLightbox, setActiveLightbox] = useState<Photo | null>(null);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-6">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div key={idx} className="flex flex-col space-y-3 animate-pulse">
            <div className={`w-full bg-[#eeeeee] ${mode === 'admin-select' ? 'aspect-[4/3]' : 'aspect-[4/5]'}`} />
            <div className="h-4 bg-[#e2e2e2] w-2/3" />
            <div className="h-3 bg-[#eeeeee] w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  // Empty State
  if (photos.length === 0) {
    return (
      <div className="py-24 border border-dashed border-[#dadada] text-center flex flex-col items-center justify-center p-8 bg-[#ffffff]">
        <span className="font-headline italic text-2xl text-[#1a1c1c] mb-2">{emptyTitle}</span>
        <p className="font-body text-sm text-[#5d5e66] max-w-md">{emptySubtitle}</p>
      </div>
    );
  }

  const handleDownload = (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation();
    // Simulate direct high-res download
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `${photo.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div
        className={`grid grid-cols-1 ${
          mode === 'admin-select' ? 'md:grid-cols-2 lg:grid-cols-3 gap-8' : 'md:grid-cols-2 lg:grid-cols-3 gap-10'
        }`}
      >
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            mode={mode}
            isSelected={selectedIds.has(photo.id)}
            onToggle={() => onToggleSelect?.(photo.id)}
            onInspect={() => setActiveLightbox(photo)}
            onDownload={(e) => handleDownload(e, photo)}
          />
        ))}
      </div>

      {/* Lightbox / High-Res View Modal */}
      {activeLightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
          onClick={() => setActiveLightbox(null)}
        >
          {/* Top Bar */}
          <div className="w-full max-w-6xl flex items-center justify-between py-4 text-white">
            <div>
              <h4 className="font-headline italic text-lg text-white">{activeLightbox.title}</h4>
              <p className="font-body text-xs text-[#dadada]">{activeLightbox.metadata || 'Archival plate'}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={(e) => handleDownload(e, activeLightbox)}
                className="px-4 py-1.5 border border-white/30 text-white text-xs hover:border-white tracking-widest uppercase flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download High-Res</span>
              </button>
              <button
                type="button"
                aria-label="Close viewer"
                onClick={() => setActiveLightbox(null)}
                className="p-1.5 text-[#dadada] hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Large image */}
          <div
            className="relative max-w-5xl max-h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeLightbox.url}
              alt={activeLightbox.alt || activeLightbox.title}
              className="max-h-[80vh] max-w-full object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
