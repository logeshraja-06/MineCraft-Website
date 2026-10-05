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
    <div className="bg-white min-h-screen font-sans text-slate-800 overflow-hidden relative selection:bg-orange-100 selection:text-orange-900">

      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <Hero participant={participant} targetUrl={targetUrl} />

      {/* ── ALL OTHER SECTIONS inside max-w container ─────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── 3-TIER LINEAR MISSION PATH ── */}
        <section className="py-10">
          <div className="p-8 sm:p-10 bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-orange-50/90 border-2 border-orange-200/90 rounded-3xl text-center space-y-6 shadow-sm relative overflow-hidden bg-arcade-grid">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-orange-200 text-[#F28C0F] text-xs font-mono font-black tracking-wider uppercase shadow-xs">
              <Layers className="w-3.5 h-3.5" />
              <span>Strict Sequential Track · 0 Points Initial Baseline</span>
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                3-Tier Linear Mission Track
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                All contestants start with 0 points. Complete Easy to unlock Medium, then solve Medium to unlock Hard. Minimum negative points win!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 max-w-4xl mx-auto relative">

              {/* Tier 1: Easy */}
              <div className="p-6 bg-white rounded-2xl border-2 border-emerald-300/90 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-3 group text-center relative overflow-hidden">
                <div className="absolute top-2 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <IsometricVoxelCube size={32} variant="emerald" label="T1" />
                </div>
                <div className="inline-flex px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-black uppercase tracking-wider">
                  Tier 1 // Easy
                </div>
                <h4 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Warm-Up Logic
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Entry-level problem solving, warm-up logic tasks &amp; QR checkpoints.
                </p>
                <div className="pt-2 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 py-1.5 rounded-lg border border-emerald-100 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>15 Mins · 1 Problem Track</span>
                </div>
              </div>

              {/* Tier 2: Medium */}
              <div className="p-6 bg-white rounded-2xl border-2 border-amber-300/90 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-3 group text-center relative overflow-hidden">
                <div className="absolute top-2 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <IsometricVoxelCube size={32} variant="gold" label="T2" />
                </div>
                <div className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-mono font-black uppercase tracking-wider">
                  Tier 2 // Medium
                </div>
                <h4 className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                  Algorithms &amp; Structures
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Intermediate data structures &amp; algorithms requiring structured assembly.
                </p>
                <div className="pt-2 text-xs font-mono font-bold text-amber-700 bg-amber-50 py-1.5 rounded-lg border border-amber-100 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>15 Mins · 1 Problem Track</span>
                </div>
              </div>

              {/* Tier 3: Hard */}
              <div className="p-6 bg-white rounded-2xl border-2 border-rose-300/90 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-3 group text-center relative overflow-hidden">
                <div className="absolute top-2 right-3 opacity-20 group-hover:opacity-40 transition-opacity">
                  <IsometricVoxelCube size={32} variant="redstone" label="T3" />
                </div>
                <div className="inline-flex px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-mono font-black uppercase tracking-wider">
                  Tier 3 // Hard
                </div>
                <h4 className="text-2xl font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                  Master Arena
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Championship-tier computational challenges &amp; advanced edge-case testing.
                </p>
                <div className="pt-2 text-xs font-mono font-bold text-rose-700 bg-rose-50 py-1.5 rounded-lg border border-rose-100 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>15 Mins · 1 Problem Track</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS: 6 STEP CARDS ── */}
        <section className="py-12 md:py-16 border-t border-slate-100 relative">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-2 bg-[#F28C0F] rounded-full"></div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
                <span>HOW IT WORKS</span>
                <span className="text-xs font-mono font-bold text-[#F28C0F] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  6 GAMEPLAY STAGES
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
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
                  className="relative min-h-[300px] p-6 bg-white rounded-3xl border-2 border-orange-100 hover:border-[#F28C0F] shadow-sm hover:shadow-[0_15px_35px_rgba(242,140,15,0.22)] hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center overflow-hidden"
                >
                  <div className="absolute top-2 left-3 text-5xl font-black text-slate-100 group-hover:text-orange-100/60 select-none transition-colors duration-300">
                    0{index + 1}
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-orange-50 group-hover:bg-[#F28C0F] flex items-center justify-center relative mb-4 transition-all duration-300 z-10 mt-3 group-hover:scale-110 shadow-xs">
                    <Icon className="w-8 h-8 text-[#F28C0F] group-hover:text-white transition-colors duration-300" strokeWidth={2.2} />
                  </div>

                  <span className="text-[10px] font-mono font-black text-[#F28C0F] uppercase tracking-wider mb-1 z-10">
                    {step.stage}
                  </span>

                  <h4 className="font-black text-slate-900 text-base mb-2 z-10 group-hover:text-[#F28C0F] transition-colors leading-tight">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium z-10">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CHALLENGE HIGHLIGHTS GRID ── */}
        <section className="py-12 md:py-16 border-t border-slate-100 relative">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-2 bg-[#F28C0F] rounded-full"></div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-wider uppercase flex items-center gap-2">
                <span>COMPETITION HIGHLIGHTS</span>
                <span className="text-xs font-mono font-bold text-[#F28C0F] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  CRITICAL RULES
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
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
                  className="p-8 bg-white rounded-3xl border-2 border-orange-100 hover:border-[#F28C0F] shadow-sm hover:shadow-[0_20px_40px_rgba(242,140,15,0.18)] hover:-translate-y-2 transition-all duration-300 flex flex-col sm:flex-row gap-5 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                  <div className="w-14 h-14 rounded-2xl bg-orange-50 flex-shrink-0 flex items-center justify-center text-[#F28C0F] group-hover:bg-[#F28C0F] group-hover:text-white transition-all duration-300 z-10 shadow-xs group-hover:scale-105">
                    <Icon className="w-7 h-7" strokeWidth={2} />
                  </div>
                  <div className="z-10 space-y-1.5">
                    <span className="text-[10px] font-mono font-black text-[#F28C0F] uppercase tracking-wider block">
                      {highlight.tag}
                    </span>
                    <h4 className="font-black text-slate-900 text-lg group-hover:text-[#F28C0F] transition-colors leading-tight">
                      {highlight.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      {highlight.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* ── ARENA PORTAL CTA (Full-width, no broken SVG) ── */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-[#FFFCF8] border-t-2 border-orange-100/90">

        {/* Concentric rings — centred, no cuts */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full border border-orange-200/50 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-dashed border-orange-300/40 pointer-events-none animate-radar"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-orange-200/30 via-amber-100/40 to-transparent blur-3xl pointer-events-none"></div>

        {/* Left edge wave — stays anchored to the left wall, no overlap */}
        <div className="absolute top-0 left-0 w-[22vw] md:w-[18vw] h-full pointer-events-none opacity-70">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,0 Q60,50 0,100 Z" fill="#FFEDC2" opacity="0.65"/>
            <path d="M0,18 Q42,50 0,82 Z" fill="#FFD37A" opacity="0.48"/>
            <path d="M0,33 Q28,50 0,67 Z" fill="#FFB733" opacity="0.38"/>
          </svg>
        </div>

        {/* Right edge wave — CSS mirror (scaleX -1), NO rotate-180 trick */}
        <div
          className="absolute top-0 right-0 w-[22vw] md:w-[18vw] h-full pointer-events-none opacity-70"
          style={{ transform: 'scaleX(-1)' }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,0 Q60,50 0,100 Z" fill="#FFEDC2" opacity="0.65"/>
            <path d="M0,18 Q42,50 0,82 Z" fill="#FFD37A" opacity="0.48"/>
            <path d="M0,33 Q28,50 0,67 Z" fill="#FFB733" opacity="0.38"/>
          </svg>
        </div>

        {/* Flanking decorative voxels */}
        <div className="absolute top-16 left-[7%] hidden md:block z-10">
          <IsometricVoxelCube size={52} variant="gold" label="{ }" floatDuration={5.5} delay={0.3} />
        </div>
        <div className="absolute bottom-14 left-[10%] hidden lg:block z-10">
          <XpOrbToken size={24} value="+500 XP" delay={1.1} />
        </div>
        <div className="absolute top-20 right-[8%] hidden md:block z-10">
          <IsometricVoxelCube size={48} variant="emerald" label="✓" floatDuration={6.2} delay={0.9} />
        </div>
        <div className="absolute bottom-16 right-[7%] hidden lg:block z-10">
          <PixelKeyToken size={40} delay={1.5} />
        </div>

        {/* CTA content */}
        <div className="relative z-20 max-w-3xl mx-auto text-center px-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-900 border border-orange-300 text-xs font-mono font-black uppercase tracking-wider shadow-xs">
            <Trophy className="w-4 h-4 text-[#F28C0F]" />
            <span>ARENA PORTAL // READY FOR COMBAT</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0B1A28] tracking-tight leading-tight">
            Ready to Enter<br />
            <span className="bg-gradient-to-r from-[#F28C0F] to-amber-500 bg-clip-text text-transparent">
              the Arena?
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Test your logic, precision, and problem-solving speed under tournament pressure. Register your credentials now or jump directly into the live challenge track!
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="group relative overflow-hidden px-10 py-4 rounded-[14px] bg-[#FFBE4D] hover:bg-[#F28C0F] text-[#0B1A28] font-black text-lg transition-all duration-300 flex items-center gap-3 shadow-xl shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-1 active:translate-y-0 border-b-4 border-amber-600 active:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C0F]"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 animate-shimmer pointer-events-none"></div>
              <span className="relative z-10">Register Now</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/rules"
              className="px-8 py-4 rounded-[14px] border-2 border-slate-900 text-slate-900 font-bold text-base hover:bg-slate-900 hover:text-white transition-all duration-300 hover:-translate-y-1 active:translate-y-0 flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <ClipboardList className="w-4 h-4" />
              <span>View Rules &amp; Protocol</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
