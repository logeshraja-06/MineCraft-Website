import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Podium({ topThree = [] }) {
  if (topThree.length < 3) return null;

  const [first, second, third] = topThree;

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pt-4 pb-6">
      {/* 2nd Place */}
      <div className="bg-white border border-slate-300 rounded-2xl p-4 text-center space-y-2 order-1 shadow-md hover:border-slate-400 transition">
        <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 border border-slate-400 flex items-center justify-center text-slate-700">
          <Medal className="w-5 h-5 text-slate-700" />
        </div>
        <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-widest block">2nd Place</span>
        <h4 className="text-sm md:text-base font-bold text-slate-900 truncate">{second.name}</h4>
        <p className="text-[11px] text-slate-500 truncate">{second.college}</p>
        <div className="text-xs font-mono font-black text-amber-600">
          {second.score ?? second.totalScore ?? 0} pts
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          {second.challengesSolved ?? 0}/3 Solved • {second.timeFormatted}
        </div>
      </div>

      {/* 1st Place */}
      <div className="bg-gradient-to-b from-amber-900 to-slate-950 border-2 border-amber-400 rounded-2xl p-5 text-center space-y-2.5 order-2 shadow-2xl shadow-amber-500/20 -translate-y-2 hover:border-amber-300 transition text-white">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20">
          <Trophy className="w-6 h-6 text-amber-300 animate-pulse" />
        </div>
        <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-widest block">
          {first.challengesSolved === 3 ? '🏆 TOURNAMENT WINNER' : 'CURRENT LEADER'}
        </span>
        <h4 className="text-base md:text-lg font-black text-white truncate">{first.name}</h4>
        <p className="text-xs text-amber-200/80 truncate">{first.college}</p>
        <div className="text-base font-mono font-black text-amber-400">
          {first.score ?? first.totalScore ?? 0} pts
        </div>
        <div className="text-xs font-mono text-emerald-300 font-bold">
          {first.challengesSolved ?? 0}/3 Solved • {first.timeFormatted}
        </div>
      </div>

      {/* 3rd Place */}
      <div className="bg-white border border-amber-900/30 rounded-2xl p-4 text-center space-y-2 order-3 shadow-md hover:border-amber-700/50 transition">
        <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 border border-amber-500/40 flex items-center justify-center text-amber-700">
          <Award className="w-5 h-5 text-amber-600" />
        </div>
        <span className="text-xs font-mono font-bold text-amber-700 uppercase tracking-widest block">3rd Place</span>
        <h4 className="text-sm md:text-base font-bold text-slate-900 truncate">{third.name}</h4>
        <p className="text-[11px] text-slate-500 truncate">{third.college}</p>
        <div className="text-xs font-mono font-black text-amber-600">
          {third.score ?? third.totalScore ?? 0} pts
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          {third.challengesSolved ?? 0}/3 Solved • {third.timeFormatted}
        </div>
      </div>
    </div>
  );
}
