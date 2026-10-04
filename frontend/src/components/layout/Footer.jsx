import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-50/80 py-6 px-4 mt-auto text-center text-xs text-slate-500 font-mono">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 MIND CRAFT. QR Hunt & Code Assembly Platform.</p>
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-slate-600 hover:text-[#F28C0F] hover:underline font-semibold transition text-[13px]">
            Admin Portal
          </Link>
          <span className="text-[11px] text-slate-300">|</span>
          <p className="text-[11px] text-slate-500">Official Competition Engine // Judge0 Sandboxed</p>
          <p className="text-[11px] text-slate-600">Frontend Prototype // Zero Backend Dependency</p>
        </div>
      </div>
    </footer>
  );
}
