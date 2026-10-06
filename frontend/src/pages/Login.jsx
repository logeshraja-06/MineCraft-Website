import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import ParticipantForm from '../components/auth/ParticipantForm';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [tab, setTab] = useState('participant'); // 'participant' | 'admin'
  const { login, adminLogin, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleParticipantJoin = async (credentials) => {
    try {
      await login(credentials);
      navigate('/challenge');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminSignIn = async (credentials) => {
    try {
      await adminLogin(credentials);
      navigate('/admin');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#07080D] text-slate-100 font-mono">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0D0F18]/90 border border-purple-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.18)] backdrop-blur-xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest shadow-sm">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]" />
            BUILT FOR CREATORS // ACCESS PORTAL
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Mind Craft Portal</h2>
          <p className="text-xs text-purple-200/60 font-sans">Enter arena credentials or admin authorization</p>
        </div>

        <div className="flex border-b border-purple-500/20 text-xs font-semibold">
          <button
            onClick={() => setTab('participant')}
            className={`flex-1 pb-3 text-center border-b-2 transition ${
              tab === 'participant' ? 'border-purple-400 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'border-transparent text-purple-300/50 hover:text-purple-200'
            }`}
          >
            Participant Entry
          </button>
          <button
            onClick={() => setTab('admin')}
            className={`flex-1 pb-3 text-center border-b-2 transition ${
              tab === 'admin' ? 'border-purple-400 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'border-transparent text-purple-300/50 hover:text-purple-200'
            }`}
          >
            Admin Sign In
          </button>
        </div>

        {tab === 'participant' ? (
          <ParticipantForm onJoin={handleParticipantJoin} isLoading={loading} error={error} />
        ) : (
          <LoginForm onSubmit={handleAdminSignIn} isLoading={loading} error={error} />
        )}
      </div>
    </div>
  );
}
