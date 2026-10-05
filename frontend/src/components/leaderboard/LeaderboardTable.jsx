import React from 'react';
import { Trophy, Award, Target, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaderboardTable({ rankings = [], currentParticipantId = null }) {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="border border-slate-200/60 rounded-3xl bg-white/60 backdrop-blur-xl p-16 text-center space-y-4 font-sans shadow-sm">
        <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
          <Trophy className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-base font-black text-slate-700">No Standings Yet</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          The arena is silent. Standings will appear in real time once participants begin their challenges.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200/80 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/40 overflow-hidden relative">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead className="bg-slate-900 text-slate-300 uppercase tracking-widest text-[10px] font-bold border-b-4 border-[#F28C0F]">
            <tr>
              <th className="px-6 py-5 rounded-tl-3xl whitespace-nowrap">Rank</th>
              <th className="px-6 py-5 whitespace-nowrap">Participant</th>
              <th className="px-6 py-5 text-center whitespace-nowrap"><Target className="w-3.5 h-3.5 inline mr-1 opacity-70"/> Solved</th>
              <th className="px-6 py-5 text-center whitespace-nowrap"><Trophy className="w-3.5 h-3.5 inline mr-1 opacity-70"/> Score</th>
              <th className="px-6 py-5 text-center whitespace-nowrap"><AlertTriangle className="w-3.5 h-3.5 inline mr-1 opacity-70"/> Penalty Stats</th>
              <th className="px-6 py-5 text-right rounded-tr-3xl whitespace-nowrap"><Clock className="w-3.5 h-3.5 inline mr-1 opacity-70"/> Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 relative">
            <AnimatePresence>
              {rankings.map((r, idx) => {
                const isMe = currentParticipantId && (r.participantId === currentParticipantId || r.id === currentParticipantId);
                const rankNum = r.rank || idx + 1;
                const solvedCount = r.challengesSolved ?? (r.status === 'Accepted' || r.status === 'ACCEPTED' ? 1 : 0);
                const scoreVal = r.score ?? r.totalScore ?? 0;
                const isWinner = rankNum === 1 && solvedCount === 3;

                return (
                  <motion.tr
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                    key={r.id || r.participantId}
                    className={`group ${
                      isWinner
                        ? 'bg-gradient-to-r from-amber-50/70 to-orange-50/70 hover:from-amber-100/70 hover:to-orange-100/70'
                        : isMe
                        ? 'bg-orange-50/90 shadow-[inset_4px_0_0_0_#F28C0F] relative z-10'
                        : 'hover:bg-slate-50/80 bg-white/40'
                    }`}
                  >
                    <td className="px-6 py-4 font-bold">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${
                          rankNum === 1 ? 'bg-gradient-to-br from-amber-300 to-[#F28C0F] text-white shadow-amber-500/20' :
                          rankNum === 2 ? 'bg-slate-200 text-slate-700' :
                          rankNum === 3 ? 'bg-orange-200 text-orange-800' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {rankNum === 1 ? <Trophy className="w-4.5 h-4.5" /> : rankNum}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {isWinner && (
                            <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 uppercase font-black tracking-widest shadow-sm flex items-center gap-1 w-max">
                              <Award className="w-3 h-3" /> WINNER
                            </span>
                          )}
                          {isMe && !isWinner && (
                            <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-[#F28C0F] text-white uppercase font-black tracking-widest w-max shadow-sm">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900 text-sm md:text-base group-hover:text-[#F28C0F] transition-colors">{r.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-1 flex flex-wrap gap-1.5 items-center">
                        <span className="bg-slate-100/80 border border-slate-200/50 px-2 py-0.5 rounded text-slate-600 shadow-sm">{r.participantId}</span>
                        {r.college && <span>• {r.college}</span>}
                        {r.department && <span className="opacity-70">({r.department})</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-14 py-1.5 rounded-full text-xs font-black shadow-sm ${
                        solvedCount === 3
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/60'
                          : solvedCount > 0
                          ? 'bg-amber-100 text-amber-700 border border-amber-200/60'
                          : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                      }`}>
                        {solvedCount}/3
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`text-lg font-black ${
                        scoreVal === 0
                          ? 'text-emerald-500'
                          : scoreVal >= -40
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}>
                        {scoreVal}
                        <span className="text-[10px] font-medium text-slate-400 ml-1 uppercase">pts</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center gap-3 bg-slate-50/80 border border-slate-200/50 px-4 py-2 rounded-xl text-[10px] font-medium transition-colors group-hover:bg-white group-hover:border-slate-200 group-hover:shadow-sm">
                        <div className="flex flex-col items-center group/tt cursor-help" title="Tasks wrong penalty">
                          <span className="text-slate-400 text-[8px] uppercase tracking-wider mb-0.5">Tasks</span>
                          <span className="text-rose-500 font-bold text-xs">{r.taskPenaltyPoints ? `-${r.taskPenaltyPoints}` : '0'}</span>
                        </div>
                        <div className="w-px h-7 bg-slate-200/80"></div>
                        <div className="flex flex-col items-center group/tt cursor-help" title="Runs penalty">
                          <span className="text-slate-400 text-[8px] uppercase tracking-wider mb-0.5">Runs</span>
                          <span className="text-amber-500 font-bold text-xs">{r.runPenaltyPoints ? `-${r.runPenaltyPoints}` : '0'}</span>
                        </div>
                        <div className="w-px h-7 bg-slate-200/80"></div>
                        <div className="flex flex-col items-center group/tt cursor-help" title="Time exhausted penalty">
                          <span className="text-slate-400 text-[8px] uppercase tracking-wider mb-0.5">Time</span>
                          <span className="text-cyan-600 font-bold text-xs">{r.timePenaltyPoints ? `-${r.timePenaltyPoints}` : '0'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center font-black text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-sm group-hover:bg-white transition-colors">
                        {r.timeFormatted || (r.totalTimeSeconds ? `${Math.floor(r.totalTimeSeconds / 60)}m ${r.totalTimeSeconds % 60}s` : '00:00')}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
