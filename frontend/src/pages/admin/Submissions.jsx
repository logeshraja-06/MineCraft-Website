import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import {
  Send,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [langFilter, setLangFilter] = useState('All');

  // Detail Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSubmissions({
        status: statusFilter,
        language: langFilter,
      });
      if (res.success) {
        setSubmissions(res.submissions);
      }
    } catch (err) {
      setToast({ message: 'Failed to fetch submissions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 10000);
    const stopPolling = () => clearInterval(interval);
    window.addEventListener('mindcraft_auth_expired', stopPolling);
    return () => {
      clearInterval(interval);
      window.removeEventListener('mindcraft_auth_expired', stopPolling);
    };
  }, [statusFilter, langFilter]);


  const openSubmissionDetails = async (id) => {
    try {
      setModalLoading(true);
      const res = await adminApi.getSubmission(id);
      if (res.success) {
        setSelectedSubmission(res.submission);
      }
    } catch (err) {
      setToast({ message: 'Failed to load submission audit details', type: 'error' });
    } finally {
      setModalLoading(false);
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
              <Send className="w-6 h-6 text-purple-400" />
              SUBMISSION AUDIT & JUDGING LOGS
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Audit assembled block orders, Judge0 evaluation output, test breakdown, and penalty deductions
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchSubmissions}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white/80 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600">Result Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
              >
                <option value="All">All Results</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="WRONG_ANSWER">Wrong Answer</option>
                <option value="COMPILATION_ERROR">Compilation Error</option>
                <option value="RUNTIME_ERROR">Runtime Error</option>
                <option value="TIME_LIMIT_EXCEEDED">Time Limit Exceeded</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600">Language:</span>
              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
              >
                <option value="All">All Languages</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-600">
            Total Audited: <strong className="text-slate-900">{submissions.length}</strong>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white/90 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Submission ID</th>
                  <th className="px-4 py-3.5">Participant</th>
                  <th className="px-4 py-3.5">Challenge</th>
                  <th className="px-4 py-3.5">Lang</th>
                  <th className="px-4 py-3.5">Result</th>
                  <th className="px-4 py-3.5">Passed Tests</th>
                  <th className="px-4 py-3.5">Score</th>
                  <th className="px-4 py-3.5">Exec Time</th>
                  <th className="px-4 py-3.5">Submitted At</th>
                  <th className="px-4 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-slate-600">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-400" />
                      Loading submission records...
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-slate-500">
                      No submissions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  submissions.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-100/40 transition">
                      <td className="px-4 py-3.5 font-bold text-orange-400 font-mono">
                        #{s._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{s.userId?.name || 'Anonymous'}</div>
                        <div className="text-[10px] text-slate-500">{s.userId?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {s.challengeId?.title || 'Unknown'}
                      </td>
                      <td className="px-4 py-3.5 uppercase font-bold text-slate-600">
                        {s.language}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            s.status === 'ACCEPTED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : s.status === 'WRONG_ANSWER'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                              : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {s.testCasesPassed}/{s.totalTestCases}
                      </td>
                      <td className="px-4 py-3.5 font-black text-emerald-400">
                        {s.score || 0}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {s.executionTimeMs ? `${s.executionTimeMs}ms` : '0ms'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {new Date(s.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => openSubmissionDetails(s._id)}
                          className="p-1.5 hover:bg-slate-100 text-orange-400 rounded-lg transition"
                          title="Inspect Submission"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUBMISSION INSPECTION MODAL */}
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 bg-slate-50/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-orange-400" />
                  <h3 className="text-base font-bold text-slate-900">
                    AUDIT REPORT: SUBMISSION #{selectedSubmission._id.slice(-8).toUpperCase()}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>

              {/* Contestant and Challenge metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Participant</span>
                  <div className="font-bold text-slate-900 truncate">{selectedSubmission.userId?.name}</div>
                  <div className="text-[10px] text-slate-600">{selectedSubmission.userId?.email}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Challenge</span>
                  <div className="font-bold text-cyan-300 truncate">{selectedSubmission.challengeId?.title}</div>
                  <div className="text-[10px] text-slate-600 uppercase">{selectedSubmission.language}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Final Score</span>
                  <div className="text-xl font-black text-emerald-400">{selectedSubmission.score || 0} PTS</div>
                  <div className="text-[10px] text-rose-400">
                    Penalties: -{selectedSubmission.revealPenalty || 0} reveals
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Judging Result</span>
                  <div className="font-bold text-slate-900">{selectedSubmission.status}</div>
                  <div className="text-[10px] text-slate-600">
                    Passed: {selectedSubmission.testCasesPassed}/{selectedSubmission.totalTestCases}
                  </div>
                </div>
              </div>

              {/* Assembled Source Code */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
                  <span>Assembled Code Submitted by Participant</span>
                  <span className="text-[10px] text-slate-500">
                    Execution time: {selectedSubmission.executionTimeMs || 0}ms
                  </span>
                </label>
                <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 leading-relaxed overflow-x-auto max-h-56">
                  {selectedSubmission.code}
                </pre>
              </div>

              {/* Block Order vs Expected Block Order */}
              {selectedSubmission.expectedBlocks && selectedSubmission.expectedBlocks.length > 0 && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-orange-400 uppercase tracking-wider">
                      Ground Truth Block Order Verification
                    </span>
                    <span className="text-[10px] text-slate-600">Admin Inspection View</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Expected Sequence:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedSubmission.expectedBlocks.map((b) => (
                          <span
                            key={b.blockId}
                            className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-bold text-[10px]"
                          >
                            {b.blockId} (#{b.originalOrder})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Assembled Block IDs:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedSubmission.assembledBlockIds || []).length > 0 ? (
                          selectedSubmission.assembledBlockIds.map((id, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold text-[10px]"
                            >
                              {id}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Direct code submission</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Cases Results Detail */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Test Case Execution Breakdown ({selectedSubmission.testCaseResults?.length || 0})
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(selectedSubmission.testCaseResults || []).map((tr, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-900">Test Case #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          {tr.isHidden && (
                            <span className="text-amber-400 font-bold">[Hidden in Contest]</span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              tr.passed ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {tr.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div className="space-y-0.5">
                          <span className="text-slate-500">Input:</span>
                          <pre className="p-1.5 bg-white rounded text-slate-700">{tr.input || '(empty)'}</pre>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-slate-500">Expected:</span>
                          <pre className="p-1.5 bg-white rounded text-emerald-400">{tr.expectedOutput}</pre>
                        </div>
                      </div>

                      {tr.actualOutput && (
                        <div className="space-y-0.5 text-[11px]">
                          <span className="text-slate-500">Actual Output:</span>
                          <pre className="p-1.5 bg-white rounded text-slate-700">{tr.actualOutput}</pre>
                        </div>
                      )}

                      {tr.runtimeError && (
                        <div className="space-y-0.5 text-[11px]">
                          <span className="text-rose-400 font-bold">Runtime Error:</span>
                          <pre className="p-1.5 bg-rose-950/60 rounded text-rose-300">{tr.runtimeError}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
