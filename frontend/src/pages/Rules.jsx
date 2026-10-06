import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useParticipant } from '../context/ParticipantContext';

export default function Rules() {
  const { participant } = useParticipant();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#07080D] font-sans text-slate-100 selection:bg-purple-600 selection:text-white relative overflow-hidden">

      {/* ── TOP SCROLL PROGRESS BAR ── */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-fuchsia-400 to-amber-400 origin-left z-[100] shadow-[0_0_12px_rgba(168,85,247,0.8)]"
      />

      {/* ── SECTION 1: HEADER & OVERVIEW (DARK SECTION) ── */}
      <section className="w-full bg-[#07080D] py-16 sm:py-20 px-6 sm:px-8 lg:px-12 border-b border-purple-900/20 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            <h1 className="text-4xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              Competition Rules &amp; Protocol
            </h1>
            <p className="text-base text-slate-400 font-normal leading-relaxed max-w-2xl">
              Mind Craft 2026 is an algorithmic treasure hunt. Review the scoring formulas, checkpoint penalty mechanics, compiler allowances, and sequential progression protocol before beginning your hunt.
            </p>

            {participant?.name && (
              <div className="text-xs font-mono text-purple-300 py-1">
                Participant Registered: <span className="text-white font-medium">{participant.name}</span> ({participant.participantId || participant.email})
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/challenges"
                  className="px-8 py-3.5 bg-white text-purple-800 hover:bg-slate-100 font-medium text-sm tracking-wide rounded-none transition-colors duration-200 shadow-sm flex items-center gap-2"
                >
                  <span>Continue To Challenges</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 overflow-hidden rounded-none border border-purple-900/40 bg-black aspect-[16/10] shadow-sm"
          >
            <img
              src="/portal-hero.jpg"
              alt="Arena Portal"
              className="w-full h-full object-cover rounded-none"
            />
          </motion.div>

        </div>
      </section>

      {/* ── SECTION 2: 3-TIER PROGRESSION & LANGUAGE SELECTION (PURE WHITE SECTION) ── */}
      <section className="w-full bg-white text-slate-900 py-20 px-6 sm:px-8 lg:px-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-16">

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl text-left space-y-2"
          >
            <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight">
              01 // 3-Tier Linear Progression
            </h2>
            <p className="text-sm text-slate-500 font-normal leading-relaxed">
              Contestants cannot jump between levels. Complete Easy to unlock Medium, and solve Medium to unlock Hard.
            </p>
          </motion.div>

          {/* 3 Tier Image Cards (Cascade In) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Tier 1 */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="border border-slate-200 bg-slate-50/60 p-6 rounded-none flex flex-col justify-between shadow-xs text-left"
            >
              <div>
                <div className="overflow-hidden rounded-none aspect-[16/10] bg-slate-900 mb-5 border border-slate-200">
                  <img
                    src="/tier-easy.jpg"
                    alt="Tier 1 Easy"
                    className="w-full h-full object-cover rounded-none hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="text-xs font-mono text-emerald-700 font-medium uppercase tracking-wider mb-1">
                  Tier 1 · 15 Mins
                </div>
                <h3 className="text-xl font-medium text-slate-900 mb-2">Warm-Up Logic</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                  Entry-level problem solving, warm-up logic tasks &amp; QR checkpoints. Solve fundamental MCQs to unlock your initial code fragments.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200 text-xs text-slate-500 font-mono">
                1 Problem · 15:00 Mins
              </div>
            </motion.div>

            {/* Tier 2 */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="border border-slate-200 bg-slate-50/60 p-6 rounded-none flex flex-col justify-between shadow-xs text-left"
            >
              <div>
                <div className="overflow-hidden rounded-none aspect-[16/10] bg-slate-900 mb-5 border border-slate-200">
                  <img
                    src="/tier-medium.jpg"
                    alt="Tier 2 Medium"
                    className="w-full h-full object-cover rounded-none hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="text-xs font-mono text-purple-700 font-medium uppercase tracking-wider mb-1">
                  Tier 2 · 15 Mins
                </div>
                <h3 className="text-xl font-medium text-slate-900 mb-2">Algorithms &amp; Structures</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                  Intermediate data structures &amp; algorithmic logic requiring structured assembly. Unlock encrypted vault chests to collect scrambled pieces.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200 text-xs text-slate-500 font-mono">
                1 Problem · 15:00 Mins
              </div>
            </motion.div>

            {/* Tier 3 */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="border border-slate-200 bg-slate-50/60 p-6 rounded-none flex flex-col justify-between shadow-xs text-left"
            >
              <div>
                <div className="overflow-hidden rounded-none aspect-[16/10] bg-slate-900 mb-5 border border-slate-200">
                  <img
                    src="/tier-hard.jpg"
                    alt="Tier 3 Hard"
                    className="w-full h-full object-cover rounded-none hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="text-xs font-mono text-rose-700 font-medium uppercase tracking-wider mb-1">
                  Tier 3 · 15 Mins
                </div>
                <h3 className="text-xl font-medium text-slate-900 mb-2">Master Arena</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                  Championship-tier computational challenges &amp; edge-case validation. Arrange complex algorithmic pipelines and test against judge test cases.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-200 text-xs text-slate-500 font-mono">
                1 Problem · 15:00 Mins
              </div>
            </motion.div>

          </div>

          {/* Language Selection & Lock */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="border border-slate-200 bg-slate-50/80 p-8 rounded-none text-left"
          >
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono text-purple-700 font-semibold uppercase tracking-wider block">
                02 // Language Selection &amp; Setup Lock
              </span>
              <h3 className="text-2xl font-medium text-slate-900">
                Choose Your Language: C, C++, Java, or Python
              </h3>
              <p className="text-sm text-slate-600 font-normal leading-relaxed">
                You select your programming language during the pre-hunt phase. Once you click "START HUNT", your chosen language is permanently locked for the duration of that challenge level.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              {['C (GCC 9.2)', 'C++ (G++ 17)', 'Java (OpenJDK 13)', 'Python 3.8+'].map((lang, idx) => (
                <motion.div
                  key={lang}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.4, delay: 0.1 * idx }}
                  whileHover={{ y: -4, borderColor: '#7c3aed' }}
                  className="p-4 bg-white border border-slate-200 rounded-none text-center font-mono font-medium text-sm text-slate-800 transition-colors cursor-default"
                >
                  {lang}
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── SECTION 3: CHECKPOINTS & COMPILER ALLOWANCES (DARK SECTION) ── */}
      <section className="w-full bg-[#07080D] text-slate-100 py-20 px-6 sm:px-8 lg:px-12 border-b border-purple-900/20">
        <div className="max-w-7xl mx-auto space-y-16">

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl text-left space-y-2"
          >
            <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
              03 // Checkpoint Tasks &amp; Compiler Allowances
            </h2>
            <p className="text-sm text-slate-400 font-normal leading-relaxed">
              Every stage balances problem solving accuracy with sandbox execution constraints.
            </p>
          </motion.div>

          {/* Two Editorial Feature Splits with Images */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">

            {/* Split 1: Checkpoints & Golden Key */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.25 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, borderColor: '#9333ea', transition: { duration: 0.25 } }}
              className="border border-purple-950/70 bg-[#0B0D15] p-8 rounded-none space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="overflow-hidden rounded-none aspect-[16/10] bg-[#06070B] border border-purple-900/30 flex items-center justify-center p-6">
                  <img
                    src="/mythic-golden-key.png"
                    alt="Golden Key Tasks"
                    className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(245,158,11,0.25)] rounded-none"
                  />
                </div>

                <div className="text-xs font-mono text-purple-400 uppercase tracking-wider font-medium">
                  Checkpoint Rules
                </div>
                <h3 className="text-2xl font-normal text-white">
                  Mini Tasks &amp; -20 Pts Incorrect Penalty
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  To reveal each QR code block, you must solve a mini task (MCQ, predict code output, or fill-in-the-blank). Every incorrect attempt immediately incurs a -20 pts penalty.
                </p>
              </div>

              <div className="pt-4 border-t border-purple-950/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Wrong answer penalty</span>
                  <span className="font-mono text-rose-400 font-medium">-20 pts</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Max attempts allowed</span>
                  <span className="font-mono text-white font-medium">3 attempts</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Auto-reveal after 3 fails</span>
                  <span className="font-mono text-purple-300 font-medium">-60 pts max penalty</span>
                </div>
              </div>
            </motion.div>

            {/* Split 2: Assembly & Free Runs */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.25 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, borderColor: '#9333ea', transition: { duration: 0.25 } }}
              className="border border-purple-950/70 bg-[#0B0D15] p-8 rounded-none space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="overflow-hidden rounded-none aspect-[16/10] bg-[#06070B] border border-purple-900/30 flex items-center justify-center p-6">
                  <img
                    src="/treasure-chest-open.png"
                    alt="Vault Chest and Fragments"
                    className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(245,158,11,0.25)] rounded-none"
                  />
                </div>

                <div className="text-xs font-mono text-purple-400 uppercase tracking-wider font-medium">
                  Compiler Sandbox
                </div>
                <h3 className="text-2xl font-normal text-white">
                  3 Free Test Runs &amp; Extra Run Penalties
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  After arranging your jumbled code fragments on the Assembly Board, you receive exactly 3 free test runs against sample cases. Starting from the 4th run onward, each extra test deducts -10 points.
                </p>
              </div>

              <div className="pt-4 border-t border-purple-950/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Sample runs 1, 2, and 3</span>
                  <span className="font-mono text-emerald-400 font-medium">100% Free (0 pts)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Run 4 onward</span>
                  <span className="font-mono text-rose-400 font-medium">-10 pts per run</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Test engine</span>
                  <span className="font-mono text-purple-300 font-medium">Judge0 Sandbox</span>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ── SECTION 4: TIME LIMITS & WINNER FORMULA (PURE WHITE SECTION) ── */}
      <section className="w-full bg-white text-slate-900 py-20 px-6 sm:px-8 lg:px-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-16">

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl text-left space-y-2"
          >
            <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight">
              04 // Time Limits &amp; Championship Formula
            </h2>
            <p className="text-sm text-slate-500 font-normal leading-relaxed">
              Understand how real-time minutes elapse and how final tournament rankings are determined.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
            
            {/* Left Column: Time Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.25 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6 border border-slate-200 bg-slate-50/70 p-8 rounded-none space-y-6"
            >
              <span className="text-xs font-mono text-purple-700 font-semibold uppercase tracking-wider block">
                Time Deduction Schedule
              </span>
              <h3 className="text-2xl font-medium text-slate-900">
                15 Minutes Per Challenge (-10 pts / min)
              </h3>
              <p className="text-sm text-slate-600 font-normal leading-relaxed">
                The clock starts ticking the moment you begin the hunt. For every minute that passes, 10 penalty points are deducted from your score.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { time: '1 Min', pts: '-10 pts' },
                  { time: '5 Mins', pts: '-50 pts' },
                  { time: '10 Mins', pts: '-100 pts' },
                  { time: '15 Mins', pts: '-150 pts' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.time}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="p-3 bg-white border border-slate-200 rounded-none text-center"
                  >
                    <span className="block text-slate-500 text-xs">{item.time}</span>
                    <span className="font-mono text-rose-600 font-medium text-sm">{item.pts}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Column: Winner Placement Criteria */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.25 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6 border border-slate-200 bg-slate-50/70 p-8 rounded-none space-y-6"
            >
              <span className="text-xs font-mono text-purple-700 font-semibold uppercase tracking-wider block">
                Official Scoring Formula
              </span>
              <h3 className="text-2xl font-medium text-slate-900">
                Minimum Negative Points Wins
              </h3>
              
              <div className="p-4 bg-white border border-slate-200 rounded-none font-mono text-xs text-slate-800 text-center">
                Total Score = - ( Task Penalties + Extra Run Penalties + Time Penalties )
              </div>

              <p className="text-sm text-slate-600 font-normal leading-relaxed">
                All contestants start with 0 points. The contestant who completes all 3 challenges with the lowest negative penalty score (closest to 0 points) takes 1st place!
              </p>

              <div className="pt-2 text-xs text-slate-500">
                Tiebreaker: In the event of equal scores, the contestant with the fastest cumulative completion time will be ranked higher.
              </div>
            </motion.div>

          </div>

          {/* 9-Step Participant Roadmap */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.7 }}
            className="border border-slate-200 bg-slate-50/70 p-8 rounded-none space-y-4 text-left"
          >
            <h4 className="text-lg font-medium text-slate-900">
              End-to-End Hunt Sequence
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 text-center text-xs font-mono">
              {[
                '1. Register',
                '2. Enter Portal',
                '3. Choose Lang',
                '4. Start 15m Timer',
                '5. Solve Tasks',
                '6. Scan QR Chest',
                '7. Assemble Code',
                '8. 3 Free Runs',
                '9. Final Submit',
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="p-3 bg-white border border-slate-200 rounded-none text-slate-800"
                >
                  {step}
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── SECTION 5: FINAL READY CTA (DARK SECTION) ── */}
      <section className="w-full bg-[#07080D] py-24 px-6 sm:px-8 lg:px-12 text-center text-white relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-8 relative z-10"
        >
          <h2 className="text-4xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
            Ready to Begin Tier 1?
          </h2>

          <p className="text-slate-400 text-base sm:text-lg font-normal max-w-2xl mx-auto leading-relaxed">
            Enter the challenges portal to select your language and begin your 15-minute countdown on the Easy challenge.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/challenges"
                className="px-8 py-3.5 bg-white text-purple-800 hover:bg-slate-100 font-medium text-sm tracking-wide rounded-none transition-colors duration-200 shadow-sm flex items-center gap-2"
              >
                <span>Enter The Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
