import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, Code2, Unlock, Key, Copy, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CinematicChestModal from './CinematicChestModal';

// Web Audio sound generator for triumphant chest opening
function playChestOpenFanfare() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [
      { freq: 261.63, time: 0, dur: 0.2 },     // C4
      { freq: 329.63, time: 0.15, dur: 0.2 },  // E4
      { freq: 392.00, time: 0.3, dur: 0.25 },  // G4
      { freq: 523.25, time: 0.45, dur: 0.4 },  // C5
      { freq: 659.25, time: 0.6, dur: 0.5 },   // E5
    ];
    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    });
  } catch (_) {}
}

/**
 * FragmentVault — Interactive Multi-Chest Vault & Animated Chest Opening.
 * Supports dynamic number of chests (4 to 7+).
 * Only reveals the code block after the treasure box is opened with full animation!
 */
export default function FragmentVault({
  fragments = [],            // All fragments for this language
  collectedIds = [],         // Collected fragment IDs
  shuffledOrder = [],        // Shuffled vault order for ASSEMBLE phase
  phase = 'HUNT',
  totalExpected = 4,         // Total expected tasks/fragments (can be 4, 5, 6, 7+)
  pendingKey = null,         // Key earned waiting to be dropped
  onUnlockKey = null,        // Callback when key is dropped or clicked to unlock
  lastUnlockedBlock = null,  // Most recently unlocked code fragment
  onProceedToAssembly = null,// Callback to move to ASSEMBLE phase
  openingKeyTrigger = null,  // Key trigger from external modal/button
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeChestIndex, setActiveChestIndex] = useState(0);
  const [isOpeningAnimation, setIsOpeningAnimation] = useState(false);
  const [revealedChestIndices, setRevealedChestIndices] = useState(new Set());
  const [chestLidOpen, setChestLidOpen] = useState(false);

  const [heroModal, setHeroModal] = useState(null); // { keyData, chestIndex, stage: 'opening' | 'revealed', fragment }

  const totalCount = Math.max(totalExpected || 0, fragments.length || 0, 4);
  const collectedCount = collectedIds.length;
  const allUnlocked = collectedCount >= totalCount;

  // Initialize revealed chests on session restore or when collectedIds change
  useEffect(() => {
    setRevealedChestIndices((prev) => {
      const next = new Set(prev);
      collectedIds.forEach((_, idx) => next.add(idx));
      return next;
    });
  }, [collectedIds]);

  // When pendingKey is available, focus the target chest
  useEffect(() => {
    if (pendingKey && pendingKey.taskIndex !== undefined) {
      setActiveChestIndex(pendingKey.taskIndex);
    }
  }, [pendingKey]);

  // Map fragment by ID
  const fragmentMap = React.useMemo(() => {
    return Object.fromEntries(fragments.map((f) => [f.id || f.blockId, f]));
  }, [fragments]);

  // Execute opening animation when a key is dropped or triggered
  const triggerChestUnlock = useCallback((keyData) => {
    if (!keyData) return;

    const chestIdx = keyData.taskIndex !== undefined ? keyData.taskIndex : collectedCount;
    setActiveChestIndex(chestIdx);

    // Extract the fragment from keyData or fallback
    const frag = keyData.unlockedBlock ||
      (fragments.find((f) => f.id === keyData.blockId || f.blockId === keyData.blockId)) ||
      (fragments[chestIdx]) ||
      null;

    // Launch front-and-center heroic cinematic chest modal!
    setHeroModal({
      keyData,
      chestIndex: chestIdx,
      fragment: frag,
    });
  }, [collectedCount, fragments]);

  // Watch for external opening trigger
  useEffect(() => {
    if (openingKeyTrigger) {
      triggerChestUnlock(openingKeyTrigger);
    }
  }, [openingKeyTrigger, triggerChestUnlock]);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (pendingKey) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (pendingKey && !isOpeningAnimation) {
      triggerChestUnlock(pendingKey);
    }
  };

  const handleCopyCode = (codeText) => {
    if (!codeText) return;
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine which fragment code to display
  const displayedFragment = React.useMemo(() => {
    // Check if the currently viewed chest has been unlocked
    const isRevealed = revealedChestIndices.has(activeChestIndex) || activeChestIndex < collectedCount;
    if (!isRevealed && !lastUnlockedBlock) return null;

    if (activeChestIndex < collectedIds.length) {
      const id = collectedIds[activeChestIndex];
      return fragmentMap[id] || (lastUnlockedBlock?.blockId === id ? lastUnlockedBlock : null);
    }
    if (lastUnlockedBlock) return lastUnlockedBlock;
    if (collectedCount > 0) {
      const lastId = collectedIds[collectedCount - 1];
      return fragmentMap[lastId] || null;
    }
    return null;
  }, [activeChestIndex, revealedChestIndices, collectedCount, collectedIds, fragmentMap, lastUnlockedBlock]);

  const isCurrentChestUnlocked =
    revealedChestIndices.has(activeChestIndex) ||
    activeChestIndex < collectedCount ||
    (lastUnlockedBlock && lastUnlockedBlock.taskIndex === activeChestIndex);

  const isCurrentChestTarget = pendingKey && pendingKey.taskIndex === activeChestIndex;

  return (
    <div className="p-5 bg-[#0D0F18]/90 border border-purple-500/30 rounded-2xl space-y-4 shadow-xl backdrop-blur-xl font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
          <span className="text-lg">🪙</span>
          <span>Treasure Vault</span>
        </h3>
        <span className="text-xs font-bold text-purple-200 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-500/30 font-mono flex items-center gap-1">
          <span>{collectedCount} / {totalCount}</span>
          <span>🔑</span>
        </span>
      </div>

      {/* ── MULTI-TREASURE BOX SELECTOR (HANDLES 4 TO 7+ CHESTS) ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-purple-300/60 font-bold px-1">
          <span>CHOOSE TREASURE CHEST:</span>
          <span className="text-purple-300 font-bold">Chest #{activeChestIndex + 1} Active</span>
        </div>

        {/* Scrollable / Grid Chest Row */}
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-4 gap-2">
          {Array.from({ length: totalCount }).map((_, i) => {
            const isTarget = pendingKey && pendingKey.taskIndex === i;
            const isUnlocked = revealedChestIndices.has(i) || i < collectedCount;
            const isSelected = activeChestIndex === i;

            return (
              <motion.button
                key={i}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => {
                  if (isTarget && !isOpeningAnimation) {
                    triggerChestUnlock(pendingKey);
                  } else {
                    setActiveChestIndex(i);
                  }
                }}
                className={`relative p-2 rounded-xl border flex flex-col items-center justify-between text-center transition-all min-h-[74px] ${
                  isTarget
                    ? 'border-2 border-amber-400 bg-amber-950/60 shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-2 ring-amber-400 animate-pulse cursor-pointer'
                    : isUnlocked
                    ? `border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 cursor-pointer ${
                        isSelected ? 'ring-2 ring-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] bg-purple-900/70' : ''
                      }`
                    : `border-purple-500/20 bg-[#07080D]/80 text-slate-500 hover:border-purple-500/40 cursor-pointer ${
                        isSelected ? 'ring-2 ring-purple-500/50' : ''
                      }`
                }`}
              >
                {/* Mini Chest Graphic */}
                <div className="text-2xl mt-0.5">
                  {isUnlocked ? '📦' : isTarget ? '🎁' : '🔒'}
                </div>

                <div className="w-full">
                  <span className="text-[10px] font-black font-mono block leading-tight text-slate-200">
                    Chest {i + 1}
                  </span>
                  <span className="text-[8px] font-bold block uppercase tracking-wider text-purple-300/60">
                    {isUnlocked ? 'Unlocked' : isTarget ? 'Drop Key!' : 'Locked'}
                  </span>
                </div>

                {/* Status Badges */}
                {isUnlocked && (
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black shadow-xs">
                    ✓
                  </div>
                )}
                {isTarget && (
                  <div className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[7px] font-black uppercase tracking-wider animate-bounce shadow">
                    KEY
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE FEATURED TREASURE CHEST DISPLAY & OPENING STAGE ── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-center flex flex-col items-center justify-center overflow-hidden min-h-[260px] ${
          isDragOver
            ? 'bg-purple-950/80 border-purple-400 scale-[1.02] shadow-[0_0_40px_rgba(168,85,247,0.6)]'
            : isCurrentChestTarget
            ? 'bg-gradient-to-b from-[#0D0F18] to-purple-950/40 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/50'
            : isCurrentChestUnlocked
            ? 'bg-purple-950/20 border-purple-500/30'
            : 'bg-[#07080D]/90 border-purple-500/20'
        }`}
      >
        {/* ── CHEST OPENING CONFETTI / VOLUMETRIC LIGHT PARTICLES ── */}
        <AnimatePresence>
          {isOpeningAnimation && (
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden">
              {/* Central radiant burst flare */}
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 2.5, 3], opacity: [1, 0.7, 0] }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="absolute w-48 h-48 rounded-full bg-gradient-to-t from-yellow-300 via-amber-400 to-amber-200 blur-xl"
              />

              {/* 24 Confetti & Gold Coin Particles bursting upward */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 360) / 24;
                const distance = 80 + (i % 3) * 35;
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * distance;
                const y = Math.sin(rad) * distance - 30; // Bias upwards
                const colors = ['#f59e0b', '#fbbf24', '#10b981', '#38bdf8', '#ec4899', '#ffffff'];

                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                    animate={{
                      x: [0, x * 0.6, x],
                      y: [0, y - 40, y + 20],
                      scale: [0, 1.3, 0],
                      opacity: [1, 1, 0],
                      rotate: [0, 360 * ((i % 2 === 0 ? 1 : -1))],
                    }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                    style={{ backgroundColor: colors[i % colors.length] }}
                    className="absolute w-3 h-3 rounded-md shadow-md"
                  />
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* 3D Chest Container with Opening Animation */}
        <div className="relative">
          <motion.div
            animate={{
              scale: isOpeningAnimation
                ? [1, 1.15, 1.05]
                : isDragOver
                ? 1.08
                : isCurrentChestTarget
                ? [1, 1.04, 1]
                : 1,
              rotate: isOpeningAnimation ? [0, -4, 4, 0] : isDragOver ? [-2, 2, -2] : 0,
            }}
            transition={{ repeat: isCurrentChestTarget && !isOpeningAnimation ? Infinity : 0, duration: 1.6 }}
            className={`relative w-44 h-44 max-w-full rounded-2xl overflow-hidden shadow-2xl border-2 transition-all bg-[#07080D] ${
              isCurrentChestUnlocked
                ? 'border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.35)]'
                : isCurrentChestTarget
                ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] ring-2 ring-amber-300'
                : 'border-purple-500/20'
            }`}
          >
            <img
              src={isCurrentChestUnlocked ? "/treasure-chest-open.png" : "/treasure-chest-closed.png"}
              alt="Treasure Chest"
              className="w-full h-full object-contain select-none transition-all duration-500 drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]"
            />

            {/* Glowing Aura inside Chest when Open */}
            {isCurrentChestUnlocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-radial from-purple-400/40 via-indigo-200/20 to-transparent pointer-events-none"
              />
            )}

            {/* Target Chest Badge */}
            {isCurrentChestTarget && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider animate-bounce shadow">
                Unlockable!
              </div>
            )}

            {/* Unlocked Checkmark Badge */}
            {isCurrentChestUnlocked && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider shadow flex items-center gap-1">
                <span>✓</span>
                <span>Open</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Chest Status Text & Interactive Actions */}
        <div className="mt-3.5 space-y-1">
          {isOpeningAnimation ? (
            <div className="space-y-1 animate-pulse">
              <h4 className="text-base font-black text-purple-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />
                <span>Opening Treasure Chest #{activeChestIndex + 1}...</span>
              </h4>
              <p className="text-[11px] text-slate-400 font-semibold">
                Unlocking code fragment with magical key...
              </p>
            </div>
          ) : isCurrentChestTarget ? (
            <>
              <h4 className="text-base font-black text-amber-300 flex items-center justify-center gap-1.5 animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Drop Key into Chest #{activeChestIndex + 1}!</span>
              </h4>
              <p className="text-[11px] text-slate-300 max-w-[270px] mx-auto leading-relaxed">
                Release Task {pendingKey.taskIndex + 1} golden key here to pop open the chest and reveal the code!
              </p>
              <button
                type="button"
                onClick={() => triggerChestUnlock(pendingKey)}
                className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-[0_0_20px_rgba(168,85,247,0.4)] transition active:scale-95 cursor-pointer"
              >
                <span>Tap to Open Chest #{activeChestIndex + 1}</span>
                <Unlock className="w-3.5 h-3.5" />
              </button>
            </>
          ) : isCurrentChestUnlocked ? (
            <>
              <h4 className="text-sm font-black text-emerald-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Chest #{activeChestIndex + 1} Unlocked!</span>
              </h4>
              <p className="text-[11px] text-purple-300/70 max-w-[260px] mx-auto leading-relaxed">
                Code fragment for Task {activeChestIndex + 1} revealed below.
              </p>
            </>
          ) : (
            <>
              <h4 className="text-base font-black text-slate-200 flex items-center justify-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Chest #{activeChestIndex + 1} Locked</span>
              </h4>
              <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto leading-relaxed font-sans">
                Complete Task {activeChestIndex + 1} to earn its key and open this chest!
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── FRAGMENT UNLOCKED CODE VIEWER (REVEALED ONLY AFTER CHEST IS OPENED) ── */}
      <AnimatePresence mode="wait">
        {displayedFragment && !isOpeningAnimation ? (
          <motion.div
            key={displayedFragment.blockId || displayedFragment.id || activeChestIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-2.5 pt-1"
          >
            {/* Unlocked banner header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎁</span>
                <div>
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>Fragment #{activeChestIndex + 1} Unlocked!</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Here is your code revealed from Chest #{activeChestIndex + 1}.
                  </p>
                </div>
              </div>

              {displayedFragment.role && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30 font-mono">
                  {displayedFragment.role}
                </span>
              )}
            </div>

            {/* Dark Code Block */}
            <div className="rounded-xl overflow-hidden border border-purple-500/30 bg-[#07080D] shadow-xl font-mono text-xs">
              {/* Code Editor Header */}
              <div className="px-3.5 py-2 bg-[#0D0F18] border-b border-purple-500/20 flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px] font-bold text-purple-200">
                    Fragment #{activeChestIndex + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(displayedFragment.code)}
                  className="px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 hover:text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer border border-purple-500/30"
                  title="Copy code to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-purple-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Lines with Line Numbers */}
              <div className="p-3.5 overflow-x-auto max-h-56 leading-relaxed text-[11px] bg-[#07080D]">
                <table className="w-full border-collapse">
                  <tbody>
                    {(displayedFragment.code || '').split('\n').map((line, idx) => (
                      <tr key={idx} className="hover:bg-purple-950/20">
                        <td className="pr-3 text-right text-purple-400/50 select-none font-mono text-[10px] w-6 align-top">
                          {idx + 1}
                        </td>
                        <td className="text-purple-200 font-mono whitespace-pre font-medium pl-1">
                          {line || ' '}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Notification Banner */}
              <div className="px-3.5 py-2 bg-emerald-950/40 border-t border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-[10px] font-semibold font-mono">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Code revealed! You unlocked this fragment.</span>
              </div>
            </div>

            {/* If all tasks completed: Big Proceed Button */}
            {allUnlocked && (
              <button
                type="button"
                onClick={onProceedToAssembly}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.45)] hover:shadow-[0_0_35px_rgba(168,85,247,0.65)] transition active:scale-95 cursor-pointer mt-2"
              >
                <span>Proceed to Assembly Board</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── CINEMATIC FRONT-AND-CENTER TREASURE CHEST OPENING MODAL ── */}
      <CinematicChestModal
        isOpen={Boolean(heroModal)}
        keyData={heroModal?.keyData}
        chestIndex={heroModal?.chestIndex ?? activeChestIndex}
        fragment={heroModal?.fragment}
        onClose={() => setHeroModal(null)}
        onCollect={(kData) => {
          const targetIdx = heroModal?.chestIndex ?? activeChestIndex;
          setRevealedChestIndices((prev) => new Set(prev).add(targetIdx));
          if (onUnlockKey && kData) onUnlockKey(kData);
          setHeroModal(null);
          if (kData?.allTasksCompleted && onProceedToAssembly) {
            onProceedToAssembly();
          }
        }}
        isAllCompleted={allUnlocked}
      />
    </div>
  );
}
