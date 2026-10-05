import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

export default function Rules() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    {
      num: '01',
      title: 'Challenge Overview',
      content: (
        <div className="space-y-4">
          <ul className="list-disc list-outside ml-5 text-slate-700 space-y-1 text-[15px] marker:text-slate-400">
            <li>After registration, participants can enter the Challenges section.</li>
            <li>There are three challenge levels, each with one programming problem.</li>
          </ul>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#fff9f0] py-5 px-4 rounded-xl text-center">
              <div className="font-bold text-[#F28C0F] text-lg mb-1">Easy</div>
              <div className="text-slate-500 text-sm">1 problem</div>
            </div>
            <div className="bg-[#fff9f0] py-5 px-4 rounded-xl text-center">
              <div className="font-bold text-[#F28C0F] text-lg mb-1">Medium</div>
              <div className="text-slate-500 text-sm">1 problem</div>
            </div>
            <div className="bg-[#fff9f0] py-5 px-4 rounded-xl text-center">
              <div className="font-bold text-[#F28C0F] text-lg mb-1">Hard</div>
              <div className="text-slate-500 text-sm">1 problem</div>
            </div>
          </div>
          <p className="text-slate-700 text-[15px]">
            The difficulty of the program increases from <span className="font-bold text-slate-900">Easy</span> to <span className="font-bold text-slate-900">Medium</span> to <span className="font-bold text-slate-900">Hard</span>.
          </p>
        </div>
      )
    },
    {
      num: '02',
      title: 'Choose Your Language',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-[15px]">You can solve the challenge in any one of the following:</p>
          <div className="bg-[#fff9f0] rounded-xl py-5 px-8 flex justify-between md:justify-around items-center">
            <span className="font-bold text-xl text-slate-900">C</span>
            <div className="w-px h-8 bg-orange-200"></div>
            <span className="font-bold text-xl text-slate-900">Java</span>
            <div className="w-px h-8 bg-orange-200"></div>
            <span className="font-bold text-xl text-slate-900">Python</span>
          </div>
        </div>
      )
    },
    {
      num: '03',
      title: 'How the Challenge Works',
      content: (
        <div className="space-y-4">
          <ul className="list-disc list-outside ml-5 text-slate-700 space-y-1 text-[15px] marker:text-slate-400">
            <li>Each programming challenge is divided into multiple code blocks.</li>
            <li>Each block is hidden inside a QR Code.</li>
            <li>To unlock each QR Code, you must first complete a mini task.</li>
          </ul>
          
          <div className="bg-[#fff9f0] rounded-xl p-6 flex flex-col md:flex-row md:items-center gap-6">
            <div className="font-bold text-[#F28C0F] text-xl whitespace-nowrap">
              Mini Tasks <span className="text-lg">(Any One)</span>
            </div>
            <div className="hidden md:block w-px h-20 bg-orange-200"></div>
            <div className="md:hidden h-px w-full bg-orange-200"></div>
            <ul className="list-disc list-outside ml-5 text-slate-700 space-y-1.5 text-[15px] marker:text-[#F28C0F]">
              <li>MCQ</li>
              <li>Fill in the Blanks</li>
              <li>Predict the Output</li>
              <li>Simple Coding / Logic-based Task</li>
            </ul>
          </div>

          <div className="bg-rose-50 rounded-xl p-5 text-slate-700 text-[15px] leading-relaxed">
            You will have <span className="font-bold text-rose-600">3 attempts</span> for each mini task.<br/>
            If you attempt <span className="font-bold text-rose-600">more than 3 times</span>, every additional attempt will result in a <span className="font-bold text-rose-600">-20 penalty</span>.
          </div>
        </div>
      )
    },
    {
      num: '04',
      title: 'Arrange the Code',
      content: (
        <ul className="list-disc list-outside ml-5 text-slate-700 space-y-1 text-[15px] marker:text-slate-400">
          <li>After unlocking all the QR Codes, you will receive all code blocks in a jumbled order.</li>
          <li>Arrange the blocks in the correct order, complete the program, execute it and get the output.</li>
        </ul>
      )
    },
    {
      num: '05',
      title: 'Time Limit',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-[15px]">Each challenge level has a maximum time limit of <span className="font-bold text-slate-900">15 minutes</span>.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#fff9f0] py-5 px-4 rounded-xl text-center">
              <div className="font-bold text-[#F28C0F] text-lg mb-1">Easy</div>
              <div className="text-slate-700 font-medium text-sm">15 Minutes</div>
            </div>
            <div className="bg-[#fff9f0] py-5 px-4 rounded-xl text-center">
              <div className="font-bold text-[#F28C0F] text-lg mb-1">Medium</div>
              <div className="text-slate-700 font-medium text-sm">15 Minutes</div>
            </div>
            <div className="bg-[#fff9f0] py-5 px-4 rounded-xl text-center">
              <div className="font-bold text-[#F28C0F] text-lg mb-1">Hard</div>
              <div className="text-slate-700 font-medium text-sm">15 Minutes</div>
            </div>
          </div>
          <p className="text-slate-700 text-[15px]">The timer starts immediately when you enter a particular challenge level.</p>
        </div>
      )
    },
    {
      num: '06',
      title: 'Time Penalty',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-[15px]">
            For every minute that passes without completing the challenge, a penalty of <span className="font-bold text-rose-600">-20 marks</span> will be added.
          </p>
          <div className="bg-[#fff9f0] rounded-xl p-5">
            <div className="text-sm font-bold text-[#F28C0F] mb-4">Example:</div>
            <div className="flex flex-wrap items-center justify-between text-[15px] text-slate-700">
              <div className="flex items-center gap-2">
                <span>1 minute</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="text-rose-600 font-bold">-20</span>
              </div>
              <div className="hidden md:block w-px h-5 bg-orange-200"></div>
              <div className="flex items-center gap-2">
                <span>2 minutes</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="text-rose-600 font-bold">-40</span>
              </div>
              <div className="hidden md:block w-px h-5 bg-orange-200"></div>
              <div className="flex items-center gap-2">
                <span>5 minutes</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="text-rose-600 font-bold">-100</span>
              </div>
              <div className="hidden md:block w-px h-5 bg-orange-200"></div>
              <div className="flex items-center gap-2">
                <span>10 minutes</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="text-rose-600 font-bold">-200</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      num: '07',
      title: 'Overall Scoring',
      content: (
        <div className="space-y-4">
          <ul className="list-disc list-outside ml-5 text-slate-700 space-y-3 text-[15px] marker:text-slate-400">
            <li>The final score is based on the penalty marks accumulated during the challenge.</li>
            <li>Penalties can be added due to:
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#F28C0F] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">1</span>
                  <span>Additional attempts beyond the allowed 3 attempts for a mini task.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#F28C0F] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">2</span>
                  <span>Time consumed during the challenge.</span>
                </div>
              </div>
            </li>
          </ul>
          <div className="bg-[#fff9f0] rounded-xl p-5 text-slate-700 text-[15px]">
            The participant/team with the <span className="font-bold text-[#F28C0F]">lowest negative score</span> (least penalty) will have the advantage.
          </div>
        </div>
      )
    },
    {
      num: '08',
      title: 'Challenge Flow',
      content: (
        <div className="bg-[#fff9f0] rounded-xl p-6">
          <div className="flex flex-wrap items-center gap-y-4 gap-x-2.5 text-[14.5px] font-medium text-slate-700 leading-none">
            <span>Register</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span>Enter Challenge</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span>Select Language</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span>Start Timer</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span>Solve Mini Task</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span>Unlock QR</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span>Reveal Code Block</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span>Unlock All Blocks</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span>Arrange Code</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span>Execute</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F28C0F]" />
            <span>Get Output</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* TIMELINE / STEPS */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[39px] top-[10px] bottom-0 w-0.5 bg-orange-200 hidden md:block"></div>
          
          <div className="space-y-12 md:space-y-16">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col md:flex-row gap-6 md:gap-10">
                {/* Number Circle */}
                <div className="flex items-start md:shrink-0 z-10">
                  <div className="w-20 h-20 rounded-full bg-[#fff9f0] shadow-[0_0_0_4px_white] flex items-center justify-center border-2 border-orange-100">
                    <span className="text-2xl font-black text-[#F28C0F]">{step.num}</span>
                  </div>
                </div>

                {/* Content block */}
                <div className="flex-1 md:pt-3">
                  <h2 className="text-2xl font-black text-slate-900 mb-5">{step.title}</h2>
                  {step.content}
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}
