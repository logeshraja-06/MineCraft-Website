import React from 'react';
import { Check, Lock, Search } from 'lucide-react';

const STEPS = [
  { key: 'HUNT',    label: '1  Hunt',     icon: Search },
  { key: 'ASSEMBLE',label: '2  Assemble', icon: Check },
  { key: 'DONE',    label: '3  Run',      icon: Check },
];

/**
 * PhaseStepper — shows current gameplay phase.
 * @param {'SETUP'|'HUNT'|'ASSEMBLE'|'DONE'} phase
 * @param {number} collectedCount
 * @param {number} totalCount
 */
export default function PhaseStepper({ phase, collectedCount = 0, totalCount = 0 }) {
  const activeIdx = STEPS.findIndex((s) => s.key === phase);

  return (
    <div className="flex flex-wrap items-center gap-2.5 px-4 py-2.5 bg-[#0D0F18]/90 border border-purple-500/25 rounded-2xl text-xs font-mono shadow-xl backdrop-blur-xl">
      {STEPS.map((step, idx) => {
        const isActive  = step.key === phase;
        const isDone    = activeIdx > idx;

        return (
          <React.Fragment key={step.key}>
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400 font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : isDone
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'bg-purple-950/30 text-purple-400/50 border border-purple-500/20'
              }`}
              aria-current={isActive ? 'step' : undefined}
            >
              {isDone ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : isActive ? (
                <span className="w-2 h-2 rounded-full bg-purple-200 animate-ping" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-purple-400/40" />
              )}
              <span className="font-sans font-semibold text-xs tracking-wide">{step.label}</span>
            </div>

            {idx < STEPS.length - 1 && (
              <span className={`text-purple-400/40 px-0.5 ${isDone ? 'text-emerald-400' : ''}`}>→</span>
            )}
          </React.Fragment>
        );
      })}

      {/* Fragment progress */}
      {totalCount > 0 && (
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400 pl-3 border-l border-purple-500/20">
          <span className="font-sans text-slate-400">Code Fragments:</span>
          <span className={`font-mono font-bold ${collectedCount === totalCount ? 'text-emerald-400' : 'text-purple-300'}`}>
            {collectedCount} / {totalCount}
          </span>
        </div>
      )}
    </div>
  );
}
