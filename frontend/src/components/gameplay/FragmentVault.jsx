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
    setRevealedChestIndices((prev) => new Set(prev).add(chestIdx));

    // Extract the fragment from keyData or fallback
    const frag = keyData.unlockedBlock ||
      (fragments.find((f) => f.id === keyData.blockId || f.blockId === keyData.blockId)) ||
      (fragments[chestIdx]) ||
      null;

    // Immediately notify parent to unlock the key, clear pendingKey, and advance the task!
    if (onUnlockKey) {
      onUnlockKey(keyData);
    }

    // Launch front-and-center heroic cinematic chest modal!
    setHeroModal({
      keyData,
      chestIndex: chestIdx,
      fragment: frag,
    });
  }, [collectedCount, fragments, onUnlockKey]);

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

    let keyDataToUnlock = pendingKey;
    try {
      const dataStr = e.dataTransfer.getData('mindcraft-key');
      if (dataStr) {
        keyDataToUnlock = JSON.parse(dataStr);
      }
    } catch (_) {}

    if (keyDataToUnlock && !isOpeningAnimation) {
      triggerChestUnlock(keyDataToUnlock);
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

      {/* ── SLEEK COMPACT CHEST SELECTOR TABS ── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-purple-300/70 font-bold px-0.5">
          <span>CHEST SELECTION:</span>
          <span className="text-purple-300">Chest #{activeChestIndex + 1} Selected</span>
        </div>

        {/* Compact Chest Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {Array.from({ length: totalCount }).map((_, i) => {
            const isTarget = pendingKey && pendingKey.taskIndex === i;
            const isUnlocked = revealedChestIndices.has(i) || i < collectedCount;
            const isSelected = activeChestIndex === i;

            return (
              <motion.button
                key={i}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => {
                  if (isTarget && !isOpeningAnimation) {
                    triggerChestUnlock(pendingKey);
                  } else {
                    setActiveChestIndex(i);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-center transition-all cursor-pointer shrink-0 font-mono text-xs ${
                  isTarget
                    ? 'border-2 border-amber-400 bg-amber-950/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-1 ring-amber-400 animate-pulse'
                    : isSelected
                    ? 'border-purple-400 bg-purple-900/80 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                    : isUnlocked
                    ? 'border-purple-500/30 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50'
                    : 'border-purple-500/15 bg-[#07080D]/70 text-slate-500 hover:border-purple-500/30'
                }`}
              >
                <span>{isUnlocked ? '✓' : isTarget ? '🎁' : '🔒'}</span>
                <span className="font-bold text-[11px]">Chest {i + 1}</span>
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
        className={`relative p-3.5 rounded-2xl border-2 transition-all duration-300 text-center flex flex-col items-center justify-center overflow-hidden min-h-[165px] ${
          isDragOver
            ? 'bg-purple-950/80 border-purple-400 scale-[1.02] shadow-[0_0_40px_rgba(168,85,247,0.6)]'
            : isCurrentChestTarget
            ? 'bg-gradient-to-b from-[#0D0F18] to-purple-950/40 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/50'
            : isCurrentChestUnlocked
            ? 'bg-purple-950/20 border-purple-500/30'
            : 'bg-[#07080D]/90 border-purple-500/20'
        }`}
      >
        {/* ── CHEST OPENING CONFETTI / VOLUMETRIC LIGHT PARTICLES ── */}
        <AnimatePresence>
          {isOpeningAnimation && (
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden">
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 2.5, 3], opacity: [1, 0.7, 0] }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="absolute w-44 h-44 rounded-full bg-gradient-to-t from-yellow-300 via-amber-400 to-amber-200 blur-xl"
              />

              {Array.from({ length: 20 }).map((_, i) => {
                const angle = (i * 360) / 20;
                const distance = 70 + (i % 3) * 30;
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * distance;
                const y = Math.sin(rad) * distance - 25;
                const colors = ['#f59e0b', '#fbbf24', '#10b981', '#38bdf8', '#ec4899', '#ffffff'];

                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                    animate={{
                      x: [0, x * 0.6, x],
                      y: [0, y - 35, y + 15],
                      scale: [0, 1.2, 0],
                      opacity: [1, 1, 0],
                      rotate: [0, 360 * ((i % 2 === 0 ? 1 : -1))],
                    }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                    style={{ backgroundColor: colors[i % colors.length] }}
                    className="absolute w-2.5 h-2.5 rounded shadow-sm"
                  />
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* 3D Chest Container */}
        <div className="relative">
          <motion.div
            animate={{
              scale: isOpeningAnimation
                ? [1, 1.12, 1.04]
                : isDragOver
                ? 1.06
                : isCurrentChestTarget
                ? [1, 1.04, 1]
                : 1,
              rotate: isOpeningAnimation ? [0, -3, 3, 0] : isDragOver ? [-2, 2, -2] : 0,
            }}
            transition={{ repeat: isCurrentChestTarget && !isOpeningAnimation ? Infinity : 0, duration: 1.6 }}
            className={`relative w-28 h-28 max-w-full rounded-2xl overflow-hidden shadow-xl border transition-all bg-[#07080D] ${
              isCurrentChestUnlocked
                ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                : isCurrentChestTarget
                ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.45)] ring-2 ring-amber-300'
                : 'border-purple-500/20'
            }`}
          >
            <img
              src={isCurrentChestUnlocked ? "/treasure-chest-open.png" : "/treasure-chest-closed.png"}
              alt="Treasure Chest"
              className="w-full h-full object-contain select-none transition-all duration-500 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            />

            {/* Glowing Aura inside Chest when Open */}
            {isCurrentChestUnlocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-radial from-purple-400/40 via-indigo-200/20 to-transparent pointer-events-none"
              />
            )}

            {/* Target Chest Badge */}
            {isCurrentChestTarget && (
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-wider animate-bounce shadow">
                Drop Key!
              </div>
            )}

            {/* Unlocked Checkmark Badge */}
            {isCurrentChestUnlocked && (
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[8px] uppercase tracking-wider shadow flex items-center gap-0.5">
                <span>✓</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Chest Status Text & Interactive Actions */}
        <div className="mt-2.5 space-y-1">
          {isOpeningAnimation ? (
            <div className="space-y-0.5 animate-pulse">
              <h4 className="text-xs font-black text-purple-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                <span>Opening Chest #{activeChestIndex + 1}...</span>
              </h4>
              <p className="text-[10px] text-slate-400">
                Unlocking code fragment...
              </p>
            </div>
          ) : isCurrentChestTarget ? (
            <>
              <h4 className="text-xs font-black text-amber-300 flex items-center justify-center gap-1.5 animate-pulse font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Drop Key into Chest #{activeChestIndex + 1}!</span>
              </h4>
              <p className="text-[10px] text-slate-300 leading-tight">
                Release Task {pendingKey.taskIndex + 1} golden key here to reveal code!
              </p>
              <button
                type="button"
                onClick={() => triggerChestUnlock(pendingKey)}
                className="mt-1.5 inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] transition active:scale-95 cursor-pointer"
              >
                <span>Tap to Open Chest #{activeChestIndex + 1}</span>
                <Unlock className="w-3 h-3" />
              </button>
            </>
          ) : isCurrentChestUnlocked ? (
            <>
              <h4 className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chest #{activeChestIndex + 1} Unlocked!</span>
              </h4>
              <p className="text-[10px] text-purple-300/70 leading-tight">
                Code fragment revealed below.
              </p>
            </>
          ) : (
            <>
              <h4 className="text-xs font-black text-slate-300 flex items-center justify-center gap-1 font-mono">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Chest #{activeChestIndex + 1} Locked</span>
              </h4>
              <p className="text-[10px] text-slate-400 leading-tight">
                Complete Task {activeChestIndex + 1} to earn its key!
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
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <span>Fragment #{activeChestIndex + 1} Unlocked!</span>
                  </h4>
                  <p className="text-[11px] text-purple-300/80 leading-tight">
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
              <div className="p-3 overflow-x-auto max-h-36 leading-relaxed text-[11px] bg-[#07080D]">
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
        onClose={() => {
          const targetIdx = heroModal?.chestIndex ?? activeChestIndex;
          setRevealedChestIndices((prev) => new Set(prev).add(targetIdx));
          setHeroModal(null);
        }}
        isAllCompleted={allUnlocked}
      />
    </div>
  );
}
