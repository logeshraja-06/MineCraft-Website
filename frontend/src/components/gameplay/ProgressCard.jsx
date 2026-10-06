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
    <div className="p-4 bg-[#0D0F18]/90 border border-purple-500/30 rounded-2xl space-y-3.5 shadow-xl backdrop-blur-xl font-mono">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-400" /> Points & Penalties
        </h4>
        <span className="text-[10px] text-purple-300/50">Starts @ 0 pts</span>
      </div>

      {/* Dual Score Cards - Side by Side */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-purple-300/70 tracking-wider">
            Live Challenge Score
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-5 h-5 rounded-md bg-purple-600/80 text-white flex items-center justify-center text-xs font-black shadow-xs">
              🛡️
            </span>
            <span className="text-base font-black text-purple-100">
              {currentScore} <span className="text-[10px] font-bold">pts</span>
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#07080D]/90 border border-purple-500/20 flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
            Total Penalty
          </span>
          <div className="mt-1">
            <span className="text-base font-black text-rose-400">
              -{currentChallengePenalties} <span className="text-[10px] font-bold">pts</span>
            </span>
          </div>
        </div>
      </div>

      {/* Previous Challenges Carried Over Banner */}
      {previousPenalties > 0 && (
        <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] flex items-center justify-between text-amber-200">
          <span className="flex items-center gap-1">
            <span>⚠️</span> Previous Challenges:
          </span>
          <span className="font-bold text-rose-400">-{previousPenalties} pts</span>
        </div>
      )}

      {/* Penalty Breakdown */}
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#07080D]/80 border border-purple-500/20">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Target className="w-3 h-3 text-rose-400" /> Wrong Tasks (-20 pts):
          </span>
          <span className={`font-bold ${taskPenalties > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
            -{taskPenalties} pts
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-[#07080D]/80 border border-purple-500/20">
          <span className="text-slate-300 flex items-center gap-1.5">
            <PlayCircle className="w-3 h-3 text-amber-400" /> Extra Runs (-10 pts):
          </span>
          <span className={`font-bold ${runPenalties > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {runsRemainingFree > 0 ? `${runsRemainingFree}/3 free` : `-${runPenalties} pts`}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-[#07080D]/80 border border-purple-500/20">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-purple-400" /> Time Elapsed (-10/min):
          </span>
          <span className={`font-bold ${timePenalties > 0 ? 'text-purple-300' : 'text-slate-500'}`}>
            -{timePenalties} pts ({timeMinutes}m)
          </span>
        </div>
      </div>

      {/* Game Progression Status */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-purple-500/20">
        <div className="p-2 bg-[#07080D]/80 rounded-xl border border-purple-500/20">
          <span className="text-[10px] text-purple-300/60 uppercase block">Fragments</span>
          <span className={`text-sm font-black ${collectedCount === totalCount ? 'text-emerald-400' : 'text-purple-300'}`}>
            {collectedCount}<span className="text-slate-500 font-normal">/{totalCount}</span>
          </span>
        </div>

        <div className="p-2 bg-[#07080D]/80 rounded-xl border border-purple-500/20">
          <span className="text-[10px] text-purple-300/60 uppercase block">Phase</span>
          <span className={`text-sm font-black ${
            phase === 'ASSEMBLE' ? 'text-emerald-400' : phase === 'HUNT' ? 'text-purple-300' : 'text-slate-300'
          }`}>
            {phase}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
        <ShieldAlert className="w-3 h-3 text-purple-400 shrink-0" />
        <span>Minimum negative points wins the tournament!</span>
      </div>
    </div>
  );
}
