import React from 'react';
import { AlertTriangle, Clock, Zap, Target, PlayCircle, ShieldAlert } from 'lucide-react';

/**
 * ProgressCard — left-column progress summary showing live points breakdown and penalties.
 */
export default function ProgressCard({
  collectedCount = 0,
  totalCount = 0,
  penaltySeconds = 0,
  quizAttempts = 0,
  phase = 'HUNT',
  points = null,
}) {
  const taskPenalties = points?.taskPenaltyPoints ?? 0;
  const runPenalties = points?.runPenaltyPoints ?? 0;
  const timePenalties = points?.timePenaltyPoints ?? 0;
  const currentChallengePenalties = points?.totalPenaltyPoints ?? (taskPenalties + runPenalties + timePenalties);
  const currentScore = points?.currentScore ?? -currentChallengePenalties;

  const previousPenalties = points?.previousChallengesPenalty ?? 0;
  const overallTotalPenalties = points?.overallTotalPenaltyPoints ?? (previousPenalties + currentChallengePenalties);
  const overallScore = points?.overallScore ?? -overallTotalPenalties;

  const runsRemainingFree = points?.runsRemainingFree ?? Math.max(0, 3 - (points?.runCount ?? 0));
  const timeMinutes = points?.timeMinutesExhausted ?? Math.floor(penaltySeconds / 60);

  return (
    <div className="p-4 bg-white/90 border border-slate-200 rounded-2xl space-y-3.5 shadow-sm font-mono">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-orange-500" /> Points & Penalties
        </h4>
        <span className="text-[10px] text-slate-500">Starts @ 0 pts</span>
      </div>

      {/* Prominent Score Card - Tournament Cumulative */}
      <div className={`p-3 rounded-xl border flex items-center justify-between ${
        overallScore < 0
          ? 'bg-rose-50/80 border-rose-200 text-rose-800'
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
      }`}>
        <div>
          <span className="text-[10px] uppercase font-bold block text-slate-500">
            {previousPenalties > 0 ? 'Overall Tournament Score' : 'Live Challenge Score'}
          </span>
          <span className="text-xl font-black">
            {overallScore} <span className="text-xs font-normal">pts</span>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold block text-slate-500">Total Penalty</span>
          <span className="text-sm font-bold text-rose-600">
            -{overallTotalPenalties} pts
          </span>
        </div>
      </div>

      {/* Previous Challenges Carried Over Banner */}
      {previousPenalties > 0 && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] flex items-center justify-between text-amber-900">
          <span className="flex items-center gap-1">
            <span>⚠️</span> Previous Challenges:
          </span>
          <span className="font-bold text-rose-600">-{previousPenalties} pts</span>
        </div>
      )}

      {/* Penalty Breakdown */}
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-slate-600 flex items-center gap-1.5">
            <Target className="w-3 h-3 text-rose-500" /> Wrong Tasks (-20 pts):
          </span>
          <span className={`font-bold ${taskPenalties > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
            -{taskPenalties} pts
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-slate-600 flex items-center gap-1.5">
            <PlayCircle className="w-3 h-3 text-amber-500" /> Extra Runs (-10 pts):
          </span>
          <span className={`font-bold ${runPenalties > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {runsRemainingFree > 0 ? `${runsRemainingFree}/3 free` : `-${runPenalties} pts`}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-slate-600 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-cyan-600" /> Time Elapsed (-10/min):
          </span>
          <span className={`font-bold ${timePenalties > 0 ? 'text-cyan-700' : 'text-slate-500'}`}>
            -{timePenalties} pts ({timeMinutes}m)
          </span>
        </div>
      </div>

      {/* Game Progression Status */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200">
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block">Fragments</span>
          <span className={`text-sm font-black ${collectedCount === totalCount ? 'text-emerald-600' : 'text-orange-500'}`}>
            {collectedCount}<span className="text-slate-400 font-normal">/{totalCount}</span>
          </span>
        </div>

        <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block">Phase</span>
          <span className={`text-sm font-black ${
            phase === 'ASSEMBLE' ? 'text-emerald-600' : phase === 'HUNT' ? 'text-orange-500' : 'text-slate-700'
          }`}>
            {phase}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
        <ShieldAlert className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Minimum negative points wins the tournament!</span>
      </div>
    </div>
  );
}
