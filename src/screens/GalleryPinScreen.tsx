import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import { Lock, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

export const GalleryPinScreen: React.FC = () => {
  const { galleryId = 'solarium-archive' } = useParams<{ galleryId: string }>();
  const navigate = useNavigate();
  const { unlockGallery, showNotification } = useApp();

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await api.verifyGalleryPin(galleryId, pin.trim());
      if (isValid) {
        unlockGallery(galleryId);
        showNotification('Passkey authenticated. Opening archive.');
        navigate(`/gallery/${galleryId}`);
      } else {
        setError('Invalid curatorial passkey. Please check with your event host.');
      }
    } catch (err) {
      setError('Verification service unavailable.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQuickFill = (testPin: string) => {
    setPin(testPin);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center items-center px-6 py-16 bg-[#f9f9f9]">
      <div className="w-full max-w-md bg-white border border-[#eeeeee] p-8 md:p-12 shadow-xs text-center">
        {/* Lock Icon */}
        <div className="w-12 h-12 bg-[#f3f3f3] text-[#1a1c1c] mx-auto flex items-center justify-center mb-6">
          <Lock className="w-5 h-5 stroke-[1.5]" />
        </div>

        {/* Heading */}
        <span className="font-body text-[10px] uppercase tracking-[0.3em] text-[#77767b] block mb-2">
          Private Access
        </span>
        <h1 className="font-headline text-3xl md:text-4xl text-[#1a1c1c] font-normal tracking-tight mb-3">
          The Solarium Archive
        </h1>
        <p className="font-body text-xs text-[#5d5e66] leading-relaxed mb-8">
          Enter the curatorial passkey provided by the lead archivist to view and download high-resolution plates.
        </p>

        {/* PIN Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError(null);
              }}
              className="w-full py-4 text-center font-headline text-3xl tracking-[0.5em] bg-[#f9f9f9] border border-[#dadada] focus:border-black focus:bg-white outline-none text-[#1a1c1c] transition-colors"
            />
            {error && (
              <p className="text-xs text-red-600 flex items-center justify-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying || pin.length < 3}
            className="w-full py-3.5 bg-black hover:bg-[#1a1c1c] text-white text-xs font-body uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <span>{isVerifying ? 'Verifying...' : 'Unlock Exhibition'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Subtle helper for review testing */}
        <div className="mt-8 pt-6 border-t border-[#eeeeee]">
          <span className="text-[10px] font-body uppercase tracking-wider text-[#77767b] block mb-2">
            Tester Quick-Fill PINs
          </span>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('7721')}
              className="px-2.5 py-1 text-[11px] font-body bg-[#f3f3f3] hover:bg-[#e8e8e8] text-[#1a1c1c] flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              <span>PIN: 7721</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('4820')}
              className="px-2.5 py-1 text-[11px] font-body bg-[#f3f3f3] hover:bg-[#e8e8e8] text-[#1a1c1c] flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              <span>PIN: 4820</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
