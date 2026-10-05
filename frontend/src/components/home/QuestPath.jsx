import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Package } from 'lucide-react';

const nodes = [
  { id: 'easy',   label: 'Easy',   state: 'active'  },
  { id: 'medium', label: 'Medium', state: 'locked'  },
  { id: 'hard',   label: 'Hard',   state: 'locked'  },
  { id: 'chest',  label: 'Chest',  state: 'chest'   },
];

/* Pulsing ring around the active node */
function PulseRing() {
  return (
    <span className="absolute -inset-1.5 rounded-full border-2 border-[#F28C0F]/60 animate-ping pointer-events-none" aria-hidden="true" />
  );
}

export default function QuestPath() {
  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">Quest Path</span>
      </div>

      <div className="relative flex items-center justify-between">

        {nodes.map((node, i) => {
          const isActive = node.state === 'active';
          const isChest  = node.state === 'chest';
          const isLocked = node.state === 'locked';

          return (
            <React.Fragment key={node.id}>
              {/* ── Connecting line between nodes ── */}
              {i > 0 && (
                <div className="flex-1 mx-1 h-px relative overflow-hidden">
                  {/* Static dashed base */}
                  <div className="absolute inset-0 border-t border-dashed border-slate-600" />
                  {/* Animated moving dashes only between active→next */}
                  {i === 1 && (
                    <div
                      className="absolute inset-0 dash-animated"
                      aria-hidden="true"
                    />
                  )}
                </div>
              )}

              {/* ── Node ── */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="relative">
                  {isActive && <PulseRing />}
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                      ${isActive  ? 'bg-[#F28C0F] border-[#F28C0F] shadow-[0_0_12px_rgba(242,140,15,0.55)]' : ''}
                      ${isLocked  ? 'bg-slate-800 border-slate-600' : ''}
                      ${isChest   ? 'bg-slate-800 border-orange-500/40 shadow-[0_0_8px_rgba(242,140,15,0.25)]' : ''}
                    `}
                  >
                    {isActive && (
                      <span className="font-mono text-[10px] font-black text-slate-950">E</span>
                    )}
                    {isLocked && (
                      <Lock className="w-3 h-3 text-slate-500" aria-hidden="true" />
                    )}
                    {isChest && (
                      <Package className="w-3.5 h-3.5 text-orange-400/70" aria-hidden="true" />
                    )}
                  </div>
                </div>

                <span
                  className={`font-mono text-[9px] leading-none
                    ${isActive ? 'text-[#F28C0F] font-bold' : 'text-slate-500'}
                  `}
                >
                  {node.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
