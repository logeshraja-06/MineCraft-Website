import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useParticipant } from '../context/ParticipantContext';
import { challengeApi } from '../services/challengeApi';
import {
  ClipboardList,
  KeyRound,
  Box,
  Code,
  Puzzle,
  PlayCircle,
  Zap,
  Package,
  Play,
  Clock,
  ArrowRight,
  Layers,
  Trophy,
  Cpu,
} from 'lucide-react';
import Hero from '../components/home/Hero';
import { IsometricVoxelCube, XpOrbToken, PixelKeyToken } from '../components/home/FloatingGraphicTokens';

export default function Home() {
  const { participant } = useParticipant();
  const [currentChallengeSlug, setCurrentChallengeSlug] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function checkProgress() {
      if (!participant) return;
      try {
        const res = await challengeApi.getProgress();
        if (!cancelled && res.success && res.currentChallengeSlug) {
          setCurrentChallengeSlug(res.currentChallengeSlug);
        }
      } catch (_) {}
    }
    checkProgress();
    return () => { cancelled = true; };
  }, [participant]);

  const targetUrl = participant && currentChallengeSlug
    ? `/challenge?id=${currentChallengeSlug}`
    : '/challenges';

  const steps = [
    { stage: 'STAGE 01', title: 'Solve Task',       desc: 'Solve MCQ, predict output, fill-in-the-blank to unlock checkpoints.',          icon: ClipboardList },
    { stage: 'STAGE 02', title: 'Earn Key',          desc: 'Answer correctly to reveal the QR code and unlock your block.',                  icon: KeyRound     },
    { stage: 'STAGE 03', title: 'Open Chest',        desc: 'Scan and collect scrambled code fragments from the vault.',                      icon: Box          },
    { stage: 'STAGE 04', title: 'Collect Fragment',  desc: 'Gather all required code pieces to assemble the complete program.',              icon: Code         },
    { stage: 'STAGE 05', title: 'Assemble Code',     desc: 'Arrange fragments on the board into the correct logic order.',                   icon: Puzzle       },
    { stage: 'STAGE 06', title: 'Run & Submit',      desc: 'Test with 3 free runs, verify against test cases, and submit.',                  icon: PlayCircle   },
  ];

  const highlights = [
    { title: '3-Tier Linear Progression',  desc: 'Complete Easy (15m) to unlock Medium (15m), and Medium to unlock Hard (15m). Strict sequential track.',        icon: Layers,  tag: 'LEVEL PROGRESSION' },
    { title: 'Task Checkpoints',            desc: 'Answer MCQs and Fill in the Blanks. -20 pts penalty per wrong answer; answer revealed after 3 attempts.',      icon: Zap,     tag: 'PENALTY MECHANIC'  },
    { title: 'Fragment Assembly Vault',     desc: 'Collect all jumbled blocks and drag them into the correct program structure before compilation.',                icon: Package, tag: 'LOGIC PUZZLE'      },
    { title: 'Real-Time Judge0 Sandbox',   desc: 'Execute your assembled C, C++, Java, or Python code against official test inputs with instant feedback.',        icon: Play,    tag: 'CODE EXECUTION'    },
    { title: '15-Min Timer & Speed Scoring', desc: 'Every minute that elapses deducts -10 pts. Move fast and avoid extra runs to keep negative score minimal!',   icon: Clock,   tag: 'SPEED BONUS'       },
    { title: '3 Free Runs Allowance',       desc: 'First 3 sample runs are 100% free! Extra runs beyond 3 incur -10 pts each. Strategize your testing.',          icon: Cpu,     tag: 'TEST STRATEGY'     },
  ];

  return (
    <div className="bg-[#07080D] min-h-screen font-sans text-slate-100 overflow-hidden relative selection:bg-purple-600 selection:text-white">

      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <Hero participant={participant} targetUrl={targetUrl} />

      {/* ── ALL OTHER SECTIONS inside max-w container ─────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── 3-TIER LINEAR MISSION PATH ── */}
        <section className="py-12">
          <div className="p-8 sm:p-10 bg-[#0D0F18]/80 border border-purple-500/30 rounded-3xl text-center space-y-6 shadow-2xl shadow-purple-950/40 relative overflow-hidden backdrop-blur-xl">

            {/* Ambient glow flare inside card */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold tracking-widest uppercase shadow-md relative z-10">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Strict Sequential Track · 0 Points Initial Baseline</span>
            </div>

            <div className="space-y-2 max-w-xl mx-auto relative z-10">
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
                3-Tier Linear Mission Track
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                All contestants start with 0 points. Complete Easy to unlock Medium, then solve Medium to unlock Hard. Minimum negative points win!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 max-w-4xl mx-auto relative z-10">

              {/* Tier 1: Easy */}
              <div className="p-6 bg-[#111422]/90 rounded-2xl border border-emerald-500/40 shadow-xl hover:shadow-[0_0_25px_rgba(34,197,94,0.3)] hover:border-emerald-400 hover:-translate-y-1.5 transition-all duration-300 space-y-3 group text-center relative overflow-hidden">
                <div className="absolute top-2 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <IsometricVoxelCube size={32} variant="emerald" label="T1" />
                </div>
                <div className="inline-flex px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono font-black uppercase tracking-wider">
                  Tier 1 // Easy
                </div>
                <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
                  Warm-Up Logic
                </h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Entry-level problem solving, warm-up logic tasks &amp; QR checkpoints.
                </p>
                <div className="pt-2 text-xs font-mono font-bold text-emerald-300 bg-emerald-950/40 py-1.5 rounded-lg border border-emerald-500/30 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>15 Mins · 1 Problem Track</span>
                </div>
              </div>

              {/* Tier 2: Medium */}
              <div className="p-6 bg-[#111422]/90 rounded-2xl border border-purple-500/40 shadow-xl hover:shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:border-purple-400 hover:-translate-y-1.5 transition-all duration-300 space-y-3 group text-center relative overflow-hidden">
                <div className="absolute top-2 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <IsometricVoxelCube size={32} variant="gold" label="T2" />
                </div>
                <div className="inline-flex px-3 py-1 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 text-[11px] font-mono font-black uppercase tracking-wider">
                  Tier 2 // Medium
                </div>
                <h4 className="text-2xl font-black text-white group-hover:text-purple-300 transition-colors">
                  Algorithms &amp; Structures
                </h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Intermediate data structures &amp; algorithms requiring structured assembly.
                </p>
                <div className="pt-2 text-xs font-mono font-bold text-purple-300 bg-purple-950/40 py-1.5 rounded-lg border border-purple-500/30 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>15 Mins · 1 Problem Track</span>
                </div>
              </div>

              {/* Tier 3: Hard */}
              <div className="p-6 bg-[#111422]/90 rounded-2xl border border-rose-500/40 shadow-xl hover:shadow-[0_0_25px_rgba(244,63,94,0.35)] hover:border-rose-400 hover:-translate-y-1.5 transition-all duration-300 space-y-3 group text-center relative overflow-hidden">
                <div className="absolute top-2 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <IsometricVoxelCube size={32} variant="redstone" label="T3" />
                </div>
                <div className="inline-flex px-3 py-1 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-300 text-[11px] font-mono font-black uppercase tracking-wider">
                  Tier 3 // Hard
                </div>
                <h4 className="text-2xl font-black text-white group-hover:text-rose-400 transition-colors">
                  Master Arena
                </h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Championship-tier computational challenges &amp; advanced edge-case testing.
                </p>
                <div className="pt-2 text-xs font-mono font-bold text-rose-300 bg-rose-950/40 py-1.5 rounded-lg border border-rose-500/30 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>15 Mins · 1 Problem Track</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS: 6 STEP CARDS ── */}
        <section className="py-12 md:py-16 border-t border-purple-900/30 relative">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-2 bg-gradient-to-r from-purple-500 to-violet-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase flex items-center gap-2">
                <span>HOW IT WORKS</span>
                <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/70 px-3 py-0.5 rounded-full border border-purple-500/40">
                  6 GAMEPLAY STAGES
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                The core quest mechanics from unlocking the key to compiler execution
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative min-h-[300px] p-6 bg-[#0D0F18]/80 rounded-3xl border border-purple-500/25 hover:border-purple-400 shadow-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center overflow-hidden backdrop-blur-md"
                >
                  <div className="absolute top-2 left-3 text-5xl font-black text-purple-950/40 group-hover:text-purple-900/50 select-none transition-colors duration-300">
                    0{index + 1}
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-500/30 group-hover:bg-purple-600 flex items-center justify-center relative mb-4 transition-all duration-300 z-10 mt-3 group-hover:scale-110 shadow-lg shadow-purple-950/40">
                    <Icon className="w-8 h-8 text-purple-400 group-hover:text-white transition-colors duration-300" strokeWidth={2.2} />
                  </div>

                  <span className="text-[10px] font-mono font-black text-purple-400 uppercase tracking-widest mb-1 z-10">
                    {step.stage}
                  </span>

                  <h4 className="font-black text-white text-base mb-2 z-10 group-hover:text-purple-300 transition-colors leading-tight">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium z-10">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CHALLENGE HIGHLIGHTS GRID ── */}
        <section className="py-12 md:py-16 border-t border-purple-900/30 relative">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-2 bg-gradient-to-r from-purple-500 to-violet-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase flex items-center gap-2">
                <span>COMPETITION HIGHLIGHTS</span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 px-3 py-0.5 rounded-full border border-emerald-500/40">
                  CRITICAL RULES
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                Key tournament constraints, execution rules, and scoring policies
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon;
              return (
                <div
                  key={index}
                  className="p-8 bg-[#0D0F18]/80 rounded-3xl border border-purple-500/25 hover:border-purple-400 shadow-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:-translate-y-2 transition-all duration-300 flex flex-col sm:flex-row gap-5 group relative overflow-hidden backdrop-blur-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                  <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-500/40 flex-shrink-0 flex items-center justify-center text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 z-10 shadow-md group-hover:scale-105">
                    <Icon className="w-7 h-7" strokeWidth={2} />
                  </div>
                  <div className="z-10 space-y-1.5">
                    <span className="text-[10px] font-mono font-black text-purple-400 uppercase tracking-wider block">
                      {highlight.tag}
                    </span>
                    <h4 className="font-black text-white text-lg group-hover:text-purple-300 transition-colors leading-tight">
                      {highlight.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                      {highlight.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* ── ARENA PORTAL CTA (Full-width Nether Portal Arena) ── */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-[#07080D] via-[#0B0C16] to-[#07080D] border-t border-purple-900/30">

        {/* Concentric rings with purple energy glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full border border-purple-500/20 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-dashed border-purple-400/30 pointer-events-none animate-radar"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-purple-600/30 via-indigo-600/20 to-transparent blur-3xl pointer-events-none"></div>

        {/* CTA content */}
        <div className="relative z-20 max-w-3xl mx-auto text-center px-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/70 text-purple-300 border border-purple-500/50 text-xs font-mono font-black uppercase tracking-wider shadow-lg shadow-purple-950/50">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span>ARENA PORTAL // READY FOR COMBAT</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight uppercase font-sans">
            Ready to Enter<br />
            <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]">
              the Arena?
            </span>
          </h2>

          <p className="text-slate-300 text-base sm:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Test your logic, precision, and problem-solving speed under tournament pressure. Register your credentials now or jump directly into the live challenge track!
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="group relative overflow-hidden px-10 py-4 rounded-full border border-purple-500 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.8)] hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">ENTER THE WORLD</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/rules"
              className="px-8 py-4 rounded-full border border-slate-700 bg-[#0D0F18]/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:border-purple-500/50 flex items-center gap-2 backdrop-blur-md"
            >
              <ClipboardList className="w-4 h-4 text-purple-400" />
              <span>View Rules &amp; Protocol</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
