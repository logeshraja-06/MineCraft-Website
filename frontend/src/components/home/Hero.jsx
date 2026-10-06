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
      className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#07080D]"
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
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 lg:py-20 flex flex-col justify-between min-h-[85vh]">
        
        {/* Main Hero Column */}
        <div className="max-w-2xl my-auto pt-6 lg:pt-0">
          <motion.div
            className="flex flex-col gap-6 text-left"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* 1 ── Creeper Badge Pill */}
            <motion.div
              variants={item}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0D0F18]/90 border border-emerald-500/40 shadow-lg shadow-emerald-950/40 w-fit backdrop-blur-md"
            >
              {/* Pixel Creeper Icon */}
              <div className="w-4 h-4 rounded-xs bg-emerald-500 flex items-center justify-center p-0.5 shadow-[0_0_8px_rgba(34,197,94,0.6)]">
                <div className="w-full h-full flex flex-col justify-between items-center">
                  <div className="w-full flex justify-between">
                    <span className="w-1 h-1 bg-[#07080D] rounded-xxs" />
                    <span className="w-1 h-1 bg-[#07080D] rounded-xxs" />
                  </div>
                  <span className="w-1.5 h-1 bg-[#07080D]" />
                </div>
              </div>
              <span className="font-mono text-[11px] font-black tracking-widest text-emerald-400 uppercase">
                Built for Creators // Loved by Generations
              </span>
            </motion.div>

            {/* 2 ── Monumental Display Headline */}
            <motion.div variants={item} className="space-y-0 tracking-tight font-black">
              <h1 className="text-[3.6rem] sm:text-[4.8rem] lg:text-[5.8rem] leading-[0.92] text-white font-extrabold font-sans uppercase">
                IMAGINE
              </h1>
              <h1 className="text-[3.6rem] sm:text-[4.8rem] lg:text-[5.8rem] leading-[0.92] text-slate-200 font-extrabold font-sans uppercase">
                BUILD
              </h1>
              <h1 className="text-[3.6rem] sm:text-[4.8rem] lg:text-[5.8rem] leading-[0.92] font-extrabold font-sans uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-fuchsia-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.7)]">
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
              {/* Primary Glowing Pill Button */}
              <Link
                to={targetUrl}
                className="group relative overflow-hidden flex items-center justify-center gap-3 px-8 py-3.5 rounded-full border border-purple-500/90 bg-gradient-to-r from-purple-950/70 via-purple-900/60 to-indigo-950/70 hover:from-purple-600 hover:to-indigo-600 text-purple-200 hover:text-white font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.75)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>ENTER THE WORLD</span>
                <ArrowRight className="w-4 h-4 text-purple-300 group-hover:translate-x-1 group-hover:text-white transition-all" />
              </Link>

              {/* Secondary Outlined Button */}
              <Link
                to="/rules"
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-slate-700/80 bg-[#0D0F18]/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:border-purple-500/50 backdrop-blur-md"
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
        <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-purple-900/20 text-xs font-mono">
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
