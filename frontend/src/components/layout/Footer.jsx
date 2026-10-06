import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#05060A] py-8 px-6 mt-auto text-center text-xs text-slate-400 font-sans border-t border-purple-900/30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></div>
          <p className="font-medium tracking-wide">© 2026 MIND CRAFT. Built for Creators // Loved by Generations.</p>
        </div>
        <div className="flex items-center gap-5 tracking-wider uppercase text-[11px] font-bold">
          <span className="text-slate-500">CREATE • CONNECT • INSPIRE</span>
          <span className="text-purple-900">|</span>
          <Link to="/rules" className="text-slate-400 hover:text-purple-300 transition">
            Rules
          </Link>
          <Link to="/admin" className="text-slate-400 hover:text-purple-300 transition">
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
