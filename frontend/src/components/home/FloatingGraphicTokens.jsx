import React from 'react';
import { motion } from 'framer-motion';

/**
 * Mathematically exact 3D Isometric Voxel Cube SVG
 * Styles include Gold (Mind Craft default), Redstone, Emerald, Diamond, and Obsidian.
 */
export function IsometricVoxelCube({
  size = 54,
  variant = 'gold', // 'gold' | 'emerald' | 'diamond' | 'redstone' | 'obsidian'
  label = '{ }',
  className = '',
  floatDuration = 5,
  delay = 0,
}) {
  const themes = {
    gold: {
      top: '#FFE29A',
      left: '#F28C0F',
      right: '#C96D02',
      border: '#9E5200',
      labelColor: '#0B1A28',
      glow: 'rgba(242, 140, 15, 0.45)',
    },
    emerald: {
      top: '#A7F3D0',
      left: '#10B981',
      right: '#047857',
      border: '#064E3B',
      labelColor: '#064E3B',
      glow: 'rgba(16, 185, 129, 0.45)',
    },
    diamond: {
      top: '#BAE6FD',
      left: '#0284C7',
      right: '#0369A1',
      border: '#075985',
      labelColor: '#0C4A6E',
      glow: 'rgba(2, 132, 199, 0.45)',
    },
    redstone: {
      top: '#FECDD3',
      left: '#E11D48',
      right: '#9F1239',
      border: '#881337',
      labelColor: '#4C0519',
      glow: 'rgba(225, 29, 72, 0.45)',
    },
    obsidian: {
      top: '#334155',
      left: '#1E293B',
      right: '#0F172A',
      border: '#020617',
      labelColor: '#F8FAFC',
      glow: 'rgba(15, 23, 42, 0.5)',
    },
  };

  const t = themes[variant] || themes.gold;

  return (
    <motion.div
      animate={{
        y: [0, -12, 0],
        rotate: [0, 2, -2, 0],
      }}
      transition={{
        duration: floatDuration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={`relative inline-block select-none cursor-pointer group ${className}`}
      style={{ width: size, height: size * 1.15 }}
    >
      {/* Dynamic Glow Shadow */}
      <div
        className="absolute inset-2 rounded-full blur-md opacity-40 group-hover:opacity-80 transition-opacity"
        style={{ backgroundColor: t.glow }}
      />

      <svg
        viewBox="0 0 100 115"
        className="w-full h-full drop-shadow-md group-hover:scale-110 transition-transform duration-300"
      >
        {/* TOP FACE */}
        <polygon
          points="50,4 96,30 50,56 4,30"
          fill={t.top}
          stroke={t.border}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Pixel highlights on top face */}
        <line x1="26" y1="23" x2="50" y2="36" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <line x1="50" y1="36" x2="74" y2="23" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />

        {/* LEFT FACE */}
        <polygon
          points="4,30 50,56 50,108 4,82"
          fill={t.left}
          stroke={t.border}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Shading stripe */}
        <polygon
          points="4,30 20,39 20,91 4,82"
          fill="rgba(0,0,0,0.08)"
        />

        {/* RIGHT FACE */}
        <polygon
          points="96,30 50,56 50,108 96,82"
          fill={t.right}
          stroke={t.border}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Shading stripe */}
        <polygon
          points="80,39 96,30 96,82 80,91"
          fill="rgba(0,0,0,0.18)"
        />

        {/* Outer boundary accent */}
        <polygon
          points="50,4 96,30 96,82 50,108 4,82 4,30"
          fill="none"
          stroke={t.border}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Center Label (e.g., Code symbol) */}
      {label && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-3">
          <span
            className="text-[11px] sm:text-xs font-mono font-black tracking-tight"
            style={{ color: t.labelColor, textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}
          >
            {label}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Pixel Art Golden Key Token
 */
export function PixelKeyToken({ size = 42, className = '', delay = 0.5 }) {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
        rotate: [0, 4, -4, 0],
      }}
      transition={{
        duration: 4.8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={`relative inline-block cursor-pointer group ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-1 rounded-full bg-amber-400/40 blur-md group-hover:bg-amber-400/70 transition-colors" />
      <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-md group-hover:scale-110 transition-transform">
        {/* Pixel Key Bow (Hex Head) */}
        <rect x="6" y="6" width="10" height="10" fill="#FFBE4D" stroke="#0B1A28" strokeWidth="1.5" rx="2" />
        <rect x="9" y="9" width="4" height="4" fill="#FFFFFF" rx="1" />
        {/* Pixel Key Stem */}
        <rect x="14" y="14" width="12" height="4" fill="#F28C0F" stroke="#0B1A28" strokeWidth="1.5" />
        {/* Pixel Key Teeth */}
        <rect x="20" y="18" width="3" height="5" fill="#F28C0F" stroke="#0B1A28" strokeWidth="1.5" />
        <rect x="24" y="18" width="3" height="3" fill="#F28C0F" stroke="#0B1A28" strokeWidth="1.5" />
      </svg>
    </motion.div>
  );
}

/**
 * Glowing Experience (XP) Orb
 */
export function XpOrbToken({ size = 28, value = '+50 XP', className = '', delay = 1 }) {
  return (
    <motion.div
      animate={{
        y: [0, -14, 0],
        scale: [1, 1.08, 1],
      }}
      transition={{
        duration: 3.6,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={`relative inline-flex items-center gap-1.5 cursor-pointer group ${className}`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full bg-amber-400/50 blur-sm animate-ping opacity-60" />
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#F28C0F] via-[#FFBE4D] to-yellow-200 border-2 border-white shadow-md flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
      </div>
      {value && (
        <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-amber-300 font-mono text-[10px] font-black tracking-wider border border-amber-400/40 shadow-xs backdrop-blur-xs group-hover:scale-105 transition-transform">
          {value}
        </span>
      )}
    </motion.div>
  );
}

/**
 * Floating Holographic Code Fragment Card
 */
export function FloatingCodeCard({ snippet = 'int main() { ... }', tag = 'FRAGMENT #01', className = '', delay = 0 }) {
  return (
    <motion.div
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 5.2,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={`p-3 bg-white/95 backdrop-blur-md rounded-xl border-2 border-orange-200/90 shadow-lg hover:shadow-xl hover:border-[#F28C0F] transition-all group select-none ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#F28C0F] bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
          {tag}
        </span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono text-slate-400">ENCRYPTED</span>
        </div>
      </div>
      <code className="block text-xs font-mono font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 group-hover:text-[#F28C0F] transition-colors">
        {snippet}
      </code>
    </motion.div>
  );
}

/**
 * Arcade Minecraft Hotbar Strip
 */
export function ArcadeHotbar({ activeSlot = 1, className = '' }) {
  const slots = [
    { num: '1', title: 'Task Quiz', icon: '📜', badge: 'Checkpoint' },
    { num: '2', title: 'Vault Key', icon: '🔑', badge: 'QR Reveal' },
    { num: '3', title: 'Loot Chest', icon: '📦', badge: 'Fragments' },
    { num: '4', title: 'Assembly', icon: '🧩', badge: 'Board' },
    { num: '5', title: 'Judge0 Run', icon: '⚡', badge: '3 Free Runs' },
    { num: '6', title: 'Victory', icon: '🏆', badge: 'Submit' },
  ];

  return (
    <div className={`p-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border-2 border-orange-500/40 shadow-2xl flex items-center justify-center gap-2 sm:gap-3 ${className}`}>
      {slots.map((slot, idx) => {
        const isCurrent = idx + 1 === activeSlot;
        return (
          <div
            key={idx}
            className={`relative p-2 sm:p-2.5 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center min-w-[50px] sm:min-w-[64px] group cursor-pointer ${
              isCurrent
                ? 'bg-gradient-to-b from-[#F28C0F]/30 to-amber-500/10 border-[#F28C0F] shadow-[0_0_15px_rgba(242,140,15,0.4)] scale-105'
                : 'bg-slate-800/80 border-slate-700/80 hover:border-orange-400/60 hover:bg-slate-800'
            }`}
          >
            {/* Slot index badge */}
            <span className="absolute top-1 left-1.5 text-[9px] font-mono font-black text-slate-400 group-hover:text-amber-400">
              {slot.num}
            </span>

            {/* Icon */}
            <span className="text-xl sm:text-2xl mt-1 group-hover:scale-110 transition-transform">
              {slot.icon}
            </span>

            {/* Title */}
            <span className="text-[10px] font-bold text-slate-300 mt-1 hidden sm:block whitespace-nowrap">
              {slot.title}
            </span>

            {/* Active Indicator */}
            {isCurrent && (
              <span className="absolute -bottom-1 w-4 h-1 bg-[#F28C0F] rounded-full shadow-[0_0_6px_#F28C0F]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Composite Ambient Voxel Background for the Hero Section
 */
export function HeroVoxelAtmosphere() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Voxel 1: Gold Craft Block (Top Left) */}
      <div className="absolute top-10 left-[4%] hidden sm:block">
        <IsometricVoxelCube size={56} variant="gold" label="</>" floatDuration={6} delay={0.2} />
      </div>

      {/* Voxel 2: Emerald Logic Block (Top Right-Center) */}
      <div className="absolute top-6 left-[48%] hidden md:block">
        <IsometricVoxelCube size={44} variant="emerald" label="fn()" floatDuration={7} delay={1.4} />
      </div>

      {/* Voxel 3: Diamond Block (Mid Right) */}
      <div className="absolute top-[42%] right-[2%] hidden lg:block">
        <IsometricVoxelCube size={50} variant="diamond" label="int[]" floatDuration={5.5} delay={0.8} />
      </div>

      {/* Voxel 4: Redstone Power Block (Bottom Left) */}
      <div className="absolute bottom-16 left-[2%] hidden md:block">
        <IsometricVoxelCube size={46} variant="redstone" label="⚡" floatDuration={6.5} delay={1.8} />
      </div>

      {/* Voxel 5: Obsidian Shell (Bottom Right) */}
      <div className="absolute bottom-10 right-[6%] hidden sm:block">
        <IsometricVoxelCube size={48} variant="obsidian" label="{ }" floatDuration={7.5} delay={2.2} />
      </div>

      {/* XP Orbs Floating across */}
      <div className="absolute top-24 left-[18%] hidden sm:block">
        <XpOrbToken size={24} value="+100 XP" delay={0.6} />
      </div>

      <div className="absolute bottom-28 left-[38%] hidden lg:block">
        <XpOrbToken size={22} value="+3 Free Runs" delay={1.7} />
      </div>

      <div className="absolute top-36 right-[26%] hidden sm:block">
        <PixelKeyToken size={38} delay={1.1} />
      </div>
    </div>
  );
}
