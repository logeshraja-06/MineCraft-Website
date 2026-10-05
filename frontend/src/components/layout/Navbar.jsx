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
    ...(isAdmin ? [{ label: 'Leaderboard', to: '/admin/leaderboard' }] : []),
    ...(isAdmin ? [{ label: 'Admin', to: '/admin' }] : []),
  ];

  const currentDisplayName = participant?.name || user?.name || (isAdmin ? 'Administrator' : null);
  const currentParticipantId = participant?.participantId || user?.participantId;
  const currentEmail = participant?.email || user?.email;

  return (
    <>
      <nav className="bg-white sticky top-0 z-40 px-6 py-4 shadow-sm font-sans border-b border-slate-100">
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

          {/* ACTION / PARTICIPANT PROFILE DROPDOWN */}
          <div className="flex items-center gap-4">
            {currentDisplayName ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-[#F28C0F] group-hover:text-slate-950 transition-colors">
                    {currentDisplayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-sm font-bold text-slate-800 block truncate max-w-[130px] leading-tight">
                      {currentDisplayName}
                    </span>
                    <span className="text-[11px] text-[#F28C0F] block font-semibold leading-tight mt-0.5">
                      {currentParticipantId || (isAdmin ? 'Admin' : 'Participant')}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${menuOpen ? 'rotate-180 text-slate-800' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 pb-3 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{currentDisplayName}</p>
                      {currentParticipantId && (
                        <p className="text-xs text-[#F28C0F] font-semibold mt-0.5">ID: {currentParticipantId}</p>
                      )}
                      {currentEmail && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{currentEmail}</p>
                      )}
                    </div>

                    <div className="py-2 px-2 space-y-1">
                      {/* Standard Logout */}
                      <button
                        onClick={handleStandardLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-slate-500" />
                        <span>Log Out</span>
                      </button>

                      {/* Delete Participant & Reset for Multi Testing (only for participants) */}
                      {!isAdmin && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setShowDeleteModal(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-left group"
                          title="Wipes this participant record from DB so you can test again with the same ID"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                          <div className="flex-1">
                            <span className="block font-bold">Logout & Delete Details</span>
                            <span className="block text-[10px] text-rose-500 font-normal">Test reset: wipe participant & re-test</span>
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
                className="px-8 py-3 rounded-full bg-[#F28C0F] hover:bg-orange-500 text-slate-950 font-bold text-base transition flex items-center gap-2 shadow-sm hover:shadow"
              >
                Register <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Confirmation Modal for Logout & Delete Participant Details */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete Participant & Reset?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This will permanently delete participant <span className="font-bold text-slate-800">"{currentDisplayName}"</span> ({currentParticipantId}) and all test progress, attempts, and submissions from the database.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> For Multi-Time Testing:
              </p>
              <p className="text-[11px] leading-relaxed text-amber-700">
                After deleting, you can immediately register again using the same Participant ID or email to test challenges from scratch!
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
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

