import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Lock, UserCheck, Shield, ChevronDown, LogOut, Check } from 'lucide-react';
import { UserRole } from '../types';

export const Header: React.FC = () => {
  const { user, switchRole, notification } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // Check if we are in public gallery view or pin screen
  const isPublicView = location.pathname.startsWith('/gallery') || location.pathname.startsWith('/access');

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    setRoleMenuOpen(false);
    if (newRole === 'admin') {
      navigate('/admin');
    } else if (newRole === 'team_member') {
      navigate('/team');
    } else {
      navigate('/access/solarium-archive');
    }
  };

  return (
    <header className="w-full bg-[#ffffff] border-b border-[#eeeeee] sticky top-0 z-40">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="bg-[#1a1c1c] text-white px-4 py-2 text-xs font-body tracking-wider text-center flex items-center justify-center gap-2 transition-all">
          <Check className="w-3.5 h-3.5 text-[#dadada]" />
          <span>{notification}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-baseline gap-6">
          <Link
            to={user.role === 'admin' ? '/admin' : user.role === 'team_member' ? '/team' : '/gallery/solarium-archive'}
            className="font-headline tracking-[0.25em] text-2xl text-[#1a1c1c] uppercase hover:opacity-80 transition-opacity"
          >
            LUMEN
          </Link>
          <span className="hidden md:inline font-body text-[11px] uppercase tracking-widest text-[#5d5e66]">
            Archive
          </span>
        </div>

        {/* Center / Navigation Links (from Stitch mockup) */}
        <nav className="hidden lg:flex items-center space-x-8 text-xs font-body uppercase tracking-wider text-[#5d5e66]">
          {user.role === 'admin' && (
            <>
              <Link
                to="/admin"
                className={`hover:text-[#1a1c1c] transition-colors ${
                  location.pathname === '/admin' ? 'text-[#1a1c1c] font-medium border-b border-black pb-0.5' : ''
                }`}
              >
                Events & Archives
              </Link>
              <Link
                to="/admin/events/serpentine-pavilion"
                className={`hover:text-[#1a1c1c] transition-colors ${
                  location.pathname.includes('/admin/events') ? 'text-[#1a1c1c] font-medium border-b border-black pb-0.5' : ''
                }`}
              >
                Serpentine Detail
              </Link>
            </>
          )}

          {user.role === 'team_member' && (
            <>
              <Link
                to="/team"
                className={`hover:text-[#1a1c1c] transition-colors ${
                  location.pathname === '/team' ? 'text-[#1a1c1c] font-medium border-b border-black pb-0.5' : ''
                }`}
              >
                Assigned Events
              </Link>
              <Link
                to="/team/events/venice-biennale/upload"
                className={`hover:text-[#1a1c1c] transition-colors ${
                  location.pathname.includes('/upload') ? 'text-[#1a1c1c] font-medium border-b border-black pb-0.5' : ''
                }`}
              >
                Ingest Queue
              </Link>
            </>
          )}

          <Link
            to="/access/solarium-archive"
            className={`hover:text-[#1a1c1c] transition-colors flex items-center gap-1.5 ${
              location.pathname.includes('/access') || location.pathname.includes('/gallery')
                ? 'text-[#1a1c1c] font-medium'
                : ''
            }`}
          >
            <Lock className="w-3 h-3 text-[#77767b]" />
            <span>Client Access</span>
          </Link>
        </nav>

        {/* Right Actions & Persona Switcher */}
        <div className="flex items-center gap-4">
          {/* Quick Persona Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="px-3 py-1.5 border border-[#dadada] hover:border-black text-[11px] font-body uppercase tracking-wider text-[#1a1c1c] flex items-center gap-2 bg-[#f9f9f9]"
            >
              {user.role === 'admin' ? (
                <Shield className="w-3.5 h-3.5 text-black" />
              ) : user.role === 'team_member' ? (
                <UserCheck className="w-3.5 h-3.5 text-black" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-black" />
              )}
              <span className="font-medium">
                {user.role === 'admin' ? 'Admin / Lead' : user.role === 'team_member' ? 'Team Member' : 'Customer'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#77767b]" />
            </button>

            {roleMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white border border-[#dadada] shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setRoleMenuOpen(false)}
              >
                <div className="px-4 py-2 border-b border-[#eeeeee]">
                  <p className="text-[10px] uppercase tracking-widest text-[#5d5e66]">Active Persona</p>
                  <p className="font-headline italic text-sm text-[#1a1c1c]">{user.name}</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-[#f3f3f3] ${
                      user.role === 'admin' ? 'font-semibold text-black bg-[#f3f3f3]' : 'text-[#5d5e66]'
                    }`}
                  >
                    <span>Admin / Lead Curator</span>
                    {user.role === 'admin' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('team_member')}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-[#f3f3f3] ${
                      user.role === 'team_member' ? 'font-semibold text-black bg-[#f3f3f3]' : 'text-[#5d5e66]'
                    }`}
                  >
                    <span>Team Member (Elena)</span>
                    {user.role === 'team_member' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('customer')}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-[#f3f3f3] ${
                      user.role === 'customer' ? 'font-semibold text-black bg-[#f3f3f3]' : 'text-[#5d5e66]'
                    }`}
                  >
                    <span>Customer (PIN Entry)</span>
                    {user.role === 'customer' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="border-t border-[#eeeeee] pt-1">
                  <Link
                    to="/signin"
                    onClick={() => setRoleMenuOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs text-[#5d5e66] hover:bg-[#f3f3f3] flex items-center gap-2"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Go to Sign In Screen</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sign In button if on public page */}
          {location.pathname !== '/signin' && (
            <Link
              to="/signin"
              className="text-[11px] font-body uppercase tracking-wider text-[#5d5e66] hover:text-[#1a1c1c]"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
