import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import {
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle,
  Trophy,
  Users,
  Award,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function AdminResults() {
  const [loading, setLoading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);
  const [downloadingParticipants, setDownloadingParticipants] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [toast, setToast] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getLeaderboard();
      if (res.success) {
        setRankings(res.rankings);
      }
    } catch (err) {
      setToast({ message: 'Failed to load results summary', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleExportCSV = async () => {
    try {
      setDownloadingCSV(true);
      await adminApi.exportLeaderboard('csv');
      setToast({ message: 'Results CSV successfully exported and downloaded!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Results CSV export failed', type: 'error' });
    } finally {
      setDownloadingCSV(false);
    }
  };

  const handleExportParticipants = async () => {
    try {
      setDownloadingParticipants(true);
      await adminApi.exportParticipants('csv');
      setToast({ message: 'Participant name list (.csv) downloaded successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Participant list export failed', type: 'error' });
    } finally {
      setDownloadingParticipants(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloadingExcel(true);
      await adminApi.downloadExcel();
      setToast({ message: 'Excel file (.xlsx) successfully generated and downloaded!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Excel generation failed', type: 'error' });
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await adminApi.downloadPdf();
      setToast({ message: 'Official PDF report successfully generated and downloaded!', type: 'success' });
    } catch (err) {
      setToast({ message: 'PDF report generation failed', type: 'error' });
    } finally {
      setDownloadingPdf(false);
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
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              OFFICIAL RESULTS & EXPORT SUITE
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Generate and stream certified competition reports, multi-sheet Excel scorecards, formatted PDFs, and contestant rosters
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
              disabled={downloadingCSV}
            >
              {downloadingCSV ? 'Exporting...' : 'Export Results'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportParticipants}
              disabled={downloadingParticipants}
            >
              {downloadingParticipants ? 'Downloading...' : 'Download Participant List'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchSummary}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Download Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Excel Card */}
          <div className="p-6 bg-white/90 border border-slate-200 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Excel Official Workbook (.xlsx)</h3>
                  <span className="text-[11px] text-emerald-400 font-semibold">Multi-Sheet Comprehensive Audit</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Contains full contestant standings, participant IDs, total points, challenges attempted/solved, accuracy percentages, reveals used, time taken, and complete submission history.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div>• Sheet 1: Leaderboard Standings & Penalty Audit</div>
                <div>• Sheet 2: Challenge Problem Catalog</div>
                <div>• Sheet 3: Submission Execution Records</div>
              </div>
            </div>

            <Button
              variant="emerald"
              size="md"
              icon={Download}
              onClick={handleDownloadExcel}
              disabled={downloadingExcel}
              className="w-full justify-center"
            >
              {downloadingExcel ? 'Generating Workbook...' : 'Download Excel (.xlsx)'}
            </Button>
          </div>

          {/* PDF Card */}
          <div className="p-6 bg-white/90 border border-slate-200 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-orange-500/40 flex items-center justify-center text-orange-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Certificate PDF Report (.pdf)</h3>
                  <span className="text-[11px] text-orange-400 font-semibold">Print-Ready Document with Branding</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Generates a clean vector PDF summary report suitable for institution archives, organizers, and contestant awards, with header banners, executive summary statistics, and ranking tables.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div>• Top Statistics (Contestants, Solved, High Score)</div>
                <div>• Formatted Standings Table with College Names</div>
                <div>• Certified Timestamp & Institution Signature Area</div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Download}
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="w-full justify-center"
            >
              {downloadingPdf ? 'Compiling PDF Document...' : 'Download PDF Report (.pdf)'}
            </Button>
          </div>
        </div>

        {/* Live Standings Preview Table */}
        <div className="p-6 bg-white/90 border border-slate-200 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Live Standings Snapshot ({rankings.length} Contestants)
            </h3>
            <span className="text-xs text-slate-600 font-semibold">
              Exports reflect this current dataset
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">College</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Solved</th>
                  <th className="px-4 py-3">Submissions</th>
                  <th className="px-4 py-3">Accuracy</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-700">
                {rankings.slice(0, 10).map((r) => (
                  <tr key={r.rank} className="hover:bg-slate-100/40">
                    <td className="px-4 py-3 font-bold text-orange-400">#{r.rank}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-[10px] text-slate-500">{r.participantId}</div>
                    </td>
                    <td className="px-4 py-3">{r.college}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">{r.totalScore} PTS</td>
                    <td className="px-4 py-3 font-semibold">{r.challengesSolved}</td>
                    <td className="px-4 py-3">{r.totalSubmissions}</td>
                    <td className="px-4 py-3 text-cyan-300">{r.accuracy}</td>
                    <td className="px-4 py-3 text-slate-600">{r.timeFormatted}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </main>
    </div>
  );
}
