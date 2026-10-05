import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import HudBar from './HudBar';
import QuestPath from './QuestPath';
import FragmentBoard from './FragmentBoard';

/* ─── Framer Motion stagger variants ────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};

/* ─── 3D tilt helpers ────────────────────────────────────── */
const MAX_TILT = 4; // degrees

export default function QuestConsole() {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = useCallback((e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / (rect.height / 2)) * -MAX_TILT;
    const ry = ((e.clientX - cx) / (rect.width / 2)) *  MAX_TILT;
    setTilt({ rx, ry });
  }, []);

  const handleMouseLeave = useCallback(() => setTilt({ rx: 0, ry: 0 }), []);

  return (
    /* Glow wrapper — purely ambient, aria-hidden */
    <div className="relative flex justify-center lg:justify-end" aria-hidden="false">
      {/* Radial orange glow behind card */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full pointer-events-none animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(242,140,15,0.22) 0%, rgba(242,140,15,0.06) 55%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* ── Card ── */}
      <motion.div
        ref={cardRef}
        aria-label="Animated preview of the quest flow"
        role="img"
        className="relative w-full max-w-[520px] rounded-2xl border border-[#F28C0F]/20 bg-slate-950 shadow-2xl overflow-hidden cursor-default"
        style={{
          /* Gentle infinite float */
          animation: 'consoleFloat 5s ease-in-out infinite',
          /* 3D tilt — applied reactively */
          transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 0.18s ease-out',
        }}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Subtle inner dot-grid ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(242,140,15,0.08) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
          aria-hidden="true"
        />

        {/* ── Orange top accent line ── */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#F28C0F]/60 to-transparent" aria-hidden="true" />

        {/* ═══════ TITLE BAR ═══════ */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          {/* File label */}
          <span className="font-mono text-[11px] text-slate-400 tracking-wider">mindcraft.exe</span>
          {/* Live dot */}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* ═══════ CARD BODY — staggered children ═══════ */}
        <motion.div
          className="flex flex-col gap-4 p-4"
          variants={stagger}
          initial="hidden"
          animate="show"
        >

          {/* 1 ── HUD row */}
          <motion.div variants={childVariants}>
            <HudBar />
          </motion.div>

          {/* 2 ── Divider */}
          <div className="h-px bg-slate-800" aria-hidden="true" />

          {/* 3 ── Quest path */}
          <motion.div variants={childVariants}>
            <QuestPath />
          </motion.div>

          {/* 4 ── Divider */}
          <div className="h-px bg-slate-800" aria-hidden="true" />

          {/* 5 ── Fragment board */}
          <motion.div variants={childVariants}>
            <FragmentBoard />
          </motion.div>

          {/* 6 ── Footer terminal hint */}
          <motion.div variants={childVariants}>
            <div className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 flex items-center gap-1">
              <span className="font-mono text-[10px] text-slate-500 select-none">
                &gt; scan QR chest to collect fragments
              </span>
              {/* Blinking cursor */}
              <span
                className="inline-block w-1.5 h-3 bg-[#F28C0F] ml-0.5 rounded-sm"
                style={{ animation: 'cursorBlink 1.1s step-end infinite' }}
                aria-hidden="true"
              />
            </div>
          </motion.div>

        </motion.div>
      </motion.div>
    </div>
  );
}
