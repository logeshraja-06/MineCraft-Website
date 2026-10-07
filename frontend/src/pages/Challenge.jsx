import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useParticipant } from '../context/ParticipantContext';
import { useChallenge } from '../hooks/useChallenge';
import { useTimer } from '../hooks/useTimer';
import { challengeApi } from '../services/challengeApi';

// layout / shared
import Timer from '../components/timer/Timer';
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

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

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
  const liveTimePenalty = isTimeExpired ? 150 : (liveElapsedMinutes * 10);

  const livePoints = useMemo(() => {
    const baseTask = points?.taskPenaltyPoints ?? 0;
    const baseRun = points?.runPenaltyPoints ?? 0;
    const baseTime = Math.max(points?.timePenaltyPoints ?? 0, liveTimePenalty);
    const prevPenalties = points?.previousChallengesPenalty ?? 0;
    const wrongSubPenalty = points?.wrongSubmissionPenalty ?? 0;
    const currentChallengePenalty = (points?.totalPenaltyPoints !== undefined && points.totalPenaltyPoints > (baseTask + baseRun + baseTime))
      ? points.totalPenaltyPoints
      : (baseTask + baseRun + baseTime + wrongSubPenalty);
    const totalPenalty = prevPenalties + currentChallengePenalty;

    return {
      ...points,
      taskPenaltyPoints: baseTask,
      runPenaltyPoints: baseRun,
      timePenaltyPoints: baseTime,
      wrongSubmissionPenalty: wrongSubPenalty,
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
      <div className="min-h-screen bg-[#07080D] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
        {/* Top Scroll Progress Bar */}
        <motion.div
          style={{ scaleX }}
          className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-fuchsia-400 to-amber-400 origin-left z-[100] shadow-[0_0_12px_rgba(168,85,247,0.8)]"
        />

        {/* Ambient atmospheric backdrop matching Home & Rules */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src="/portal-hero.jpg"
            alt="Arena Portal Ambience"
            className="w-full h-full object-cover filter brightness-[0.5] contrast-[1.1] opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/70 to-[#07080D]" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#07080D]/50 to-[#07080D]" />
        </div>

        {/* Ambient atmospheric radial glow flares */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-xl mx-auto w-full space-y-6 relative z-10">
          <div className="bg-[#0D0F18]/80 border border-purple-500/25 rounded-2xl p-2 shadow-xl backdrop-blur-xl">
            <MissionStepper progress={userProgress} compact />
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/challenges"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-xs text-purple-200 hover:text-white font-mono transition shadow-sm"
            >
              ← Back to Roadmap
            </Link>
            <span className="text-[10px] px-3.5 py-1.5 rounded-full bg-purple-950/80 text-purple-200 font-bold uppercase tracking-wider border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)] font-mono">
              {challenge.difficulty} // {challenge.points} PTS
            </span>
          </div>

          <div className="text-center space-y-3">
            <span className="text-[10px] px-3.5 py-1 rounded-full bg-emerald-950/70 text-emerald-300 font-bold uppercase tracking-wider border border-emerald-500/40 font-mono inline-block shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              MIND CRAFT ARENA
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-sans drop-shadow-[0_0_35px_rgba(255,255,255,0.12)]">
              {challenge.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-lg mx-auto">
              {challenge.description}
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-[#0D0F18]/90 border border-purple-500/30 rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.2)] backdrop-blur-2xl space-y-6 relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/80 to-transparent" />

            <LanguagePicker
              language={language}
              onSelect={selectLanguage}
              locked={languageLocked}
            />

            <button
              type="button"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_45px_rgba(168,85,247,0.7)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer font-sans"
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
              <span>▶ START HUNT</span>
            </button>

            <p className="text-xs text-purple-300/70 text-center font-sans tracking-wide">
              You can change language until the first task is answered.
            </p>
          </div>

          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      </div>
    );
  }

  // ─── HUNT + ASSEMBLE + DONE layout ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07080D] font-sans text-slate-200 selection:bg-purple-600 selection:text-white relative overflow-hidden">
      {/* ── TOP SCROLL PROGRESS BAR (MATCHING HOME & RULES) ── */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-fuchsia-400 to-amber-400 origin-left z-[100] shadow-[0_0_12px_rgba(168,85,247,0.8)]"
      />

      {/* ── AMBIENT BACKGROUND GLOWS ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-2/3 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto px-4 sm:px-6 py-5 space-y-4">

      {/* ── ARENA HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0D0F18]/90 border border-purple-500/30 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.12)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            to="/challenges"
            className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-mono transition flex items-center gap-1.5 shrink-0 shadow-sm"
            title="Back to Mission Roadmap"
          >
            <span>←</span>
            <span className="hidden sm:inline">Roadmap</span>
          </Link>

          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)] shrink-0">
            <Blocks className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase tracking-wider">
                MIND CRAFT ARENA
              </span>
              <h2 className="text-base font-bold text-white tracking-wide">{challenge.title}</h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Category: <span className="text-purple-300 font-semibold">{challenge.category}</span>
              {' '}// Reward: <span className="text-emerald-400 font-semibold">{challenge.points} PTS</span>
              {' '}// Engine: <span className="text-purple-300 font-semibold">Judge0</span>
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

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs">
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Contestant:</span>
            <span className="text-purple-200 font-bold">{participant?.name || 'Registered Participant'} {participant?.participantId ? `(${participant.participantId})` : ''}</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
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

      {/* ── PHASE 1: HUNT PHASE (2-COLUMN LAYOUT WITH DESCRIPTION ON TOP) ── */}
      {phase === 'HUNT' && (
        <div className="space-y-5 animate-fadeIn">
          {/* 1. TOP FULL-WIDTH SECTION: CHALLENGE DESCRIPTION & OBJECTIVE */}
          <div className="p-5 sm:p-6 bg-[#0D0F18]/90 border border-purple-500/25 rounded-2xl shadow-xl backdrop-blur-xl font-sans space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)] shrink-0">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                      {challenge.category || 'Algorithms'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                      +{challenge.points || 100} PTS REWARD
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
                    {challenge.title}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase border shadow-sm ${
                  challenge.difficulty === 'Easy'
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                    : challenge.difficulty === 'Hard'
                    ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                    : 'bg-purple-950/70 text-purple-200 border-purple-500/40'
                }`}>
                  {challenge.difficulty || 'MEDIUM'}
                </span>
              </div>
            </div>

            {/* Problem Description & Sample Test Case side-by-side inside top brief */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-between space-y-1.5">
                <label className="text-[10px] text-purple-300/70 font-bold uppercase tracking-wider block font-mono">
                  Problem Description
                </label>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-sans whitespace-pre-line bg-[#07080D]/90 p-4 rounded-xl border border-purple-500/20 flex-1">
                  {challenge.description}
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between space-y-1.5">
                <span className="text-[10px] text-purple-300/70 font-bold uppercase tracking-wider block font-mono">
                  Sample Test Case
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 flex-1">
                  <div className="p-3 bg-[#07080D]/90 border border-purple-500/20 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 block font-mono font-semibold">Standard Input:</span>
                    <div className="text-slate-200 text-xs font-mono font-medium overflow-x-auto whitespace-pre-wrap">
                      {challenge.sampleInput || 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1">
                    <span className="text-[10px] text-emerald-400/80 block font-mono font-semibold">Expected Output:</span>
                    <div className="text-emerald-300 text-xs font-mono font-bold overflow-x-auto whitespace-pre-wrap">
                      {challenge.sampleOutput || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 2-COLUMN MAIN WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ── LEFT COLUMN (lg:col-span-7): Task Progression & Interactive Quiz ── */}
            <div className="lg:col-span-7 space-y-5">
              {/* Task progress bar & circular step badges */}
              <div className="p-4 sm:p-5 bg-[#0D0F18]/90 border border-purple-500/25 rounded-2xl space-y-3.5 shadow-xl backdrop-blur-xl font-sans">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <span className="text-base">🎯</span>
                    <span>Task Progress</span>
                  </h3>
                  <span className="text-xs font-bold text-purple-300 font-mono">
                    {completedTaskIds.length} / {totalTasks} tasks completed
                  </span>
                </div>

                {/* Circular step badges */}
                <div className="flex items-center gap-3 pt-0.5 overflow-x-auto pb-1 scrollbar-none">
                  {Array.from({ length: totalTasks || 4 }, (_, i) => {
                    const isDone = i < completedTaskIds.length;
                    const isCurrent = i === currentTaskIndex && !isDone;
                    return (
                      <div
                        key={i}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 shrink-0 ${
                          isDone
                            ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                            : isCurrent
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-2 ring-purple-400'
                            : 'bg-purple-950/40 text-purple-400/50 border border-purple-500/20'
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
                <div className="p-6 bg-[#0D0F18]/80 border border-dashed border-purple-500/30 rounded-2xl text-center text-xs text-purple-300/70 font-mono shadow-sm">
                  Loading next task...
                </div>
              )}

              {/* All tasks completed — transition message */}
              {allTasksCompleted && (
                <div className="p-6 bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-400/50 rounded-2xl text-center space-y-3 animate-fadeIn shadow-[0_0_30px_rgba(168,85,247,0.25)] font-sans">
                  <span className="text-3xl">🎉</span>
                  <p className="text-base font-bold text-purple-100">All Tasks Completed!</p>
                  <p className="text-xs text-purple-300/80">All code fragments are unlocked in your Treasure Vault on the right.</p>
                  <button
                    onClick={startAssemblyPhase}
                    className="mt-2 px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] transition cursor-pointer font-mono"
                  >
                    Proceed to Assembly Board →
                  </button>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN (lg:col-span-5): Fragment Vault & Points/Penalties HUD ── */}
            <div className="lg:col-span-5 space-y-5">
              {/* Fragment Vault */}
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

              {/* Points & Penalties HUD Card */}
              <ProgressCard
                collectedCount={collectedFragmentIds.length}
                totalCount={totalFragments}
                penaltySeconds={penaltySeconds}
                quizAttempts={quizAttempts}
                phase={phase}
                points={livePoints}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE 2: ASSEMBLE / DONE PHASE ── */}
      {(phase === 'ASSEMBLE' || phase === 'DONE') && (
        <div className="space-y-4 animate-fadeIn">
          {/* Phase Banner */}
          <div className="p-3.5 bg-purple-950/60 border border-purple-500/30 rounded-2xl text-xs font-mono text-purple-200 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎉</span>
              <span>All fragments collected! Arrange them in the correct sequence on the left, then run and submit on the right.</span>
            </div>
            <button
              onClick={handleClearAssembly}
              className="px-3 py-1.5 text-[11px] font-mono text-purple-200 bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
            >
              <Shuffle className="w-3.5 h-3.5 text-purple-400" /> Reset Order
            </button>
          </div>

          {/* 1. Problem Objective Summary Card */}
          <div className="p-4 bg-[#0D0F18]/90 border border-purple-500/25 rounded-2xl shadow-xl backdrop-blur-xl space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Problem Objective</span>
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-purple-900/80 text-purple-200 border border-purple-500/40 font-mono shadow-xs">
                {challenge.difficulty || 'EASY'}
              </span>
            </div>
            <p className="text-slate-200 text-xs font-mono leading-relaxed bg-[#07080D]/90 p-3 rounded-xl border border-purple-500/20">
              {challenge.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-purple-300/70 block mb-1 font-bold">Input:</span>
                <div className="p-2.5 bg-[#07080D]/90 border border-purple-500/20 rounded-lg text-slate-200 text-[11px] font-mono whitespace-pre-wrap">
                  {challenge.sampleInput || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-purple-300/70 block mb-1 font-bold">Expected Output:</span>
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-300 font-bold text-[11px] font-mono whitespace-pre-wrap">
                  {challenge.sampleOutput || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* 2. UNIFIED CODE ASSEMBLY & LIVE PREVIEW WORKSPACE */}
          <div className="p-4 sm:p-5 bg-[#0D0F18]/90 border border-purple-500/30 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.1)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Blocks className="w-4 h-4 text-purple-400" />
                  <span>Assemble Code Sequence &amp; Live Preview</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Arrange fragments on the left • Live assembled program synthesizes in real-time on the right
                </p>
              </div>
              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <span className="text-xs font-mono font-bold text-purple-200 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/30">
                  {assemblyFragments.length} / {totalFragments} fragments
                </span>
                <button
                  onClick={handleClearAssembly}
                  className="px-3 py-1 text-xs font-mono font-bold text-purple-200 bg-purple-900/50 hover:bg-purple-800/70 border border-purple-500/30 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0"
                  title="Reset to default shuffled order"
                >
                  <Shuffle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Reset Order</span>
                </button>
              </div>
            </div>

            {/* SIDE-BY-SIDE IN THE SAME SECTION */}
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
              <div className="p-4 bg-[#0D0F18]/90 border border-purple-500/25 rounded-2xl shadow-xl backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <span>Compiler Controls</span>
                  </h4>
                  <button
                    onClick={resetAll}
                    className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px] font-mono transition cursor-pointer"
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
                <div className="flex items-center justify-between text-[11px] font-mono px-3 py-1.5 rounded-xl bg-[#07080D]/90 border border-purple-500/20">
                  <span>
                    {(points?.runsRemainingFree ?? 3) > 0 ? (
                      <span className="text-emerald-400 font-bold">
                        ✓ {(points?.runsRemainingFree ?? 3)}/3 Free Runs Left
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold">
                        ⚠️ Extra run: -10 pts each
                      </span>
                    )}
                  </span>
                  <span className="text-purple-300/80 font-bold">
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

      {/* ── TOAST NOTIFICATIONS ── */}
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      </div>
    </div>
  );
}

