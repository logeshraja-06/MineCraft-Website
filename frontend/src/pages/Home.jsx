import React, { useState, useEffect, useRef } from 'react';
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
  Lock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Hero from '../components/home/Hero';
import { IsometricVoxelCube, XpOrbToken, PixelKeyToken } from '../components/home/FloatingGraphicTokens';

export default function Home() {
  const { participant } = useParticipant();
  const [currentChallengeSlug, setCurrentChallengeSlug] = useState(null);
  const trackRef = useRef(null);

  const scrollTrack = (direction) => {
    if (trackRef.current) {
      const scrollAmount = trackRef.current.clientWidth * 0.8;
      trackRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

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

  return (
    <div className="bg-[#07080D] min-h-screen font-sans text-slate-100 overflow-hidden relative selection:bg-purple-600 selection:text-white">

      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <Hero participant={participant} targetUrl={targetUrl} />

      {/* ── 3-TIER LINEAR MISSION PATH (PREMIUM FULL-SCREEN SHOWCASE) ── */}
      <section className="w-full min-h-screen h-screen bg-white text-slate-900 flex flex-col justify-center border-y border-slate-200/90 relative overflow-hidden py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full flex flex-col justify-center my-auto">

          {/* Top Header Row: Clean Elegant Title & Subtitle + Carousel Arrows */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 sm:pb-6">
            <div className="space-y-2 max-w-3xl text-left">
              <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight">
                3-Tier Linear Mission Track
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed font-normal">
                All contestants start with 0 points. Complete Easy to unlock Medium, then solve Medium to unlock Hard. Minimum negative points win!
              </p>
            </div>

            {/* Circular Carousel Controls (Exactly like reference UI) */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
              <button
                type="button"
                onClick={() => scrollTrack('left')}
                aria-label="Previous card"
                className="w-10 h-10 rounded-full border border-slate-300 hover:border-slate-800 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors shadow-xs active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={() => scrollTrack('right')}
                aria-label="Next card"
                className="w-10 h-10 rounded-full border border-slate-300 hover:border-slate-800 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors shadow-xs active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>
          </div>

          {/* 3 Editorial Cards Grid */}
          <div
            ref={trackRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 overflow-x-auto no-scrollbar scroll-smooth"
          >

            {/* Card 1: Easy */}
            <div className="group flex flex-col justify-between text-left rounded-none">
              <div>
                {/* Image Banner: Non-rounded (sharp corners) */}
                <div className="relative overflow-hidden rounded-none aspect-[16/10] bg-slate-900 shadow-xs border border-slate-200">
                  <img
                    src="/tier-easy.jpg"
                    alt="Warm-Up Logic"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-none"
                  />
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-medium text-slate-900 mt-4 mb-2 leading-snug group-hover:text-purple-700 transition-colors">
                  Warm-Up Logic
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Entry-level problem solving, warm-up logic tasks &amp; QR checkpoints. Solve fundamental MCQs and code outputs to unlock your first fragments and gain initial momentum.
                </p>
              </div>

              {/* Clean minimal footer */}
              <div className="pt-3 mt-4 flex items-center justify-between border-t border-slate-100 text-xs font-normal text-slate-500">
                <span className="text-emerald-700 font-medium">Tier 1 // Easy · 15 Mins</span>
                <span className="font-mono text-slate-400">Stage 01</span>
              </div>
            </div>

            {/* Card 2: Medium */}
            <div className="group flex flex-col justify-between text-left rounded-none">
              <div>
                {/* Image Banner: Non-rounded */}
                <div className="relative overflow-hidden rounded-none aspect-[16/10] bg-slate-900 shadow-xs border border-slate-200">
                  <img
                    src="/tier-medium.jpg"
                    alt="Algorithms & Structures"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-none"
                  />
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-medium text-slate-900 mt-4 mb-2 leading-snug group-hover:text-purple-700 transition-colors">
                  Algorithms &amp; Structures
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Intermediate data structures &amp; algorithms requiring structured assembly. Collect scrambled code pieces from vault chests and arrange them into accurate computational pipelines.
                </p>
              </div>

              {/* Clean minimal footer */}
              <div className="pt-3 mt-4 flex items-center justify-between border-t border-slate-100 text-xs font-normal text-slate-500">
                <span className="text-purple-700 font-medium">Tier 2 // Medium · 15 Mins</span>
                <span className="font-mono text-slate-400">Stage 02</span>
              </div>
            </div>

            {/* Card 3: Hard */}
            <div className="group flex flex-col justify-between text-left rounded-none">
              <div>
                {/* Image Banner: Non-rounded */}
                <div className="relative overflow-hidden rounded-none aspect-[16/10] bg-slate-900 shadow-xs border border-slate-200">
                  <img
                    src="/tier-hard.jpg"
                    alt="Master Arena"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-none"
                  />
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-medium text-slate-900 mt-4 mb-2 leading-snug group-hover:text-purple-700 transition-colors">
                  Master Arena
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Championship-tier computational challenges &amp; advanced edge-case testing. Assemble complex algorithms, optimize logic execution, and pass judge test cases for peak speed bonus points.
                </p>
              </div>

              {/* Clean minimal footer */}
              <div className="pt-3 mt-4 flex items-center justify-between border-t border-slate-100 text-xs font-normal text-slate-500">
                <span className="text-rose-700 font-medium">Tier 3 // Hard · 15 Mins</span>
                <span className="font-mono text-slate-400">Stage 03</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS (DARK SECTION // EDITORIAL 3-PHASE JOURNEY WITH IMAGES) ── */}
      <section className="w-full bg-[#07080D] text-slate-100 py-24 px-6 sm:px-8 lg:px-12 border-b border-purple-900/20 relative">
        <div className="max-w-7xl mx-auto space-y-16">

          {/* Section Header */}
          <div className="max-w-3xl text-left space-y-2">
            <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
              Tournament Gameplay Protocol
            </h2>
            <p className="text-sm text-slate-400 font-normal leading-relaxed">
              From checkpoint problem solving to code assembly and compiler execution — master the 3 core phases.
            </p>
          </div>

          {/* Editorial 3-Phase Showcase with Real Images (No Repetitive Cards) */}
          <div className="space-y-12">

            {/* Phase 1: Tasks & Golden Key */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-purple-950/60 bg-[#0B0D15] p-6 sm:p-8 rounded-none">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-mono text-purple-400 font-medium uppercase tracking-wider block">
                  Phase 01 // Checkpoint Clearance
                </span>
                <h3 className="text-2xl sm:text-3xl font-normal text-white leading-tight">
                  Solve Tasks &amp; Earn The Golden Key
                </h3>
                <p className="text-sm text-slate-400 font-normal leading-relaxed">
                  Each challenge begins with locked checkpoints. Solve targeted Multiple Choice Questions (MCQ) or predict code outputs to verify your computational logic. Answer correctly to reveal the QR checkpoint and receive your digital Golden Key.
                </p>
                <div className="pt-2 flex items-center gap-6 text-xs text-slate-400 border-t border-purple-950/80">
                  <div>
                    <span className="text-white font-medium block">MCQ &amp; Logic</span>
                    <span>Task Format</span>
                  </div>
                  <div>
                    <span className="text-rose-400 font-medium block">-20 pts</span>
                    <span>Wrong Answer</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-medium block">Key Reveal</span>
                    <span>On Success</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 overflow-hidden rounded-none border border-purple-900/30 bg-[#06070B] aspect-[16/10] flex items-center justify-center p-6 sm:p-8">
                <img
                  src="/mythic-golden-key.png"
                  alt="Golden Key Checkpoint"
                  className="w-full h-full object-contain drop-shadow-[0_0_35px_rgba(245,158,11,0.25)] rounded-none"
                />
              </div>
            </div>

            {/* Phase 2: Vault Chest & Fragment Extraction */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-purple-950/60 bg-[#0B0D15] p-6 sm:p-8 rounded-none">
              <div className="lg:col-span-7 order-2 lg:order-1 overflow-hidden rounded-none border border-purple-900/30 bg-[#06070B] aspect-[16/10] flex items-center justify-center p-6 sm:p-8">
                <img
                  src="/treasure-chest-open.png"
                  alt="Vault Chest and Scrambled Fragments"
                  className="w-full h-full object-contain drop-shadow-[0_0_35px_rgba(245,158,11,0.25)] rounded-none"
                />
              </div>

              <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
                <span className="text-xs font-mono text-purple-400 font-medium uppercase tracking-wider block">
                  Phase 02 // Vault Extraction
                </span>
                <h3 className="text-2xl sm:text-3xl font-normal text-white leading-tight">
                  Unlock Vault Chests &amp; Gather Fragments
                </h3>
                <p className="text-sm text-slate-400 font-normal leading-relaxed">
                  Scan the unlocked QR block to open the chest vault. Extract jumbled code fragments that make up the full algorithmic solution. Every challenge consists of 3 to 6 fragmented blocks that must all be collected before assembly.
                </p>
                <div className="pt-2 flex items-center gap-6 text-xs text-slate-400 border-t border-purple-950/80">
                  <div>
                    <span className="text-white font-medium block">Encrypted QR</span>
                    <span>Checkpoint Access</span>
                  </div>
                  <div>
                    <span className="text-purple-300 font-medium block">3 to 6 Blocks</span>
                    <span>Code Extraction</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 3: Assembly Board & Sandbox Execution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-purple-950/60 bg-[#0B0D15] p-6 sm:p-8 rounded-none">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-mono text-purple-400 font-medium uppercase tracking-wider block">
                  Phase 03 // Execution &amp; Scoring
                </span>
                <h3 className="text-2xl sm:text-3xl font-normal text-white leading-tight">
                  Assemble Logic &amp; Run In Sandbox
                </h3>
                <p className="text-sm text-slate-400 font-normal leading-relaxed">
                  Drag and reorder your collected code fragments on the interactive Assembly Board. Test your solution with 3 free runs against test cases in Judge0. Submit your final code before the 15-minute timer elapses to lock in your score.
                </p>
                <div className="pt-2 flex items-center gap-6 text-xs text-slate-400 border-t border-purple-950/80">
                  <div>
                    <span className="text-emerald-400 font-medium block">3 Free Runs</span>
                    <span>Zero Penalty</span>
                  </div>
                  <div>
                    <span className="text-rose-400 font-medium block">-10 pts</span>
                    <span>Extra Run (4+)</span>
                  </div>
                  <div>
                    <span className="text-white font-medium block">C, C++, Java, Py</span>
                    <span>Supported</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 overflow-hidden rounded-none border border-purple-900/30 bg-[#06070B] aspect-[16/10] flex items-center justify-center">
                <img
                  src="/tier-medium.jpg"
                  alt="Code Assembly & Sandbox"
                  className="w-full h-full object-cover rounded-none"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 4: TOURNAMENT RULES & CONSTRAINTS (PURE WHITE SECTION // EDITORIAL) ── */}
      <section className="w-full bg-white text-slate-900 py-24 px-6 sm:px-8 lg:px-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-16">

          {/* Header */}
          <div className="max-w-3xl text-left space-y-2">
            <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight">
              Competition Rules &amp; Scoring System
            </h2>
            <p className="text-sm text-slate-500 font-normal leading-relaxed">
              Understand the core mechanics, penalty schedules, and how winner placement is calculated.
            </p>
          </div>

          {/* 3-Column Editorial Comparison (No repetitive generic dark cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Column 1 */}
            <div className="border border-slate-200 bg-slate-50/60 p-8 rounded-none flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-mono text-purple-700 font-semibold uppercase tracking-wider">
                  Constraint 01 // Speed
                </div>
                <h3 className="text-2xl font-medium text-slate-900">
                  15-Minute Countdown &amp; Elapsed Penalty
                </h3>
                <p className="text-sm text-slate-600 font-normal leading-relaxed">
                  Every challenge runs on an independent 15-minute timer (900s). For every minute that elapses during your run, a penalty of -10 points is applied in real time. Fast solving preserves your standing.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>1 min elapsed</span>
                  <span className="font-mono text-rose-600 font-medium">-10 pts</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>5 mins elapsed</span>
                  <span className="font-mono text-rose-600 font-medium">-50 pts</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>15 mins elapsed</span>
                  <span className="font-mono text-rose-600 font-medium">-150 pts</span>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="border border-slate-200 bg-slate-50/60 p-8 rounded-none flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-mono text-purple-700 font-semibold uppercase tracking-wider">
                  Constraint 02 // Accuracy
                </div>
                <h3 className="text-2xl font-medium text-slate-900">
                  Checkpoint Accuracy &amp; 3-Attempt Reveal
                </h3>
                <p className="text-sm text-slate-600 font-normal leading-relaxed">
                  Mini tasks require precision. Each incorrect answer deducts -20 points. If a contestant misses 3 consecutive attempts, the correct answer is revealed with an explanation so they can proceed.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Incorrect attempt</span>
                  <span className="font-mono text-rose-600 font-medium">-20 pts</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Max attempts per task</span>
                  <span className="font-mono text-slate-900 font-medium">3 attempts</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Auto-reveal after 3 fails</span>
                  <span className="font-mono text-purple-700 font-medium">Available</span>
                </div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="border border-slate-200 bg-slate-50/60 p-8 rounded-none flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-mono text-purple-700 font-semibold uppercase tracking-wider">
                  Constraint 03 // Winner Criteria
                </div>
                <h3 className="text-2xl font-medium text-slate-900">
                  Minimum Negative Points
                </h3>
                <p className="text-sm text-slate-600 font-normal leading-relaxed">
                  All contestants start at 0 points. Penalties accumulate across Easy, Medium, and Hard tiers. The contestant who completes all 3 challenges with the lowest negative score (closest to 0) wins the championship.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Starting balance</span>
                  <span className="font-mono text-emerald-700 font-medium">0 pts</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Free compiler tests</span>
                  <span className="font-mono text-emerald-700 font-medium">3 runs</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Winner placement</span>
                  <span className="font-mono text-purple-700 font-medium">Min Negative Pts</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 5: ARENA PORTAL CTA (DARK SECTION) ── */}
      <section className="w-full bg-[#07080D] py-28 px-6 sm:px-8 lg:px-12 text-center text-white relative">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
            Ready to enter the tournament?
          </h2>

          <p className="text-slate-400 text-base sm:text-lg font-normal max-w-2xl mx-auto leading-relaxed">
            Test your algorithmic logic, rapid assembly skills, and debugging precision under competitive arena conditions.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white text-purple-800 hover:bg-slate-100 font-medium text-sm tracking-wide rounded-none transition-colors duration-200 shadow-sm"
            >
              Enter The World
            </Link>

            <Link
              to="/rules"
              className="px-8 py-3.5 bg-transparent text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 font-medium text-sm tracking-wide rounded-none transition-colors duration-200"
            >
              View Full Rules &amp; Protocol
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
