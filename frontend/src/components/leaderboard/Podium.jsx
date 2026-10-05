import React from 'react';
import { Trophy, Medal, Award, Crown, Star } from 'lucide-react';

export default function Podium({ topThree = [] }) {
  if (topThree.length < 3) return null;

  const [first, second, third] = topThree;

  return (
    <div className="grid grid-cols-3 gap-4 md:gap-8 items-end pt-12 pb-10 max-w-5xl mx-auto">
      {/* 2nd Place */}
      <div className="group relative bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-5 text-center space-y-3 order-1 shadow-lg hover:shadow-xl hover:border-slate-300 hover:-translate-y-2 transition-all duration-300">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-4 border-white shadow-md flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform duration-300">
            <Medal className="w-7 h-7 text-slate-600" />
          </div>
        </div>
        <div className="pt-6">
          <span className="text-[10px] font-sans font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">2nd Place</span>
          <h4 className="text-sm md:text-base font-black text-slate-800 truncate group-hover:text-slate-900 transition-colors">{second.name}</h4>
          <p className="text-[10px] text-slate-500 truncate mt-0.5">{second.college}</p>
        </div>
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
          <div className="text-base font-sans font-black text-slate-700">
            {second.score ?? second.totalScore ?? 0} <span className="text-[10px] font-medium text-slate-400">pts</span>
          </div>
          <div className="text-[10px] font-sans text-slate-500 mt-1.5 flex items-center justify-center gap-1.5">
            <span className="bg-slate-200/70 px-2 py-0.5 rounded-md text-slate-700 font-bold">{second.challengesSolved ?? 0}/3</span>
            <span>•</span>
            <span className="font-medium">{second.timeFormatted}</span>
          </div>
        </div>
      </div>

      {/* 1st Place */}
      <div className="group relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 border border-slate-700/80 rounded-[2.5rem] p-6 text-center space-y-4 order-2 shadow-2xl shadow-[#F28C0F]/20 -translate-y-6 hover:-translate-y-8 hover:shadow-[#F28C0F]/30 hover:border-slate-600 transition-all duration-300 z-10">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="absolute inset-0 bg-[#F28C0F] blur-xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 to-[#F28C0F] border-[5px] border-slate-900 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Crown className="w-12 h-12 text-white drop-shadow-md" />
            </div>
          </div>
        </div>
        <div className="pt-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-sans font-black text-amber-400 uppercase tracking-[0.2em] mb-2 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            <Star className="w-3 h-3 fill-amber-400" />
            {first.challengesSolved === 3 ? 'Tournament Winner' : 'Current Leader'}
            <Star className="w-3 h-3 fill-amber-400" />
          </div>
          <h4 className="text-xl md:text-2xl font-black text-white truncate drop-shadow-sm">{first.name}</h4>
          <p className="text-xs text-slate-400 truncate mt-1">{first.college}</p>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 backdrop-blur-md shadow-inner">
          <div className="text-3xl font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-[#F28C0F]">
            {first.score ?? first.totalScore ?? 0} <span className="text-sm font-medium text-amber-500/70">pts</span>
          </div>
          <div className="text-xs font-sans text-emerald-400 font-bold mt-3 flex items-center justify-center gap-2">
            <span className="bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-md shadow-sm">{first.challengesSolved ?? 0}/3 Solved</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 tracking-wide">{first.timeFormatted}</span>
          </div>
        </div>
      </div>

      {/* 3rd Place */}
      <div className="group relative bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-5 text-center space-y-3 order-3 shadow-lg hover:shadow-xl hover:border-orange-200 hover:-translate-y-2 transition-all duration-300">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 border-4 border-white shadow-md flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
            <Award className="w-7 h-7 text-orange-600" />
          </div>
        </div>
        <div className="pt-6">
          <span className="text-[10px] font-sans font-black text-orange-400/80 uppercase tracking-[0.2em] block mb-1">3rd Place</span>
          <h4 className="text-sm md:text-base font-black text-slate-800 truncate group-hover:text-slate-900 transition-colors">{third.name}</h4>
          <p className="text-[10px] text-slate-500 truncate mt-0.5">{third.college}</p>
        </div>
        <div className="bg-orange-50/60 rounded-2xl p-3 border border-orange-100/60">
          <div className="text-base font-sans font-black text-orange-700">
            {third.score ?? third.totalScore ?? 0} <span className="text-[10px] font-medium text-orange-400">pts</span>
          </div>
          <div className="text-[10px] font-sans text-slate-500 mt-1.5 flex items-center justify-center gap-1.5">
            <span className="bg-orange-100/70 text-orange-800 px-2 py-0.5 rounded-md font-bold">{third.challengesSolved ?? 0}/3</span>
            <span>•</span>
            <span className="font-medium">{third.timeFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
