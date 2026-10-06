import React from 'react';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

export default function Podium({ topThree = [] }) {
  if (topThree.length < 3) return null;

  const [first, second, third] = topThree;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6 pb-6 max-w-5xl mx-auto">
      {/* 2nd Place */}
      <div className="border border-purple-950/70 bg-[#0B0D15] p-6 text-center space-y-4 rounded-none order-2 md:order-1">
        <div className="w-12 h-12 mx-auto bg-slate-800 text-slate-300 flex items-center justify-center rounded-none border border-slate-700">
          <Medal className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
            2nd Place
          </span>
          <h4 className="text-lg font-medium text-white truncate">{second.name}</h4>
          <p className="text-xs text-slate-400 truncate mt-0.5">{second.college}</p>
        </div>
        <div className="border-t border-purple-950/80 pt-3">
          <div className="text-xl font-mono text-slate-200">
            {second.score ?? second.totalScore ?? 0} <span className="text-xs text-slate-500">pts</span>
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            {second.challengesSolved ?? 0}/3 Solved · {second.timeFormatted}
          </div>
        </div>
      </div>

      {/* 1st Place */}
      <div className="border border-purple-500/60 bg-[#100D1E] p-8 text-center space-y-4 rounded-none order-1 md:order-2 md:-translate-y-4 shadow-lg shadow-purple-950/50">
        <div className="w-16 h-16 mx-auto bg-amber-400 text-slate-950 flex items-center justify-center rounded-none shadow-md">
          <Crown className="w-8 h-8 text-slate-950" />
        </div>
        <div>
          <span className="text-[11px] font-mono text-amber-300 uppercase tracking-widest block mb-1">
            Tournament Leader
          </span>
          <h4 className="text-2xl font-medium text-white truncate">{first.name}</h4>
          <p className="text-xs text-slate-300 truncate mt-0.5">{first.college}</p>
        </div>
        <div className="border-t border-purple-900/60 pt-4">
          <div className="text-3xl font-mono text-amber-300 font-medium">
            {first.score ?? first.totalScore ?? 0} <span className="text-xs text-amber-400/80">pts</span>
          </div>
          <div className="text-xs font-mono text-emerald-400 mt-1">
            {first.challengesSolved ?? 0}/3 Solved · {first.timeFormatted}
          </div>
        </div>
      </div>

      {/* 3rd Place */}
      <div className="border border-purple-950/70 bg-[#0B0D15] p-6 text-center space-y-4 rounded-none order-3">
        <div className="w-12 h-12 mx-auto bg-amber-950 text-amber-300 flex items-center justify-center rounded-none border border-amber-800">
          <Award className="w-6 h-6 text-amber-300" />
        </div>
        <div>
          <span className="text-[11px] font-mono text-amber-500 uppercase tracking-widest block mb-1">
            3rd Place
          </span>
          <h4 className="text-lg font-medium text-white truncate">{third.name}</h4>
          <p className="text-xs text-slate-400 truncate mt-0.5">{third.college}</p>
        </div>
        <div className="border-t border-purple-950/80 pt-3">
          <div className="text-xl font-mono text-slate-200">
            {third.score ?? third.totalScore ?? 0} <span className="text-xs text-slate-500">pts</span>
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            {third.challengesSolved ?? 0}/3 Solved · {third.timeFormatted}
          </div>
        </div>
      </div>
    </div>
  );
}
