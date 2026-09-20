import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#f9f9f9] border-t border-[#eeeeee] py-16 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="max-w-sm">
          <span className="font-headline tracking-[0.2em] text-lg text-[#1a1c1c] uppercase block mb-2">
            LUMEN
          </span>
          <p className="font-body text-xs text-[#5d5e66] leading-relaxed">
            An understated archive of contemporary fine art photography and curated exhibition visual records.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4 text-xs font-body tracking-wider uppercase text-[#5d5e66]">
          <Link to="/signin" className="hover:text-[#1a1c1c] transition-colors">
            Team Portal
          </Link>
          <Link to="/access/solarium-archive" className="hover:text-[#1a1c1c] transition-colors">
            Client Ingestion
          </Link>
          <span className="text-[#dadada]">·</span>
          <span className="text-[#77767b]">Berlin — Basel — London</span>
        </div>

        <div className="font-body text-[11px] text-[#77767b] tracking-wider">
          © {new Date().getFullYear()} LUMEN ARCHIVE. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
};
