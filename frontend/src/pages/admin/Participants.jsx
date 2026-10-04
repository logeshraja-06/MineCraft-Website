import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  Power,
  RotateCcw,
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Calendar,
  Trash2,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function AdminParticipants() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('score');

  // Detail Modal
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getParticipants({
        search: search || undefined,
        status: statusFilter,
      });
      if (res.success) {
        setParticipants(res.participants);
      }
    } catch (err) {
      setToast({ message: 'Failed to fetch participants', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchParticipants();
  };

  const openDetails = async (id) => {
    try {
      setModalLoading(true);
      const res = await adminApi.getParticipant(id);
      if (res.success) {
        setSelectedParticipant(res.participant);
      }
    } catch (err) {
      setToast({ message: 'Failed to load participant profile', type: 'error' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await adminApi.toggleParticipantStatus(id);
      if (res.success) {
        setToast({ message: `Participant ${res.isActive ? 'enabled' : 'disabled'}`, type: 'info' });
        fetchParticipants();
      }
    } catch (err) {
      setToast({ message: 'Failed to update participant status', type: 'error' });
    }
  };

  const handleResetParticipant = async (id, name) => {
    if (!window.confirm(`Are you sure you want to reset all challenge progress and submissions for ${name}?`)) return;
    try {
      const res = await adminApi.resetParticipant(id);
      if (res.success) {
        setToast({ message: 'Participant progress reset', type: 'success' });
        if (selectedParticipant?._id === id) {
          openDetails(id);
        }
        fetchParticipants();
      }
    } catch (err) {
      setToast({ message: 'Reset failed', type: 'error' });
    }
  };

  const handleDeleteParticipant = async (id, name) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE participant "${name}"? This will delete their account and all test progress from the database.`)) return;
    try {
      const res = await adminApi.deleteParticipant(id);
      if (res.success) {
        setToast({ message: `Participant "${name}" deleted successfully`, type: 'success' });
        if (selectedParticipant?._id === id) {
          setSelectedParticipant(null);
        }
        fetchParticipants();
      }
    } catch (err) {
      setToast({ message: 'Delete failed', type: 'error' });
    }
  };


  // Sorting
  const sortedParticipants = [...participants].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'solved') return b.challengesCompleted - a.challengesCompleted;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="flex min-h-screen bg-slate-50 font-mono text-slate-800">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-wider flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-400" />
              PARTICIPANT SURVEILLANCE & ROSTER
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Audit registered contestants, performance metrics, reveal penalties, and live sessions
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchParticipants}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 bg-white/80 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, team ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-cyan-600 hover:bg-orange-500 text-slate-900 rounded-xl font-bold transition"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Arena</option>
                <option value="Completed">Completed</option>
                <option value="Idle">Idle</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold"
              >
                <option value="score">Highest Score</option>
                <option value="solved">Most Solved</option>
                <option value="name">Contestant Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Participants Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white/90 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Contestant</th>
                  <th className="px-4 py-3.5">College / Team</th>
                  <th className="px-4 py-3.5">Solved</th>
                  <th className="px-4 py-3.5">Score</th>
                  <th className="px-4 py-3.5">Submissions</th>
                  <th className="px-4 py-3.5">Accepted / Wrong</th>
                  <th className="px-4 py-3.5">Reveals Used</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-600">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-400" />
                      Loading participants...
                    </td>
                  </tr>
                ) : sortedParticipants.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-500">
                      No participants match the specified filter.
                    </td>
                  </tr>
                ) : (
                  sortedParticipants.map((p, idx) => (
                    <tr key={p._id} className="hover:bg-slate-100/40 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                        <div className="text-[10px] text-orange-400/80 font-mono">
                          {p.participantId} • {p.email}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        <div>{p.college}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{p.teamName}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900">{p.challengesCompleted}</span>
                        <span className="text-slate-500">/{p.challengesAttempted || 1}</span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-400 text-sm">
                        {p.score} PTS
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {p.submissionsCount}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-emerald-400 font-bold">{p.acceptedCount}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="text-rose-400 font-bold">{p.wrongCount}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {p.revealsCount}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            p.status === 'Active'
                              ? 'bg-cyan-950 text-orange-400 border border-cyan-800/60'
                              : p.status === 'Completed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : p.status === 'Disabled'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDetails(p._id)}
                            title="View Contestant Profile"
                            className="p-1.5 text-orange-400 hover:bg-cyan-950/40 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(p._id)}
                            title={p.isActive ? 'Disable Participant' : 'Enable Participant'}
                            className={`p-1.5 rounded-lg transition ${
                              p.isActive ? 'text-slate-600 hover:text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleResetParticipant(p._id, p.name)}
                            title="Reset Session Progress"
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteParticipant(p._id, p.name)}
                            title="Delete Participant Permanently"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PARTICIPANT DETAIL MODAL */}
        {selectedParticipant && (
          <div className="fixed inset-0 z-50 bg-slate-50/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-400" />
                    {selectedParticipant.name}
                  </h3>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {selectedParticipant.participantId} • {selectedParticipant.email} • {selectedParticipant.teamName}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Score</span>
                  <div className="text-xl font-black text-emerald-400">
                    {selectedParticipant.stats?.totalScore || 0} PTS
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Accuracy</span>
                  <div className="text-xl font-black text-orange-400">
                    {selectedParticipant.stats?.accuracy || '0%'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Accepted</span>
                  <div className="text-xl font-black text-slate-900">
                    {selectedParticipant.stats?.acceptedCount || 0} / {selectedParticipant.stats?.submissionsCount || 0}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Reveals Used</span>
                  <div className="text-xl font-black text-amber-400">
                    {selectedParticipant.stats?.revealsUsed || 0}
                  </div>
                </div>
              </div>

              {/* Submissions History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Submission History ({selectedParticipant.submissions?.length || 0})
                </h4>

                {(!selectedParticipant.submissions || selectedParticipant.submissions.length === 0) ? (
                  <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-200">
                    No submissions recorded yet for this participant.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white text-slate-600 uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Challenge</th>
                          <th className="px-3 py-2">Lang</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Tests</th>
                          <th className="px-3 py-2">Score</th>
                          <th className="px-3 py-2">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-700 text-[11px]">
                        {selectedParticipant.submissions.map((sub) => (
                          <tr key={sub._id}>
                            <td className="px-3 py-2 text-slate-900 font-semibold">{sub.challengeId?.title || 'Unknown'}</td>
                            <td className="px-3 py-2 uppercase text-slate-600">{sub.language}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  sub.status === 'ACCEPTED' ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {sub.testCasesPassed}/{sub.totalTestCases}
                            </td>
                            <td className="px-3 py-2 font-bold text-slate-900">{sub.score || 0}</td>
                            <td className="px-3 py-2 text-slate-500">
                              {new Date(sub.createdAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteParticipant(selectedParticipant._id, selectedParticipant.name)}
                  >
                    Delete Participant
                  </Button>

                  <Button
                    variant="warning"
                    size="sm"
                    icon={RotateCcw}
                    onClick={() => handleResetParticipant(selectedParticipant._id, selectedParticipant.name)}
                  >
                    Reset Progress
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedParticipant(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </main>
    </div>
  );
}
