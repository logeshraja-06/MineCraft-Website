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
      icon: <Layers className="w-5 h-5 text-[#F28C0F]" />,
      content: (
        <div className="space-y-4">
          <ul className="list-disc list-outside ml-5 text-slate-700 space-y-1.5 text-[15px] marker:text-slate-400">
            <li>Welcome to <strong className="text-slate-900">Mind Craft</strong>! After registration, all participants enter the Challenges portal.</li>
            <li>The tournament consists of <strong className="text-slate-900">3 distinct challenge tiers</strong>, solved in sequential progression:</li>
          </ul>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#fff9f0] border border-orange-200/80 py-5 px-4 rounded-2xl text-center shadow-sm">
              <div className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Tier 1</div>
              <div className="font-black text-[#F28C0F] text-xl mb-0.5">Easy</div>
              <div className="text-slate-600 font-medium text-xs">1 Programming Problem • 15 Mins</div>
            </div>
            <div className="bg-[#fff9f0] border border-orange-200/80 py-5 px-4 rounded-2xl text-center shadow-sm">
              <div className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Tier 2</div>
              <div className="font-black text-[#F28C0F] text-xl mb-0.5">Medium</div>
              <div className="text-slate-600 font-medium text-xs">1 Programming Problem • 15 Mins</div>
            </div>
            <div className="bg-[#fff9f0] border border-orange-200/80 py-5 px-4 rounded-2xl text-center shadow-sm">
              <div className="text-xs font-black text-rose-600 uppercase tracking-widest mb-1">Tier 3</div>
              <div className="font-black text-[#F28C0F] text-xl mb-0.5">Hard</div>
              <div className="text-slate-600 font-medium text-xs">1 Programming Problem • 15 Mins</div>
            </div>
          </div>
          <p className="text-slate-600 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            💡 Difficulty and problem complexity ramp up smoothly from <span className="font-bold text-slate-800">Easy</span> to <span className="font-bold text-slate-800">Medium</span> to <span className="font-bold text-slate-800">Hard</span>. Solving Tier 1 unlocks Tier 2, and Tier 2 unlocks Tier 3.
          </p>
        </div>
      ),
    },
    {
      num: '02',
      title: 'Programming Language Selection',
      icon: <Terminal className="w-5 h-5 text-[#F28C0F]" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-[15px]">
            You can solve challenges in any of the four standard languages of your choice:
          </p>
          <div className="bg-[#fff9f0] border border-orange-200/80 rounded-2xl py-4 px-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-orange-100 font-bold text-lg text-slate-900">C</div>
            <div className="p-3 bg-white rounded-xl shadow-xs border border-orange-100 font-bold text-lg text-slate-900">C++</div>
            <div className="p-3 bg-white rounded-xl shadow-xs border border-orange-100 font-bold text-lg text-slate-900">Java</div>
            <div className="p-3 bg-white rounded-xl shadow-xs border border-orange-100 font-bold text-lg text-slate-900">Python</div>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Language Lock:</strong> You must select your programming language during the setup phase before clicking <strong>"START HUNT"</strong>. Once the hunt begins, the language is locked for that challenge.
            </span>
          </div>
        </div>
      ),
    },
    {
      num: '03',
      title: 'QR Tasks & Answer Reveal Penalties',
      icon: <HelpCircle className="w-5 h-5 text-[#F28C0F]" />,
      content: (
        <div className="space-y-4">
          <ul className="list-disc list-outside ml-5 text-slate-700 space-y-1.5 text-[15px] marker:text-slate-400">
            <li>Each challenge is decomposed into multiple scrambled code blocks hidden inside QR checkpoints.</li>
            <li>To unlock and reveal each code fragment, you must solve a targeted mini task (Multiple Choice Questions or Fill in the Blanks).</li>
          </ul>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#fff9f0] rounded-2xl border border-orange-200/80 space-y-2">
              <span className="text-xs font-bold uppercase text-[#F28C0F] tracking-wider block">Task Formats</span>
              <ul className="text-xs text-slate-700 space-y-1 list-disc ml-4">
                <li>Multiple Choice Questions (MCQ)</li>
                <li>Fill in the Blanks</li>
                <li>Predict the Output / Logic Evaluation</li>
              </ul>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
              <span className="text-xs font-bold uppercase text-rose-600 tracking-wider block">Wrong Answer Penalty</span>
              <p className="text-xs text-rose-900 leading-relaxed">
                Every incorrect attempt incurs an immediate penalty of <strong className="font-extrabold text-rose-600">-20 points</strong>!
              </p>
            </div>
          </div>

          <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-300/80 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> 3 Attempts & Answer Reveal Rule:
            </div>
            <p className="leading-relaxed">
              You are allowed up to <strong>3 attempts</strong> per task. If all 3 attempts are answered incorrectly (accumulating -60 pts penalty), the correct answer is automatically revealed with an explanation so you are never stuck and can proceed to collect your fragment.
            </p>
          </div>
        </div>
      ),
    },
    {
      num: '04',
      title: 'Code Assembly & 3 Free Runs',
      icon: <Zap className="w-5 h-5 text-[#F28C0F]" />,
      content: (
        <div className="space-y-4">
          <ul className="list-disc list-outside ml-5 text-slate-700 space-y-1.5 text-[15px] marker:text-slate-400">
            <li>Once all fragments are unlocked, you enter the <strong>Code Assembly Phase</strong>.</li>
            <li>All fragments appear intentionally jumbled. Drag and reorder them on the Assembly Board into the correct logical program sequence.</li>
          </ul>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Compiler Run Allowance</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-xs">3 FREE RUNS</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              Your first <strong>3 "Run Code" tests</strong> against sample test cases are <strong>100% FREE</strong> and do not deduct any points! Use them to test your syntax and logic.
            </p>
          </div>

          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
            <span className="font-bold text-rose-700 block">Extra Run Penalty:</span>
            <p className="leading-relaxed">
              Starting from the <strong>4th run onward</strong>, every additional run will deduct <strong className="font-extrabold text-rose-600">-10 points</strong> from your score (e.g. Run 4: -10 pts, Run 5: -20 pts cumulative, etc.).
            </p>
          </div>
        </div>
      ),
    },
    {
      num: '05',
      title: 'Time Limit (15 Mins Per Challenge)',
      icon: <Clock className="w-5 h-5 text-[#F28C0F]" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-[15px]">
            Each challenge level operates on an independent, non-extendable timer of <strong className="text-slate-900">15 minutes (900 seconds)</strong>:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#fff9f0] border border-orange-200/80 py-4 px-4 rounded-2xl text-center">
              <div className="font-bold text-[#F28C0F] text-base">Tier 1: Easy</div>
              <div className="text-slate-800 font-black text-xl mt-1">15:00 Mins</div>
            </div>
            <div className="bg-[#fff9f0] border border-orange-200/80 py-4 px-4 rounded-2xl text-center">
              <div className="font-bold text-[#F28C0F] text-base">Tier 2: Medium</div>
              <div className="text-slate-800 font-black text-xl mt-1">15:00 Mins</div>
            </div>
            <div className="bg-[#fff9f0] border border-orange-200/80 py-4 px-4 rounded-2xl text-center">
              <div className="font-bold text-[#F28C0F] text-base">Tier 3: Hard</div>
              <div className="text-slate-800 font-black text-xl mt-1">15:00 Mins</div>
            </div>
          </div>
          <p className="text-slate-600 text-xs">
            ⏱️ The countdown timer begins the instant you click <strong>"START HUNT"</strong>. If the 15 minutes expire before completion, your session is automatically evaluated and locked.
          </p>
        </div>
      ),
    },
    {
      num: '06',
      title: 'Time Elapsed Penalty (-10 pts / min)',
      icon: <Clock className="w-5 h-5 text-[#F28C0F]" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-[15px]">
            Time efficiency is critical! For every minute that passes during your attempt, a penalty of <strong className="text-rose-600 font-extrabold">-10 points</strong> is deducted in real time:
          </p>
          <div className="bg-[#fff9f0] border border-orange-200/80 rounded-2xl p-5">
            <div className="text-xs font-bold text-[#F28C0F] uppercase tracking-wider mb-3">Time Deduction Schedule:</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-orange-100">
                <span className="block text-slate-500 text-[11px]">1 min</span>
                <span className="text-rose-600 font-extrabold text-base">-10 pts</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-orange-100">
                <span className="block text-slate-500 text-[11px]">2 mins</span>
                <span className="text-rose-600 font-extrabold text-base">-20 pts</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-orange-100">
                <span className="block text-slate-500 text-[11px]">5 mins</span>
                <span className="text-rose-600 font-extrabold text-base">-50 pts</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-orange-100">
                <span className="block text-slate-500 text-[11px]">10 mins</span>
                <span className="text-rose-600 font-extrabold text-base">-100 pts</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-orange-100 col-span-2 sm:col-span-1">
                <span className="block text-slate-500 text-[11px]">15 mins</span>
                <span className="text-rose-600 font-extrabold text-base">-150 pts</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: '07',
      title: 'Centrally Managed Scoring & Winner Criteria',
      icon: <Trophy className="w-5 h-5 text-[#F28C0F]" />,
      content: (
        <div className="space-y-4">
          <ul className="list-disc list-outside ml-5 text-slate-700 space-y-2 text-[15px] marker:text-slate-400">
            <li><strong className="text-slate-900">Initial Score:</strong> All participants begin the competition with exactly <span className="font-bold text-slate-900">0 points</span>.</li>
            <li><strong className="text-slate-900">Cumulative Tracking:</strong> Points and penalties are centrally aggregated across all 3 challenges (Easy + Medium + Hard). Penalties carry forward continuously.</li>
            <li>
              <span>Your total tournament score is calculated as:</span>
              <div className="my-2 p-3 bg-slate-900 text-white font-mono text-xs rounded-xl border border-slate-700 text-center">
                Total Score = - ( Task Penalties + Extra Run Penalties + Time Penalties )
              </div>
            </li>
          </ul>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-5 text-slate-800 text-[15px] space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-base">
              <Sparkles className="w-5 h-5 text-[#F28C0F]" />
              <span>How Winners Are Determined:</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-sans">
              The winner of Mind Craft 2026 is the participant who completes all 3 challenges with the <strong className="text-[#F28C0F] font-black">MINIMUM NEGATIVE POINTS</strong> (closest to 0 points). Accuracy in mini tasks, minimizing code runs, and fast assembly lead to victory!
            </p>
            <p className="text-[11px] text-amber-800 italic pt-1 border-t border-amber-200/60">
              Note: The live competition leaderboard is centrally managed and visible exclusively to event administrators to ensure fairness and prevent tactical stalling.
            </p>
          </div>
        </div>
      ),
    },
    {
      num: '08',
      title: 'Complete Participant Mission Flow',
      icon: <CheckCircle2 className="w-5 h-5 text-[#F28C0F]" />,
      content: (
        <div className="bg-[#fff9f0] border border-orange-200/80 rounded-2xl p-6">
          <div className="flex flex-wrap items-center gap-y-4 gap-x-2.5 text-[14px] font-bold text-slate-700 leading-none">
            <span className="px-2 py-1 bg-white rounded-lg border border-orange-100">1. Register</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span className="px-2 py-1 bg-white rounded-lg border border-orange-100">2. Enter Challenge</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span className="px-2 py-1 bg-white rounded-lg border border-orange-100">3. Select Language</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span className="px-2 py-1 bg-white rounded-lg border border-orange-100">4. Start Hunt (15m)</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span className="px-2 py-1 bg-white rounded-lg border border-orange-100">5. Solve Tasks (-20 if wrong)</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span className="px-2 py-1 bg-white rounded-lg border border-orange-100">6. Unlock QR & Collect Blocks</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span className="px-2 py-1 bg-white rounded-lg border border-orange-100">7. Assemble Logic</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span className="px-2 py-1 bg-white rounded-lg border border-orange-100">8. Run Code (3 Free)</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span className="px-2 py-1 bg-white rounded-lg border border-orange-100">9. Submit Solution</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/40 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* HERO / WELCOME HEADER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/80 text-orange-800 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#F28C0F]" />
              <span>Official Event Guidelines</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Mind Craft <span className="text-[#F28C0F]">Rules & Scoring</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              Please review the 8 key rules, scoring mechanics, and penalty calculations before entering the challenges.
            </p>
            {participant?.name && (
              <p className="text-xs font-bold text-slate-500 pt-1">
                Participant: <span className="text-[#F28C0F]">{participant.name}</span> ({participant.participantId || participant.email})
              </p>
            )}
          </div>

          <Link
            to="/challenges"
            className="w-full sm:w-auto px-8 py-4 bg-[#F28C0F] hover:bg-orange-500 text-slate-950 font-black text-sm tracking-wider rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-3 shrink-0"
          >
            <span>CONTINUE TO CHALLENGES</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* TIMELINE / STEPS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm relative">
          {/* Vertical Line */}
          <div className="absolute left-[39px] sm:left-[55px] top-[40px] bottom-[40px] w-0.5 bg-orange-200 hidden md:block"></div>
          
          <div className="space-y-12 md:space-y-16">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col md:flex-row gap-6 md:gap-10">
                {/* Number Circle */}
                <div className="flex items-start md:shrink-0 z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#fff9f0] shadow-sm flex flex-col items-center justify-center border-2 border-orange-200/80">
                    <span className="text-xl sm:text-2xl font-black text-[#F28C0F] leading-none">{step.num}</span>
                    <span className="text-[10px] text-orange-400 font-bold uppercase mt-1">Rule</span>
                  </div>
                </div>

                {/* Content block */}
                <div className="flex-1 md:pt-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-50 border border-orange-100 hidden sm:flex">
                      {step.icon}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{step.title}</h2>
                  </div>
                  {step.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PROMINENT BOTTOM CTA BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready for the Challenge?</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ready to Craft Your Solution?
            </h3>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              You are ready to enter Tier 1 (Easy). Remember: accuracy in tasks and minimizing runs will give you the winning edge!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              to="/challenges"
              className="w-full sm:w-auto px-8 py-4 bg-[#F28C0F] hover:bg-orange-500 text-slate-950 font-black text-sm tracking-wider rounded-2xl shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-3 shrink-0"
            >
              <span>CONTINUE TO CHALLENGES</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
