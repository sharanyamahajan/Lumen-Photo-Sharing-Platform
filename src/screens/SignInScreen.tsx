import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import * as api from '../services/api';
import { Lock, ArrowRight, ShieldCheck, Camera } from 'lucide-react';

export const SignInScreen: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole, showNotification } = useApp();
  const [role, setRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('admin@lumen.ch');
  const [password, setPassword] = useState('AdminSecret123!');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleTabChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'admin') {
      setEmail('admin@lumen.ch');
      setPassword('AdminSecret123!');
    } else {
      setEmail('team@lumen.ch');
      setPassword('TeamSecret123!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { user: authedUser } = await api.loginUser(email, password);
      switchRole(authedUser.role);
      showNotification(`Signed in as ${authedUser.role === 'admin' ? 'Lead Curator (Admin)' : 'Team Member (Photographer)'}`);
      if (authedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/team');
      }
    } catch (err: any) {
      showNotification(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center items-center px-6 py-16 bg-[#f9f9f9]">
      <div className="w-full max-w-md bg-[#ffffff] border border-[#eeeeee] p-8 md:p-12 shadow-xs">
        {/* Editorial Heading */}
        <div className="text-center mb-8">
          <span className="font-body text-[10px] uppercase tracking-[0.3em] text-[#77767b] block mb-2">
            Archival Access
          </span>
          <h1 className="font-headline text-3xl md:text-4xl text-[#1a1c1c] tracking-tight font-normal">
            Sign In to LUMEN
          </h1>
          <p className="font-body text-xs text-[#5d5e66] mt-2 leading-relaxed">
            Select your role to access event archives or upload photographic records.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#f3f3f3] mb-6">
          <button
            type="button"
            onClick={() => handleRoleTabChange('admin')}
            className={`py-2 text-xs font-body uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              role === 'admin'
                ? 'bg-white text-[#1a1c1c] shadow-xs font-medium'
                : 'text-[#5d5e66] hover:text-[#1a1c1c]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin / Lead</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('team_member')}
            className={`py-2 text-xs font-body uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              role === 'team_member'
                ? 'bg-white text-[#1a1c1c] shadow-xs font-medium'
                : 'text-[#5d5e66] hover:text-[#1a1c1c]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Team Member</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-body uppercase tracking-wider text-[#5d5e66] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f9f9f9] border border-[#dadada] focus:border-black focus:bg-white outline-none text-xs font-body text-[#1a1c1c] transition-colors"
              placeholder="curator@lumen-archive.ch"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-body uppercase tracking-wider text-[#5d5e66]">
                Password
              </label>
              <span className="text-[10px] text-[#77767b] hover:text-black cursor-pointer">
                Reset key
              </span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f9f9f9] border border-[#dadada] focus:border-black focus:bg-white outline-none text-xs font-body text-[#1a1c1c] transition-colors"
              placeholder="••••••••••••"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-black hover:bg-[#1a1c1c] text-white text-xs font-body uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : `Enter as ${role === 'admin' ? 'Admin' : 'Team Member'}`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Client Access Link */}
        <div className="mt-8 pt-6 border-t border-[#eeeeee] text-center">
          <p className="font-body text-xs text-[#5d5e66]">
            Have a private exhibition PIN?
          </p>
          <Link
            to="/access/solarium-archive"
            className="inline-flex items-center gap-1.5 text-xs font-body font-medium text-[#1a1c1c] hover:underline mt-1.5"
          >
            <Lock className="w-3 h-3 text-[#77767b]" />
            <span>Go to Client Gallery PIN Entry &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
