import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { ShieldAlert, Clock, CheckCircle, Layers } from 'lucide-react';

export default function Rules() {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleStart = () => {
    if (!agreed) return;
    navigate('/challenges');
  };

  const rulesList = [
    'Strict Linear Track: Complete Easy to unlock Medium, then Medium to unlock Hard. Challenges cannot be skipped or chosen.',
    'Single round timed challenge — 20:00 countdown starts immediately upon entering a challenge arena',
    'AI tools are strictly prohibited',
    'Internet lookups and external assistance are strictly prohibited',
    'Solve progressive quizzes to earn keys and unlock code fragments',
    'Each correct quiz answer unlocks one code block fragment',
    'Wrong quiz answers add a 20-second time penalty to your official tournament time',
    'After a wrong answer, a 3-second cooldown applies before the next attempt',
    'Collect all fragments, then arrange them in the correct execution order on the assembly board',
    'Run assembled code against sample tests, then submit for hidden test-case scoring',
    'ACCEPTED result commits your official time and points. Replay is locked after acceptance to protect leaderboard integrity.',
    'If your session expires without acceptance, you can RETRY your current challenge until solved.',
    'Leaderboard rank is determined by total score, then lowest total time + penalties.',
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 font-mono">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-[#F28C0F]" />
          <span>OFFICIAL EVENT REGULATIONS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          MIND CRAFT – Quiz Hunt & Code Assembly
        </h1>
        <p className="text-xs text-slate-600">
          Review the competition mechanics before entering the mission track
        </p>
      </div>

      {/* HOW PROGRESSION WORKS */}
      <div className="p-5 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-[#F28C0F] uppercase tracking-widest flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#F28C0F]" /> Linear Mission Progression
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed font-sans">
          Participants do not select challenges arbitrarily. You must progress through the canonical 3-tier sequence:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300">
            <span className="font-bold text-emerald-700 block">1. Easy (ch-05)</span>
            <span className="text-[11px] text-slate-600">Available immediately. 100 PTS.</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300">
            <span className="font-bold text-amber-700 block">2. Medium (ch-06)</span>
            <span className="text-[11px] text-slate-600">Unlocks once Easy is ACCEPTED. 200 PTS.</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300">
            <span className="font-bold text-rose-700 block">3. Hard (ch-07)</span>
            <span className="text-[11px] text-slate-600">Unlocks once Medium is ACCEPTED. 300 PTS.</span>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
        <h3 className="text-xs font-bold text-[#F28C0F] uppercase tracking-widest">How It Works</h3>
        <ol className="space-y-2 text-xs text-slate-700 list-none">
          {[
            '1. Select your preferred programming language (Python / C / C++ / Java)',
            '2. Answer progressive programming tasks to unlock code fragments',
            '3. Correct answer → code fragment unlocked into your fragment vault',
            '4. Wrong answer → +20s penalty → 3s cooldown → alternate question appears',
            '5. Collect all fragments, then assemble them in the correct execution order',
            '6. Click "Run Code" to test against sample input, then "Submit" for hidden tests',
            '7. ACCEPTED = advance to next challenge in sequence + commit leaderboard score',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle className="w-3.5 h-3.5 text-[#F28C0F] mt-0.5 flex-shrink-0" />
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* RULES LIST */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-[#F28C0F] uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#F28C0F]" /> Tournament Rules
        </h3>
        <ul className="space-y-2.5 text-xs text-slate-700">
          {rulesList.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="text-[#F28C0F] font-bold">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* DURATION BADGE */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">
            Challenge Duration
          </span>
          <span className="text-3xl font-black text-slate-900 font-mono tracking-wider">20:00</span>
        </div>
        <div className="text-right text-xs text-slate-600">
          <p>Countdown starts immediately upon entry</p>
          <p className="text-rose-500 font-semibold mt-1">Wrong quiz answers add +20s each</p>
        </div>
      </div>

      {/* AGREEMENT */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
        <label className="flex items-center gap-3 cursor-pointer select-none text-xs text-slate-700 hover:text-slate-900 transition">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 rounded bg-white border-slate-300 text-[#F28C0F] focus:ring-orange-400 cursor-pointer"
          />
          <span>I have read and agree to all rules, linear unlock constraints, and timing protocols</span>
        </label>

        <Button
          variant="primary"
          size="lg"
          disabled={!agreed}
          onClick={handleStart}
          className="w-full text-sm font-black bg-[#F28C0F] hover:bg-orange-500 text-slate-950"
        >
          ENTER MISSION ROADMAP
        </Button>
      </div>
    </div>
  );
}
