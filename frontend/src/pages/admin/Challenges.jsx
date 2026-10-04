import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import {
  Code2,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Copy,
  Trash2,
  Play,
  Archive,
  CheckCircle,
  RefreshCw,
  Blocks,
  FileCheck,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function AdminChallenges() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [langFilter, setLangFilter] = useState('All');

  // Preview Modal
  const [previewChallenge, setPreviewChallenge] = useState(null);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getChallenges({
        search: search || undefined,
        difficulty: difficultyFilter,
        status: statusFilter,
        language: langFilter,
      });
      if (res.success) {
        setChallenges(res.challenges);
      }
    } catch (err) {
      setToast({ message: 'Failed to fetch challenges from database', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const participantFacing = challenges.filter(
    (c) => c.status === 'Published' && c.isActive !== false && [1, 2, 3].includes(Number(c.sequenceOrder))
  );
  const sequenceOrderSet = new Set(participantFacing.map((c) => Number(c.sequenceOrder)));
  const isSequenceValid =
    participantFacing.length === 3 &&
    sequenceOrderSet.has(1) &&
    sequenceOrderSet.has(2) &&
    sequenceOrderSet.has(3);

  useEffect(() => {
    fetchChallenges();
  }, [difficultyFilter, statusFilter, langFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchChallenges();
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await adminApi.duplicateChallenge(id);
      if (res.success) {
        setToast({ message: 'Challenge duplicated successfully', type: 'success' });
        fetchChallenges();
      }
    } catch (err) {
      setToast({ message: 'Duplication failed', type: 'error' });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await adminApi.updateChallenge(id, { status: newStatus, isActive: newStatus === 'Published' });
      if (res.success) {
        setToast({ message: `Challenge marked as ${newStatus}`, type: 'success' });
        fetchChallenges();
      }
    } catch (err) {
      setToast({ message: 'Status update failed', type: 'error' });
    }
  };

  const handleDelete = (c) => {
    const id = c._id || c.id;
    const title = c.title || 'Untitled Challenge';
    const slug = c.slug || '';
    setDeleteTarget({ id, title, slug });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      setDeleting(true);
      const res = await adminApi.deleteChallenge(deleteTarget.id);
      if (res && res.success !== false) {
        setToast({ message: `Challenge "${deleteTarget.title}" deleted successfully`, type: 'success' });
        // Optimistically remove from state immediately
        setChallenges((prev) =>
          prev.filter((item) => (item._id || item.id) !== deleteTarget.id && item.slug !== deleteTarget.slug)
        );
        setDeleteTarget(null);
        fetchChallenges();
      } else {
        setToast({ message: res?.message || 'Delete failed', type: 'error' });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message || 'Failed to delete challenge',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const openPreview = async (id) => {
    try {
      const res = await adminApi.getChallenge(id);
      if (res.success) {
        setPreviewChallenge(res.challenge);
      }
    } catch (err) {
      setToast({ message: 'Failed to load challenge preview', type: 'error' });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-mono text-slate-800">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-wider flex items-center gap-2">
              <Code2 className="w-6 h-6 text-orange-400" />
              CHALLENGE MANAGEMENT
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Configure, split, publish, and audit code assembly problems
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchChallenges}
              disabled={loading}
            >
              Refresh
            </Button>
            <Link to="/admin/challenges/create">
              <Button variant="primary" size="sm" icon={PlusCircle}>
                Create Challenge
              </Button>
            </Link>
          </div>
        </div>

        {/* Canonical Sequence Warning Banner */}
        {!loading && (
          !isSequenceValid ? (
            <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/60 text-amber-200 flex items-start gap-3 shadow-lg">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                ⚠️
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-amber-300 uppercase tracking-wide">
                  Participant Sequence Alert: Exactly 3 Challenges Required
                </h4>
                <p className="text-amber-200/90 leading-relaxed font-sans">
                  The participant-facing arena requires <strong>exactly 3 published challenges</strong> assigned to sequence positions <strong>1 (Easy), 2 (Medium), and 3 (Hard)</strong>.
                  Currently assigned: {participantFacing.length} / 3 (positions: {Array.from(sequenceOrderSet).sort().join(', ') || 'none'}).
                  Please edit challenges and configure sequence positions 1, 2, and 3 so participants can progress.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Canonical 3-challenge sequence active: <strong>1: Easy</strong> → <strong>2: Medium</strong> → <strong>3: Hard</strong></span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Roadmap Ready
              </span>
            </div>
          )
        )}

        {/* Filters & Search Toolbar */}
        <div className="p-4 bg-white/80 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, slug, keywords..."
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600">Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
              >
                <option value="All">All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
              >
                <option value="All">All</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600">Language:</span>
              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
              >
                <option value="All">All</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
          </div>
        </div>

        {/* Challenges Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white/90 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Sequence</th>
                  <th className="px-4 py-3.5">Challenge Title</th>
                  <th className="px-4 py-3.5">Difficulty</th>
                  <th className="px-4 py-3.5">Language</th>
                  <th className="px-4 py-3.5">Points</th>
                  <th className="px-4 py-3.5">Blocks</th>
                  <th className="px-4 py-3.5">Test Cases</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-600">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-400" />
                      Loading challenges from database...
                    </td>
                  </tr>
                ) : challenges.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-500">
                      No challenges found matching filters. Click "Create Challenge" to create one.
                    </td>
                  </tr>
                ) : (
                  challenges.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-100/40 transition">
                      <td className="px-4 py-3.5">
                        {c.sequenceOrder === 1 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            1 // Easy
                          </span>
                        ) : c.sequenceOrder === 2 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            2 // Medium
                          </span>
                        ) : c.sequenceOrder === 3 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            3 // Hard
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded text-slate-500 bg-slate-100 border border-slate-200">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{c.title}</div>
                        <div className="text-[10px] text-orange-500/80 font-mono">slug: {c.slug}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            c.difficulty === 'Easy'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : c.difficulty === 'Hard'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                              : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                          }`}
                        >
                          {c.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 uppercase text-slate-700 font-semibold">
                        {c.sourceLanguage || 'Java'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-400">
                        {c.points} PTS
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <Blocks className="w-3.5 h-3.5 text-orange-400" />
                          <strong>{c.blockCount || c.blockConfig?.totalBlocks || 0}</strong> blocks
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <strong>{c.testCaseCount || 0}</strong> tests
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            c.status === 'Published'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                              : c.status === 'Archived'
                              ? 'bg-slate-100 text-slate-600 border border-slate-300'
                              : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openPreview(c._id)}
                            title="Preview as Participant"
                            className="p-1.5 text-orange-400 hover:bg-cyan-950/40 rounded-lg transition"
                          >
                            <Play className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/admin/challenges/${c._id}/edit`}
                            title="Edit Challenge"
                            className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDuplicate(c._id)}
                            title="Duplicate Challenge"
                            className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {c.status !== 'Published' ? (
                            <button
                              onClick={() => handleStatusChange(c._id, 'Published')}
                              title="Publish"
                              className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(c._id, 'Draft')}
                              title="Unpublish (Draft)"
                              className="p-1.5 text-amber-400 hover:bg-amber-950/40 rounded-lg transition"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(c)}
                            title="Delete Challenge"
                            className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
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

        {/* PREVIEW AS PARTICIPANT MODAL */}
        {previewChallenge && (
          <div className="fixed inset-0 z-50 bg-slate-50/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-orange-400" />
                  <h3 className="text-base font-bold text-slate-900">
                    PARTICIPANT PREVIEW: {previewChallenge.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewChallenge(null)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>

              {/* Problem info */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-orange-400 font-bold uppercase">{previewChallenge.category}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">{previewChallenge.points} PTS</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{previewChallenge.difficulty}</span>
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {previewChallenge.description}
                </p>
                {previewChallenge.instructions && (
                  <p className="text-slate-600 italic text-[11px] pt-1">
                    Instructions: {previewChallenge.instructions}
                  </p>
                )}
              </div>

              {/* Code Blocks generated */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-orange-400 uppercase">
                    Code Fragments Generated ({previewChallenge.blocks?.length || 0})
                  </h4>
                  <span className="text-[11px] text-slate-600">
                    Initially visible: {previewChallenge.blockConfig?.initialVisibleCount || 3}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                  {(previewChallenge.blocks || []).map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-orange-400">{b.blockId}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {b.blockType}
                        </span>
                        <span className="text-emerald-400 font-semibold">
                          Order #{b.originalOrder}
                        </span>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-800 bg-white p-2 rounded overflow-x-auto">
                        {b.codeSnippet}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Cases */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase">
                  Configured Test Cases ({previewChallenge.testCases?.length || 0})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {(previewChallenge.testCases || []).map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-700">Test #{idx + 1}</span>
                        <span className={tc.isHidden ? 'text-amber-400' : 'text-emerald-400'}>
                          {tc.isHidden ? 'Hidden' : 'Visible'} ({tc.weight || 20} pts)
                        </span>
                      </div>
                      <div className="text-slate-600">Input: <code className="text-slate-900">{tc.input || '(empty)'}</code></div>
                      <div className="text-slate-600">Expected: <code className="text-cyan-300">{tc.expectedOutput}</code></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <Link to={`/challenge?id=${previewChallenge._id}`} target="_blank">
                  <Button variant="primary" size="sm" icon={Play}>
                    Launch in Arena
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM DELETE MODAL */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 bg-rose-950/80 border border-rose-500/30 rounded-xl">
                  <Trash2 className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-wide">PERMANENTLY DELETE CHALLENGE?</h3>
                  <p className="text-[11px] text-rose-300/80">This action cannot be undone</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="text-slate-700">
                  You are about to delete <strong className="text-slate-900 font-bold">"{deleteTarget.title}"</strong>
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  All associated QR code blocks, test cases, contestant submissions, and active participant sessions for this challenge will be purged from the database.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 text-slate-900 text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-950/50"
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Permanently
                    </>
                  )}
                </button>
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
