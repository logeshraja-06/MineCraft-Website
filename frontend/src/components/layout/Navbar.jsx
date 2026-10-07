import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useParticipant } from '../../context/ParticipantContext';
import { useAuthContext } from '../../context/AuthContext';
import { ArrowRight, Shield, LogOut, ChevronDown, User, X } from 'lucide-react';

export default function Navbar() {
  const { participant, clearParticipant } = useParticipant();
  const { role, user, logout } = useAuthContext() || {};
  const isAdmin = role === 'admin' || user?.role === 'admin';
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef(null);

  // Monitor scroll position to transition navbar from transparent to dark
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsScrolled(window.scrollY > 20);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStandardLogout = () => {
    setMenuOpen(false);
    if (clearParticipant) {
      clearParticipant();
    } else if (logout) {
      logout();
    }
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Challenges', to: '/challenges' },
    { label: 'Rules', to: '/rules' },
    { label: 'Leaderboard', to: '/leaderboard' },
    ...(isAdmin ? [{ label: 'Admin', to: '/admin' }] : []),
  ];

  const currentDisplayName = participant?.name || user?.name || (isAdmin ? 'Administrator' : null);
  const currentParticipantId = participant?.participantId || user?.participantId;
  const currentEmail = participant?.email || user?.email;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-3 font-sans transition-all duration-300 ease-in-out ${isScrolled
          ? 'bg-[#07080D]/90 backdrop-blur-xl border-b border-purple-500/20 shadow-xl shadow-purple-950/25'
          : 'bg-transparent border-b border-transparent shadow-none'
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center">
              <img
                src="/logo.png"
                alt="Mind Craft"
                className="w-15 h-11 sm:w-15 sm:h-15 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(242,140,15,0.45)]"
              />
              <div className="ml-2.5 flex items-center gap-1 tracking-wider font-sans">
                <span className="font-black text-2xl md:text-2xl text-white leading-tight">MIND</span>
                <span className="font-black text-2xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 leading-tight drop-shadow-[0_0_10px_rgba(242,140,15,0.55)]">
                  CRAFT
                </span>
              </div>
            </div>
          </Link>

          {/* LINKS */}
          <div className="hidden md:flex items-center gap-7 lg:gap-9 font-bold text-xs lg:text-sm tracking-widest uppercase">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative py-1.5 transition-all duration-200 ${isActive ? 'text-purple-300 font-extrabold drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'text-slate-300 hover:text-white'
                    }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-violet-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ACTION / PARTICIPANT PROFILE DROPDOWN */}
          <div className="flex items-center gap-4">
            {currentDisplayName ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 p-1.5 pr-3.5 rounded-full bg-[#0D0F18]/90 hover:bg-purple-950/40 border border-purple-500/30 transition-all text-left group shadow-lg shadow-purple-950/20"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-white font-black text-sm shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:scale-105 transition-transform">
                    {currentDisplayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xs font-bold text-slate-100 block truncate max-w-[130px] leading-tight">
                      {currentDisplayName}
                    </span>
                    <span className="text-[10px] text-purple-400 block font-semibold leading-tight mt-0.5">
                      {currentParticipantId || (isAdmin ? 'Admin' : 'Participant')}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180 text-purple-300' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#0D0F18]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-purple-500/30 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 pb-3 border-b border-purple-900/30">
                      <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate mt-0.5">{currentDisplayName}</p>
                      {currentParticipantId && (
                        <p className="text-xs text-purple-300 font-semibold mt-0.5 font-mono">ID: {currentParticipantId}</p>
                      )}
                      {currentEmail && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{currentEmail}</p>
                      )}
                    </div>

                    <div className="py-2 px-2 space-y-1">
                      {/* Standard Logout */}
                      <button
                        onClick={handleStandardLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-purple-950/40 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-slate-400" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/register"
                className="group px-6 py-2.5  bg-white hover:bg-purple-50 text-purple-900 hover:text-purple-950 font-black text-xs tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.35)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 border border-white"
              >
                <span>ENTER THE WORLD</span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-700 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

