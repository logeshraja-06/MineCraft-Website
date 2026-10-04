import React from 'react';
import { Trophy, CheckCircle2, Award, Zap } from 'lucide-react';

export default function LeaderboardTable({ rankings = [], currentParticipantId = null }) {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="border border-slate-200 rounded-2xl bg-white p-12 text-center space-y-3 font-mono shadow-sm">
        <Trophy className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-700">No data yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No participants have completed challenges yet. Standings will appear in real time once submissions are verified.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xl">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-slate-50/90 text-slate-600 uppercase tracking-wider border-b border-slate-200 text-[11px]">
          <tr>
            <th className="px-5 py-3.5">Rank</th>
            <th className="px-5 py-3.5">Participant</th>
            <th className="px-5 py-3.5 text-center">Challenges Solved</th>
            <th className="px-5 py-3.5 text-center">Score (Negative Pts)</th>
            <th className="px-5 py-3.5 text-center">Penalty Breakdown</th>
            <th className="px-5 py-3.5 text-right">Total Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rankings.map((r, idx) => {
            const isMe = currentParticipantId && (r.participantId === currentParticipantId || r.id === currentParticipantId);
            const rankNum = r.rank || idx + 1;
            const solvedCount = r.challengesSolved ?? (r.status === 'Accepted' || r.status === 'ACCEPTED' ? 1 : 0);
            const scoreVal = r.score ?? r.totalScore ?? 0;
            const isWinner = rankNum === 1 && solvedCount === 3;

            return (
              <tr
                key={r.id || r.participantId || rankNum}
                className={`transition-colors ${
                  isWinner
                    ? 'bg-amber-50/60 font-medium'
                    : isMe
                    ? 'bg-orange-50 border-l-4 border-l-[#F28C0F] text-slate-900 font-bold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <td className="px-5 py-3.5 font-bold flex items-center gap-2">
                  {rankNum === 1 ? (
                    <Trophy className="w-4 h-4 text-amber-500 inline" />
                  ) : (
                    <span>#{rankNum}</span>
                  )}
                  {isWinner && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase font-black tracking-wider flex items-center gap-1 shadow-sm">
                      <Award className="w-3 h-3" /> WINNER
                    </span>
                  )}
                  {isMe && !isWinner && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F28C0F] text-slate-950 uppercase font-black">
                      YOU
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900">{r.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {r.participantId} {r.college ? `• ${r.college}` : ''} {r.department ? `(${r.department})` : ''}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-center font-bold">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                    solvedCount === 3
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : solvedCount > 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {solvedCount} / 3
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center font-black">
                  <span className={`text-sm ${
                    scoreVal === 0
                      ? 'text-emerald-600'
                      : scoreVal >= -40
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}>
                    {scoreVal} <span className="text-[10px] font-normal text-slate-500">pts</span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center text-[10px] text-slate-500 font-mono">
                  <span className="inline-flex gap-2">
                    <span title="Tasks wrong penalty (-20/wrong)">Tasks: <strong className="text-rose-600">-{r.taskPenaltyPoints || 0}</strong></span>
                    <span>•</span>
                    <span title="Runs penalty (-10/run after 3 free)">Runs: <strong className="text-amber-600">-{r.runPenaltyPoints || 0}</strong></span>
                    <span>•</span>
                    <span title="Time exhausted penalty (-10/min)">Time: <strong className="text-cyan-700">-{r.timePenaltyPoints || 0}</strong></span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                  {r.timeFormatted || (r.totalTimeSeconds ? `${Math.floor(r.totalTimeSeconds / 60)}m ${r.totalTimeSeconds % 60}s` : '00:00')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
