import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { playKeyHover } from '../../utils/gameAudio';

/**
 * PremiumGoldenKey — Studio-grade animated mythic golden key.
 * Features rotating arcane celestial rings, volumetric god-ray corona,
 * smooth 3D floating levitation with dynamic ground shadow,
 * specular sheen sweep, and interactive drag/hover physics.
 *
 * Props:
 *   size: 'sm' | 'md' | 'lg' | 'xl' | 'hero' (default: 'lg')
 *   keyData: pendingKey object for drag-and-drop
 *   onClick: function to execute on click
 *   interactive: boolean (default true)
 *   showLabel: boolean
 *   showRings: boolean (default true)
 */
export default function PremiumGoldenKey({
  size = 'lg',
  keyData = null,
  onClick = null,
  interactive = true,
  showLabel = false,
  showRings = true,
  className = '',
}) {
  const sizeMap = {
    sm: { box: 'w-16 h-16', img: 'w-14 h-14', shadow: 'w-10 h-2.5', ring: 80 },
    md: { box: 'w-24 h-24', img: 'w-20 h-20', shadow: 'w-14 h-3', ring: 110 },
    lg: { box: 'w-32 h-32', img: 'w-28 h-28', shadow: 'w-20 h-3.5', ring: 140 },
    xl: { box: 'w-40 h-40', img: 'w-36 h-36', shadow: 'w-24 h-4', ring: 170 },
    hero: { box: 'w-48 h-48', img: 'w-44 h-44', shadow: 'w-32 h-5', ring: 210 },
  };

  const currentSize = sizeMap[size] || sizeMap.lg;

  const handleDragStart = (e) => {
    if (!keyData) return;
    try {
      e.dataTransfer.setData('mindcraft-key', JSON.stringify(keyData));
      e.dataTransfer.setData('key', 'true');
      e.dataTransfer.effectAllowed = 'copyMove';
    } catch (_) {}
  };

  const handleMouseEnter = () => {
    if (interactive) {
      playKeyHover();
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* ── AMBIENT GOD-RAY GLOW / CORONA ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.4, 0.75, 0.4],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut',
          }}
          className="w-56 h-56 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-400/30 to-amber-600/20 blur-3xl"
        />
        {/* Secondary Cyan Mana Gem Core Glow */}
        <motion.div
          animate={{
            scale: [0.9, 1.3, 0.9],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.2,
            ease: 'easeInOut',
          }}
          className="w-24 h-24 rounded-full bg-cyan-400/25 blur-xl -translate-y-4"
        />
      </div>

      {/* ── ROTATING ARCANE CELESTIAL RINGS ── */}
      {showRings && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Outer Runic Gear Ring (Clockwise) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
            className="absolute rounded-full border border-amber-400/35 border-dashed"
            style={{ width: currentSize.ring, height: currentSize.ring }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b]" />
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#06b6d4]" />
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#06b6d4]" />
          </motion.div>

          {/* Inner Orbital Energy Ring (Counter-Clockwise) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
            className="absolute rounded-full border border-amber-300/20"
            style={{
              width: currentSize.ring * 0.75,
              height: currentSize.ring * 0.75,
              borderStyle: 'double',
            }}
          >
            <div className="absolute top-1/4 right-0 w-1.5 h-1.5 rounded-full bg-yellow-200 shadow-[0_0_6px_#fde047]" />
            <div className="absolute bottom-1/4 left-0 w-1.5 h-1.5 rounded-full bg-yellow-200 shadow-[0_0_6px_#fde047]" />
          </motion.div>
        </div>
      )}

      {/* ── FLOATING LEVITATING KEY CONTAINER ── */}
      <motion.div
        draggable={Boolean(interactive && keyData)}
        onDragStart={handleDragStart}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        animate={{
          y: [-6, 6, -6],
          rotate: [-3, 3, -3],
          scale: [1, 1.03, 1],
        }}
        transition={{
          y: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' },
          rotate: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' },
          scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
        }}
        whileHover={
          interactive
            ? {
                scale: 1.15,
                y: -12,
                rotate: 0,
                filter: 'drop-shadow(0 0 25px rgba(245, 158, 11, 0.9))',
              }
            : {}
        }
        whileTap={interactive ? { scale: 0.95 } : {}}
        className={`relative ${currentSize.box} flex items-center justify-center z-10 ${
          interactive ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        title={interactive ? 'Golden Master Key • Drag to Chest or Click to Unlock' : 'Golden Master Key'}
      >
        {/* Specular Glint Star Sparkles */}
        <motion.div
          animate={{
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0],
            rotate: [0, 90, 180],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.4,
            ease: 'easeInOut',
            times: [0, 0.5, 1],
          }}
          className="absolute -top-1 -right-1 z-20 pointer-events-none"
        >
          <Sparkles className="w-5 h-5 text-amber-200 drop-shadow-[0_0_8px_#fde047]" />
        </motion.div>

        <motion.div
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, -90, -180],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.8,
            delay: 1.2,
            ease: 'easeInOut',
            times: [0, 0.5, 1],
          }}
          className="absolute -bottom-1 -left-1 z-20 pointer-events-none"
        >
          <Sparkles className="w-4 h-4 text-cyan-200 drop-shadow-[0_0_8px_#22d3ee]" />
        </motion.div>

        {/* ── HIGH-FIDELITY 3D KEY GRAPHIC (TRANSPARENT PNG) ── */}
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src="/mythic-golden-key.png"
            alt="Mythic Golden Key"
            className={`${currentSize.img} object-contain pointer-events-none select-none drop-shadow-[0_12px_24px_rgba(245,158,11,0.6)]`}
          />

          {/* Shimmer Light Sweep Diagonal Gradient */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
            style={{ mixBlendMode: 'overlay' }}
          >
            <motion.div
              animate={{
                x: ['-100%', '200%'],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.8,
                ease: 'easeInOut',
                repeatDelay: 1.2,
              }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-25deg]"
            />
          </div>
        </div>
      </motion.div>

      {/* ── DYNAMIC LEVITATION CAST SHADOW ON GROUND ── */}
      <motion.div
        animate={{
          scale: [0.85, 1.15, 0.85],
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{
          repeat: Infinity,
          duration: 3.2,
          ease: 'easeInOut',
        }}
        className={`rounded-full bg-amber-950/70 blur-md pointer-events-none ${currentSize.shadow} mt-1`}
      />

      {/* Optional Label */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center"
        >
          <span className="text-[11px] font-mono font-black text-amber-300 tracking-wider uppercase bg-amber-950/70 px-3 py-1 rounded-full border border-amber-400/40 shadow-sm inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Master Key #{keyData?.taskIndex !== undefined ? keyData.taskIndex + 1 : '1'}</span>
          </span>
        </motion.div>
      )}
    </div>
  );
}
