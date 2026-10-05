import React, { useState, useCallback, useEffect } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Clock, Send, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * TaskPanel – renders the current server-sent task quiz.
 * Supports types: MCQ, SHORT_ANSWER, OUTPUT_PREDICTION, FILL_BLANK, CODE_ORDER
 *
 * Props:
 *   task          – { taskId, title, description, order, quiz: { quizId, type, prompt, options, concept } }
 *   onSubmit      – async (answer) => { correct, explain, penalty?, cooldown? }
 *   cooldown      – number (seconds remaining)
 *   taskIndex     – current task index (0-based)
 *   totalTasks    – total number of tasks
 *   disabled      – if true, input is locked
 *   lastResult    – true | false | null (last answer correctness)
 *   lastExplain   – string (explanation from last answer)
 *   isSubmitting   – bool
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
  pendingKeyDrop = false,
}) {
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [localFeedback, setLocalFeedback] = useState(null);

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

  // Reset answer when task/quiz changes
  useEffect(() => {
    setAnswer('');
    setSelectedOption(null);
    setLocalFeedback(null);
  }, [task?.taskId, quiz?.quizId]);

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
    if (disabled || cooldown > 0 || isSubmitting) return;

    let submittedAnswer;
    if (quiz?.type === 'MCQ') {
      if (selectedOption === null) return;
      submittedAnswer = selectedOption;
    } else {
      if (!answer.trim()) return;
      submittedAnswer = answer.trim();
    }

    const result = await onSubmit(submittedAnswer);
    if (result?.correct) {
      // Clear input on correct
      setAnswer('');
      setSelectedOption(null);
    }
  }, [quiz, selectedOption, answer, onSubmit, disabled, cooldown, isSubmitting]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  if (!task || !quiz) {
    return (
      <div className="p-6 bg-white/80 border border-slate-200 rounded-2xl text-center text-slate-500 text-xs font-mono">
        No task available
      </div>
    );
  }

  const typeLabel = {
    MCQ: 'Multiple Choice',
    SHORT_ANSWER: 'Short Answer',
    OUTPUT_PREDICTION: 'Predict Output',
    FILL_BLANK: 'Fill in the Blank',
    CODE_ORDER: 'Code Order',
  }[quiz.type] || quiz.type;

  return (
    <div className="p-5 bg-white/90 border border-slate-200 rounded-2xl space-y-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-orange-500/40 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{task.title || `Task ${taskIndex + 1}`}</h3>
            <span className="text-[10px] text-slate-500 font-mono uppercase">{typeLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
            attemptsCount >= 2
              ? 'bg-rose-100 text-rose-700 border border-rose-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            Attempt {Math.min(attemptsCount + 1, maxAttempts)}/{maxAttempts} (-20 pts)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-700 font-bold font-mono">
            {taskIndex + 1} / {totalTasks}
          </span>
        </div>
      </div>

      {/* 3 Wrong Attempts Answer Revealed Banner */}
      {revealedAnswerInfo?.revealed && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-xs font-mono space-y-2.5 animate-fadeIn shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                {revealedAnswerInfo.forTaskTitle
                  ? `${revealedAnswerInfo.forTaskTitle} — Answer Revealed`
                  : 'Previous Task: 3 Attempts Exhausted — Answer Revealed!'}
              </span>
            </div>
            {onDismissReveal && (
              <button
                type="button"
                onClick={onDismissReveal}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-amber-200/90 hover:bg-amber-300 text-amber-900 font-bold transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                title="Dismiss answer banner"
              >
                <span>Dismiss</span>
                <span>✕</span>
              </button>
            )}
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-amber-300">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">
              {revealedAnswerInfo.forTaskTitle ? `${revealedAnswerInfo.forTaskTitle} Correct Answer:` : 'Correct Answer:'}
            </span>
            <span className="text-sm font-bold text-amber-900">{revealedAnswerInfo.answer}</span>
          </div>
          {revealedAnswerInfo.explain && (
            <p className="text-slate-600 text-[11px] leading-relaxed">{revealedAnswerInfo.explain}</p>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
            <p className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Code fragment unlocked! Answer the current task below.
            </p>
            {onDismissReveal && (
              <button
                type="button"
                onClick={onDismissReveal}
                className="text-[11px] text-amber-800 underline hover:text-amber-950 font-bold cursor-pointer"
              >
                Continue to {task.title || `Task ${taskIndex + 1}`} →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz prompt */}
      <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-200/60">
        {quiz.prompt}
      </div>

      {/* Concept tag */}
      {quiz.concept && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">
            {quiz.concept}
          </span>
        </div>
      )}

      {/* Answer input area */}
      <div className="space-y-2">
        {quiz.type === 'MCQ' && quiz.options?.length > 0 && (
          <div className="space-y-2">
            {quiz.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const wasCorrectOption = localFeedback?.correct === true && isSelected;
              const wasWrongOption = localFeedback?.correct === false && isSelected;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (!disabled && cooldown <= 0 && !isSubmitting) {
                      setSelectedOption(idx);
                      setLocalFeedback(null);
                      if (onDismissReveal) onDismissReveal();
                    }
                  }}
                  disabled={disabled || cooldown > 0 || isSubmitting}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all duration-200 flex items-center gap-3 ${
                    wasCorrectOption
                      ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200'
                      : wasWrongOption
                      ? 'border-rose-500/60 bg-rose-950/30 text-rose-200'
                      : isSelected
                      ? 'border-orange-500/60 bg-cyan-950/30 text-cyan-200'
                      : 'border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-400 hover:bg-white/60'
                  } ${disabled || cooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isSelected
                        ? 'bg-orange-500/30 text-cyan-300 border border-orange-500/50'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
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
              disabled={disabled || cooldown > 0 || isSubmitting}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 disabled:opacity-50"
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
            disabled={disabled || cooldown > 0 || isSubmitting}
            rows={3}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 disabled:opacity-50 resize-none"
          />
        )}
      </div>

      {/* Feedback */}
      {(localFeedback || pendingKeyDrop) && (
        <div
          className={`p-3 rounded-xl text-xs font-mono flex items-start gap-2 animate-fadeIn ${
            pendingKeyDrop || localFeedback?.correct
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          {pendingKeyDrop ? (
            <motion.div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('key', 'true');
              }}
              animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl cursor-grab active:cursor-grabbing drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]"
              title="Drag me to the Treasure Box!"
            >
              🔑
            </motion.div>
          ) : localFeedback?.correct ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="font-bold">
              {pendingKeyDrop
                ? '✅ Correct! Drag the glowing key to the Treasure Box on the right.'
                : localFeedback?.correct
                ? '✅ Correct! Code block unlocked.'
                : `❌ Wrong Answer (-20 pts). Attempt ${localFeedback?.attemptsCount || 1} of 3.`}
            </span>
            {localFeedback?.explain && !pendingKeyDrop && (
              <p className="text-slate-600 leading-relaxed">{localFeedback.explain}</p>
            )}
          </div>
        </div>
      )}

      {/* Cooldown indicator */}
      {cooldown > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>Cooldown: {cooldown}s — next question loading...</span>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={
          disabled ||
          cooldown > 0 ||
          isSubmitting ||
          (quiz.type === 'MCQ' ? selectedOption === null : !answer.trim())
        }
        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 bg-gradient-to-r from-cyan-600 to-orange-500 text-slate-900 hover:from-orange-500 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-orange-500 active:scale-[0.98]"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Validating...
          </>
        ) : cooldown > 0 ? (
          <>
            <Clock className="w-4 h-4" />
            Wait {cooldown}s
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Answer
          </>
        )}
      </button>
    </div>
  );
}
