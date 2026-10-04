import React from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';

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
            <th className="px-5 py-3.5 text-center">Solved</th>
            <th className="px-5 py-3.5 text-center">Score</th>
            <th className="px-5 py-3.5 text-right">Total Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rankings.map((r, idx) => {
            const isMe = currentParticipantId && (r.participantId === currentParticipantId || r.id === currentParticipantId);
            const rankNum = r.rank || idx + 1;
            return (
              <tr
                key={r.id || r.participantId || rankNum}
                className={`transition-colors ${
                  isMe
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
                  {isMe && (
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
                <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                  {r.challengesSolved ?? (r.status === 'Accepted' || r.status === 'ACCEPTED' ? 1 : 0)}
                </td>
                <td className="px-5 py-3.5 text-center font-black text-amber-600">
                  {r.score ?? r.totalScore ?? 0}
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
