import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Key, HelpCircle, CheckCircle2, XCircle, Clock, Send, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumGoldenKey from './PremiumGoldenKey';
import { playKeyUnlockFanfare } from '../../utils/gameAudio';

// Web Audio sound generator for fireworks and sparkles
function playMagicSparkleSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.35);
    });
  } catch (_) {}
}

/**
 * TaskPanel – Renders the current server-sent task quiz and celebratory firework key reveal.
 */
export default function TaskPanel({
  task,
  onSubmit,
  cooldown = 0,
  taskIndex = 0,
  totalTasks = 0,
  disabled = false,
  lastResult = null,
  lastExplain = '',
  isSubmitting = false,
  attemptsCount = 0,
  maxAttempts = 3,
  revealedAnswerInfo = null,
  onDismissReveal = null,
  pendingKey = null,
  onUnlockKey = null,
}) {
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [localFeedback, setLocalFeedback] = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showFireworkBurst, setShowFireworkBurst] = useState(false);
  const prevPendingKeyRef = useRef(null);

  const quiz = task?.quiz;

  // Auto-dismiss reveal banner after 12s if user doesn't dismiss it manually
  useEffect(() => {
    if (revealedAnswerInfo?.revealed && onDismissReveal) {
      const timer = setTimeout(() => {
        onDismissReveal();
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [revealedAnswerInfo?.revealed, onDismissReveal]);

  // Reset answer when task changes and there is no pending key for the task
  useEffect(() => {
    if (!pendingKey) {
      setAnswer('');
      setSelectedOption(null);
      setLocalFeedback(null);
      setShowFireworkBurst(false);
      setShowKeyModal(false);
    }
  }, [task?.taskId, quiz?.quizId, pendingKey]);

  // When a new pendingKey is earned, trigger key modal and celebratory sound!
  useEffect(() => {
    if (pendingKey && (!prevPendingKeyRef.current || prevPendingKeyRef.current.taskIndex !== pendingKey.taskIndex)) {
      setShowKeyModal(true);
      setShowFireworkBurst(true);
      playKeyUnlockFanfare();
      const t = setTimeout(() => setShowFireworkBurst(false), 2400);
      return () => clearTimeout(t);
    } else if (!pendingKey) {
      setShowKeyModal(false);
    }
    prevPendingKeyRef.current = pendingKey;
  }, [pendingKey]);

  // Show server feedback
  useEffect(() => {
    if (lastResult !== null) {
      setLocalFeedback({
        correct: lastResult,
        explain: lastExplain,
        attemptsCount,
      });
    }
  }, [lastResult, lastExplain, attemptsCount]);

  const handleSubmit = useCallback(async () => {
    if (disabled || cooldown > 0 || isSubmitting || pendingKey) return;

    let submittedAnswer;
    if (quiz?.type === 'MCQ') {
      if (selectedOption === null) return;
      submittedAnswer = selectedOption;
    } else {
      if (!answer.trim()) return;
      submittedAnswer = answer.trim();
    }

    await onSubmit(submittedAnswer);
  }, [quiz, selectedOption, answer, onSubmit, disabled, cooldown, isSubmitting, pendingKey]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  if (!task || !quiz) {
    return (
      <div className="p-8 bg-white/90 border border-slate-200 rounded-2xl text-center text-slate-500 text-xs font-mono shadow-sm">
        No task available
      </div>
    );
  }

  const typeLabel = {
    MCQ: 'MULTIPLE CHOICE',
    SHORT_ANSWER: 'SHORT ANSWER',
    OUTPUT_PREDICTION: 'PREDICT OUTPUT',
    FILL_BLANK: 'FILL IN THE BLANK',
    CODE_ORDER: 'CODE ORDER',
  }[quiz.type] || quiz.type;

  return (
    <div className="relative p-6 bg-[#0D0F18]/90 border border-purple-500/30 rounded-2xl space-y-5 shadow-xl backdrop-blur-xl font-sans overflow-hidden">
      {/* ── FIREWORK EXPLOSION / DECORATION LIGHT BURST ON KEY REVEAL ── */}
      <AnimatePresence>
        {showFireworkBurst && (
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden">
            {/* Flash shockwave */}
            <motion.div
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: [0, 2.8, 3.5], opacity: [0.9, 0.4, 0] }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              className="absolute w-44 h-44 rounded-full bg-gradient-to-r from-purple-400 via-indigo-300 to-amber-400 blur-xl"
            />

            {/* Light beam spokes rotating */}
            <motion.div
              initial={{ rotate: 0, scale: 0, opacity: 0.8 }}
              animate={{ rotate: 180, scale: [0, 1.8, 0], opacity: [0.8, 1, 0] }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute w-72 h-72 rounded-full border-4 border-dashed border-purple-400/60"
            />

            {/* 28 Sparkling Firework Particles shooting radially */}
            {Array.from({ length: 28 }).map((_, i) => {
              const angle = (i * 360) / 28;
              const radius = 90 + (i % 4) * 35;
              const rad = (angle * Math.PI) / 180;
              const targetX = Math.cos(rad) * radius;
              const targetY = Math.sin(rad) * radius;
              const colors = [
                '#c084fc', '#a855f7', '#818cf8', '#10b981', '#f59e0b', '#ec4899', '#ffffff', '#e0e7ff'
              ];
              const color = colors[i % colors.length];

              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: [0, targetX * 0.7, targetX],
                    y: [0, targetY * 0.7, targetY + 20],
                    scale: [0, 1.4, 0],
                    opacity: [1, 1, 0],
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 1.1 + (i % 3) * 0.2, ease: 'easeOut' }}
                  style={{ backgroundColor: color }}
                  className="absolute w-3 h-3 rounded-full shadow-[0_0_12px_currentColor]"
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Task Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
            <Key className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              Task {taskIndex + 1}: {task.title || 'Complete Objective'}
            </h3>
            <span className="text-[10px] font-bold text-purple-300/70 font-mono tracking-wider uppercase">
              {typeLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold ${
              attemptsCount >= 2
                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                : 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
            }`}
          >
            Attempt {Math.min(attemptsCount + 1, maxAttempts)}/{maxAttempts} (-20 pts)
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-900/40 text-purple-200 font-bold font-mono border border-purple-500/30">
            {taskIndex + 1} / {totalTasks}
          </span>
        </div>
      </div>

      {/* 3 Wrong Attempts Answer Revealed Banner */}
      {revealedAnswerInfo?.revealed && (
        <div className="p-4 rounded-xl bg-amber-950/50 border-2 border-amber-400/50 text-xs font-mono space-y-2 animate-fadeIn shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-200 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {revealedAnswerInfo.forTaskTitle
                  ? `${revealedAnswerInfo.forTaskTitle} — Answer Revealed`
                  : '3 Attempts Exhausted — Answer Revealed!'}
              </span>
            </div>
            {onDismissReveal && (
              <button
                type="button"
                onClick={onDismissReveal}
                className="px-2 py-0.5 text-[10px] rounded bg-amber-900 hover:bg-amber-800 text-amber-200 font-bold transition"
              >
                ✕
              </button>
            )}
          </div>
          <div className="p-2.5 bg-[#07080D]/90 rounded-lg border border-amber-500/40 text-amber-100">
            <span className="text-[10px] text-purple-300/60 uppercase font-bold block">Correct Answer:</span>
            <span className="text-sm font-bold">{revealedAnswerInfo.answer}</span>
          </div>
          {revealedAnswerInfo.explain && (
            <p className="text-slate-300 text-[11px] leading-relaxed">{revealedAnswerInfo.explain}</p>
          )}
        </div>
      )}

      {/* Question Prompt */}
      <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-line bg-[#07080D]/90 p-4 rounded-2xl border border-purple-500/25 font-mono shadow-inner">
        {quiz.prompt}
      </div>

      {/* Concept tag */}
      {quiz.concept && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30 font-mono font-bold">
            {quiz.concept}
          </span>
        </div>
      )}

      {/* Answer Options Area */}
      <div className="space-y-2.5">
        {quiz.type === 'MCQ' && quiz.options?.length > 0 && (
          <div className="space-y-2">
            {quiz.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const wasCorrectOption = localFeedback?.correct === true && isSelected;
              const wasWrongOption = localFeedback?.correct === false && isSelected;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!disabled && cooldown <= 0 && !isSubmitting && !pendingKey) {
                      setSelectedOption(idx);
                      setLocalFeedback(null);
                      if (onDismissReveal) onDismissReveal();
                    }
                  }}
                  disabled={disabled || cooldown > 0 || isSubmitting || Boolean(pendingKey)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-mono transition-all duration-150 flex items-center gap-3.5 ${
                    wasCorrectOption || (pendingKey && isSelected)
                      ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : wasWrongOption
                      ? 'border-rose-500 bg-rose-950/60 text-rose-200 font-bold'
                      : isSelected
                      ? 'border-purple-400 bg-purple-950/80 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.35)] ring-1 ring-purple-400/50'
                      : 'border-purple-500/20 bg-[#07080D]/80 text-slate-200 hover:border-purple-500/50 hover:bg-purple-950/30'
                  } ${disabled || cooldown > 0 || pendingKey ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                      wasCorrectOption || (pendingKey && isSelected)
                        ? 'bg-emerald-500 text-white'
                        : wasWrongOption
                        ? 'bg-rose-500 text-white'
                        : isSelected
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                        : 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {(quiz.type === 'SHORT_ANSWER' || quiz.type === 'OUTPUT_PREDICTION' || quiz.type === 'FILL_BLANK') && (
          <div className="relative">
            <input
              type="text"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setLocalFeedback(null);
                if (onDismissReveal) onDismissReveal();
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                quiz.type === 'FILL_BLANK'
                  ? 'Type the missing code...'
                  : quiz.type === 'OUTPUT_PREDICTION'
                  ? 'What does the code output?'
                  : 'Type your answer...'
              }
              disabled={disabled || cooldown > 0 || isSubmitting || Boolean(pendingKey)}
              className="w-full p-3.5 bg-[#07080D]/90 border border-purple-500/30 rounded-xl text-xs font-mono text-white placeholder:text-purple-300/40 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40 disabled:opacity-60"
            />
          </div>
        )}

        {quiz.type === 'CODE_ORDER' && (
          <textarea
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setLocalFeedback(null);
              if (onDismissReveal) onDismissReveal();
            }}
            placeholder="Enter the correct order (comma-separated or one per line)"
            disabled={disabled || cooldown > 0 || isSubmitting || Boolean(pendingKey)}
            rows={3}
            className="w-full p-3.5 bg-[#07080D]/90 border border-purple-500/30 rounded-xl text-xs font-mono text-white placeholder:text-purple-300/40 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40 disabled:opacity-60 resize-none"
          />
        )}
      </div>

      {/* Wrong Answer Feedback */}
      {localFeedback && !localFeedback.correct && !pendingKey && (
        <div className="p-3.5 rounded-xl text-xs font-mono flex items-start gap-2.5 bg-rose-950/60 border border-rose-500/40 text-rose-200 animate-fadeIn">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">❌ Wrong Answer (-20 pts). Attempt {attemptsCount + 1} of {maxAttempts}.</span>
            {localFeedback.explain && (
              <p className="text-slate-300 text-[11px] leading-relaxed">{localFeedback.explain}</p>
            )}
          </div>
        </div>
      )}

      {/* Cooldown Timer */}
      {cooldown > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono">
          <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
          <span>Cooldown active: {cooldown}s — preparing next attempt...</span>
        </div>
      )}

      {/* ── CELEBRATORY KEY EARNED POPUP MODAL (PROMINENT FULL-SCREEN POPUP) ── */}
      <AnimatePresence>
        {showKeyModal && pendingKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.6, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 shadow-[0_0_60px_rgba(245,158,11,0.5)] text-center overflow-hidden font-mono"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer z-20 text-xs font-bold"
              >
                ✕
              </button>

              {/* Radiant Light Flare */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-amber-400/25 blur-3xl pointer-events-none" />

              {/* Modal Header */}
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black uppercase tracking-widest border border-amber-400/30 inline-flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Correct Answer!</span>
                </span>
                <h3 className="text-xl font-black text-slate-100 pt-1">
                  Key #{pendingKey.taskIndex + 1} Unlocked!
                </h3>
                <p className="text-xs text-slate-400">
                  Tap to unlock Treasure Chest #{pendingKey.taskIndex + 1} or drag the key!
                </p>
              </div>

              {/* Glowing Draggable Premium Golden Key Centerpiece */}
              <div className="py-5 flex items-center justify-center relative z-10">
                <PremiumGoldenKey
                  size="xl"
                  keyData={pendingKey}
                  interactive={true}
                  onClick={() => {
                    setShowKeyModal(false);
                    if (onUnlockKey) onUnlockKey(pendingKey);
                  }}
                />
              </div>

              {/* Big Action Button */}
              <div className="space-y-2 relative z-10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setShowKeyModal(false);
                    if (onUnlockKey) onUnlockKey(pendingKey);
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.6)] transition cursor-pointer border border-yellow-200/50"
                >
                  <span>Open Treasure Box #{pendingKey.taskIndex + 1}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </motion.button>

                <p className="text-[11px] text-amber-300/80 font-semibold">
                  (You can also drag this key to the chest on the right!)
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INLINE GOLDEN KEY IN TASK CARD (DRAGGABLE BACKUP) ── */}
      {pendingKey ? (
        <div className="pt-3 pb-2 flex flex-col items-center justify-center animate-fadeIn">
          <PremiumGoldenKey
            size="md"
            keyData={pendingKey}
            interactive={true}
            showLabel={true}
            onClick={() => onUnlockKey && onUnlockKey(pendingKey)}
          />
          <button
            type="button"
            onClick={() => onUnlockKey && onUnlockKey(pendingKey)}
            className="mt-2 text-xs font-mono font-bold text-amber-600 hover:text-amber-500 underline cursor-pointer"
          >
            Click or drag to open Chest #{pendingKey.taskIndex + 1} →
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-1">

          {/* Submit Answer Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              disabled ||
              cooldown > 0 ||
              isSubmitting ||
              (quiz.type === 'MCQ' ? selectedOption === null : !answer.trim())
            }
            className="w-full py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] active:scale-[0.99] cursor-pointer tracking-wide"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-300/30 border-t-white rounded-full animate-spin" />
                <span>Checking Answer...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Wait {cooldown}s</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Answer</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
