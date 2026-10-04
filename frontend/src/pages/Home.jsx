import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useParticipant } from '../context/ParticipantContext';
import { challengeApi } from '../services/challengeApi';
import { ClipboardList, KeyRound, Box, Code, Puzzle, PlayCircle, Zap, Package, Play, Clock, BarChart2, ArrowRight, Layers } from 'lucide-react';

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
    { title: 'Solve Quiz', desc: 'Solve MCQ, predict output, fill-in-the-blank to earn keys.', icon: ClipboardList },
    { title: 'Earn Key', desc: 'Answer correctly to get keys.', icon: KeyRound },
    { title: 'Open Chest', desc: 'Unlock and collect shuffled code fragments.', icon: Box },
    { title: 'Collect Fragment', desc: 'Pick the right fragments from each chest.', icon: Code },
    { title: 'Assemble Code', desc: 'Arrange the fragments in logical order.', icon: Puzzle },
    { title: 'Run & Submit', desc: 'Execute your code and submit before time runs out.', icon: PlayCircle },
  ];

  const highlights = [
    { title: 'Linear Progression', desc: 'Complete Easy to unlock Medium, then Medium to unlock Hard.', icon: Layers },
    { title: 'Quiz to Keys', desc: 'Solve MCQ, predict output, fill-in-the-blank to earn keys.', icon: Zap },
    { title: 'Treasure Chests', desc: 'Unlock and collect shuffled code fragments.', icon: Package },
    { title: 'Fragment Assembly', desc: 'Arrange the fragments in logical order.', icon: Puzzle },
    { title: 'Real Execution', desc: 'Run your assembled code against sample input via Judge0.', icon: Play },
    { title: 'Timed Challenge', desc: '20-minute countdown with fair penalties.', icon: Clock },
  ];

  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 overflow-hidden relative">
      
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-100/40 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      <div className="absolute top-[40%] left-0 w-[400px] h-[400px] bg-orange-50/50 rounded-full -translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-6">
        
        <section className="relative pt-2 pb-12 lg:pt-4 lg:pb-16 flex flex-col lg:flex-row items-center justify-between gap-12">

          <div className="w-full lg:w-1/2 space-y-6 z-10">

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mt-4">
              Quiz Hunt & Code Assembly
            </h2>
            
            <p className="text-[#F28C0F] font-bold text-base md:text-lg tracking-widest uppercase">
              Think . Quiz . Unlock . Assemble . Execute .
            </p>

            <p className="text-slate-600 text-lg max-w-lg leading-relaxed pt-2 font-medium">
              Route through a strict linear sequence: complete Easy to unlock Medium, then solve Medium to unlock Hard. Solve programming quizzes to earn keys, open treasure chests to collect code fragments, assemble them in the right order, and clear all test cases before time runs out.
            </p>

            <div className="flex flex-wrap gap-4 pt-6">
              <Link to={targetUrl} className="px-10 py-4 text-lg rounded-full bg-[#F28C0F] hover:bg-orange-500 text-slate-900 font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/30">
                Enter Challenge <ArrowRight className="w-6 h-6" />
              </Link>
              <Link to="/rules" className="px-10 py-4 text-lg rounded-full border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 font-bold transition">
                Read Rules & Protocol
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-1/2 relative z-10 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg aspect-square">
               <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-transparent rounded-full opacity-60 animate-pulse"></div>
               <img 
                 src="/hero-illustration.png" 
                 alt="Mind Craft Arena Illustration" 
                 className="absolute inset-0 w-full h-full object-contain scale-110 drop-shadow-2xl relative z-10"
               />
            </div>
          </div>
        </section>

        {/* 3-TIER LINEAR MISSION PATH */}
        <section className="py-8">
          <div className="p-8 bg-orange-50/60 border border-orange-200/80 rounded-3xl text-center space-y-4 max-w-3xl mx-auto shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F28C0F]/10 border border-[#F28C0F]/30 text-[#F28C0F] text-xs font-bold tracking-wider uppercase">
              <Layers className="w-3.5 h-3.5" />
              <span>Linear Progression Sequence</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              3-TIER LINEAR MISSION PATH
            </h3>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Complete Easy to unlock Medium, then Medium to unlock Hard. Challenges cannot be skipped or chosen freely.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs pt-2">
              <span className="px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold rounded-xl shadow-sm">
                1. Easy (100 PTS)
              </span>
              <span className="text-slate-400 font-black">→</span>
              <span className="px-4 py-2 bg-amber-50 border border-amber-300 text-amber-700 font-bold rounded-xl shadow-sm">
                2. Medium (200 PTS)
              </span>
              <span className="text-slate-400 font-black">→</span>
              <span className="px-4 py-2 bg-rose-50 border border-rose-300 text-rose-700 font-bold rounded-xl shadow-sm">
                3. Hard (300 PTS)
              </span>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 border-t border-slate-100 relative">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-10 h-1.5 bg-[#F28C0F] rounded-full"></div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-wider uppercase">HOW IT WORKS</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative min-h-[280px] p-6 bg-white rounded-2xl border-2 border-[#F28C0F]/30 shadow-lg hover:shadow-[0_0_30px_rgba(242,140,15,0.3)] hover:border-[#F28C0F] hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center">
                  <div className="absolute top-2 left-3 text-4xl font-black text-slate-50 opacity-70 select-none transition-all group-hover:text-orange-50">
                    0{index + 1}
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center relative mb-5 group-hover:scale-110 group-hover:bg-[#F28C0F] transition duration-300 z-10 mt-2">
                    <Icon className="w-8 h-8 text-[#F28C0F] group-hover:text-white transition duration-300" strokeWidth={2.5} />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base lg:text-lg mb-3 z-10">{step.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium z-10">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-12 md:py-16 border-t border-slate-100 relative">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-1.5 bg-[#F28C0F] rounded-full"></div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-wider uppercase">CHALLENGE HIGHLIGHTS</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon;
              return (
                <div key={index} className="p-8 bg-white rounded-3xl border-2 border-[#F28C0F]/30 shadow-lg hover:shadow-[0_0_40px_rgba(242,140,15,0.25)] hover:border-[#F28C0F] hover:-translate-y-2 transition-all duration-300 flex flex-col sm:flex-row gap-6 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  
                  <div className="w-16 h-16 rounded-2xl bg-orange-50 flex-shrink-0 flex items-center justify-center text-[#F28C0F] group-hover:bg-[#F28C0F] group-hover:text-white transition duration-300 z-10 shadow-sm">
                    <Icon className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <div className="z-10">
                    <h4 className="font-extrabold text-slate-900 text-xl mb-2">{highlight.title}</h4>
                    <p className="text-base text-slate-500 leading-relaxed font-medium">{highlight.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="relative py-28 md:py-40 overflow-hidden bg-[#FFFCF8]">
        
        {/* Left Waves */}
        <div className="absolute top-0 left-0 w-[45vw] md:w-[35vw] h-full pointer-events-none opacity-80">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,0 C50,0 70,50 0,100 Z" fill="#FFEDC2" opacity="0.6"/>
            <path d="M0,20 C40,30 50,80 0,100 Z" fill="#FFD37A" opacity="0.5"/>
            <path d="M0,40 C30,50 35,90 0,100 Z" fill="#FFB733" opacity="0.4"/>
            <path d="M0,10 C60,20 80,70 10,100" fill="none" stroke="#FFC04D" strokeWidth="0.5" opacity="0.8"/>
          </svg>
        </div>

        {/* Right Waves */}
        <div className="absolute top-0 right-0 w-[45vw] md:w-[35vw] h-full pointer-events-none opacity-80 transform rotate-180">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,0 C50,0 70,50 0,100 Z" fill="#FFEDC2" opacity="0.6"/>
            <path d="M0,20 C40,30 50,80 0,100 Z" fill="#FFD37A" opacity="0.5"/>
            <path d="M0,40 C30,50 35,90 0,100 Z" fill="#FFB733" opacity="0.4"/>
            <path d="M0,10 C60,20 80,70 10,100" fill="none" stroke="#FFC04D" strokeWidth="0.5" opacity="0.8"/>
          </svg>
        </div>

        {/* Right Side Sparkle */}
        <div className="absolute top-[40%] right-[15%] md:right-[25%] text-[#F28C0F] opacity-70 w-4 h-4 z-10">
           <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/></svg>
        </div>

        {/* Content */}
        <div className="relative z-20 max-w-2xl mx-auto text-center px-6">
          <h2 className="text-5xl md:text-[64px] font-black text-[#0B1A28] mb-1 tracking-tight leading-tight">
            Ready to Enter<br/>
            <span className="text-[#F28C0F]">the Arena?</span>
          </h2>
          <p className="text-slate-600 text-lg md:text-xl font-medium max-w-lg mx-auto mt-6 mb-10 leading-relaxed">
            Test your logic, speed and problem-solving skills in the ultimate coding challenge.
          </p>
          <Link to="/register" className="inline-flex px-10 py-4 rounded-full bg-[#FFBE4D] hover:bg-[#F28C0F] text-[#0B1A28] font-bold text-lg transition items-center gap-2 shadow-xl shadow-orange-500/20 hover:-translate-y-1 transform">
            Register Now <ArrowRight className="w-5 h-5" strokeWidth={3} />
          </Link>
        </div>
      </section>

    </div>
  );
}
