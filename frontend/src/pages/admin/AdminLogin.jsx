import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLogin() {
  const { adminLogin, loading, error, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleAdminSignIn = async (credentials) => {
    try {
      await adminLogin(credentials);
      navigate('/admin', { replace: true });
    } catch {
      // Error message is stored in AuthContext and shown in LoginForm
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 font-mono relative">
      <div className="absolute w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative w-full max-w-md bg-[#0D0F18]/90 border border-purple-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.2)] backdrop-blur-2xl space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[10px] font-bold tracking-widest uppercase mb-2">
            <span>SECURE ACCESS</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-wider">ADMIN GATEWAY</h2>
          <p className="text-xs text-purple-300/70">MindCraft Blind Coding Platform Administrator</p>
        </div>
        <LoginForm onSubmit={handleAdminSignIn} isLoading={loading} error={error} />
        <div className="text-center pt-2 border-t border-purple-500/20 text-[11px] text-slate-400">
          Default Admin: <span className="text-purple-300 font-semibold">admin@mindcraft.io</span>
        </div>
      </div>
    </div>
  );
}
