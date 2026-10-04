import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import {
  QrCode,
  Download,
  Printer,
  RefreshCw,
  Code2,
  FileCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function QRManager() {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function loadChallenges() {
      try {
        setLoading(true);
        const res = await adminApi.getChallenges();
        if (res.success && res.challenges) {
          setChallenges(res.challenges);
          if (res.challenges.length > 0) {
            setSelectedChallengeId(res.challenges[0]._id);
          }
        }
      } catch (err) {
        setToast({ message: 'Failed to load challenges', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    loadChallenges();
  }, []);

  const handleGenerateQRs = async () => {
    if (!selectedChallengeId) return;
    try {
      setGenerating(true);
      const res = await adminApi.generateQRs(selectedChallengeId);
      if (res.success) {
        setBlocks(res.blocks || []);
        setToast({
          message: `Generated QR codes for ${res.blocks?.length || 0} code blocks!`,
          type: 'success',
        });
      }
    } catch (err) {
      setToast({ message: 'Failed to generate QR codes', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (selectedChallengeId) {
      handleGenerateQRs();
    }
  }, [selectedChallengeId]);

  const filteredBlocks = blocks.filter((b) => {
    if (selectedLang === 'all') return true;
    return b.language?.toLowerCase() === selectedLang.toLowerCase();
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSingleQR = (block) => {
    const link = document.createElement('a');
    link.href = block.qrDataUrl;
    link.download = `QR-${block.blockId}-${block.language}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-mono text-slate-800">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
        <div className="print:hidden">
          <Header
            title="QR Code Dispatch & Batch Printing"
            subtitle="Generate printable QR sheets, cryptographically sign and export physical QR matrix cards for challenge fragments."
          />
        </div>

        {/* Controls Toolbar (hidden during print) */}
        <div className="print:hidden p-5 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                Select Challenge
              </label>
              <select
                value={selectedChallengeId}
                onChange={(e) => setSelectedChallengeId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              >
                {challenges.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title} ({c.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                Language Filter
              </label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Languages</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="java">Java</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleGenerateQRs}
              disabled={generating || !selectedChallengeId}
            >
              {generating ? 'Regenerating...' : 'Regenerate Hashes'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              disabled={filteredBlocks.length === 0}
            >
              Print QR Sheet
            </Button>
          </div>
        </div>

        {/* QR Blocks Grid */}
        {filteredBlocks.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl text-slate-500 bg-white">
            <QrCode className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-bold text-slate-700">No QR blocks found for this challenge.</p>
            <p className="text-xs text-slate-500 mt-1">Select a challenge or click Regenerate Hashes to initialize.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
            {filteredBlocks.map((block) => (
              <div
                key={block.blockId + block.language}
                className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-between text-center space-y-4 shadow-sm print:bg-white print:border-black print:text-black print:break-inside-avoid"
              >
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#F28C0F] print:text-black uppercase">
                      {block.language}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 print:bg-gray-200 print:text-black text-[10px]">
                      {block.type || 'LOGIC'}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 print:text-black truncate">
                    {block.title || `Block ${block.blockId}`}
                  </h3>
                </div>

                {/* QR Code image */}
                <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-200 print:border-black">
                  <img
                    src={block.qrDataUrl}
                    alt={`QR for ${block.blockId}`}
                    className="w-40 h-40 object-contain mx-auto"
                  />
                </div>

                <div className="w-full space-y-1">
                  <p className="font-mono text-[10px] text-slate-600 print:text-black truncate select-all">
                    {block.qrToken}
                  </p>
                  <p className="text-[10px] text-slate-400 print:text-gray-600">
                    ID: {block.blockId}
                  </p>
                </div>

                <div className="print:hidden w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={() => handleDownloadSingleQR(block)}
                    className="w-full justify-center text-xs"
                  >
                    Save PNG
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </div>
  );
}
