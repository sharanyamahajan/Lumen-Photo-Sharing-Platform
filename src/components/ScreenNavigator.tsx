import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ScreenNavigator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { switchRole } = useApp();

  const screens = [
    { num: '1', name: 'Sign In', path: '/signin', role: 'admin' as const },
    { num: '2', name: 'Admin Dashboard', path: '/admin', role: 'admin' as const },
    { num: '3', name: 'Event Detail (Admin)', path: '/admin/events/serpentine-pavilion', role: 'admin' as const },
    { num: '4', name: 'Team Member Dashboard', path: '/team', role: 'team_member' as const },
    { num: '5', name: 'Team Member Upload', path: '/team/events/venice-biennale/upload', role: 'team_member' as const },
    { num: '6', name: 'Gallery PIN Entry', path: '/access/solarium-archive', role: 'customer' as const },
    { num: '7', name: 'Public Gallery View', path: '/gallery/solarium-archive', role: 'customer' as const }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden font-body">
      {isOpen ? (
        <div className="bg-[#1a1c1c] text-white border border-[#333] shadow-2xl p-4 w-80 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-[#333] mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#dadada]" />
              <span className="text-xs uppercase tracking-widest font-medium">Stitch Screen Directory</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#77767b] hover:text-white"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {screens.map((screen) => {
              const isActive = location.pathname === screen.path;
              return (
                <Link
                  key={screen.num}
                  to={screen.path}
                  onClick={() => {
                    switchRole(screen.role);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                    isActive
                      ? 'bg-white text-black font-semibold'
                      : 'text-[#e2e2e2] hover:bg-[#2a2c2c] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#77767b] w-4">{screen.num}.</span>
                    <span>{screen.name}</span>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5" />}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 pt-2 border-t border-[#333] text-[10px] text-[#77767b]">
            Direct navigation across all 7 requested screens.
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-[#1a1c1c] hover:bg-black text-white px-3.5 py-2 text-xs border border-[#333] shadow-lg flex items-center gap-2 uppercase tracking-widest transition-all"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>7 Screens Directory</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#77767b]" />
        </button>
      )}
    </div>
  );
};
