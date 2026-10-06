import React from 'react';
import { Trophy, Award, Target, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaderboardTable({ rankings = [], currentParticipantId = null }) {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="border border-purple-500/20 rounded-3xl bg-[#0D0F18]/80 backdrop-blur-xl p-16 text-center space-y-4 font-sans shadow-md">
        <div className="w-16 h-16 mx-auto bg-purple-950/60 border border-purple-500/30 rounded-full flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-white">No Standings Yet</h3>
        <p className="text-sm text-purple-200/60 max-w-sm mx-auto leading-relaxed font-mono">
          The arena is silent. Standings will appear in real time once participants begin their challenges.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-purple-500/25 rounded-3xl bg-[#0D0F18]/85 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.12)] overflow-hidden relative">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead className="bg-[#0A0C14] text-purple-200/80 uppercase tracking-widest text-[10px] font-bold border-b-2 border-purple-500/40 font-mono">
            <tr>
              <th className="px-6 py-5 rounded-tl-3xl whitespace-nowrap">Rank</th>
              <th className="px-6 py-5 whitespace-nowrap">Participant</th>
              <th className="px-6 py-5 text-center whitespace-nowrap"><Target className="w-3.5 h-3.5 inline mr-1 opacity-70"/> Solved</th>
              <th className="px-6 py-5 text-center whitespace-nowrap"><Trophy className="w-3.5 h-3.5 inline mr-1 opacity-70"/> Score</th>
              <th className="px-6 py-5 text-center whitespace-nowrap"><AlertTriangle className="w-3.5 h-3.5 inline mr-1 opacity-70"/> Penalty Stats</th>
              <th className="px-6 py-5 text-right rounded-tr-3xl whitespace-nowrap"><Clock className="w-3.5 h-3.5 inline mr-1 opacity-70"/> Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10 relative">
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
                        ? 'bg-gradient-to-r from-purple-950/40 via-amber-950/20 to-purple-950/40 hover:from-purple-900/40 hover:to-purple-950/50'
                        : isMe
                        ? 'bg-purple-950/40 shadow-[inset_4px_0_0_0_#A855F7] relative z-10'
                        : 'hover:bg-purple-950/20 bg-[#0D0F18]/40'
                    }`}
                  >
                    <td className="px-6 py-4 font-bold">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${
                          rankNum === 1 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]' :
                          rankNum === 2 ? 'bg-slate-700 text-slate-200 border border-slate-600' :
                          rankNum === 3 ? 'bg-amber-900 text-amber-300 border border-amber-800' :
                          'bg-slate-800/80 text-slate-400 border border-slate-700'
                        }`}>
                          {rankNum === 1 ? <Trophy className="w-4 h-4" /> : rankNum}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {isWinner && (
                            <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase font-black tracking-widest shadow-sm flex items-center gap-1 w-max">
                              <Award className="w-3 h-3" /> WINNER
                            </span>
                          )}
                          {isMe && !isWinner && (
                            <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-purple-600 text-white uppercase font-black tracking-widest w-max shadow-sm shadow-purple-500/40">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-white text-sm md:text-base group-hover:text-purple-300 transition-colors">{r.name}</div>
                      <div className="text-[10px] text-purple-200/50 font-medium mt-1 flex flex-wrap gap-1.5 items-center font-mono">
                        <span className="bg-[#141724] border border-purple-500/30 px-2 py-0.5 rounded text-purple-300 shadow-sm">{r.participantId}</span>
                        {r.college && <span>• {r.college}</span>}
                        {r.department && <span className="opacity-70">({r.department})</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-14 py-1.5 rounded-full text-xs font-black shadow-sm font-mono ${
                        solvedCount === 3
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                          : solvedCount > 0
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}>
                        {solvedCount}/3
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`text-lg font-black font-mono ${
                        scoreVal === 0
                          ? 'text-emerald-400'
                          : scoreVal >= -40
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {scoreVal}
                        <span className="text-[10px] font-medium text-slate-500 ml-1 uppercase">pts</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center gap-3 bg-[#141724]/80 border border-purple-500/25 px-4 py-2 rounded-xl text-[10px] font-medium font-mono transition-colors group-hover:border-purple-500/40">
                        <div className="flex flex-col items-center group/tt cursor-help" title="Tasks wrong penalty">
                          <span className="text-slate-400 text-[8px] uppercase tracking-wider mb-0.5">Tasks</span>
                          <span className="text-rose-400 font-bold text-xs">{r.taskPenaltyPoints ? `-${r.taskPenaltyPoints}` : '0'}</span>
                        </div>
                        <div className="w-px h-7 bg-purple-500/20"></div>
                        <div className="flex flex-col items-center group/tt cursor-help" title="Runs penalty">
                          <span className="text-slate-400 text-[8px] uppercase tracking-wider mb-0.5">Runs</span>
                          <span className="text-amber-400 font-bold text-xs">{r.runPenaltyPoints ? `-${r.runPenaltyPoints}` : '0'}</span>
                        </div>
                        <div className="w-px h-7 bg-purple-500/20"></div>
                        <div className="flex flex-col items-center group/tt cursor-help" title="Time exhausted penalty">
                          <span className="text-slate-400 text-[8px] uppercase tracking-wider mb-0.5">Time</span>
                          <span className="text-purple-300 font-bold text-xs">{r.timePenaltyPoints ? `-${r.timePenaltyPoints}` : '0'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center font-black font-mono text-purple-200 bg-[#141724]/90 px-3 py-1.5 rounded-lg border border-purple-500/30 shadow-sm">
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
