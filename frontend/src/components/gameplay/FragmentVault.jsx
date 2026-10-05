import React, { useState } from 'react';
import { Lock, Code2, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * FragmentVault — right-column panel.
 *
 * HUNT phase: shows collected fragments as chips + locked silhouettes.
 * ASSEMBLE phase: shows shuffled vault order (same chips, re-ordered).
 */
export default function FragmentVault({
  fragments = [],          // all fragments for this lang (langConfig.fragments)
  collectedIds = [],       // collected fragment ids (in collection order)
  shuffledOrder = [],      // seeded shuffle for ASSEMBLE phase
  phase = 'HUNT',
  totalExpected = 0,       // total expected fragment count (from server)
  pendingKeyDrop = false,
  onKeyDropped = null,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const totalCount     = totalExpected || fragments.length;
  const collectedCount = collectedIds.length;

  // In ASSEMBLE phase show shuffled vault order; in HUNT show collection order
  const displayIds = phase === 'ASSEMBLE'
    ? (shuffledOrder?.length > 0 ? shuffledOrder : collectedIds)
    : collectedIds;

  const fragmentMap = Object.fromEntries(fragments.map((f) => [f.id, f]));

  return (
    <div className="p-4 bg-white/90 border border-slate-200 rounded-2xl space-y-3 shadow-lg">
      {/* header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <Code2 className="w-4 h-4 text-orange-400" />
          Fragment Vault
        </h3>
        <span className="text-[11px] text-slate-600 font-mono">
          Unlocked:{' '}
          <strong className={collectedCount === totalCount ? 'text-emerald-400' : 'text-orange-400'}>
            {collectedCount}/{totalCount}
          </strong>
        </span>
      </div>

      {/* collected / shuffled fragments */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {displayIds.map((id, idx) => {
          const frag = fragmentMap[id];
          if (!frag) return null;
          const lines  = frag.code.split('\n');
          const first  = lines[0].slice(0, 32);
          const extra  = lines.length - 1;
          return (
            <div
              key={id}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono space-y-1 animate-fragmentReveal hover:border-orange-500/30 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                  #{idx + 1} · {frag.role}
                </span>
                {extra > 0 && (
                  <span className="text-[10px] text-slate-500">+{extra} lines</span>
                )}
              </div>
              <pre className="text-slate-700 whitespace-pre-wrap leading-relaxed text-[11px] overflow-hidden">
                {first}{extra > 0 ? '…' : ''}
              </pre>
            </div>
          );
        })}
      </div>

      {/* locked silhouettes & treasure box */}
      {phase === 'HUNT' && collectedCount < totalCount && (
        <div className="space-y-1.5">
          {Array.from({ length: totalCount - collectedCount }).map((_, i) => {
            // Render the treasure box on the first locked fragment when key is earned
            if (i === 0 && pendingKeyDrop) {
              return (
                <motion.div
                  key={`treasure-box-${i}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.getData('key') && onKeyDropped) {
                      onKeyDropped();
                    }
                  }}
                  animate={{
                    scale: isDragOver ? 1.05 : 1,
                    boxShadow: isDragOver
                      ? '0px 0px 20px 5px rgba(234, 179, 8, 0.6)'
                      : '0px 0px 10px 2px rgba(234, 179, 8, 0.3)',
                  }}
                  className={`p-4 border-2 rounded-xl flex items-center gap-4 text-sm font-mono font-bold transition-colors ${
                    isDragOver
                      ? 'bg-amber-900/30 border-amber-400 text-amber-300'
                      : 'bg-gradient-to-r from-amber-950/40 to-yellow-900/20 border-yellow-500/60 text-yellow-500'
                  }`}
                >
                  <motion.div
                    animate={{ rotate: isDragOver ? [-5, 5, -5] : 0, scale: isDragOver ? 1.1 : 1 }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.5)] border border-yellow-500/50"
                  >
                    <img src="/treasure-chest.jpg" alt="Treasure Chest" className="w-full h-full object-cover" />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="uppercase tracking-wider">
                      {isDragOver ? 'Drop Key to Unlock!' : 'Treasure Box Ready'}
                    </span>
                    <span className="text-[10px] text-amber-500/80 font-normal">
                      Drag the glowing key here
                    </span>
                  </div>
                  {isDragOver && (
                    <Unlock className="w-5 h-5 ml-auto text-amber-300 animate-pulse" />
                  )}
                </motion.div>
              );
            }

            return (
              <div
                key={i}
                className="p-2.5 bg-white/40 border border-dashed border-slate-200 rounded-xl flex items-center gap-2 text-[11px] font-mono text-slate-600"
              >
                <Lock className="w-3.5 h-3.5 text-slate-700" />
                <span>??? FRAGMENT LOCKED — solve a quiz to unlock</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
