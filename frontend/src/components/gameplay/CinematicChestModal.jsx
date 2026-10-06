import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Code2, Copy, Check, ArrowRight, X, ShieldCheck, Key } from 'lucide-react';
import {
  playKeyInsert,
  playLockTurn,
  playChestOpenFanfare,
  playRelicAscend,
} from '../../utils/gameAudio';

/**
 * CinematicChestModal — AAA Studio-grade treasure chest opening graphics animation.
 *
 * Choreography Timeline:
 *   0.0s - 0.7s: Key floats down in 3D perspective toward the chest lock (playKeyInsert)
 *   0.7s - 1.4s: Key turns 90°, shockwave ripples, runes glow, chest rumbles (playLockTurn)
 *   1.4s - 2.2s: Lid bursts open, volumetric light beam explodes, loot erupts (playChestOpenFanfare)
 *   2.2s+:       Holographic Code Relic ascends from inside the chest (playRelicAscend)
 */
export default function CinematicChestModal({
  isOpen = false,
  keyData = null,
  chestIndex = 0,
  fragment = null,
  onClose = null,
  onCollect = null,
  isAllCompleted = false,
}) {
  // animation stages: 'key-descend' | 'key-turn' | 'chest-open' | 'relic-reveal'
  const [animStage, setAnimStage] = useState('key-descend');
  const [copied, setCopied] = useState(false);
  const audioFiredRef = useRef({ insert: false, turn: false, fanfare: false, relic: false });

  // Reset and trigger timeline whenever modal opens
  useEffect(() => {
    if (!isOpen) {
      setAnimStage('key-descend');
      audioFiredRef.current = { insert: false, turn: false, fanfare: false, relic: false };
      return;
    }

    setAnimStage('key-descend');
    playKeyInsert();
    audioFiredRef.current.insert = true;

    // Stage 1 -> Stage 2 (Key Turn & Rumble)
    const t1 = setTimeout(() => {
      setAnimStage('key-turn');
      playLockTurn();
      audioFiredRef.current.turn = true;
    }, 750);

    // Stage 2 -> Stage 3 (Chest Lid Burst & Light Beam)
    const t2 = setTimeout(() => {
      setAnimStage('chest-open');
      playChestOpenFanfare();
      audioFiredRef.current.fanfare = true;
    }, 1500);

    // Stage 3 -> Stage 4 (Code Fragment Ascension)
    const t3 = setTimeout(() => {
      setAnimStage('relic-reveal');
      playRelicAscend();
      audioFiredRef.current.relic = true;
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const isChestOpen = animStage === 'chest-open' || animStage === 'relic-reveal';
  const isRelicVisible = animStage === 'relic-reveal';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto"
      >
        {/* ── BACKGROUND VOLUMETRIC GOD-RAYS & VIGNETTE ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Pulsing ambient warmth */}
          <motion.div
            animate={{
              scale: isChestOpen ? [1.2, 1.6, 1.4] : [1, 1.1, 1],
              opacity: isChestOpen ? [0.4, 0.7, 0.5] : [0.2, 0.35, 0.2],
            }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-600/20 blur-[100px]"
          />

          {/* Rotating Conic Sunbeam Burst upon chest opening */}
          {isChestOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.8, opacity: [0.6, 0.85, 0.6], rotate: 360 }}
              transition={{
                scale: { duration: 0.8, ease: 'easeOut' },
                rotate: { repeat: Infinity, duration: 25, ease: 'linear' },
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none bg-[conic-gradient(from_0deg,#fbbf24_0deg,transparent_20deg,#f59e0b_45deg,transparent_65deg,#fbbf24_90deg,transparent_110deg,#f59e0b_135deg,transparent_155deg,#fbbf24_180deg,transparent_200deg,#f59e0b_225deg,transparent_245deg,#fbbf24_270deg,transparent_290deg,#f59e0b_315deg,transparent_335deg,#fbbf24_360deg)] blur-lg opacity-60"
            />
          )}

          {/* Shockwave ripple when key turns */}
          {animStage === 'key-turn' && (
            <motion.div
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-amber-300 shadow-[0_0_50px_#f59e0b]"
            />
          )}
        </div>

        {/* ── CINEMATIC STAGE CONTAINER ── */}
        <motion.div
          initial={{ scale: 0.85, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 30 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-black/95 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.5)] text-center overflow-hidden font-sans"
        >
          {/* Close / Dismiss Button */}
          <button
            type="button"
            onClick={() => {
              if (onCollect) onCollect(keyData);
              if (onClose) onClose();
            }}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer z-30 text-sm font-bold border border-slate-700/50 shadow-md"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top HUD Banner */}
          <div className="relative z-20 space-y-1 mb-2">
            <span className="text-[10px] px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono font-black uppercase tracking-widest border border-amber-400/40 inline-flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>
                {isRelicVisible
                  ? 'Code Fragment Acquired!'
                  : isChestOpen
                  ? 'Treasure Unsealed!'
                  : `Unlocking Chest #${chestIndex + 1}...`}
              </span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight font-mono">
              Treasure Chest #{chestIndex + 1}
            </h2>
          </div>

          {/* ── 3D CHEST STAGE & KEY INSERTION CHOREOGRAPHY ── */}
          <div className="relative flex flex-col items-center justify-center py-2 min-h-[220px]">
            {/* ── KEY DESCENT & INSERTION ANIMATION ── */}
            <AnimatePresence>
              {!isChestOpen && (
                <motion.div
                  initial={{ y: -90, x: 25, scale: 1.5, rotate: -20, opacity: 0 }}
                  animate={
                    animStage === 'key-descend'
                      ? { y: 20, x: 0, scale: 1.05, rotate: -5, opacity: 1 }
                      : { y: 35, x: 0, scale: 0.95, rotate: 90, opacity: [1, 1, 0.4] }
                  }
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{
                    y: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                    rotate: animStage === 'key-turn' ? { duration: 0.45, ease: 'backOut' } : {},
                    opacity: { duration: 0.3 },
                  }}
                  className="absolute z-20 pointer-events-none drop-shadow-[0_0_20px_rgba(245,158,11,1)]"
                >
                  <img
                    src="/mythic-golden-key.png"
                    alt="Key Inserting"
                    className="w-24 h-24 object-contain drop-shadow-[0_8px_25px_rgba(245,158,11,0.9)]"
                  />
                  {/* Glowing insertion flare */}
                  <motion.div
                    animate={{ scale: [1, 1.8, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="absolute inset-0 rounded-full bg-amber-400/50 blur-lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── 3D CHEST VISUAL CONTAINER ── */}
            <motion.div
              animate={
                animStage === 'key-turn'
                  ? {
                      x: [-3, 3, -3, 3, -1, 1, 0],
                      scale: [1, 1.04, 1.02],
                    }
                  : isChestOpen
                  ? {
                      scale: [1, 1.05, 1],
                      y: [0, -4, 0],
                    }
                  : { scale: 1, y: 0 }
              }
              transition={
                animStage === 'key-turn'
                  ? { repeat: Infinity, duration: 0.15 }
                  : { duration: 0.6 }
              }
              className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden flex items-center justify-center"
            >
              {/* Closed or Open Chest Image (Transparent PNG) */}
              <motion.img
                key={isChestOpen ? 'chest-opened' : 'chest-closed'}
                initial={{ opacity: 0.85, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={isChestOpen ? '/treasure-chest-open.png' : '/treasure-chest-closed.png'}
                alt="Treasure Chest"
                className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_20px_45px_rgba(0,0,0,0.8)]"
              />

              {/* Intense molten gold light bursting from chest interior when open */}
              {isChestOpen && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: [0.8, 1, 0.8], scaleY: 1 }}
                  transition={{ duration: 0.6 }}
                  className="absolute bottom-16 w-36 h-48 bg-gradient-to-t from-yellow-300 via-amber-400/60 to-transparent blur-xl pointer-events-none"
                />
              )}

              {/* ── ERUPTION PARTICLES (GOLD COINS, GEMS, CYBER CODE TOKENS) ── */}
              {isChestOpen && (
                <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-visible">
                  {/* 30 Golden Shimmer Particles */}
                  {Array.from({ length: 32 }).map((_, i) => {
                    const angle = (i * 360) / 32;
                    const distance = 90 + (i % 4) * 35;
                    const rad = (angle * Math.PI) / 180;
                    const x = Math.cos(rad) * distance;
                    const y = Math.sin(rad) * distance - 40; // upward bias
                    const colors = ['#f59e0b', '#fbbf24', '#fef08a', '#38bdf8', '#34d399', '#ffffff'];

                    return (
                      <motion.div
                        key={`spark-${i}`}
                        initial={{ x: 0, y: 10, scale: 0, opacity: 1 }}
                        animate={{
                          x: [0, x * 0.7, x],
                          y: [10, y - 30, y + 15],
                          scale: [0, 1.4, 0],
                          opacity: [1, 1, 0],
                        }}
                        transition={{ duration: 1.4 + (i % 3) * 0.2, ease: 'easeOut' }}
                        style={{ backgroundColor: colors[i % colors.length] }}
                        className="absolute w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                      />
                    );
                  })}

                  {/* 8 Floating 3D Gold Coins & Gems */}
                  {['🪙', '💎', '🪙', '✨', '🪙', '💎', '🪙', '⭐'].map((emoji, i) => {
                    const xOffset = (i - 3.5) * 36;
                    const yOffset = -70 - (i % 3) * 30;
                    return (
                      <motion.div
                        key={`loot-${i}`}
                        initial={{ x: 0, y: 20, scale: 0, opacity: 0 }}
                        animate={{
                          x: [0, xOffset],
                          y: [20, yOffset, yOffset + 25],
                          scale: [0, 1.4, 1.1],
                          opacity: [0, 1, 0.85],
                          rotate: [0, 180 * (i % 2 === 0 ? 1 : -1)],
                        }}
                        transition={{
                          duration: 1.3,
                          delay: 0.1 + i * 0.05,
                          ease: 'easeOut',
                        }}
                        className="absolute text-2xl drop-shadow-[0_4px_10px_rgba(245,158,11,0.8)] pointer-events-none"
                      >
                        {emoji}
                      </motion.div>
                    );
                  })}

                  {/* Flying Cyber Code Tokens */}
                  {['{ }', 'const', '01', '=>', 'return', 'fn()'].map((token, i) => {
                    const angle = (i * 60 - 30) * (Math.PI / 180);
                    const dist = 110;
                    return (
                      <motion.div
                        key={`code-token-${i}`}
                        initial={{ x: 0, y: 15, scale: 0, opacity: 0 }}
                        animate={{
                          x: [0, Math.cos(angle) * dist],
                          y: [15, Math.sin(angle) * dist - 50],
                          scale: [0, 1.2, 0.9],
                          opacity: [0, 1, 0],
                        }}
                        transition={{ duration: 1.5, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
                        className="absolute px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-mono font-bold text-[10px] shadow-[0_0_12px_#06b6d4] pointer-events-none"
                      >
                        {token}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── STAGE 4: HOLOGRAPHIC CODE FRAGMENT ASCENSION ── */}
          <AnimatePresence>
            {isRelicVisible && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.6, type: 'spring', damping: 18, stiffness: 200 }}
                className="mt-4 text-left space-y-3 relative z-30"
              >
                {/* Fragment Banner Pill */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎁</span>
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                      <span>Code Fragment #{chestIndex + 1} Revealed!</span>
                    </span>
                  </div>
                  {fragment?.role && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-950/90 text-purple-300 border border-purple-500/50 font-mono uppercase tracking-wider shadow-sm">
                      {fragment.role}
                    </span>
                  )}
                </div>

                {/* Dark Holographic Code Inspector Box */}
                <div className="rounded-2xl overflow-hidden border-2 border-purple-500/30 bg-[#07080D] shadow-2xl font-mono text-xs">
                  {/* Top Bar with Copy Button */}
                  <div className="px-4 py-2.5 bg-[#0D0F18] border-b border-purple-500/20 flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-purple-400" />
                      <span className="text-[11px] font-bold text-purple-200">
                        Fragment #{chestIndex + 1} • Logic Unit
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(fragment?.code)}
                      className="px-3 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border border-purple-500/30"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-purple-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Syntax-Highlighted Code Lines */}
                  <div className="p-4 overflow-x-auto max-h-56 leading-relaxed text-[11.5px] bg-[#07080D]">
                    <table className="w-full border-collapse">
                      <tbody>
                        {(fragment?.code || '// Code fragment ready').split('\n').map((line, idx) => (
                          <tr key={idx} className="hover:bg-purple-950/20">
                            <td className="pr-3 text-right text-purple-400/50 select-none text-[10px] w-7 align-top">
                              {idx + 1}
                            </td>
                            <td className="text-purple-200 font-mono whitespace-pre font-medium pl-2">
                              {line || ' '}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Success Banner */}
                  <div className="px-4 py-2 bg-emerald-950/40 border-t border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-[11px] font-semibold">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Fragment saved to Vault! You can re-read it anytime on the right.</span>
                  </div>
                </div>

                {/* Big Action Button: Collect Fragment & Continue */}
                <button
                  type="button"
                  onClick={() => {
                    if (onCollect) onCollect(keyData);
                    if (onClose) onClose();
                  }}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] transition active:scale-95 cursor-pointer font-mono"
                >
                  <span>{isAllCompleted ? 'Proceed to Assembly Board' : 'Collect Fragment & Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
