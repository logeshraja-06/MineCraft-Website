import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div
        className={`bg-[#0D0F18]/95 border border-purple-500/30 rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.2)] w-full ${maxWidth} overflow-hidden transform transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-[#07080D]/60">
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono tracking-wide">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-purple-300/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-purple-900/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 text-slate-200">{children}</div>
      </div>
    </div>
  );
}
