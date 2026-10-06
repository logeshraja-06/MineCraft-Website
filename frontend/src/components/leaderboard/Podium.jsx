import React from 'react';
import { Trophy, Medal, Award, Crown, Star } from 'lucide-react';

export default function Podium({ topThree = [] }) {
  if (topThree.length < 3) return null;

  const [first, second, third] = topThree;

  return (
    <div className="grid grid-cols-3 gap-4 md:gap-8 items-end pt-12 pb-10 max-w-5xl mx-auto">
      {/* 2nd Place */}
      <div className="group relative bg-[#0D0F18]/85 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-5 text-center space-y-3 order-1 shadow-[0_0_30px_rgba(148,163,184,0.15)] hover:border-slate-500 hover:-translate-y-2 transition-all duration-300">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-4 border-[#0D0F18] shadow-md flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform duration-300">
            <Medal className="w-7 h-7 text-slate-300" />
          </div>
        </div>
        <div className="pt-6">
          <span className="text-[10px] font-sans font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">2nd Place</span>
          <h4 className="text-sm md:text-base font-black text-white truncate group-hover:text-purple-300 transition-colors">{second.name}</h4>
          <p className="text-[10px] text-purple-200/50 truncate mt-0.5">{second.college}</p>
        </div>
        <div className="bg-[#141724]/90 rounded-2xl p-3 border border-slate-800">
          <div className="text-base font-sans font-black text-slate-200">
            {second.score ?? second.totalScore ?? 0} <span className="text-[10px] font-medium text-slate-400">pts</span>
          </div>
          <div className="text-[10px] font-sans text-purple-200/60 mt-1.5 flex items-center justify-center gap-1.5">
            <span className="bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-300 font-bold">{second.challengesSolved ?? 0}/3</span>
            <span>•</span>
            <span className="font-medium text-slate-300">{second.timeFormatted}</span>
          </div>
        </div>
      </div>

      {/* 1st Place */}
      <div className="group relative bg-gradient-to-b from-[#161226] via-[#0E0C1C] to-[#080711] border-2 border-purple-500/50 rounded-[2.5rem] p-6 text-center space-y-4 order-2 shadow-[0_0_50px_rgba(168,85,247,0.35)] -translate-y-6 hover:-translate-y-8 hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] hover:border-purple-400 transition-all duration-300 z-10">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity rounded-full"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border-[5px] border-[#0E0C1C] shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Crown className="w-12 h-12 text-slate-950 drop-shadow-md" />
            </div>
          </div>
        </div>
        <div className="pt-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-sans font-black text-amber-300 uppercase tracking-[0.2em] mb-2 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
            <Star className="w-3 h-3 fill-amber-300" />
            {first.challengesSolved === 3 ? 'Tournament Winner' : 'Current Leader'}
            <Star className="w-3 h-3 fill-amber-300" />
          </div>
          <h4 className="text-xl md:text-2xl font-black text-white truncate drop-shadow-sm">{first.name}</h4>
          <p className="text-xs text-purple-200/60 truncate mt-1">{first.college}</p>
        </div>
        <div className="bg-[#17132B]/90 rounded-2xl p-5 border border-purple-500/30 backdrop-blur-md shadow-inner">
          <div className="text-3xl font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
            {first.score ?? first.totalScore ?? 0} <span className="text-sm font-medium text-amber-400/70">pts</span>
          </div>
          <div className="text-xs font-sans text-emerald-400 font-bold mt-3 flex items-center justify-center gap-2">
            <span className="bg-emerald-400/10 border border-emerald-400/30 px-2 py-1 rounded-md shadow-sm">{first.challengesSolved ?? 0}/3 Solved</span>
            <span className="text-purple-400">•</span>
            <span className="text-purple-200 tracking-wide">{first.timeFormatted}</span>
          </div>
        </div>
      </div>

      {/* 3rd Place */}
      <div className="group relative bg-[#0D0F18]/85 backdrop-blur-xl border border-amber-800/40 rounded-3xl p-5 text-center space-y-3 order-3 shadow-[0_0_30px_rgba(217,119,6,0.12)] hover:border-amber-600/60 hover:-translate-y-2 transition-all duration-300">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 border-4 border-[#0D0F18] shadow-md flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform duration-300">
            <Award className="w-7 h-7 text-amber-300" />
          </div>
        </div>
        <div className="pt-6">
          <span className="text-[10px] font-sans font-black text-amber-400/80 uppercase tracking-[0.2em] block mb-1">3rd Place</span>
          <h4 className="text-sm md:text-base font-black text-white truncate group-hover:text-amber-300 transition-colors">{third.name}</h4>
          <p className="text-[10px] text-purple-200/50 truncate mt-0.5">{third.college}</p>
        </div>
        <div className="bg-[#141724]/90 rounded-2xl p-3 border border-amber-900/30">
          <div className="text-base font-sans font-black text-amber-300">
            {third.score ?? third.totalScore ?? 0} <span className="text-[10px] font-medium text-amber-400/70">pts</span>
          </div>
          <div className="text-[10px] font-sans text-purple-200/60 mt-1.5 flex items-center justify-center gap-1.5">
            <span className="bg-amber-950/60 border border-amber-700/40 text-amber-300 px-2 py-0.5 rounded-md font-bold">{third.challengesSolved ?? 0}/3</span>
            <span>•</span>
            <span className="font-medium text-slate-300">{third.timeFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
