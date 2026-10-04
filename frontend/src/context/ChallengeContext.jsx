import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { challengeApi } from '../services/challengeApi';
import { sessionApi } from '../services/sessionApi';
import { qrApi } from '../services/qrApi';
import { runCode as apiRunCode, submitSolution as apiSubmitSolution } from '../services/api';
import { clearCompetitionStorage } from '../utils/constants';
import { combineFragments, seededShuffle } from '../utils/assembly';

const ChallengeContext = createContext(null);

export function ChallengeProvider({ children }) {
  const searchParams = new URLSearchParams(window.location.search);
  const urlChallengeId = searchParams.get('id') || searchParams.get('challengeId');

  // ── Available challenges from server ──
  const [challenges, setChallenges] = useState([]);
  const [challengeId, setChallengeId] = useState(urlChallengeId || null);
  const [activeChallengeInfo, setActiveChallengeInfo] = useState(null);

  // ── Server-authoritative session ──
  const [serverSession, setServerSession] = useState(null);
  const [phase, setPhase] = useState('SETUP'); // SETUP | HUNT | ASSEMBLE | DONE
  const [language, setLanguage] = useState('python');
  const [languageLocked, setLanguageLocked] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [isTimeExpired, setIsTimeExpired] = useState(false);

  // ── Fragments & Tasks ──
  const [collectedFragments, setCollectedFragments] = useState([]);
  const [collectedFragmentIds, setCollectedFragmentIds] = useState([]);
  const [shuffledVaultOrder, setShuffledVaultOrder] = useState([]);
  const [assemblyOrder, setAssemblyOrder] = useState([]);

  // Server task progression (if task-based hunt)
  const [currentTask, setCurrentTask] = useState(null);
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskCooldownRemaining, setTaskCooldownRemaining] = useState(0);
  const [lastQuizExplain, setLastQuizExplain] = useState('');
  const [lastQuizCorrect, setLastQuizCorrect] = useState(null);
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // ── Scoring & Attempts ──
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [submissionAttempts, setSubmissionAttempts] = useState(0);

  // ── Execution state ──
  const [isCompiling, setIsCompiling] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [compileOutput, setCompileOutput] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [lockedNotice, setLockedNotice] = useState(null);

  const submittingRef = useRef(false);
  const saveAssemblyTimerRef = useRef(null);

  // 1. Load active challenges on mount
  useEffect(() => {
    let cancelled = false;
    async function loadChallenges() {
      try {
        const [res, progRes] = await Promise.all([
          challengeApi.getAll().catch(() => ({ challenges: [] })),
          challengeApi.getProgress().catch(() => null),
        ]);
        if (cancelled) return;
        const list = res.challenges || (Array.isArray(res) ? res : []);
        setChallenges(list);

        if (!challengeId) {
          if (progRes?.currentChallengeSlug) {
            setChallengeId(progRes.currentChallengeSlug);
          }
        }
      } catch (err) {
        console.warn('[ChallengeContext] Failed to load challenges:', err.message);
      }
    }
    loadChallenges();
    return () => { cancelled = true; };
  }, []);

  // 2. Fetch active challenge details whenever challengeId changes
  useEffect(() => {
    if (!challengeId) return;
    let cancelled = false;

    async function loadChallengeDetails() {
      try {
        const res = await challengeApi.getById(challengeId);
        if (cancelled) return;
        if (res.success && res.challenge) {
          setActiveChallengeInfo(res.challenge);
          const tasks = res.challenge.tasks || [];
          setTotalTasks(tasks.length);
          if (tasks.length > 0 && !currentTask) {
            const firstTask = tasks[0];
            const quiz = firstTask.quizPool?.[0] || null;
            if (quiz) {
              setCurrentTask({
                taskId: firstTask.taskId,
                title: firstTask.title,
                description: firstTask.description,
                order: firstTask.order,
                quiz: {
                  quizId: quiz.quizId,
                  type: quiz.type,
                  prompt: quiz.prompt,
                  options: quiz.options || [],
                  concept: quiz.concept || '',
                },
              });
            }
          }
        }
      } catch (err) {
        console.warn('[ChallengeContext] Failed to load challenge details:', err.message);
      }
    }

    loadChallengeDetails();
    return () => { cancelled = true; };
  }, [challengeId]);

  // 3. Recover active session from server whenever challengeId changes
  useEffect(() => {
    if (!challengeId) return;
    const token = localStorage.getItem('mindcraft_token');
    const userStr = localStorage.getItem('mindcraft_user');
    // If not authenticated or on admin route or user is an admin, skip participant session recovery
    if (!token) return;
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) return;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u?.role === 'admin') return;
      } catch (_) {}
    }

    let cancelled = false;

    async function recoverServerSession() {
      try {
        const res = await sessionApi.getCurrentSession(challengeId);
        if (cancelled) return;
        if (res.success && res.session) {
          const sess = res.session;
          setServerSession(sess);
          setStartTime(sess.startTime);
          if (sess.selectedLanguage) setLanguage(sess.selectedLanguage);

          if (res.isExpired) {
            setIsTimeExpired(true);
          }

          if (sess.scannedBlocks && sess.scannedBlocks.length > 0) {
            setCollectedFragments(sess.scannedBlocks);
            setCollectedFragmentIds(sess.scannedBlocks.map((b) => b.blockId || b._id));
            setLanguageLocked(true);
          }

          if (sess.assemblyOrder && sess.assemblyOrder.length > 0) {
            setAssemblyOrder(sess.assemblyOrder);
          }

          // Fetch current task state if in progress
          try {
            const taskData = await challengeApi.getCurrentTask(challengeId);
            if (!cancelled && taskData.success) {
              if (taskData.currentTask) setCurrentTask(taskData.currentTask);
              if (taskData.totalTasks) setTotalTasks(taskData.totalTasks);
              if (taskData.completedTaskIds) setCompletedTaskIds(taskData.completedTaskIds);
              if (taskData.currentTaskIndex !== undefined) setCurrentTaskIndex(taskData.currentTaskIndex);
              if (taskData.allTasksCompleted) {
                setAllTasksCompleted(true);
                setPhase('ASSEMBLE');
              }
            }
          } catch (_) {}

          if (sess.status === 'COMPLETED') {
            setPhase('DONE');
          } else if (sess.assemblyOrder?.length > 0 || sess.status === 'ACTIVE') {
            const expectedTotal = activeChallengeInfo?.blockConfig?.totalBlocks || activeChallengeInfo?.totalBlocks || activeChallengeInfo?.tasks?.length || 4;
            const isAllCollected = sess.scannedBlocks?.length >= expectedTotal;
            setPhase(isAllCollected ? 'ASSEMBLE' : 'HUNT');
          }
        }
      } catch (err) {
        if (err.response?.status === 403 && (err.response?.data?.code === 'CHALLENGE_LOCKED' || err.response?.data?.code === 'CHALLENGE_COMPLETED')) {
          setLockedNotice(err.response.data.message || 'This challenge is not accessible.');
        }
        // Participant session recovery failure is normal if no session was started yet
      }
    }

    recoverServerSession();
    return () => { cancelled = true; };
  }, [challengeId, activeChallengeInfo?.totalBlocks, activeChallengeInfo?.blockConfig?.totalBlocks, activeChallengeInfo?.tasks?.length]);

  // ── Derived active challenge metadata ──
  const challenge = useMemo(() => {
    const raw = activeChallengeInfo || {};
    const supportedLangs = raw.supportedLanguages?.length
      ? raw.supportedLanguages
      : ['python', 'c', 'cpp', 'java'];

    return {
      id: raw._id || raw.id || challengeId || 'challenge',
      slug: raw.slug || challengeId || 'challenge',
      title: raw.title || 'Coding Challenge',
      description: raw.description || '',
      difficulty: raw.difficulty || 'Medium',
      points: Number(raw.points) || 100,
      category: raw.category || 'Algorithms',
      sampleInput: raw.sampleInput || '',
      sampleOutput: raw.sampleOutput || '',
      duration: raw.timeLimitSeconds || raw.duration || 1200,
      supportedLanguages: supportedLangs,
      tasks: raw.tasks || [],
    };
  }, [activeChallengeInfo, challengeId]);

  // ── Derived fragment map ──
  const fragmentMap = useMemo(() => {
    const map = {};
    collectedFragments.forEach((f) => {
      const id = f.blockId || f._id;
      if (id) {
        map[id] = { id, code: f.code || f.codeSnippet || '', role: f.type || f.role || 'LOGIC' };
      }
    });
    return map;
  }, [collectedFragments]);

  // ── Derived assembled fragments ──
  const assemblyFragments = useMemo(
    () => assemblyOrder.map((id) => fragmentMap[id]).filter(Boolean),
    [assemblyOrder, fragmentMap]
  );

  // ── Derived assembled source code ──
  const assembledCode = useMemo(() => combineFragments(assemblyFragments), [assemblyFragments]);

  const totalFragments = useMemo(() => {
    return (
      activeChallengeInfo?.blockConfig?.totalBlocks ||
      activeChallengeInfo?.totalBlocks ||
      (Array.isArray(activeChallengeInfo?.tasks) && activeChallengeInfo.tasks.length > 0 ? activeChallengeInfo.tasks.length : 0) ||
      activeChallengeInfo?.languageConfigs?.[0]?.blockCount ||
      (collectedFragments.length > 0 ? collectedFragments.length : 4)
    );
  }, [activeChallengeInfo, collectedFragments.length]);

  // ── Shuffle vault when entering ASSEMBLE phase ──
  useEffect(() => {
    if (phase !== 'ASSEMBLE' && phase !== 'DONE') return;
    const canonicalIds = collectedFragmentIds;
    if (canonicalIds.length === 0) return;
    if (assemblyOrder.length > 0) return; // preserve server-restored order

    const seed = startTime ? new Date(startTime).getTime() % 99991 : 12345;
    const shuffled = seededShuffle([...canonicalIds], seed);
    setShuffledVaultOrder(shuffled);
    setAssemblyOrder(shuffled);
  }, [phase, collectedFragmentIds, startTime, assemblyOrder.length]);

  // ── Debounced save assembly to server ──
  const syncAssemblyToServer = useCallback((order, code) => {
    if (!challengeId) return;
    if (saveAssemblyTimerRef.current) clearTimeout(saveAssemblyTimerRef.current);
    saveAssemblyTimerRef.current = setTimeout(async () => {
      try {
        await sessionApi.saveAssembly({
          challengeId,
          assemblyOrder: order,
          assembledCode: code,
        });
      } catch (err) {
        console.warn('[ChallengeContext] Failed to persist assembly to server:', err.message);
      }
    }, 600);
  }, [challengeId]);

  // ── Actions ──

  const selectLanguage = useCallback((lang) => {
    if (languageLocked) return;
    setLanguage(lang);
  }, [languageLocked]);

  const startChallenge = useCallback(async (selectedChalId) => {
    const targetId = selectedChalId || challengeId;
    clearCompetitionStorage();

    try {
      const res = await sessionApi.startSession({ challengeId: targetId, language });
      if (res.success && res.session) {
        setChallengeId(targetId);
        setServerSession(res.session);
        setStartTime(res.session.startTime);
        setLanguageLocked(false);
        setCollectedFragments(res.session.scannedBlocks || []);
        setCollectedFragmentIds((res.session.scannedBlocks || []).map((b) => b.blockId || b._id));
        setShuffledVaultOrder([]);
        setAssemblyOrder(res.session.assemblyOrder || []);
        setPenaltySeconds(0);
        setQuizAttempts(0);
        setSubmissionAttempts(0);
        setFinalResult(null);
        setCompileOutput(null);
        setIsTimeExpired(false);

        // Fetch task-based progression from server
        try {
          const taskRes = await challengeApi.startSession(targetId, language);
          if (taskRes && taskRes.success) {
            if (taskRes.currentTask) setCurrentTask(taskRes.currentTask);
            if (taskRes.totalTasks) setTotalTasks(taskRes.totalTasks);
            if (taskRes.completedTaskIds) setCompletedTaskIds(taskRes.completedTaskIds);
            if (taskRes.currentTaskIndex !== undefined) setCurrentTaskIndex(taskRes.currentTaskIndex);
            if (taskRes.allTasksCompleted) setAllTasksCompleted(true);
          }
        } catch (tErr) {
          console.warn('[ChallengeContext] Task progression notice:', tErr.message);
        }

        // If blocks were already unlocked from previous session
        if (res.session.scannedBlocks?.length > 0) {
          setLanguageLocked(true);
        }

        // If challenge has tasks, start in HUNT. If 0 tasks, enter ASSEMBLE
        const chalTasks = activeChallengeInfo?.tasks || [];
        if (chalTasks.length === 0) {
          setPhase('ASSEMBLE');
        } else {
          setPhase('HUNT');
        }
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'CHALLENGE_LOCKED') {
        const msg = err.response.data.message || 'Complete previous tiers first to unlock this challenge.';
        setLockedNotice(msg);
        throw err;
      }
      console.error('[ChallengeContext] startSession error:', err);
      setChallengeId(targetId);
      setStartTime(new Date().toISOString());
      setPhase('HUNT');
    }
  }, [challengeId, language, activeChallengeInfo]);

  const scanQRCode = useCallback(async (qrCode) => {
    if (!challengeId) return null;
    try {
      const res = await qrApi.scanBlock({ qrCode, challengeId });
      if (res.success && res.block) {
        setCollectedFragments((prev) => {
          const exists = prev.some((b) => (b.blockId || b._id) === (res.block.blockId || res.block._id));
          return exists ? prev : [...prev, res.block];
        });
        setCollectedFragmentIds((prev) => {
          const id = res.block.blockId || res.block._id;
          return prev.includes(id) ? prev : [...prev, id];
        });
        setLanguageLocked(true);
        return res.block;
      }
    } catch (err) {
      console.error('[ChallengeContext] scanQRCode error:', err);
      throw err;
    }
    return null;
  }, [challengeId]);

  const submitQuizAnswer = useCallback(async (answer) => {
    if (taskSubmitting || taskCooldownRemaining > 0) {
      return { correct: false, explain: 'Please wait...' };
    }
    setTaskSubmitting(true);
    setLastQuizCorrect(null);
    setLastQuizExplain('');

    try {
      const res = await challengeApi.submitTaskAnswer(challengeId, answer);
      setQuizAttempts((prev) => prev + 1);

      if (res.correct) {
        if (!languageLocked) setLanguageLocked(true);
        setLastQuizCorrect(true);
        setLastQuizExplain(res.explain || '');

        if (res.unlockedBlock) {
          setCollectedFragments((prev) => {
            if (prev.find((f) => (f.blockId || f._id) === (res.unlockedBlock.blockId || res.unlockedBlock._id))) return prev;
            return [...prev, res.unlockedBlock];
          });
          setCollectedFragmentIds((prev) => {
            const id = res.unlockedBlock.blockId || res.unlockedBlock._id;
            return prev.includes(id) ? prev : [...prev, id];
          });
        }

        setCompletedTaskIds(res.completedTaskIds || []);
        setCurrentTaskIndex(res.currentTaskIndex || 0);
        setCurrentTask(res.nextTask || null);
        setAllTasksCompleted(res.allTasksCompleted || false);
        setPenaltySeconds(res.totalPenaltySeconds || 0);

        if (res.allTasksCompleted) {
          if (res.unlockedBlocks) {
            setCollectedFragments(res.unlockedBlocks);
            setCollectedFragmentIds(res.unlockedBlocks.map((b) => b.blockId || b._id));
          }
          setTimeout(() => setPhase('ASSEMBLE'), 600);
        }

        return { correct: true, explain: res.explain || '', unlockedBlock: res.unlockedBlock };
      } else {
        setLastQuizCorrect(false);
        setLastQuizExplain(res.explain || 'Incorrect answer. Please review logic and try again.');
        setPenaltySeconds(res.totalPenaltySeconds ?? (penaltySeconds + (res.penalty || 20)));
        return {
          correct: false,
          explain: res.explain || 'Incorrect answer. Please review logic and try again.',
          penalty: res.penalty || 20,
        };
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'CHALLENGE_LOCKED') {
        setLockedNotice(err.response.data.message || 'This challenge is locked.');
      }
      return { correct: false, explain: err.response?.data?.message || 'Server error. Please try again.' };
    } finally {
      setTaskSubmitting(false);
    }
  }, [challengeId, taskSubmitting, taskCooldownRemaining, languageLocked, penaltySeconds]);

  const reorderAssembly = useCallback((sourceIdx, destIdx) => {
    setAssemblyOrder((prev) => {
      if (
        sourceIdx < 0 || sourceIdx >= prev.length ||
        destIdx < 0   || destIdx   >= prev.length
      ) return prev;
      const next = [...prev];
      const [removed] = next.splice(sourceIdx, 1);
      next.splice(destIdx, 0, removed);

      const newFragments = next.map((id) => fragmentMap[id]).filter(Boolean);
      const newCode = combineFragments(newFragments);
      syncAssemblyToServer(next, newCode);

      return next;
    });
  }, [fragmentMap, syncAssemblyToServer]);

  const resetAssemblyOrder = useCallback(() => {
    const next = [...shuffledVaultOrder];
    setAssemblyOrder(next);
    const newFragments = next.map((id) => fragmentMap[id]).filter(Boolean);
    const newCode = combineFragments(newFragments);
    syncAssemblyToServer(next, newCode);
  }, [shuffledVaultOrder, fragmentMap, syncAssemblyToServer]);

  // ── Execution (Real backend / Judge0) ──

  const executeCode = useCallback(async (customInput = null) => {
    setIsCompiling(true);
    setCompileOutput(null);
    try {
      const inputToUse = customInput ?? challenge.sampleInput ?? '';
      const apiRes = await apiRunCode(language, assembledCode, inputToUse);
      setCompileOutput(apiRes);
      return apiRes;
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'CHALLENGE_LOCKED') {
        setLockedNotice(err.response.data.message || 'This challenge is locked.');
      }
      const fallback = {
        success: false,
        status: 'Error',
        stdout: '',
        stderr: err.response?.data?.message || err.message || 'Execution error.',
        compileOutput: '',
        executionTime: '0.00s',
        memory: '0.0 MB',
      };
      setCompileOutput(fallback);
      return fallback;
    } finally {
      setIsCompiling(false);
    }
  }, [language, assembledCode, challenge.sampleInput]);

  const submitSolution = useCallback(async (participant) => {
    if (submittingRef.current) return null;
    submittingRef.current = true;
    setIsValidating(true);
    setSubmissionAttempts((prev) => prev + 1);

    try {
      // First ensure the server has the latest assembly
      await sessionApi.saveAssembly({
        challengeId,
        assemblyOrder,
        assembledCode,
      });

      const outcome = await apiSubmitSolution(language, assembledCode, challengeId);
      const isAccepted = outcome.status === 'ACCEPTED' || outcome.success;

      const record = {
        ...outcome,
        passed: isAccepted,
        finalScore: outcome.score || (isAccepted ? challenge.points : 0),
        score: outcome.score || (isAccepted ? challenge.points : 0),
        participantName: participant?.name || '',
        participantId: participant?.participantId || '',
        challengeId,
        challengeTitle: challenge.title,
        language,
        timestamp: new Date().toISOString(),
        attempts: submissionAttempts + 1,
        penaltySeconds,
        fragmentCount: collectedFragments.length,
        quizAttempts,
      };

      if (isAccepted) {
        setFinalResult(record);
        setPhase('DONE');
      }
      return record;
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'CHALLENGE_LOCKED') {
        setLockedNotice(err.response.data.message || 'This challenge is locked.');
      }
      return {
        success: false,
        status: 'WRONG_ANSWER',
        title: '⚠️ EVALUATION ERROR',
        message: err.response?.data?.message || 'Unable to evaluate submission.',
        passedCount: 0,
        totalCount: 3,
        testResults: [],
        executionTime: '0.00s',
        memory: '0.0 MB',
      };
    } finally {
      setIsValidating(false);
      submittingRef.current = false;
    }
  }, [challengeId, assemblyOrder, assembledCode, language, challenge.points, challenge.title, submissionAttempts, penaltySeconds, collectedFragments.length, quizAttempts]);

  const handleTimeExpired = useCallback(() => setIsTimeExpired(true), []);

  const resetAll = useCallback(() => {
    clearCompetitionStorage();
    setPhase('SETUP');
    setStartTime(null);
    setLanguageLocked(false);
    setCollectedFragments([]);
    setCollectedFragmentIds([]);
    setShuffledVaultOrder([]);
    setAssemblyOrder([]);
    setPenaltySeconds(0);
    setQuizAttempts(0);
    setSubmissionAttempts(0);
    setFinalResult(null);
    setCompileOutput(null);
    setIsTimeExpired(false);
    setServerSession(null);
    setCurrentTask(null);
    setAllTasksCompleted(false);
    setTotalTasks(0);
    setCompletedTaskIds([]);
    setCurrentTaskIndex(0);
    setLastQuizCorrect(null);
    setLastQuizExplain('');
    setTaskCooldownRemaining(0);
  }, []);

  const selectChallenge = useCallback((newId) => {
    if (!newId) return;
    setChallengeId(newId);
    setPhase('SETUP');
    setStartTime(null);
    setServerSession(null);
    setCurrentTask(null);
    setAllTasksCompleted(false);
    setTotalTasks(0);
    setCompletedTaskIds([]);
    setCurrentTaskIndex(0);
    setCollectedFragments([]);
    setCollectedFragmentIds([]);
    setShuffledVaultOrder([]);
    setAssemblyOrder([]);
    setPenaltySeconds(0);
    setQuizAttempts(0);
    setSubmissionAttempts(0);
    setFinalResult(null);
    setCompileOutput(null);
    setIsTimeExpired(false);
    setTaskCooldownRemaining(0);
    setLastQuizExplain('');
    setLastQuizCorrect(null);
    setLanguageLocked(false);
    clearCompetitionStorage();
  }, []);

  const langConfig = useMemo(() => {
    return {
      fragments: collectedFragments.map((f) => ({
        id: f.blockId || f._id,
        code: f.code || f.codeSnippet || '',
        role: f.type || f.role || 'LOGIC',
      })),
    };
  }, [collectedFragments]);

  return (
    <ChallengeContext.Provider
      value={{
        // challenge
        challenge,
        challenges,
        setChallengeId,
        selectChallenge,

        // language
        language,
        selectLanguage,
        languageLocked,
        langConfig,

        // timer
        startTime,
        startChallenge,

        // phase
        phase,

        // task state
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
        fragmentMap,
        shuffledVaultOrder,
        totalFragments,
        scanQRCode,

        // assembly
        assemblyOrder,
        assemblyFragments,
        assembledCode,
        reorderAssembly,
        resetAssemblyOrder,
        setAssemblyOrder,

        // scoring
        penaltySeconds,
        quizAttempts,
        submissionAttempts,
        attempts: submissionAttempts,

        // execution
        executeCode,
        submitSolution,
        isCompiling,
        isValidating,
        compileOutput,

        // result
        finalResult,
        isTimeExpired,
        handleTimeExpired,
        resetAll,
        lockedNotice,
        setLockedNotice,

        // aliases for backward compatibility
        unlockedBlocks: collectedFragments.map((f) => ({
          id: f.blockId || f._id,
          code: f.code || f.codeSnippet || '',
          role: f.type || f.role || 'LOGIC',
          blockId: f.blockId || f._id,
        })),
        assemblyBlocks: assemblyFragments,
        reorderAssemblyBlocks: reorderAssembly,
        removeAssemblyBlock: () => {},
        addBlockToAssembly: () => false,
        revealNextBlock: async () => null,
        unlockQR: scanQRCode,
        scannedQRIds: collectedFragmentIds,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallengeContext() {
  const context = useContext(ChallengeContext);
  if (!context) throw new Error('useChallengeContext must be used within a ChallengeProvider');
  return context;
}
