import React from 'react';
import { Trophy, Award, Target, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaderboardTable({ rankings = [], currentParticipantId = null }) {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="border border-slate-200 bg-white p-16 text-center space-y-4 font-sans rounded-none shadow-xs">
        <div className="w-16 h-16 mx-auto bg-slate-100 border border-slate-200 rounded-none flex items-center justify-center text-slate-500">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-base font-medium text-slate-900">No Standings Yet</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-normal">
          The arena is awaiting participants. Scores and standings will appear in real time once challenges commence.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 bg-white rounded-none overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-mono border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap">Rank</th>
              <th className="px-6 py-4 whitespace-nowrap">Contestant</th>
              <th className="px-6 py-4 text-center whitespace-nowrap">Solved</th>
              <th className="px-6 py-4 text-center whitespace-nowrap">Total Score</th>
              <th className="px-6 py-4 text-center whitespace-nowrap">Penalty Breakdown</th>
              <th className="px-6 py-4 text-right whitespace-nowrap">Elapsed Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
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
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    key={r.id || r.participantId}
                    className={`transition-colors ${
                      isMe
                        ? 'bg-purple-50/70 border-l-4 border-l-purple-600'
                        : isWinner
                        ? 'bg-amber-50/50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Rank */}
                    <td className="px-6 py-4 font-mono font-medium">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 flex items-center justify-center font-mono text-xs rounded-none border ${
                          rankNum === 1 ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold' :
                          rankNum === 2 ? 'bg-slate-200 text-slate-800 border-slate-300' :
                          rankNum === 3 ? 'bg-amber-100 text-amber-900 border-amber-300' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {rankNum}
                        </span>

                        {isWinner && (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                            Winner
                          </span>
                        )}
                        {isMe && !isWinner && (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 uppercase">
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Participant */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 text-sm">{r.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 flex flex-wrap gap-1.5 items-center">
                        <span className="text-purple-700">{r.participantId}</span>
                        {r.college && <span>· {r.college}</span>}
                        {r.department && <span className="opacity-75">({r.department})</span>}
                      </div>
                    </td>

                    {/* Solved */}
                    <td className="px-6 py-4 text-center font-mono text-xs">
                      <span className={`px-2.5 py-1 border rounded-none font-medium ${
                        solvedCount === 3
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : solvedCount > 0
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {solvedCount}/3
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4 text-center font-mono text-sm">
                      <span className={`font-medium ${
                        scoreVal === 0
                          ? 'text-emerald-700'
                          : scoreVal >= -40
                          ? 'text-amber-700'
                          : 'text-rose-600'
                      }`}>
                        {scoreVal} pts
                      </span>
                    </td>

                    {/* Penalty breakdown */}
                    <td className="px-6 py-4 text-center font-mono text-xs text-slate-600">
                      <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-none">
                        <span>Tasks: <strong className="text-rose-600">-{r.taskPenaltyPoints || 0}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Runs: <strong className="text-amber-600">-{r.runPenaltyPoints || 0}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Time: <strong className="text-purple-700">-{r.timePenaltyPoints || 0}</strong></span>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-700">
                      {r.timeFormatted || (r.totalTimeSeconds ? `${Math.floor(r.totalTimeSeconds / 60)}m ${r.totalTimeSeconds % 60}s` : '00:00')}
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
