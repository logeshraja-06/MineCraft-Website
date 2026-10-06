import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useParticipant } from '../../context/ParticipantContext';
import { useAuthContext } from '../../context/AuthContext';
import { ArrowRight, Shield, LogOut, Trash2, ChevronDown, User, AlertTriangle, X, RefreshCw } from 'lucide-react';

export default function Navbar() {
  const { participant, clearParticipant, logoutAndDeleteParticipant } = useParticipant();
  const { role, user, logout } = useAuthContext() || {};
  const isAdmin = role === 'admin' || user?.role === 'admin';
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef(null);

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

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (logoutAndDeleteParticipant) {
        await logoutAndDeleteParticipant();
      } else if (clearParticipant) {
        clearParticipant();
      }
      setShowDeleteModal(false);
      setMenuOpen(false);
      navigate('/register');
    } catch (err) {
      console.error('Failed to delete participant details:', err);
      if (clearParticipant) clearParticipant();
      setShowDeleteModal(false);
      setMenuOpen(false);
      navigate('/register');
    } finally {
      setIsDeleting(false);
    }
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
      <nav className="bg-[#07080D]/85 backdrop-blur-xl sticky top-0 z-40 px-6 py-3.5 shadow-xl shadow-purple-950/20 font-sans border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="relative flex items-center">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-900 to-slate-950 border border-purple-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_22px_rgba(168,85,247,0.7)] transition-all">
                 <div className="w-5 h-5 rounded-md bg-purple-400/20 border border-purple-400 flex items-center justify-center">
                   <div className="w-2.5 h-2.5 bg-purple-300 rounded-xs animate-pulse"></div>
                 </div>
               </div>
               <div className="ml-3 flex items-center gap-1.5 tracking-wider font-sans">
                  <span className="font-black text-2xl md:text-3xl text-white leading-tight">MIND</span>
                  <span className="font-black text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-300 leading-tight drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]">CRAFT</span>
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
                  className={`relative py-1.5 transition-all duration-200 ${
                    isActive ? 'text-purple-300 font-extrabold drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'text-slate-300 hover:text-white'
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

                      {/* Delete Participant & Reset for Multi Testing (only for participants) */}
                      {!isAdmin && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setShowDeleteModal(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors text-left group"
                          title="Wipes this participant record from DB so you can test again with the same ID"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                          <div className="flex-1">
                            <span className="block font-bold">Logout & Delete Details</span>
                            <span className="block text-[10px] text-rose-400 font-normal">Test reset: wipe participant & re-test</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/register"
                className="px-6 py-2.5 rounded-full border border-purple-500/80 bg-purple-950/40 hover:bg-purple-600 text-purple-200 hover:text-white font-bold text-xs tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] flex items-center gap-2"
              >
                <span>ENTER THE WORLD</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Confirmation Modal for Logout & Delete Participant Details */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-sans">
          <div className="bg-[#0D0F18] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-500/30 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Delete Participant & Reset?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This will permanently delete participant <span className="font-bold text-purple-300">"{currentDisplayName}"</span> ({currentParticipantId}) and all test progress, attempts, and submissions from the database.
                </p>
              </div>
            </div>

            <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 text-xs text-purple-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-purple-300">
                <RefreshCw className="w-3.5 h-3.5" /> For Multi-Time Testing:
              </p>
              <p className="text-[11px] leading-relaxed text-slate-400">
                After deleting, you can immediately register again using the same Participant ID or email to test challenges from scratch!
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Deleting & Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Yes, Delete & Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

