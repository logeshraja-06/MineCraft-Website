import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Trophy,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Terminal,
  Shield,
  Layers,
  Sparkles,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useParticipant } from '../context/ParticipantContext';

export default function Rules() {
  const navigate = useNavigate();
  const { participant } = useParticipant();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    {
      num: '01',
      title: 'Competition Overview & Tiers',
      icon: <Layers className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="space-y-4 font-mono">
          <ul className="list-disc list-outside ml-5 text-purple-200/80 space-y-1.5 text-xs sm:text-sm marker:text-purple-400">
            <li>Welcome to <strong className="text-white">Mind Craft Arena</strong>! After registration, all participants enter the Challenges portal.</li>
            <li>The tournament consists of <strong className="text-white">3 distinct challenge tiers</strong>, solved in sequential progression:</li>
          </ul>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#141724]/90 border border-emerald-500/40 py-5 px-4 rounded-2xl text-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Tier 1</div>
              <div className="font-black text-white text-xl mb-0.5">Easy</div>
              <div className="text-purple-200/60 font-medium text-xs">1 Programming Problem • 15 Mins</div>
            </div>
            <div className="bg-[#141724]/90 border border-purple-500/50 py-5 px-4 rounded-2xl text-center shadow-[0_0_25px_rgba(168,85,247,0.2)]">
              <div className="text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">Tier 2</div>
              <div className="font-black text-white text-xl mb-0.5">Medium</div>
              <div className="text-purple-200/60 font-medium text-xs">1 Programming Problem • 15 Mins</div>
            </div>
            <div className="bg-[#141724]/90 border border-rose-500/40 py-5 px-4 rounded-2xl text-center shadow-[0_0_20px_rgba(244,63,94,0.1)]">
              <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Tier 3</div>
              <div className="font-black text-white text-xl mb-0.5">Hard</div>
              <div className="text-purple-200/60 font-medium text-xs">1 Programming Problem • 15 Mins</div>
            </div>
          </div>
          <p className="text-purple-200/70 text-xs bg-[#141724]/60 p-3.5 rounded-xl border border-purple-500/20 font-sans">
            💡 Difficulty and problem complexity ramp up smoothly from <span className="font-bold text-emerald-300">Easy</span> to <span className="font-bold text-purple-300">Medium</span> to <span className="font-bold text-rose-300">Hard</span>. Solving Tier 1 unlocks Tier 2, and Tier 2 unlocks Tier 3.
          </p>
        </div>
      ),
    },
    {
      num: '02',
      title: 'Programming Language Selection',
      icon: <Terminal className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="space-y-4 font-mono">
          <p className="text-purple-200/80 text-xs sm:text-sm">
            You can solve challenges in any of the four standard languages of your choice:
          </p>
          <div className="bg-[#141724]/90 border border-purple-500/30 rounded-2xl py-4 px-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-[#0D0F18] rounded-xl border border-purple-500/30 font-bold text-lg text-white shadow-sm">C</div>
            <div className="p-3 bg-[#0D0F18] rounded-xl border border-purple-500/30 font-bold text-lg text-white shadow-sm">C++</div>
            <div className="p-3 bg-[#0D0F18] rounded-xl border border-purple-500/30 font-bold text-lg text-white shadow-sm">Java</div>
            <div className="p-3 bg-[#0D0F18] rounded-xl border border-purple-500/30 font-bold text-lg text-white shadow-sm">Python</div>
          </div>
          <div className="p-3.5 bg-purple-950/40 rounded-xl border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Language Lock:</strong> You must select your programming language during the setup phase before clicking <strong className="text-purple-300">"START HUNT"</strong>. Once the hunt begins, the language is locked for that challenge.
            </span>
          </div>
        </div>
      ),
    },
    {
      num: '03',
      title: 'QR Tasks & Answer Reveal Penalties',
      icon: <HelpCircle className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="space-y-4 font-mono">
          <ul className="list-disc list-outside ml-5 text-purple-200/80 space-y-1.5 text-xs sm:text-sm marker:text-purple-400">
            <li>Each challenge is decomposed into multiple scrambled code blocks hidden inside QR checkpoints.</li>
            <li>To unlock and reveal each code fragment, you must solve a targeted mini task (Multiple Choice Questions or Fill in the Blanks).</li>
          </ul>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#141724]/90 rounded-2xl border border-purple-500/30 space-y-2">
              <span className="text-xs font-bold uppercase text-purple-300 tracking-wider block">Task Formats</span>
              <ul className="text-xs text-purple-200/70 space-y-1 list-disc ml-4">
                <li>Multiple Choice Questions (MCQ)</li>
                <li>Fill in the Blanks</li>
                <li>Predict the Output / Logic Evaluation</li>
              </ul>
            </div>

            <div className="p-4 bg-rose-950/40 rounded-2xl border border-rose-500/40 space-y-2">
              <span className="text-xs font-bold uppercase text-rose-400 tracking-wider block">Wrong Answer Penalty</span>
              <p className="text-xs text-rose-200 leading-relaxed">
                Every incorrect attempt incurs an immediate penalty of <strong className="font-extrabold text-rose-400">-20 points</strong>!
              </p>
            </div>
          </div>

          <div className="bg-[#141724]/90 rounded-2xl p-4 border border-amber-500/30 text-xs text-amber-200 space-y-1.5 font-sans">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> 3 Attempts & Answer Reveal Rule:
            </div>
            <p className="leading-relaxed">
              You are allowed up to <strong className="text-white">3 attempts</strong> per task. If all 3 attempts are answered incorrectly (accumulating -60 pts penalty), the correct answer is automatically revealed with an explanation so you are never stuck and can proceed to collect your fragment.
            </p>
          </div>
        </div>
      ),
    },
    {
      num: '04',
      title: 'Code Assembly & 3 Free Runs',
      icon: <Zap className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="space-y-4 font-mono">
          <ul className="list-disc list-outside ml-5 text-purple-200/80 space-y-1.5 text-xs sm:text-sm marker:text-purple-400">
            <li>Once all fragments are unlocked, you enter the <strong className="text-white">Code Assembly Phase</strong>.</li>
            <li>All fragments appear intentionally jumbled. Drag and reorder them on the Assembly Board into the correct logical program sequence.</li>
          </ul>

          <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/35 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Compiler Run Allowance</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs">3 FREE RUNS</span>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Your first <strong className="text-emerald-300">3 "Run Code" tests</strong> against sample test cases are <strong className="text-emerald-300">100% FREE</strong> and do not deduct any points! Use them to test your syntax and logic.
            </p>
          </div>

          <div className="p-4 bg-rose-950/40 rounded-2xl border border-rose-500/40 text-xs text-rose-200 space-y-1">
            <span className="font-bold text-rose-400 block">Extra Run Penalty:</span>
            <p className="leading-relaxed">
              Starting from the <strong className="text-white">4th run onward</strong>, every additional run will deduct <strong className="font-extrabold text-rose-400">-10 points</strong> from your score (e.g. Run 4: -10 pts, Run 5: -20 pts cumulative, etc.).
            </p>
          </div>
        </div>
      ),
    },
    {
      num: '05',
      title: 'Time Limit (15 Mins Per Challenge)',
      icon: <Clock className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="space-y-4 font-mono">
          <p className="text-purple-200/80 text-xs sm:text-sm">
            Each challenge level operates on an independent, non-extendable timer of <strong className="text-white">15 minutes (900 seconds)</strong>:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#141724]/90 border border-emerald-500/30 py-4 px-4 rounded-2xl text-center">
              <div className="font-bold text-emerald-400 text-sm">Tier 1: Easy</div>
              <div className="text-white font-black text-xl mt-1">15:00 Mins</div>
            </div>
            <div className="bg-[#141724]/90 border border-purple-500/40 py-4 px-4 rounded-2xl text-center">
              <div className="font-bold text-purple-300 text-sm">Tier 2: Medium</div>
              <div className="text-white font-black text-xl mt-1">15:00 Mins</div>
            </div>
            <div className="bg-[#141724]/90 border border-rose-500/30 py-4 px-4 rounded-2xl text-center">
              <div className="font-bold text-rose-400 text-sm">Tier 3: Hard</div>
              <div className="text-white font-black text-xl mt-1">15:00 Mins</div>
            </div>
          </div>
          <p className="text-purple-200/60 text-xs font-sans">
            ⏱️ The countdown timer begins the instant you click <strong className="text-white">"START HUNT"</strong>. If the 15 minutes expire before completion, your session is automatically evaluated and locked.
          </p>
        </div>
      ),
    },
    {
      num: '06',
      title: 'Time Elapsed Penalty (-10 pts / min)',
      icon: <Clock className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="space-y-4 font-mono">
          <p className="text-purple-200/80 text-xs sm:text-sm">
            Time efficiency is critical! For every minute that passes during your attempt, a penalty of <strong className="text-rose-400 font-extrabold">-10 points</strong> is deducted in real time:
          </p>
          <div className="bg-[#141724]/90 border border-purple-500/30 rounded-2xl p-5">
            <div className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-3">Time Deduction Schedule:</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-2.5 bg-[#0D0F18] rounded-xl border border-purple-500/20">
                <span className="block text-slate-400 text-[11px]">1 min</span>
                <span className="text-rose-400 font-extrabold text-base">-10 pts</span>
              </div>
              <div className="p-2.5 bg-[#0D0F18] rounded-xl border border-purple-500/20">
                <span className="block text-slate-400 text-[11px]">2 mins</span>
                <span className="text-rose-400 font-extrabold text-base">-20 pts</span>
              </div>
              <div className="p-2.5 bg-[#0D0F18] rounded-xl border border-purple-500/20">
                <span className="block text-slate-400 text-[11px]">5 mins</span>
                <span className="text-rose-400 font-extrabold text-base">-50 pts</span>
              </div>
              <div className="p-2.5 bg-[#0D0F18] rounded-xl border border-purple-500/20">
                <span className="block text-slate-400 text-[11px]">10 mins</span>
                <span className="text-rose-400 font-extrabold text-base">-100 pts</span>
              </div>
              <div className="p-2.5 bg-[#0D0F18] rounded-xl border border-purple-500/20 col-span-2 sm:col-span-1">
                <span className="block text-slate-400 text-[11px]">15 mins</span>
                <span className="text-rose-400 font-extrabold text-base">-150 pts</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: '07',
      title: 'Centrally Managed Scoring & Winner Criteria',
      icon: <Trophy className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="space-y-4 font-mono">
          <ul className="list-disc list-outside ml-5 text-purple-200/80 space-y-2 text-xs sm:text-sm marker:text-purple-400">
            <li><strong className="text-white">Initial Score:</strong> All participants begin the competition with exactly <span className="font-bold text-white">0 points</span>.</li>
            <li><strong className="text-white">Cumulative Tracking:</strong> Points and penalties are centrally aggregated across all 3 challenges (Easy + Medium + Hard). Penalties carry forward continuously.</li>
            <li>
              <span>Your total tournament score is calculated as:</span>
              <div className="my-2 p-3 bg-[#0D0F18] text-purple-200 font-mono text-xs rounded-xl border border-purple-500/30 text-center shadow-inner">
                Total Score = - ( Task Penalties + Extra Run Penalties + Time Penalties )
              </div>
            </li>
          </ul>

          <div className="bg-[#141724]/90 border border-purple-500/30 rounded-2xl p-5 text-purple-200 space-y-2 shadow-sm font-sans">
            <div className="flex items-center gap-2 font-bold text-purple-300 text-base">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>How Winners Are Determined:</span>
            </div>
            <p className="text-xs text-purple-200/80 leading-relaxed">
              The winner of Mind Craft 2026 is the participant who completes all 3 challenges with the <strong className="text-purple-300 font-black">MINIMUM NEGATIVE POINTS</strong> (closest to 0 points). Accuracy in mini tasks, minimizing code runs, and fast assembly lead to victory!
            </p>
            <p className="text-[11px] text-purple-300/60 italic pt-1 border-t border-purple-500/20">
              Note: The live competition leaderboard is centrally managed and visible exclusively to event administrators to ensure fairness and prevent tactical stalling.
            </p>
          </div>
        </div>
      ),
    },
    {
      num: '08',
      title: 'Complete Participant Mission Flow',
      icon: <CheckCircle2 className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="bg-[#141724]/90 border border-purple-500/30 rounded-2xl p-6 font-mono">
          <div className="flex flex-wrap items-center gap-y-4 gap-x-2.5 text-xs font-bold text-purple-200 leading-none">
            <span className="px-2.5 py-1.5 bg-[#0D0F18] rounded-lg border border-purple-500/30">1. Register</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            <span className="px-2.5 py-1.5 bg-[#0D0F18] rounded-lg border border-purple-500/30">2. Enter Portal</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            <span className="px-2.5 py-1.5 bg-[#0D0F18] rounded-lg border border-purple-500/30">3. Select Language</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            <span className="px-2.5 py-1.5 bg-[#0D0F18] rounded-lg border border-purple-500/30">4. Start Hunt (15m)</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            <span className="px-2.5 py-1.5 bg-[#0D0F18] rounded-lg border border-purple-500/30">5. Solve Tasks (-20 if wrong)</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            <span className="px-2.5 py-1.5 bg-[#0D0F18] rounded-lg border border-purple-500/30">6. Unlock QR & Collect Blocks</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            <span className="px-2.5 py-1.5 bg-[#0D0F18] rounded-lg border border-purple-500/30">7. Assemble Logic</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            <span className="px-2.5 py-1.5 bg-[#0D0F18] rounded-lg border border-purple-500/30">8. Run Code (3 Free)</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            <span className="px-2.5 py-1.5 bg-[#0D0F18] rounded-lg border border-purple-500/30">9. Submit Solution</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#07080D] font-sans py-12 px-4 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        
        {/* HERO / WELCOME HEADER */}
        <div className="bg-[#0D0F18]/85 border border-purple-500/25 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(168,85,247,0.12)] backdrop-blur-xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]" />
              <span>Official Event Guidelines</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Mind Craft <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">Rules & Scoring</span>
            </h1>
            <p className="text-sm text-purple-200/70 max-w-xl">
              Please review the 8 key rules, scoring mechanics, and penalty calculations before entering the challenges.
            </p>
            {participant?.name && (
              <p className="text-xs font-bold text-purple-300/80 pt-1 font-mono">
                Participant: <span className="text-purple-300 font-bold">{participant.name}</span> ({participant.participantId || participant.email})
              </p>
            )}
          </div>

          <Link
            to="/challenges"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm tracking-wider rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)] border border-purple-400/40 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-3 shrink-0"
          >
            <span>CONTINUE TO CHALLENGES</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* TIMELINE / STEPS */}
        <div className="bg-[#0D0F18]/80 border border-purple-500/20 rounded-3xl p-6 sm:p-10 shadow-xl backdrop-blur-xl relative">
          {/* Vertical Line */}
          <div className="absolute left-[39px] sm:left-[55px] top-[40px] bottom-[40px] w-0.5 bg-purple-500/30 hidden md:block"></div>
          
          <div className="space-y-12 md:space-y-16">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col md:flex-row gap-6 md:gap-10">
                {/* Number Circle */}
                <div className="flex items-start md:shrink-0 z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#141724] shadow-md flex flex-col items-center justify-center border-2 border-purple-500/40">
                    <span className="text-xl sm:text-2xl font-black text-purple-300 leading-none">{step.num}</span>
                    <span className="text-[10px] text-purple-400/80 font-bold uppercase mt-1">Rule</span>
                  </div>
                </div>

                {/* Content block */}
                <div className="flex-1 md:pt-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 hidden sm:flex">
                      {step.icon}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{step.title}</h2>
                  </div>
                  {step.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PROMINENT BOTTOM CTA BANNER */}
        <div className="bg-gradient-to-r from-purple-950/80 via-[#0D0F18] to-indigo-950/80 border border-purple-500/35 rounded-3xl p-8 sm:p-10 text-white shadow-[0_0_50px_rgba(168,85,247,0.2)] backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready for the Challenge?</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ready to Craft Your Solution?
            </h3>
            <p className="text-xs text-purple-200/70 max-w-lg leading-relaxed font-sans">
              You are ready to enter Tier 1 (Easy). Remember: accuracy in tasks and minimizing runs will give you the winning edge!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              to="/challenges"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm tracking-wider rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)] border border-purple-400/40 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-3 shrink-0"
            >
              <span>ENTER THE PORTAL</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
