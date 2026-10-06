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
  { icon: Layers, value: '3 Tiers', label: 'Easy → Medium → Hard' },
  { icon: Clock, value: '15 Min', label: 'Per Tier · Speed Scoring' },
  { icon: Cpu, value: '3 Free Runs', label: 'Zero Penalty · Judge0' },
];

/* ─── Main Hero component ────────────────────────────────── */
export default function Hero({ participant, targetUrl }) {
  return (
    <section
      aria-label="Hero"
      className="relative h-screen min-h-screen flex flex-col justify-between overflow-hidden bg-[#07080D]"
    >
      {/* Background Nether Portal Image from Reference */}
      <div className="absolute inset-0 z-0">
        <img
          src="/portal-hero.jpg"
          alt="Minecraft Nether Portal Universe"
          className="w-full h-full object-cover object-center lg:object-right filter brightness-[0.88] contrast-[1.05]"
        />
        {/* Cinematic gradient overlays to blend text seamlessly */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/40 to-[#07080D]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080D] via-[#07080D]/75 to-transparent hidden md:block" />
        {/* Subtle purple radial glow flare */}
        <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ─── Foreground Content ─────────────────────────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-20 sm:pt-24 pb-6 sm:pb-8 flex flex-col justify-between h-full">

        {/* Main Hero Column */}
        <div className="max-w-2xl my-auto pt-2 lg:pt-0">
          <motion.div
            className="flex flex-col gap-5 sm:gap-6 text-left"
            variants={container}
            initial="hidden"
            animate="show"
          >

            {/* Monumental Display Headline */}
            <motion.div variants={item} className="space-y-0 tracking-tight font-black">

              <h1 className="text-[3.2rem] sm:text-[4.4rem] lg:text-[5.4rem] leading-[0.92] text-white font-bold font-sans uppercase">
                IMAGINE
              </h1>
              <h1 className="text-[3.2rem] sm:text-[4.4rem] lg:text-[5.4rem] leading-[0.92] text-slate-200 font-bold font-sans uppercase">
                BUILD
              </h1>
              <h1 className="text-[3.2rem] sm:text-[4.4rem] lg:text-[5.4rem] leading-[0.92] font-bold font-sans uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-fuchsia-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.7)]">
                BEYOND
              </h1>
            </motion.div>

            {/* 3 ── Subtext uppercase tracked */}
            <motion.p
              variants={item}
              className="max-w-lg text-xs sm:text-sm font-semibold tracking-wider text-slate-300 uppercase leading-relaxed font-sans"
            >
              Minecraft isn't just a game. It's a canvas. A toolkit. A universe where the only limit is your ideas.
            </motion.p>

            {/* 4 ── CTA buttons */}
            <motion.div
              variants={item}
              className="flex flex-col sm:flex-row gap-4 pt-2 items-start"
            >
              {/* Primary Pill Button */}
              <Link
                to={targetUrl}
                className="group relative overflow-hidden flex items-center justify-center gap-3 px-8 py-3.5  bg-white hover:bg-purple-50 text-purple-900 hover:text-purple-950 font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-[0.98] border border-white"
              >
                <span>ENTER THE WORLD</span>
                <ArrowRight className="w-4 h-4 text-purple-700 group-hover:translate-x-1 group-hover:text-purple-900 transition-all" />
              </Link>

              {/* Secondary Button */}
              <Link
                to="/rules"
                className="flex items-center justify-center gap-2 px-7 py-3.5  bg-transparent hover:bg-white text-white hover:text-purple-950 font-black text-sm uppercase tracking-widest transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-[0_0_20px_rgba(255,255,255,0.35)] border border-purple-200/60"
              >
                <span>Explore Rules</span>
              </Link>
            </motion.div>

            {/* Signed-in badge */}
            {participant?.name && (
              <motion.div
                variants={item}
                className="flex items-center gap-2 text-xs text-slate-400 font-medium pt-1"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                <span>Signed in as <strong className="text-purple-300">{participant.name}</strong></span>
                {participant.participantId && (
                  <span className="text-slate-500 font-mono">({participant.participantId})</span>
                )}
              </motion.div>
            )}

          </motion.div>
        </div>

        {/* ─── Bottom Reference Corner Badges ──────────────────────── */}
        <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-purple-900/20 text-xs font-mono">
          {/* Bottom Left: Ultimate Sandbox badge */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0D0F18]/70 border border-purple-500/30 backdrop-blur-md shadow-lg shadow-purple-950/20">
            <span className="text-purple-400 text-base">✦</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">The Ultimate Sandbox</div>
              <div className="text-xs font-black text-white tracking-widest">MINDCRAFT 2026</div>
            </div>
          </div>

          {/* Bottom Right: Micro Motto */}
          <div className="flex items-center gap-2 text-slate-400 text-xs tracking-widest uppercase font-semibold">
            <span className="text-purple-400">CREATE</span>
            <span className="text-slate-600">•</span>
            <span className="text-purple-400">CONNECT</span>
            <span className="text-slate-600">•</span>
            <span className="text-purple-400">INSPIRE</span>
          </div>
        </div>

      </div>
    </section>
  );
}
