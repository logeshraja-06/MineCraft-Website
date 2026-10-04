import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useParticipant } from '../../context/ParticipantContext';
import { useAuthContext } from '../../context/AuthContext';
import { ArrowRight, Shield } from 'lucide-react';

export default function Navbar() {
  const { participant } = useParticipant();
  const { role, user } = useAuthContext() || {};
  const isAdmin = role === 'admin' || user?.role === 'admin';
  const location = useLocation();

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Challenges', to: '/challenges' },
    { label: 'Rules', to: '/rules' },
    { label: 'Leaderboard', to: '/leaderboard' },
    ...(isAdmin ? [{ label: 'Admin', to: '/admin' }] : []),
  ];

  return (
    <nav className="bg-white sticky top-0 z-40 px-6 py-4 shadow-sm font-mono">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-4 group">
          <div className="relative flex items-center">
             <img src="/logo.png" alt="Mind Craft Logo" className="w-16 h-16 object-contain group-hover:scale-105 transition-transform" />
             <div className="ml-2 flex items-center gap-1.5">
                <span className="font-extrabold text-2xl md:text-3xl text-slate-900 leading-tight">Mind</span>
                <span className="font-extrabold text-2xl md:text-3xl text-[#F28C0F] leading-tight">Craft</span>
             </div>
          </div>
        </Link>

        {/* LINKS */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8 font-bold text-base lg:text-lg">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative py-1 transition ${
                  isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-[#F28C0F] rounded-full"></span>
                )}
              </Link>
            );
          })}
        </div>

        {/* ACTION / REGISTER BUTTON */}
        <div className="flex items-center gap-4">
          {participant ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-base font-bold text-slate-800 block truncate max-w-[120px]">
                  {participant.name}
                </span>
                <span className="text-sm text-[#F28C0F] block font-medium">
                  {participant.participantId}
                </span>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
                {participant.name?.charAt(0) || 'P'}
              </div>
            </div>
          ) : (
            <Link
              to="/register"
              className="px-8 py-3 rounded-full bg-[#F28C0F] hover:bg-orange-500 text-slate-950 font-bold text-base transition flex items-center gap-2"
            >
              Register <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
