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
  } = useChallenge();

  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [pendingKeyDrop, setPendingKeyDrop] = useState(false);

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

  // redirect to result on ACCEPTED
  useEffect(() => {
    if (finalResult?.status === 'ACCEPTED') navigate('/result');
  }, [finalResult, navigate]);

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
    handleTimeExpired,
    finalResult?.status === 'ACCEPTED'
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
      setPendingKeyDrop(true);
      showToast('🔑 Key earned! Drag it to the Treasure Box to unlock the fragment.', 'success');
    } else if (result?.answerRevealed) {
      showToast(`⚠️ 3 wrong attempts reached! Correct answer revealed: ${result.revealedAnswer}. Fragment unlocked!`, 'info');
    } else if (result?.penalty) {
      const remaining = result.attemptsRemaining ?? Math.max(0, 3 - (taskAttemptsCount + 1));
      showToast(`❌ Wrong answer (-20 pts penalty applied, ${remaining} attempts left). Try again!`, 'error');
    }
    return result;
  }, [submitQuizAnswer, isTimeExpired, taskAttemptsCount, showToast]);

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

      {/* ── 3-COLUMN MAIN LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── COLUMN 1: Challenge Brief + Progress (col-span-3) ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-orange-400" /> CHALLENGE BRIEF
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800/40">
                {challenge.difficulty}
              </span>
            </div>

            <div className="space-y-2 text-xs leading-relaxed">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Problem</label>
              <p className="text-slate-700 whitespace-pre-line bg-slate-100 p-3 rounded-xl border border-slate-200/60">
                {challenge.description}
              </p>
            </div>

            {/* Sample I/O */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sample Test</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500">Input:</span>
                  <pre className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-[11px]">
                    {challenge.sampleInput || 'N/A'}
                  </pre>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Output:</span>
                  <pre className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-emerald-400 text-[11px]">
                    {challenge.sampleOutput || 'N/A'}
                  </pre>
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

        {/* ── COLUMN 2: HUNT or ASSEMBLE (col-span-5) ── */}
        <div className="lg:col-span-5 space-y-4">

          {/* HUNT phase: task-based progression */}
          {phase === 'HUNT' && (
            <>
              {/* Task progress bar */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Task Progress
                  </h3>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    {completedTaskIds.length} / {totalTasks} tasks
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${totalTasks > 0 ? (completedTaskIds.length / totalTasks) * 100 : 0}%` }}
                  />
                </div>
                {/* Task dots */}
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: totalTasks }, (_, i) => {
                    const isDone = i < completedTaskIds.length;
                    const isCurrent = i === currentTaskIndex;
                    return (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                          isDone
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : isCurrent
                            ? 'bg-orange-500/30 text-cyan-300 border border-orange-500/40 animate-pulse'
                            : 'bg-slate-100/60 text-slate-600 border border-slate-300/40'
                        }`}
                      >
                        {isDone ? '✓' : i + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Panel: displays current quiz */}
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
                  pendingKeyDrop={pendingKeyDrop}
                />
              )}

              {/* Waiting state: no current task but not all done */}
              {!currentTask && !allTasksCompleted && (
                <div className="p-4 bg-slate-100 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-mono">
                  Loading next task...
                </div>
              )}

              {/* All tasks completed — transition message */}
              {allTasksCompleted && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-center space-y-2 animate-fadeIn">
                  <span className="text-2xl">🎉</span>
                  <p className="text-sm font-bold text-emerald-300">All Tasks Completed!</p>
                  <p className="text-xs text-slate-600">Moving to Code Assembly phase...</p>
                </div>
              )}
            </>
          )}

          {/* ASSEMBLE phase: assembly board + preview */}
          {(phase === 'ASSEMBLE' || phase === 'DONE') && (
            <>
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fadeIn">
                <span className="text-lg">🎉</span>
                <span>All fragments collected! Arrange them in the correct order, then run and submit.</span>
              </div>

              <AssemblyBoard
                blocks={assemblyFragments}
                onReorder={handleReorder}
                onRemove={() => {}}
                onClear={handleClearAssembly}
              />

              <AssemblyPreview combinedCode={assembledCode} />

              {/* Reset button */}
              <div className="flex gap-2">
                <button
                  onClick={handleClearAssembly}
                  className="flex-1 py-1.5 text-[11px] font-mono text-slate-600 hover:text-slate-700 border border-slate-200 hover:border-slate-400 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Reset Order
                </button>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <FragmentVault
            fragments={collectedFragments.map((f) => ({
              id: f.blockId,
              code: f.code,
              role: f.role,
            }))}
            collectedIds={pendingKeyDrop ? collectedFragmentIds.slice(0, -1) : collectedFragmentIds}
            shuffledOrder={shuffledVaultOrder}
            phase={phase}
            totalExpected={totalFragments}
            pendingKeyDrop={pendingKeyDrop}
            onKeyDropped={() => setPendingKeyDrop(false)}
          />
        </div>
      </div>

      {/* ── BOTTOM: Execution Controls + Output Panel ── */}
      {(phase === 'ASSEMBLE' || phase === 'DONE') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* Execution controls */}
          <div className="lg:col-span-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-orange-400" /> EXECUTION CONTROLS
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Run against sample input to verify, then submit for official hidden test scoring.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-200">
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

              {/* Run count & free run counter indicator */}
              <div className="flex items-center justify-between text-[11px] font-mono px-1 py-1 rounded bg-slate-100/80 border border-slate-200">
                <span>
                  {(points?.runsRemainingFree ?? 3) > 0 ? (
                    <span className="text-emerald-700 font-bold">
                      {(points?.runsRemainingFree ?? 3)}/3 Free Runs Left
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold">
                      Extra run: -10 pts each
                    </span>
                  )}
                </span>
                <span className="text-slate-500 font-bold">
                  Runs: {points?.runCount ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] font-mono text-slate-500">
                  Fragments on board: {assemblyFragments.length}/{totalFragments}
                </span>
                <button
                  onClick={resetAll}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Session
                </button>
              </div>
            </div>
          </div>

          {/* Output panel */}
          <div className="lg:col-span-8">
            <OutputPanel
              compileOutput={compileOutput}
              submissionResult={submissionResult}
              sampleInput={challenge.sampleInput}
              sampleOutput={challenge.sampleOutput}
            />
          </div>
        </div>
      )}

      {/* ── MODALS & TOAST ── */}
      <TimeExpiredModal
        isOpen={isTimeExpired && (!finalResult || finalResult.status !== 'ACCEPTED')}
        onAcknowledge={() => navigate('/result')}
        onRestart={() => startChallenge()}
      />
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
    </div>
  );
}
