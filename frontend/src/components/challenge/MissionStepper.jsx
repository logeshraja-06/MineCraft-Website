import React from 'react';
import { CheckCircle2, Lock } from 'lucide-react';

/**
 * Reusable 3-step progress stepper: Easy ●—● Medium ○—○ Hard
 *
 * Props:
 *  - progress: array of 3 steps [{ sequenceOrder, difficulty, status, title }]
 *  - currentSlug: string (optional, currently active challenge slug)
 *  - compact: boolean (optional, smaller version for headers)
 */
export default function MissionStepper({ progress = [], compact = false }) {
  const steps = [
    { seq: 1, name: 'Easy', slug: 'ch-05' },
    { seq: 2, name: 'Medium', slug: 'ch-06' },
    { seq: 3, name: 'Hard', slug: 'ch-07' },
  ];

  const getStepState = (seq) => {
    const item = progress.find(
      (p) => Number(p.sequenceOrder) === seq || Number(p.tier) === seq
    );
    if (!item) {
      return seq === 1 ? 'CURRENT' : 'LOCKED';
    }
    return item.status; // 'COMPLETED' | 'CURRENT' | 'LOCKED'
  };

  return (
    <div
      className={`w-full flex items-center justify-between font-mono ${
        compact ? 'py-1 px-3 bg-[#0D0F18]/80 border border-purple-500/30 rounded-xl' : 'py-3 px-4'
      }`}
    >
      {steps.map((step, idx) => {
        const state = getStepState(step.seq);
        const isCompleted = state === 'COMPLETED';
        const isCurrent = state === 'CURRENT';
        const isLocked = state === 'LOCKED';

        // Connector line state (between this step and next)
        const nextState = idx < steps.length - 1 ? getStepState(steps[idx + 1].seq) : null;
        const lineCompleted = isCompleted && (nextState === 'COMPLETED' || nextState === 'CURRENT');

        return (
          <React.Fragment key={step.seq}>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center transition-all ${
                  compact ? 'w-6 h-6 rounded-md text-[10px]' : 'w-8 h-8 rounded-lg text-xs'
                } font-black ${
                  isCompleted
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : isCurrent
                    ? 'bg-purple-950/80 text-purple-200 border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-pulse'
                    : 'bg-slate-900 border border-slate-800 text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                ) : isLocked ? (
                  <Lock className={compact ? 'w-3 h-3 text-slate-600' : 'w-3.5 h-3.5 text-slate-600'} />
                ) : (
                  <span>{step.seq}</span>
                )}
              </div>

              <div className="flex flex-col">
                <span
                  className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                    isCompleted
                      ? 'text-emerald-300'
                      : isCurrent
                      ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                      : 'text-slate-500'
                  }`}
                >
                  {step.name}
                </span>
                {!compact && (
                  <span className="text-[9px] text-slate-400 hidden sm:inline">
                    {isCompleted ? '✓ Accepted' : isCurrent ? '● Portal Open' : '○ Locked'}
                  </span>
                )}
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div className="flex-1 mx-2 sm:mx-4 flex items-center">
                <div
                  className={`h-0.5 w-full transition-colors ${
                    lineCompleted
                      ? 'bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                      : isCompleted
                      ? 'bg-gradient-to-r from-emerald-500 to-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      : 'bg-slate-800'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
