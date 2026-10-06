import React from 'react';
import TestCaseResult from './TestCaseResult';
import { Terminal, CheckCircle2, AlertOctagon, Clock, Cpu } from 'lucide-react';

export default function OutputPanel({ compileOutput, submissionResult, sampleInput, sampleOutput }) {
  const isCompileSuccess = compileOutput && (
    compileOutput.status === 'ACCEPTED' ||
    compileOutput.status === 'Accepted' ||
    compileOutput.status === 'success' ||
    (Boolean(compileOutput.success) && !compileOutput.stderr?.trim() && !compileOutput.compileOutput?.trim())
  );

  return (
    <div className="p-4 bg-[#0D0F18]/90 border border-purple-500/30 rounded-2xl space-y-4 shadow-xl backdrop-blur-xl font-mono">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
        <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" /> EXECUTION RESULT
        </h4>
      </div>

      {/* SAMPLE TEST CASE REFERENCE */}
      <div className="p-3 bg-[#07080D]/90 rounded-xl border border-purple-500/20 text-xs space-y-2">
        <span className="text-[10px] uppercase font-bold text-purple-300/70 tracking-wider">SAMPLE TEST</span>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <span className="text-slate-400 block text-[10px]">Input:</span>
            <code className="text-purple-300 text-xs font-bold">{sampleInput || '5'}</code>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Expected Output:</span>
            <code className="text-emerald-400 text-xs font-bold">{sampleOutput || '15'}</code>
          </div>
        </div>
      </div>

      {/* SUBMISSION TEST RESULTS */}
      {submissionResult && (
        <div className="space-y-3">
          <div
            className={`p-3 rounded-xl border flex items-center gap-3 ${
              submissionResult.status === 'ACCEPTED'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-rose-950/50 border-rose-500/40 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
            }`}
          >
            {submissionResult.status === 'ACCEPTED' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertOctagon className="w-5 h-5 flex-shrink-0 text-rose-400" />
            )}
            <div>
              <h5 className="font-bold text-sm">{submissionResult.title}</h5>
              <p className="text-xs text-slate-300">{submissionResult.message}</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-purple-300/80">Hidden Test Evaluations:</span>
            {submissionResult.testResults?.map((tr, idx) => (
              <TestCaseResult key={idx} testCase={tr} index={idx + 1} />
            ))}
          </div>
        </div>
      )}

      {/* COMPILER OUTPUT */}
      {compileOutput && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>
              Status: <strong className={isCompileSuccess ? 'text-emerald-400' : 'text-rose-400'}>{String(compileOutput.status || (isCompileSuccess ? 'ACCEPTED' : 'ERROR')).toUpperCase()}</strong>
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-purple-400" /> {compileOutput.executionTime || '0.04s'}</span>
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-purple-400" /> {compileOutput.memory || '0.0 MB'}</span>
            </div>
          </div>

          {Boolean(compileOutput.stdout?.trim()) && (
            <div>
              <span className="text-[10px] text-purple-300/70 block mb-1">Standard Output:</span>
              <pre className="p-3 bg-[#07080D] rounded-lg border border-purple-500/30 text-purple-200 whitespace-pre-wrap font-mono">
                {compileOutput.stdout}
              </pre>
            </div>
          )}

          {Boolean(compileOutput.stderr?.trim()) && (
            <div>
              <span className="text-[10px] text-rose-400 font-bold block mb-1">Standard Error:</span>
              <pre className="p-3 bg-rose-950/40 rounded-lg border border-rose-500/40 text-rose-200 whitespace-pre-wrap font-mono">
                {compileOutput.stderr}
              </pre>
            </div>
          )}

          {Boolean(compileOutput.compileOutput?.trim()) && (
            <p className="text-[10px] text-rose-300 font-mono italic bg-rose-950/40 p-2 rounded border border-rose-500/40">{compileOutput.compileOutput}</p>
          )}

          {isCompileSuccess && !compileOutput.stdout?.trim() && (
            <p className="text-xs text-emerald-400 font-mono py-1">
              ✓ Program compiled and executed cleanly with no output.
            </p>
          )}
        </div>
      )}

      {!compileOutput && !submissionResult && (
        <p className="text-xs text-purple-300/50 text-center py-4">
          Click "Run Code" to compile against sample input, or "Submit Solution" for hidden test scoring.
        </p>
      )}
    </div>
  );
}
