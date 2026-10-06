import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useParticipant } from '../context/ParticipantContext';
import { useChallenge } from '../hooks/useChallenge';
import { useTimer } from '../hooks/useTimer';
import { challengeApi } from '../services/challengeApi';

// layout / shared
import Timer from '../components/timer/Timer';
import TimeExpiredModal from '../components/timer/TimeExpiredModal';
import Toast from '../components/common/Toast';
import Button from '../components/common/Button';
import AssemblyBoard from '../components/assembly/AssemblyBoard';
import AssemblyPreview from '../components/assembly/AssemblyPreview';
import RunButton from '../components/execution/RunButton';
import SubmitButton from '../components/execution/SubmitButton';
import OutputPanel from '../components/execution/OutputPanel';

// gameplay components
import PhaseStepper from '../components/gameplay/PhaseStepper';
import LanguagePicker from '../components/gameplay/LanguagePicker';
import FragmentVault from '../components/gameplay/FragmentVault';
import ProgressCard from '../components/gameplay/ProgressCard';
import MissionStepper from '../components/challenge/MissionStepper';

// task renderer
import TaskPanel from '../components/gameplay/TaskPanel';

import {
  User, Blocks, BookOpen, Terminal, RotateCcw, Shuffle, Trash2,
} from 'lucide-react';
import { USE_MOCK_JUDGE } from '../utils/constants';

export default function Challenge() {
  const { participant, logoutAndDeleteParticipant } = useParticipant();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const urlId = searchParams.get('id') || searchParams.get('challengeId');

  const {
    challenge,
    selectChallenge,
    language,
    selectLanguage,
    languageLocked,
    startTime,
    startChallenge,
    phase,

    // server-driven task state
    currentTask,
    allTasksCompleted,
    totalTasks,
    completedTaskIds,
    currentTaskIndex,
    submitQuizAnswer,
    taskCooldownRemaining,
    lastQuizExplain,
    lastQuizCorrect,
    taskSubmitting,

    // fragments
    collectedFragments,
    collectedFragmentIds,
    totalFragments,
    fragmentMap,
    shuffledVaultOrder,

    // assembly
    assemblyOrder,
    assemblyFragments,
    assembledCode,
    reorderAssembly,
    resetAssemblyOrder,

    // scoring
    penaltySeconds,
    quizAttempts,
    submissionAttempts,
    points,
    currentScore,
    taskAttemptsCount,
    revealedAnswerInfo,
    dismissRevealedAnswer,

    // execution
    executeCode,
    submitSolution,
    isCompiling,
    isValidating,
    compileOutput,
    setCompileOutput,

    // result
    finalResult,
    isTimeExpired,
    handleTimeExpired,
    resetAll,
    lockedNotice,

    // key unlock & fragments
    pendingKey,
    unlockKey,
    lastUnlockedBlock,
    startAssemblyPhase,
  } = useChallenge();

  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [userProgress, setUserProgress] = useState([]);

  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage(msg);
    setToastType(type);
  }, []);

  // Fetch user progression for header stepper
  useEffect(() => {
    let cancelled = false;
    async function loadProg() {
      if (!participant) return;
      try {
        const res = await challengeApi.getProgress();
        if (!cancelled && res.success && Array.isArray(res.progress)) {
          setUserProgress(res.progress);
        }
      } catch (_) {}
    }
    loadProg();
    return () => { cancelled = true; };
  }, [participant]);

  // Redirect to /challenges if challenge is locked or completed from server
  useEffect(() => {
    if (lockedNotice) {
      navigate('/challenges', {
        replace: true,
        state: { lockError: lockedNotice },
      });
    }
  }, [lockedNotice, navigate]);

  // Guard against direct URL access to locked or already completed challenges
  useEffect(() => {
    let cancelled = false;
    async function checkDirectAccessLock() {
      const target = urlId || challenge.id || challenge.slug;
      if (!participant || !target) return;
      try {
        const progRes = await challengeApi.getProgress();
        if (cancelled) return;
        if (progRes.success && Array.isArray(progRes.progress)) {
          setUserProgress(progRes.progress);
          const item = progRes.progress.find(
            (p) =>
              String(p.challengeId).toLowerCase() === String(target).toLowerCase() ||
              String(p.slug || '').toLowerCase() === String(target).toLowerCase()
          );
          if (item && item.status === 'COMPLETED') {
            navigate('/challenges', {
              replace: true,
              state: { lockError: 'You have already completed this challenge. Replay is disabled to preserve official scores.' },
            });
            return;
          }
          if (item && item.status === 'LOCKED') {
            navigate('/challenges', {
              replace: true,
              state: { lockError: item.lockedReason || 'This challenge is locked. Complete previous challenges first.' },
            });
            return;
          }
        }
      } catch (err) {
        if (err.response?.status === 403) {
          navigate('/challenges', {
            replace: true,
            state: { lockError: err.response.data?.message || 'Challenge is inaccessible.' },
          });
        }
      }
    }
    checkDirectAccessLock();
    return () => {
      cancelled = true;
    };
  }, [participant, urlId, challenge.id, challenge.slug, navigate]);

  // sync URL id with selected challenge
  useEffect(() => {
    if (urlId && urlId !== challenge.id && urlId !== challenge.slug) {
      selectChallenge(urlId);
    }
  }, [urlId, challenge.id, challenge.slug, selectChallenge]);

  // redirect if not registered
  useEffect(() => {
    if (!participant) navigate('/register', { replace: true });
  }, [participant, navigate]);

  if (!participant) return null;

  const autoSubmittingRef = useRef(false);

  // Auto-submit when countdown expires
  const handleAutoSubmit = useCallback(async () => {
    handleTimeExpired();
    if (autoSubmittingRef.current || finalResult) return;
    autoSubmittingRef.current = true;
    showToast('⌛ Time expired! Auto-submitting your solution...', 'info');

    try {
      const res = await submitSolution(participant, true);
      setSubmissionResult(res);
      navigate('/result');
    } catch (err) {
      console.error('Auto-submit error:', err);
      navigate('/result');
    }
  }, [handleTimeExpired, finalResult, submitSolution, participant, showToast, navigate]);

  // redirect to result on ACCEPTED or auto-submit completion
  useEffect(() => {
    if (finalResult && (finalResult.status === 'ACCEPTED' || finalResult.isAutoSubmit)) {
      navigate('/result');
    }
  }, [finalResult, navigate]);

  // If already expired on mount/restore and not yet submitted, trigger auto-submit
  useEffect(() => {
    if (isTimeExpired && !finalResult && !autoSubmittingRef.current && phase !== 'SETUP' && startTime) {
      handleAutoSubmit();
    }
  }, [isTimeExpired, finalResult, phase, startTime, handleAutoSubmit]);

  // start challenge if no startTime and past SETUP
  useEffect(() => {
    if (participant && !startTime && phase !== 'SETUP') {
      startChallenge().catch((err) => {
        if (err.response?.status === 403) {
          navigate('/challenges', {
            replace: true,
            state: { lockError: err.response.data?.message || 'This challenge is locked.' },
          });
        }
      });
    }
  }, [participant, startTime, phase, startChallenge, navigate]);

  const { secondsRemaining, timerState } = useTimer(
    startTime,
    challenge.duration || 900,
    handleAutoSubmit,
    finalResult?.status === 'ACCEPTED' || isTimeExpired
  );

  // ── Real-time points & penalties calculation (including live elapsed minute penalty) ──
  const elapsedSeconds = Math.max(0, (challenge.duration || 900) - secondsRemaining);
  const liveElapsedMinutes = Math.floor(elapsedSeconds / 60);
  const liveTimePenalty = liveElapsedMinutes * 10;

  const livePoints = useMemo(() => {
    const baseTask = points?.taskPenaltyPoints ?? 0;
    const baseRun = points?.runPenaltyPoints ?? 0;
    const baseTime = Math.max(points?.timePenaltyPoints ?? 0, liveTimePenalty);
    const prevPenalties = points?.previousChallengesPenalty ?? 0;
    const currentChallengePenalty = baseTask + baseRun + baseTime;
    const totalPenalty = prevPenalties + currentChallengePenalty;

    return {
      ...points,
      taskPenaltyPoints: baseTask,
      runPenaltyPoints: baseRun,
      timePenaltyPoints: baseTime,
      timeMinutesExhausted: Math.max(points?.timeMinutesExhausted ?? 0, liveElapsedMinutes),
      totalPenaltyPoints: currentChallengePenalty,
      currentScore: -currentChallengePenalty,
      previousChallengesPenalty: prevPenalties,
      overallTotalPenaltyPoints: totalPenalty,
      overallScore: -totalPenalty,
    };
  }, [points, liveTimePenalty, liveElapsedMinutes]);

  // ── quiz answer handler with 3-attempt reveal & -20 pts penalty ──
  const handleQuizAnswer = useCallback(async (answer) => {
    if (isTimeExpired) return { correct: false, explain: '' };
    const result = await submitQuizAnswer(answer);
    if (result?.correct) {
      showToast('🔑 Key earned! Drag it to the Treasure Box to reveal the code.', 'success');
    } else if (result?.answerRevealed) {
      showToast(`⚠️ 3 wrong attempts reached! Correct answer revealed: ${result.revealedAnswer}. Drag the key to unlock!`, 'info');
    } else if (result?.penalty) {
      const remaining = result.attemptsRemaining ?? Math.max(0, 3 - (taskAttemptsCount + 1));
      showToast(`❌ Wrong answer (-20 pts penalty applied, ${remaining} attempts left). Try again!`, 'error');
    }
    return result;
  }, [submitQuizAnswer, isTimeExpired, taskAttemptsCount, showToast]);

  const [openingChestKey, setOpeningChestKey] = useState(null);

  const handleOpenChest = useCallback((keyData) => {
    setOpeningChestKey(keyData);
  }, []);

  const handleKeyUnlocked = useCallback((keyData) => {
    setOpeningChestKey(null);
    unlockKey(keyData);
    showToast('✨ Fragment Unlocked! Code revealed in the Treasure Box.', 'success');
  }, [unlockKey, showToast]);

  // ── Fragment reordering with stale error clearing ──
  const handleReorder = useCallback((sourceIdx, destIdx) => {
    setSubmissionResult(null);
    if (setCompileOutput) setCompileOutput(null);
    reorderAssembly(sourceIdx, destIdx);
  }, [reorderAssembly, setCompileOutput]);

  const handleClearAssembly = useCallback(() => {
    setSubmissionResult(null);
    if (setCompileOutput) setCompileOutput(null);
    resetAssemblyOrder();
  }, [resetAssemblyOrder, setCompileOutput]);

  // ── run code with 3 free runs, -10 pts after 3 ──
  const handleRunCode = useCallback(async () => {
    if (isTimeExpired) { showToast('Time expired. Execution locked.', 'error'); return; }
    if (!assembledCode.trim()) { showToast('No code assembled yet. Arrange fragments first.', 'warning'); return; }

    // Clear previous submission results so old submission errors don't linger
    setSubmissionResult(null);

    const res = await executeCode();
    const isAccepted =
      res.status === 'ACCEPTED' ||
      res.status === 'Accepted' ||
      res.status === 'success' ||
      (Boolean(res.success) && !res.stderr?.trim() && !res.compileOutput?.trim());

    if (isAccepted) {
      if (res.runPenaltyApplied > 0) {
        showToast(`⚠️ Compilation successful! Extra run #${res.runCount} (-10 pts penalty applied).`, 'warning');
      } else {
        showToast(`✅ Compilation successful! (${res.runsRemainingFree ?? 3} free runs remaining).`, 'success');
      }
    } else {
      if (res.runPenaltyApplied > 0) {
        showToast(`⚠️ Execution returned error. Run #${res.runCount} (-10 pts applied). Check output.`, 'warning');
      } else {
        showToast(res.stderr || res.message || 'Execution returned an error. Check output panel.', 'error');
      }
    }
  }, [isTimeExpired, assembledCode, executeCode, showToast]);

  // ── submit ──
  const handleSubmit = useCallback(async () => {
    if (isTimeExpired) { showToast('Time expired. Submissions closed.', 'error'); return; }
    if (!assembledCode.trim()) { showToast('Cannot submit empty assembly.', 'warning'); return; }

    if (setCompileOutput) setCompileOutput(null);

    const res = await submitSolution(participant);
    setSubmissionResult(res);
    if (res?.status === 'ACCEPTED') {
      showToast('🎉 ACCEPTED! All hidden test cases passed.', 'success');
    } else {
      showToast('❌ Wrong answer. Some test cases failed. Check output panel.', 'error');
    }
  }, [isTimeExpired, assembledCode, submitSolution, participant, showToast, setCompileOutput]);

  // ─── SETUP phase UI ─────────────────────────────────────────────────────
  if (phase === 'SETUP') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6 font-mono text-slate-700">
        <MissionStepper progress={userProgress} compact />
        <div className="flex items-center justify-between">
          <Link
            to="/challenges"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-orange-400 font-mono transition"
          >
            ← Back to Roadmap
          </Link>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-500/20 text-cyan-300 font-bold uppercase tracking-wider border border-orange-500/30">
            {challenge.difficulty} // {challenge.points} PTS
          </span>
        </div>

        <div className="text-center space-y-2">
          <span className="text-[10px] px-3 py-1 rounded-full bg-orange-500/20 text-cyan-300 font-bold uppercase tracking-wider border border-orange-500/30">
            MIND CRAFT ARENA
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mt-3">{challenge.title}</h1>
          <p className="text-xs text-slate-600">{challenge.description}</p>
        </div>

        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
          <LanguagePicker
            language={language}
            onSelect={selectLanguage}
            locked={languageLocked}
          />

          <Button
            variant="primary"
            size="lg"
            className="w-full font-black"
            onClick={async () => {
              try {
                await startChallenge();
                showToast('⏱ Timer started! Good luck.', 'info');
              } catch (err) {
                if (err.response?.status === 403) {
                  navigate('/challenges', {
                    replace: true,
                    state: { lockError: err.response.data?.message || 'This challenge is locked.' },
                  });
                }
              }
            }}
          >
            ▶ START HUNT
          </Button>

          <p className="text-[11px] text-slate-500 text-center">
            You can change language until the first task is answered.
          </p>
        </div>

        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      </div>
    );
  }

  // ─── HUNT + ASSEMBLE + DONE layout ───────────────────────────────────────
  return (
    <div className="max-w-[1700px] mx-auto px-4 py-5 space-y-4 font-mono text-slate-700">

      {/* ── ARENA HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50/80 border border-slate-200 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            to="/challenges"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-orange-500 text-xs font-mono transition flex items-center gap-1.5 shrink-0"
            title="Back to Mission Roadmap"
          >
            <span>←</span>
            <span className="hidden sm:inline">Roadmap</span>
          </Link>

          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
            <Blocks className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-cyan-300 font-bold uppercase tracking-wider">
                MIND CRAFT ARENA
              </span>
              <h2 className="text-base font-bold text-slate-800 tracking-wide">{challenge.title}</h2>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Category: <span className="text-orange-400">{challenge.category}</span>
              {' '}// Reward: <span className="text-emerald-400">{challenge.points} PTS</span>
              {' '}// Engine: <span className="text-emerald-400">Judge0</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden xl:block min-w-[280px]">
            <MissionStepper progress={userProgress} compact />
          </div>

          <LanguagePicker
            language={language}
            onSelect={selectLanguage}
            locked={languageLocked || phase !== 'SETUP' || Boolean(startTime)}
          />

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <User className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-600">Contestant:</span>
            <span className="text-slate-800 font-bold">{participant?.name || 'Registered Participant'} {participant?.participantId ? `(${participant.participantId})` : ''}</span>
          </div>

          {participant && (
            <button
              onClick={async () => {
                if (window.confirm(`Delete participant "${participant.name}" (${participant.participantId}) and reset all challenge progress to test again fresh?`)) {
                  if (logoutAndDeleteParticipant) {
                    await logoutAndDeleteParticipant();
                  }
                  navigate('/register');
                }
              }}
              title="Delete participant details and reset for testing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Delete Details & Exit</span>
              <span className="sm:hidden">Reset</span>
            </button>
          )}

          <Timer secondsRemaining={secondsRemaining} timerState={timerState} />

        </div>
      </div>

      {/* ── PHASE STEPPER ── */}
      <PhaseStepper
        phase={phase}
        collectedCount={collectedFragmentIds.length}
        totalCount={totalFragments}
      />

      {/* ── PHASE 1: HUNT PHASE (Task Hunt + Treasure Vault) ── */}
      {phase === 'HUNT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* COLUMN 1: Challenge Brief + Live Score (col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-5 bg-white/95 border border-slate-200/90 rounded-2xl space-y-4 shadow-md font-sans">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <span className="text-base">💡</span>
                  <span>Challenge Brief</span>
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-500 text-white font-mono shadow-xs">
                  {challenge.difficulty || 'EASY'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                  Problem
                </label>
                <p className="text-slate-800 whitespace-pre-line bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80 text-xs font-mono leading-relaxed">
                  {challenge.description}
                </p>
              </div>

              {/* Sample I/O */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                  Sample Test
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Input:</span>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-[11px] font-mono min-h-[38px] flex items-center">
                      {challenge.sampleInput || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Output:</span>
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-300 rounded-xl text-emerald-700 font-bold text-[11px] font-mono min-h-[38px] flex items-center">
                      {challenge.sampleOutput || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <ProgressCard
              collectedCount={collectedFragmentIds.length}
              totalCount={totalFragments}
              penaltySeconds={penaltySeconds}
              quizAttempts={quizAttempts}
              phase={phase}
              points={livePoints}
            />
          </div>

          {/* COLUMN 2: Task Progression & Task Panel (col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Task progress bar & circular step badges */}
            <div className="p-4 bg-white/95 border border-slate-200/90 rounded-2xl space-y-3 shadow-md font-sans">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <span className="text-base">🎯</span>
                  <span>Task Progress</span>
                </h3>
                <span className="text-xs font-bold text-cyan-600 font-mono">
                  {completedTaskIds.length} / {totalTasks} tasks
                </span>
              </div>

              {/* Circular step badges: 1, 2, 3, 4 */}
              <div className="flex items-center gap-3 pt-0.5">
                {Array.from({ length: totalTasks || 4 }, (_, i) => {
                  const isDone = i < completedTaskIds.length;
                  const isCurrent = i === currentTaskIndex && !isDone;
                  return (
                    <div
                      key={i}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : isCurrent
                          ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isDone ? '✓' : i + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task Panel: displays current quiz & key unlocking container */}
            {currentTask && !allTasksCompleted && (
              <TaskPanel
                task={currentTask}
                onSubmit={handleQuizAnswer}
                cooldown={taskCooldownRemaining}
                taskIndex={currentTaskIndex}
                totalTasks={totalTasks}
                disabled={isTimeExpired}
                lastResult={lastQuizCorrect}
                lastExplain={lastQuizExplain}
                isSubmitting={taskSubmitting}
                attemptsCount={taskAttemptsCount}
                maxAttempts={3}
                revealedAnswerInfo={revealedAnswerInfo}
                onDismissReveal={dismissRevealedAnswer}
                pendingKey={pendingKey}
                onUnlockKey={handleOpenChest}
              />
            )}

            {/* Waiting state: no current task but not all done */}
            {!currentTask && !allTasksCompleted && (
              <div className="p-6 bg-white/90 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-mono shadow-sm">
                Loading next task...
              </div>
            )}

            {/* All tasks completed — transition message */}
            {allTasksCompleted && (
              <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2 animate-fadeIn shadow-sm">
                <span className="text-3xl">🎉</span>
                <p className="text-sm font-bold text-emerald-800">All Tasks Completed!</p>
                <p className="text-xs text-slate-600">All code fragments unlocked in the Treasure Box.</p>
                <button
                  onClick={startAssemblyPhase}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Proceed to Assembly Board →
                </button>
              </div>
            )}
          </div>

          {/* COLUMN 3: Fragment Vault (col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <FragmentVault
              fragments={collectedFragments.map((f) => ({
                id: f.blockId || f._id,
                code: f.code,
                role: f.role || f.type || 'LOGIC',
              }))}
              collectedIds={collectedFragmentIds}
              shuffledOrder={shuffledVaultOrder}
              phase={phase}
              totalExpected={totalTasks || totalFragments || 4}
              pendingKey={pendingKey}
              openingKeyTrigger={openingChestKey}
              onUnlockKey={handleKeyUnlocked}
              lastUnlockedBlock={lastUnlockedBlock}
              onProceedToAssembly={startAssemblyPhase}
            />
          </div>
        </div>
      )}

      {/* ── PHASE 2: ASSEMBLE / DONE PHASE (TREASURE VAULT HIDDEN! 2 VISIBLE SIDES: ASSEMBLY ON LEFT, COMPILER & OUTPUT ON RIGHT) ── */}
      {(phase === 'ASSEMBLE' || phase === 'DONE') && (
        <div className="space-y-4 animate-fadeIn">
          {/* Phase Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-mono text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎉</span>
              <span>All fragments collected! Arrange them in the correct sequence on the left, then run and submit on the right.</span>
            </div>
            <button
              onClick={handleClearAssembly}
              className="px-3 py-1.5 text-[11px] font-mono text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
            >
              <Shuffle className="w-3.5 h-3.5 text-orange-500" /> Reset Order
            </button>
          </div>

          {/* 1. Problem Objective Summary Card (Full-width Top Overview) */}
          <div className="p-4 bg-white/95 border border-slate-200/90 rounded-2xl shadow-sm space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                <span>Problem Objective</span>
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-500 text-white font-mono shadow-xs">
                {challenge.difficulty || 'EASY'}
              </span>
            </div>
            <p className="text-slate-700 text-xs font-mono leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              {challenge.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1 font-bold">Input:</span>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px] font-mono">
                  {challenge.sampleInput || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1 font-bold">Expected Output:</span>
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-300 rounded-lg text-emerald-700 font-bold text-[11px] font-mono">
                  {challenge.sampleOutput || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* 2. UNIFIED CODE ASSEMBLY & LIVE PREVIEW WORKSPACE (IN THE SAME SECTION, PERFECTLY FITTED SIDE-BY-SIDE) */}
          <div className="p-4 sm:p-5 bg-white/95 border-2 border-slate-200/90 rounded-2xl shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Blocks className="w-4 h-4 text-orange-500" />
                  <span>Assemble Code Sequence &amp; Live Preview</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Arrange fragments on the left • Live assembled program synthesizes in real-time on the right
                </p>
              </div>
              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {assemblyFragments.length} / {totalFragments} fragments
                </span>
                <button
                  onClick={handleClearAssembly}
                  className="px-3 py-1 text-xs font-mono font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
                  title="Reset to default shuffled order"
                >
                  <Shuffle className="w-3.5 h-3.5 text-orange-500" />
                  <span>Reset Order</span>
                </button>
              </div>
            </div>

            {/* SIDE-BY-SIDE IN THE SAME SECTION (EQUAL ALIGNMENT, ZERO AWKWARD SCROLLBAR TRAPPING) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Column (col-span-6): Assemble Code Sequence */}
              <div className="lg:col-span-6 flex flex-col">
                <AssemblyBoard
                  blocks={assemblyFragments}
                  onReorder={handleReorder}
                  onRemove={() => {}}
                  onClear={handleClearAssembly}
                />
              </div>

              {/* Right Column (col-span-6): Assembled Source Preview */}
              <div className="lg:col-span-6 flex flex-col">
                <AssemblyPreview
                  combinedCode={assembledCode}
                  language={language}
                />
              </div>
            </div>
          </div>

          {/* 3. COMPILER CONTROLS, PROGRESS & OUTPUT PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (col-span-5): Controls + Progress */}
            <div className="lg:col-span-5 space-y-4">
              {/* Execution Controls: Run Code & Submit Buttons */}
              <div className="p-4 bg-white/95 border border-slate-200/90 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Terminal className="w-4 h-4 text-orange-500" />
                    <span>Compiler Controls</span>
                  </h4>
                  <button
                    onClick={resetAll}
                    className="text-rose-500 hover:text-rose-700 flex items-center gap-1 text-[11px] font-mono transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Session
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <RunButton
                    onClick={handleRunCode}
                    isLoading={isCompiling}
                    disabled={isTimeExpired || !assembledCode.trim()}
                  />
                  <SubmitButton
                    onClick={handleSubmit}
                    isLoading={isValidating}
                    disabled={isTimeExpired || !assembledCode.trim()}
                  />
                </div>

                {/* Free Runs & Penalties indicator */}
                <div className="flex items-center justify-between text-[11px] font-mono px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span>
                    {(points?.runsRemainingFree ?? 3) > 0 ? (
                      <span className="text-emerald-700 font-bold">
                        ✓ {(points?.runsRemainingFree ?? 3)}/3 Free Runs Left
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold">
                        ⚠️ Extra run: -10 pts each
                      </span>
                    )}
                  </span>
                  <span className="text-slate-600 font-bold">
                    Runs Used: {points?.runCount ?? 0}
                  </span>
                </div>
              </div>

              {/* Live Score Summary */}
              <ProgressCard
                collectedCount={collectedFragmentIds.length}
                totalCount={totalFragments}
                penaltySeconds={penaltySeconds}
                quizAttempts={quizAttempts}
                phase={phase}
                points={livePoints}
              />
            </div>

            {/* Right Column (col-span-7): Live Output Panel */}
            <div className="lg:col-span-7">
              <OutputPanel
                compileOutput={compileOutput}
                submissionResult={submissionResult}
                sampleInput={challenge.sampleInput}
                sampleOutput={challenge.sampleOutput}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS & TOAST ── */}
      <TimeExpiredModal
        isOpen={isTimeExpired && !finalResult}
        onAcknowledge={() => navigate('/result')}
      />
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
    </div>
  );
}
