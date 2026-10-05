import React, { useState } from 'react';
import { Code2, Copy, Check, Sparkles } from 'lucide-react';

/**
 * AssemblyPreview — Displays the real-time synthesized code from assembled fragments.
 * Fitted to the assembly section with line numbers, syntax styling, and copy button.
 * No arbitrary height truncation or nested scroll traps.
 */
export default function AssemblyPreview({ combinedCode = '', language = 'Java' }) {
  const [copied, setCopied] = useState(false);

  const lines = (combinedCode || '').split('\n');
  const lineCount = combinedCode.trim() ? lines.length : 0;

  const handleCopy = () => {
    if (!combinedCode) return;
    navigator.clipboard.writeText(combinedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b101b] border-2 border-slate-800 rounded-2xl overflow-hidden shadow-md font-mono">
      {/* Editor Header */}
      <div className="px-4 py-3 bg-[#111827] border-b border-slate-800 flex items-center justify-between text-slate-300 select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-orange-400" />
            <span>Assembled Source Preview</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lineCount > 0 && (
            <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60">
              {lineCount} lines
            </span>
          )}
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Live Synthesis</span>
          </span>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!combinedCode}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border border-slate-700 disabled:opacity-40"
            title="Copy synthesized code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor Body with Line Numbers */}
      <div className="p-4 flex-1 overflow-x-auto text-[11.5px] leading-relaxed select-text bg-[#0b101b]">
        {!combinedCode.trim() ? (
          <div className="py-12 text-center text-slate-500 italic space-y-1">
            <p>// No code assembled yet.</p>
            <p className="text-[10px] text-slate-600">// Arrange fragments on the left to synthesize source.</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="pr-3 text-right text-slate-600 select-none text-[10px] w-8 align-top font-mono">
                    {idx + 1}
                  </td>
                  <td className="text-emerald-300 font-mono whitespace-pre font-medium pl-1.5 align-top">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Editor Footer Status */}
      <div className="px-4 py-2 bg-[#0d1422] border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
        <span>UTF-8 • Ready for Judge Engine</span>
        <span className="text-amber-400/90 font-semibold">Updates live as you reorder fragments</span>
      </div>
    </div>
  );
}
