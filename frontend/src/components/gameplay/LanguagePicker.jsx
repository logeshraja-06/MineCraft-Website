import React from 'react';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';

/**
 * LanguagePicker — shown in SETUP phase before hunt starts.
 * Locks and shows as a badge once languageLocked = true.
 */
export default function LanguagePicker({ language, onSelect, locked = false }) {
  if (locked) {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.id === language);
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-xs font-mono shadow-[0_0_12px_rgba(168,85,247,0.2)]">
        <span>{lang?.icon || '💻'}</span>
        <span className="font-bold text-purple-200">{lang?.name || language.toUpperCase()}</span>
        <span className="text-purple-300/50 text-[10px] ml-1">(locked)</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-purple-300/70 font-bold uppercase tracking-wider block">
        Choose Language
      </label>
      <div className="grid grid-cols-2 gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => onSelect(lang.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              language === lang.id
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-[#07080D]/90 border-purple-500/20 text-slate-300 hover:border-purple-500/50 hover:bg-purple-950/30'
            }`}
            aria-pressed={language === lang.id}
          >
            <span className="text-base">{lang.icon}</span>
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
