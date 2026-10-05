import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';

/* ── Total seconds for the demo cycle (15:00 → 14:50 = 10s) ── */
const TOTAL = 10; // ticks from 900 down to 890, then resets

function formatTime(seconds) {
  const totalRemainder = 900 - seconds; // seconds elapsed from 15:00
  const displaySecs = 900 - totalRemainder; // 900 → 890
  const m = Math.floor(displaySecs / 60);
  const s = displaySecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function HudBar() {
  const [elapsed, setElapsed] = useState(0); // 0..TOTAL

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(e => (e >= TOTAL ? 0 : e + 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const timeLabel = formatTime(elapsed);
  const progressPct = ((TOTAL - elapsed) / TOTAL) * 100;

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* ── TIMER ── */}
      <div className="bg-slate-800/70 rounded-xl p-2.5 flex flex-col gap-1.5 border border-slate-700/60">
        <div className="flex items-center gap-1 mb-0.5">
          <Clock className="w-3 h-3 text-[#F28C0F]" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">Timer</span>
        </div>
        <span className="font-mono text-lg font-black text-white leading-none tabular-nums">
          {timeLabel}
        </span>
        {/* Orange progress bar */}
        <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#F28C0F] to-amber-400 rounded-full"
            style={{ width: `${progressPct}%` }}
            transition={{ duration: 0.9, ease: 'linear' }}
          />
        </div>
      </div>

      {/* ── SCORE ── */}
      <div className="bg-slate-800/70 rounded-xl p-2.5 flex flex-col gap-1 border border-slate-700/60">
        <div className="flex items-center gap-1 mb-0.5">
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">Score</span>
        </div>
        <span className="font-mono text-lg font-black text-white leading-none">0 PTS</span>
        <span className="font-mono text-[9px] text-slate-500">Baseline start</span>
      </div>

      {/* ── XP ── */}
      <div className="bg-slate-800/70 rounded-xl p-2.5 flex flex-col gap-1.5 border border-slate-700/60">
        <div className="flex items-center gap-1 mb-0.5">
          <Zap className="w-3 h-3 text-amber-400" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">XP</span>
        </div>
        {/* 5-segment bar, 2 filled */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 flex-1 rounded-sm ${i < 2 ? 'bg-[#F28C0F]' : 'bg-slate-700'}`}
            />
          ))}
        </div>
        <span className="font-mono text-[9px] text-slate-500">2 / 5 stages</span>
      </div>
    </div>
  );
}
