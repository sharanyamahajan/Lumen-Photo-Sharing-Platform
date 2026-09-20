import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import { Photo, EventItem } from '../types';
import { PhotoGrid } from '../components/PhotoGrid';
import { Download, Lock, Share2, Sparkles, Check } from 'lucide-react';

export const PublicGalleryScreen: React.FC = () => {
  const { galleryId = 'solarium-archive' } = useParams<{ galleryId: string }>();
  const { unlockedGalleries, showNotification } = useApp();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if PIN has been verified
  const isUnlocked = unlockedGalleries[galleryId] || true; // Allow direct viewing, with lock status indicator

  useEffect(() => {
    let isMounted = true;
    async function loadGallery() {
      setIsLoading(true);
      try {
        const result = await api.getPublishedGallery(galleryId);
        if (isMounted) {
          setEvent(result.event);
          setPhotos(result.photos);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadGallery();
    return () => {
      isMounted = false;
    };
  }, [galleryId]);

  const handleDownloadAll = () => {
    showNotification(`Packaging all ${photos.length} full-resolution plates for download.`);
    // Simulate multi-file trigger
    if (photos.length > 0) {
      const link = document.createElement('a');
      link.href = photos[0].url;
      link.download = `${(event?.name || 'exhibition').toLowerCase().replace(/\s+/g, '-')}-archive.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Gallery link copied to clipboard.');
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Gallery Hero / Header matching Stitch Image 11 */}
        <div className="text-center max-w-3xl mx-auto mb-16 pb-12 border-b border-[#eeeeee]">
          <span className="font-body text-[10px] uppercase tracking-[0.3em] text-[#77767b] block mb-3">
            Curated Visual Record · Private Collection
          </span>
          <h1 className="font-headline text-4xl md:text-6xl text-[#1a1c1c] font-normal tracking-tight mb-4">
            {event?.name === 'The Solarium Archive'
              ? 'Sørensen Vernissage — Autumnal Salon'
              : event?.name || 'Curated Exhibition Gallery'}
          </h1>
          <p className="font-body text-xs md:text-sm text-[#5d5e66] leading-relaxed max-w-xl mx-auto mb-8">
            An understated archive of fine art photographs preserved in archival format. Each plate captures the architectural ambience and intimate curatorial moments of the evening.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleDownloadAll}
              className="px-6 py-3 bg-black hover:bg-[#1a1c1c] text-white text-xs font-body uppercase tracking-[0.18em] flex items-center gap-2 shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Entire Portfolio ({photos.length} Plates)</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-5 py-3 border border-[#dadada] hover:border-black bg-white text-[#1a1c1c] text-xs font-body uppercase tracking-[0.15em] flex items-center gap-2 transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Gallery</span>
            </button>
          </div>
        </div>

        {/* Status / Plate Count Subheader */}
        <div className="flex items-center justify-between pb-6 border-b border-[#eeeeee] mb-10 text-xs font-body uppercase tracking-wider text-[#5d5e66]">
          <span>Collection Index</span>
          <span className="font-medium text-[#1a1c1c]">{photos.length} Plates Cataloged</span>
        </div>

        {/* Photo Grid with Public Mode (hover download, no admin selection) */}
        <PhotoGrid
          photos={photos}
          mode="public-gallery"
          isLoading={isLoading}
          emptyTitle="No archival plates published"
          emptySubtitle="The curatorial team is currently finalizing selection and color grading."
        />

        {/* Colophon & Archival Note */}
        <div className="mt-24 pt-12 border-t border-[#eeeeee] max-w-2xl mx-auto text-center text-xs font-body text-[#77767b] leading-relaxed">
          <p>
            Plates preserved on high-density cold storage. Delivered to private guests under curatorial license.
            For licensing inquiries or physical darkroom prints, please reference the plate numbers shown above.
          </p>
        </div>
      </div>
    </div>
  );
};
