import React from 'react';
import { Check, Download, Eye, Maximize2 } from 'lucide-react';
import { Photo } from '../types';

export interface PhotoCardProps {
  photo: Photo;
  mode: 'admin-select' | 'team-upload' | 'public-gallery';
  isSelected?: boolean;
  onToggle?: () => void;
  onInspect?: () => void;
  onDownload?: (e: React.MouseEvent) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  mode,
  isSelected = false,
  onToggle,
  onInspect,
  onDownload
}) => {
  const aspectClass = mode === 'admin-select' ? 'aspect-[4/3]' : 'aspect-[4/5]';

  return (
    <div className="group flex flex-col relative transition-all">
      {/* Image Container */}
      <div
        className={`relative w-full ${aspectClass} overflow-hidden bg-[#e8e8e8] cursor-pointer`}
        onClick={() => {
          if (mode === 'admin-select') {
            onToggle?.();
          } else {
            onInspect?.();
          }
        }}
      >
        <img
          src={photo.url}
          alt={photo.alt || photo.title}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          loading="lazy"
        />

        {/* MODE 1: ADMIN MULTI-SELECT OVERLAY */}
        {mode === 'admin-select' && (
          <>
            <div
              className={`absolute inset-0 transition-opacity duration-200 ${
                isSelected
                  ? 'bg-black/20 ring-2 ring-black ring-inset'
                  : 'bg-black/0 group-hover:bg-black/10'
              }`}
            />
            {/* Checkbox button */}
            <button
              type="button"
              aria-label={isSelected ? 'Deselect photo' : 'Select photo'}
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
              className={`absolute top-4 left-4 w-6 h-6 border flex items-center justify-center transition-colors z-10 ${
                isSelected
                  ? 'bg-black border-black text-white'
                  : 'bg-white/90 border-[#1a1c1c]/40 text-transparent hover:border-black'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* Inspect button in top right */}
            <button
              type="button"
              aria-label="Inspect high resolution"
              onClick={(e) => {
                e.stopPropagation();
                onInspect?.();
              }}
              className="absolute top-4 right-4 w-7 h-7 bg-white/80 hover:bg-white text-[#1a1c1c] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-xs"
              title="Inspect preview"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* MODE 2: TEAM UPLOAD OVERLAY */}
        {mode === 'team-upload' && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <button
              type="button"
              aria-label="View photo"
              onClick={(e) => {
                e.stopPropagation();
                onInspect?.();
              }}
              className="w-10 h-10 bg-white/90 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MODE 3: PUBLIC GALLERY DOWNLOAD OVERLAY */}
        {mode === 'public-gallery' && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end justify-between p-4 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInspect?.();
              }}
              className="px-3 py-1.5 bg-white/90 hover:bg-white text-black text-xs font-body tracking-wider uppercase flex items-center gap-1.5 shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.(e);
              }}
              className="px-3 py-1.5 bg-black hover:bg-black/90 text-white text-xs font-body tracking-wider uppercase flex items-center gap-1.5 shadow-xs"
              title="Download full resolution plate"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        )}
      </div>

      {/* Caption and Metadata Below */}
      <div className="mt-3 flex flex-col justify-between">
        <div className="flex items-baseline justify-between">
          <span className="font-body text-xs text-[#1a1c1c] font-medium tracking-tight truncate max-w-[70%]">
            {photo.title}
          </span>
          {mode === 'admin-select' && (
            <span className="font-body text-[11px] text-[#5d5e66]">
              {photo.uploadedBy ? photo.uploadedBy.split(' ')[0] : 'Team'}
            </span>
          )}
          {mode === 'team-upload' && (
            <span className="font-body text-[10px] uppercase tracking-widest text-[#5d5e66]">
              Archived
            </span>
          )}
        </div>

        {photo.metadata && (
          <span className="font-body text-[11px] text-[#5d5e66] mt-0.5 tracking-tight">
            {photo.metadata}
          </span>
        )}
      </div>
    </div>
  );
};
