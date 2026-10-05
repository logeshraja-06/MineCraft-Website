import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Layers, Clock, Cpu, CheckCircle2 } from 'lucide-react';
import QuestConsole from './QuestConsole';

/* ─── Animation variants ─────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── HUD stat strip data ─────────────────────────────────── */
const stats = [
  { icon: Layers, value: '3 Tiers',     label: 'Easy → Medium → Hard' },
  { icon: Clock,  value: '15 Min',      label: 'Per Tier · Speed Scoring' },
  { icon: Cpu,    value: '3 Free Runs', label: 'Zero Penalty · Judge0' },
];

/* ─── Main Hero component ────────────────────────────────── */
export default function Hero({ participant, targetUrl }) {
  return (
    <section
      aria-label="Hero"
      className="relative min-h-[calc(100vh-72px)] flex items-center overflow-hidden"
    >
      {/* Faint dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(242,140,15,0.055) 1.5px, transparent 1.5px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Ambient glow blobs */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none animate-pulse-slow"
        aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(242,140,15,0.14) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/2 -left-24 w-[380px] h-[380px] rounded-full pointer-events-none animate-float-slow"
        aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.09) 0%, transparent 70%)' }}
      />

      {/* ─── Grid container ─────────────────────────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-10 lg:gap-14 items-center">

          {/* ═══════════════ LEFT COLUMN ══════════════════ */}
          <motion.div
            className="flex flex-col gap-6 text-center lg:text-left"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* 1 ── Status pill */}
            <motion.div
              variants={item}
              className="inline-flex items-center gap-2 self-center lg:self-start px-3.5 py-1.5 rounded-full bg-slate-950 border border-orange-500/60 shadow-md"
            >
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[11px] font-bold tracking-widest text-amber-300 uppercase whitespace-nowrap">
                Quest Online · Mind Craft Arena 2026
              </span>
            </motion.div>

            {/* 2 ── Headline — forced 2-line break via block spans */}
            <motion.h1
              variants={item}
              className="text-[2.65rem] sm:text-5xl lg:text-[3.5rem] font-black tracking-tight text-slate-900"
              style={{ lineHeight: 1.08 }}
            >
              <span className="block">Mine The Logic.</span>
              <span className="block bg-gradient-to-r from-[#F28C0F] via-amber-500 to-[#F28C0F] bg-clip-text text-transparent animate-gradient-shift">
                Craft The Solution.
              </span>
            </motion.h1>

            {/* 3 ── Subtext */}
            <motion.p
              variants={item}
              className="max-w-lg mx-auto lg:mx-0 text-[1.05rem] text-slate-600 leading-relaxed font-medium"
            >
              Solve coding challenges, hunt QR chests, assemble the code fragments and compile clean to win.
            </motion.p>

            {/* 4 ── CTA buttons */}
            <motion.div
              variants={item}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              {/* Primary game button */}
              <Link
                to={targetUrl}
                className="group relative overflow-hidden flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-[14px] bg-[#F28C0F] text-slate-950 font-black text-base border-b-[3px] border-[#b86200] active:border-b-0 active:translate-y-[2px] hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-orange-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C0F]"
              >
                {/* shimmer sweep */}
                <span
                  className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700 ease-in-out pointer-events-none"
                  aria-hidden="true"
                />
                <span className="relative z-10">Start Challenge Quest</span>
                <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>

              {/* Secondary outlined button */}
              <Link
                to="/rules"
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-[14px] border-2 border-slate-900 text-slate-900 font-bold text-base hover:bg-slate-900 hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                Rules &amp; Protocol
              </Link>
            </motion.div>

            {/* Signed-in indicator */}
            {participant?.name && (
              <motion.p
                variants={item}
                className="flex items-center justify-center lg:justify-start gap-1.5 text-[12px] text-slate-500 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                Signed in as&nbsp;
                <span className="text-slate-900 font-bold">{participant.name}</span>
                {(participant.participantId || participant.email) && (
                  <>&nbsp;({participant.participantId || participant.email})</>
                )}
              </motion.p>
            )}

            {/* 5 ── HUD stat strip */}
            <motion.div variants={item}>
              <div className="inline-flex items-stretch divide-x divide-slate-200 rounded-[14px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                {stats.map(({ icon: Icon, value, label }, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-4 py-3 hover:bg-orange-50 transition-colors duration-150 cursor-default"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <Icon className="w-3.5 h-3.5 text-[#F28C0F]" />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-[13px] text-slate-900 leading-none">{value}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5 leading-none whitespace-nowrap">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* ═══════════════ RIGHT COLUMN — Quest Console ═════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
          >
            <QuestConsole />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
