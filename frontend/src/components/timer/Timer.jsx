import React from 'react';
import { formatTime } from '../../utils/timer';
import { Clock } from 'lucide-react';

export default function Timer({ secondsRemaining = 0, timerState = 'normal' }) {
  const styles = {
    normal: 'bg-[#0D0F18]/90 border-purple-500/30 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    warning: 'bg-amber-950/80 border-amber-500/60 text-amber-300 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.35)]',
    critical: 'bg-rose-950/80 border-rose-500 text-rose-300 animate-bounce shadow-[0_0_25px_rgba(244,63,94,0.5)]',
    expired: 'bg-[#0D0F18]/90 border-rose-500/50 text-rose-400 opacity-90 shadow-[0_0_15px_rgba(244,63,94,0.25)]',
  };

  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border backdrop-blur-xl font-mono font-bold text-sm transition-all ${
        styles[timerState] || styles.normal
      }`}
    >
      <Clock className="w-4 h-4 flex-shrink-0 text-purple-400" />
      <div>
        <span className="text-[9px] uppercase tracking-widest text-purple-300/70 block -mb-0.5">Time Left</span>
        <span className="text-base tracking-wider text-white font-black">{formatTime(secondsRemaining)}</span>
      </div>
    </div>
  );
}
