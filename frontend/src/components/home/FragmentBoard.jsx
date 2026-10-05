import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

/* ── Code lines for the puzzle ── */
const LINE_TOP    = { id: 'top',    code: 'for (i = 0; i < n; i++) {', kw: 'for' };
const LINE_MIDDLE = { id: 'mid',    code: '  sum += arr[i];',            kw: 'sum' };
const LINE_BOTTOM = { id: 'bot',    code: '  return sum;',               kw: 'return' };

/* Syntax-colour a code string — highlights keyword in orange, rest white/cream */
function CodeLine({ code, kw, dim = false }) {
  const parts = code.split(kw);
  return (
    <span className={`font-mono text-[11px] sm:text-xs leading-relaxed ${dim ? 'opacity-50' : ''}`}>
      {parts[0] && <span className="text-slate-300">{parts[0]}</span>}
      <span className="text-[#F28C0F] font-bold">{kw}</span>
      {parts[1] && <span className="text-slate-300">{parts[1]}</span>}
    </span>
  );
}

/*
  State machine (cycle ~6s):
    idle (0)     → show slot empty (dashed outline)
    sliding (1)  → block slides in from right
    snapped (2)  → slot is solid, ✓ pill appears
    reset (-1)   → flash out, back to idle
*/
export default function FragmentBoard() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let timeout;
    if (phase === 0) timeout = setTimeout(() => setPhase(1), 1200); // wait, then slide
    if (phase === 1) timeout = setTimeout(() => setPhase(2), 700);  // after slide, snap
    if (phase === 2) timeout = setTimeout(() => setPhase(0), 2800); // show pill, then reset
    return () => clearTimeout(timeout);
  }, [phase]);

  const slotFilled = phase === 2;
  const blockVisible = phase === 1 || phase === 2;

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">Fragment Board</span>
      </div>

      {/* Code block area */}
      <div className="rounded-xl bg-slate-900 border border-slate-700/70 overflow-hidden">
        {/* Top line — solid */}
        <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" aria-hidden="true" />
          <CodeLine code={LINE_TOP.code} kw={LINE_TOP.kw} />
        </div>

        {/* Middle line — the slot */}
        <div className="px-3 py-2 border-b border-slate-800 relative min-h-[38px] flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0 mr-2" aria-hidden="true" />

          {/* Empty slot outline */}
          {!slotFilled && !blockVisible && (
            <div
              className="flex-1 h-6 rounded border-2 border-dashed border-[#F28C0F]/60 bg-[#F28C0F]/5"
              aria-label="empty code slot"
            />
          )}

          {/* Sliding / snapped block */}
          <AnimatePresence>
            {blockVisible && (
              <motion.div
                key="block"
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0,  opacity: 1 }}
                exit={{    x: 60, opacity: 0 }}
                transition={{
                  type: phase === 1 ? 'spring' : 'tween',
                  stiffness: 380, damping: 22,
                  duration: 0.35,
                }}
                className="flex-1"
              >
                <CodeLine code={LINE_MIDDLE.code} kw={LINE_MIDDLE.kw} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom line — solid */}
        <div className="px-3 py-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" aria-hidden="true" />
          <CodeLine code={LINE_BOTTOM.code} kw={LINE_BOTTOM.kw} />
        </div>
      </div>

      {/* ✓ Compiled pill — appears after snap */}
      <div className="h-7 mt-2">
        <AnimatePresence>
          {slotFilled && (
            <motion.div
              key="pill"
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1   }}
              exit={{    opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400"
            >
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold">✓ Compiled · 0 errors · +100 XP</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
