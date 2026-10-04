import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Shield,
  Sliders,
  Clock,
  Award,
  Lock,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    competitionName: 'MindCraft National Blind Coding Championship 2026',
    duration: 60,
    maxParticipants: 100,
    defaultChallengeTime: 20,
    allowLateJoin: true,
    allowReattempt: true,
    revealPenalty: 5,
    wrongSubmissionPenalty: 2,
    leaderboardVisibility: 'Public',
    autoSubmit: true,
    sessionTimeout: 60,
    enforceProgression: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      setToast({ message: 'Failed to load settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await adminApi.updateSettings(settings);
      if (res.success) {
        setToast({ message: 'Competition settings updated and active!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Failed to update settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-mono text-slate-800">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-wider flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-slate-600" />
              COMPETITION POLICIES & ARENA SETTINGS
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Configure competition duration, penalty rates, reveal parameters, and security policies
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchSettings}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* GENERAL INFO */}
          <div className="p-6 bg-white/90 border border-slate-200 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4" /> EVENT PARAMETERS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-slate-600 font-bold">Competition Name</label>
                <input
                  type="text"
                  value={settings.competitionName}
                  onChange={(e) => setSettings({ ...settings, competitionName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Event Total Duration (Minutes)</label>
                <input
                  type="number"
                  value={settings.duration}
                  onChange={(e) => setSettings({ ...settings, duration: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-amber-400 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Default Challenge Time (Minutes)</label>
                <input
                  type="number"
                  value={settings.defaultChallengeTime}
                  onChange={(e) => setSettings({ ...settings, defaultChallengeTime: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-cyan-300 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Max Concurrent Participants</label>
                <input
                  type="number"
                  value={settings.maxParticipants}
                  onChange={(e) => setSettings({ ...settings, maxParticipants: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Leaderboard Visibility</label>
                <select
                  value={settings.leaderboardVisibility}
                  onChange={(e) => setSettings({ ...settings, leaderboardVisibility: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  <option value="Public">Public (All Participants)</option>
                  <option value="AdminOnly">Admin Only (Hidden from Students)</option>
                  <option value="Frozen">Frozen (Final Scoreboard Locked)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SCORING & PENALTIES */}
          <div className="p-6 bg-white/90 border border-slate-200 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4" /> GLOBAL SCORING & PENALTIES
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Reveal Penalty (Points per Unlocked Block)</label>
                <input
                  type="number"
                  value={settings.revealPenalty}
                  onChange={(e) => setSettings({ ...settings, revealPenalty: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-rose-400 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-bold">Wrong Submission Penalty (Points per Failed Submit)</label>
                <input
                  type="number"
                  value={settings.wrongSubmissionPenalty}
                  onChange={(e) => setSettings({ ...settings, wrongSubmissionPenalty: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-rose-400 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={settings.allowLateJoin}
                  onChange={(e) => setSettings({ ...settings, allowLateJoin: e.target.checked })}
                  className="rounded bg-white border-slate-300"
                />
                <span className="text-slate-700 font-semibold">Allow Late Registration</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={settings.allowReattempt}
                  onChange={(e) => setSettings({ ...settings, allowReattempt: e.target.checked })}
                  className="rounded bg-white border-slate-300"
                />
                <span className="text-slate-700 font-semibold">Allow Reattempt on Failure</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={settings.autoSubmit}
                  onChange={(e) => setSettings({ ...settings, autoSubmit: e.target.checked })}
                  className="rounded bg-white border-slate-300"
                />
                <span className="text-slate-700 font-semibold">Auto-Submit on Timer Expiry</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3.5 bg-slate-950/80 rounded-xl border border-cyan-800/60 hover:border-cyan-500/70 transition-colors sm:col-span-3">
                <input
                  type="checkbox"
                  checked={settings.enforceProgression ?? true}
                  onChange={(e) => setSettings({ ...settings, enforceProgression: e.target.checked })}
                  className="mt-0.5 rounded bg-slate-900 border-cyan-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-cyan-300 font-bold block text-xs">Enforce Easy → Medium → Hard progression</span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">
                    When enabled, participants must solve Easy to unlock Medium, and solve Medium to unlock Hard. When disabled, all challenges are accessible immediately.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={Save}
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving Policies...' : 'Save Competition Settings'}
            </Button>
          </div>
        </form>

        {/* SECURITY & ADMIN CREDENTIALS */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4" /> ADMIN SECURITY & ACCESS CREDENTIALS
          </h3>
          <p className="text-xs text-slate-400">
            Update your master admin console authentication password.
          </p>

          <AdminPasswordForm setToast={setToast} />
        </div>

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </main>
    </div>
  );
}

function AdminPasswordForm({ setToast }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    try {
      setChanging(true);
      const res = await adminApi.changePassword(currentPassword, newPassword);
      if (res.success) {
        setToast({ message: 'Admin password successfully updated!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Password update failed', type: 'error' });
    } finally {
      setChanging(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md text-xs">
      <div className="space-y-1.5">
        <label className="text-slate-400 font-bold">Current Master Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          placeholder="Enter current password"
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-slate-400 font-bold">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          placeholder="Enter new password (min 6 chars)"
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-slate-400 font-bold">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Confirm new password"
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        type="submit"
        disabled={changing}
        className="border-amber-500/40 text-amber-300 hover:bg-amber-950/40"
      >
        {changing ? 'Updating Password...' : 'Update Admin Password'}
      </Button>
    </form>
  );
}

