import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { challengeApi } from '../services/challengeApi';
import { sessionApi } from '../services/sessionApi';
import { qrApi } from '../services/qrApi';
import { runCode as apiRunCode, submitSolution as apiSubmitSolution } from '../services/api';
import { clearCompetitionStorage } from '../utils/constants';
import { combineFragments, seededShuffle, getThoroughlyMixedOrder } from '../utils/assembly';

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
  const [pendingKey, setPendingKey] = useState(null);
  const [lastUnlockedBlock, setLastUnlockedBlock] = useState(null);

  // ── Scoring & Points System (0 initial, negative penalties) ──
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [submissionAttempts, setSubmissionAttempts] = useState(0);
  const [taskAttemptsCount, setTaskAttemptsCount] = useState(0);
  const [revealedAnswerInfo, setRevealedAnswerInfo] = useState(null);
  const [points, setPoints] = useState({
    currentScore: 0,
    totalPenaltyPoints: 0,
    taskPenaltyPoints: 0,
    runPenaltyPoints: 0,
    timePenaltyPoints: 0,
    runCount: 0,
    runsRemainingFree: 3,
    timeMinutesExhausted: 0,
    previousChallengesPenalty: 0,
    overallTotalPenaltyPoints: 0,
    overallScore: 0,
  });

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
            const allIds = sess.scannedBlocks.map((b) => b.blockId || b._id);
            setCollectedFragmentIds(allIds);
            setLastUnlockedBlock(sess.scannedBlocks[sess.scannedBlocks.length - 1]);
            setLanguageLocked(true);

            if (sess.assemblyOrder && sess.assemblyOrder.length > 0) {
              const missing = allIds.filter((id) => !sess.assemblyOrder.includes(id));
              const fullOrder = [...sess.assemblyOrder, ...missing];
              setAssemblyOrder(fullOrder);
            } else if (allIds.length > 0) {
              const langCfg = (activeChallengeInfo?.languageConfigs || []).find((lc) => lc.language === (sess.selectedLanguage || language));
              const correctOrder = langCfg?.revealOrder || langCfg?.blocks?.map((b) => b.blockId) || [];
              const mixed = getThoroughlyMixedOrder(allIds, correctOrder);
              setShuffledVaultOrder(mixed);
              setAssemblyOrder(mixed);
            }
          }

          if (sess.points) {
            setPoints(sess.points);
          }

          // Fetch current task state if in progress
          try {
            const taskData = await challengeApi.getCurrentTask(challengeId);
            if (!cancelled && taskData.success) {
              if (taskData.currentTask) setCurrentTask(taskData.currentTask);
              if (taskData.totalTasks) setTotalTasks(taskData.totalTasks);
              if (taskData.completedTaskIds) setCompletedTaskIds(taskData.completedTaskIds);
              if (taskData.currentTaskIndex !== undefined) setCurrentTaskIndex(taskData.currentTaskIndex);
              if (taskData.points) setPoints(taskData.points);
              if (taskData.attemptsCount !== undefined) setTaskAttemptsCount(taskData.attemptsCount);
              if (taskData.unlockedBlocks && taskData.unlockedBlocks.length > 0) {
                setCollectedFragments((prev) => {
                  const map = new Map();
                  prev.forEach((b) => map.set(b.blockId || b._id, b));
                  taskData.unlockedBlocks.forEach((b) => map.set(b.blockId || b._id, b));
                  return Array.from(map.values());
                });
                setCollectedFragmentIds((prev) => {
                  const set = new Set(prev);
                  taskData.unlockedBlocks.forEach((b) => set.add(b.blockId || b._id));
                  return Array.from(set);
                });
              }
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
  const assemblyFragments = useMemo(() => {
    const fromOrder = assemblyOrder.map((id) => fragmentMap[id]).filter(Boolean);
    const seenIds = new Set(fromOrder.map((f) => f.id));
    // If any collected fragments are not yet in assemblyOrder, include them so no fragment is ever lost
    const missing = collectedFragments
      .map((f) => fragmentMap[f.blockId || f._id])
      .filter((f) => f && !seenIds.has(f.id));
    return [...fromOrder, ...missing];
  }, [assemblyOrder, fragmentMap, collectedFragments]);

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

  // ── Thoroughly mix fragments when entering ASSEMBLE phase ──
  useEffect(() => {
    if (phase !== 'ASSEMBLE' && phase !== 'DONE') return;
    const canonicalIds = collectedFragmentIds.length > 0
      ? collectedFragmentIds
      : collectedFragments.map((b) => b.blockId || b._id);
    if (canonicalIds.length === 0) return;

    const langCfg = (activeChallengeInfo?.languageConfigs || []).find((lc) => lc.language === language);
    const correctOrder = langCfg?.revealOrder || langCfg?.blocks?.map((b) => b.blockId) || [];

    if (assemblyOrder.length > 0) {
      // Append any newly collected fragments that are not yet in assemblyOrder
      const missing = canonicalIds.filter((id) => !assemblyOrder.includes(id));
      if (missing.length > 0) {
        const updatedOrder = [...assemblyOrder, ...missing];
        setAssemblyOrder(updatedOrder);
        const newFragments = updatedOrder.map((id) => fragmentMap[id]).filter(Boolean);
        const newCode = combineFragments(newFragments);
        syncAssemblyToServer(updatedOrder, newCode);
      }
      // Never re-mix an existing arrangement, especially when it matches the correct canonical order!
      return;
    }

    // Initialize assemblyOrder with a mixed arrangement only if currently empty
    const mixed = getThoroughlyMixedOrder(canonicalIds, correctOrder);
    setShuffledVaultOrder(mixed);
    setAssemblyOrder(mixed);
    const newFragments = mixed.map((id) => fragmentMap[id]).filter(Boolean);
    const newCode = combineFragments(newFragments);
    syncAssemblyToServer(mixed, newCode);
  }, [phase, collectedFragmentIds, collectedFragments, assemblyOrder, activeChallengeInfo, language, fragmentMap, syncAssemblyToServer]);

  // ── Actions ──

  const selectLanguage = useCallback((lang) => {
    if (languageLocked || phase !== 'SETUP' || serverSession) return;
    setLanguage(lang);
  }, [languageLocked, phase, serverSession]);

  const startChallenge = useCallback(async (selectedChalId) => {
    const targetId = selectedChalId || challengeId;
    clearCompetitionStorage();

    try {
      const res = await sessionApi.startSession({ challengeId: targetId, language });
      if (res.success && res.session) {
        setChallengeId(targetId);
        setServerSession(res.session);
        setStartTime(res.session.startTime);
        setLanguageLocked(true);
        setPhase('HUNT');
        setCollectedFragments(res.session.scannedBlocks || []);
        setCollectedFragmentIds((res.session.scannedBlocks || []).map((b) => b.blockId || b._id));
        setShuffledVaultOrder([]);
        setAssemblyOrder(res.session.assemblyOrder || []);
        setPenaltySeconds(0);
        setQuizAttempts(0);
        setSubmissionAttempts(0);
        setTaskAttemptsCount(0);
        setRevealedAnswerInfo(null);
        setPoints(res.session.points || {
          currentScore: 0,
          totalPenaltyPoints: 0,
          taskPenaltyPoints: 0,
          runPenaltyPoints: 0,
          timePenaltyPoints: 0,
          runCount: 0,
          runsRemainingFree: 3,
          timeMinutesExhausted: 0,
        });
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
            if (taskRes.points) setPoints(taskRes.points);
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
    setRevealedAnswerInfo(null);

    try {
      const res = await challengeApi.submitTaskAnswer(challengeId, answer);
      setQuizAttempts((prev) => prev + 1);

      if (res.points) {
        setPoints(res.points);
      }
      if (res.attemptsCount !== undefined) {
        setTaskAttemptsCount(res.attemptsCount);
      }

      if (res.correct) {
        if (!languageLocked) setLanguageLocked(true);
        setLastQuizCorrect(true);
        setLastQuizExplain(res.explain || '');
        setRevealedAnswerInfo(null);
        setTaskAttemptsCount(0);

        if (res.unlockedBlocks && res.unlockedBlocks.length > 0) {
          setCollectedFragments((prev) => {
            const map = new Map();
            prev.forEach((b) => map.set(b.blockId || b._id, b));
            res.unlockedBlocks.forEach((b) => map.set(b.blockId || b._id, b));
            if (res.unlockedBlock) map.set(res.unlockedBlock.blockId || res.unlockedBlock._id, res.unlockedBlock);
            return Array.from(map.values());
          });
          setCollectedFragmentIds((prev) => {
            const set = new Set(prev);
            res.unlockedBlocks.forEach((b) => set.add(b.blockId || b._id));
            if (res.unlockedBlock) set.add(res.unlockedBlock.blockId || res.unlockedBlock._id);
            return Array.from(set);
          });
        }

        const keyData = {
          taskIndex: currentTaskIndex,
          taskTitle: currentTask?.title || `Task ${currentTaskIndex + 1}`,
          unlockedBlock: res.unlockedBlock,
          nextTask: res.nextTask,
          nextTaskIndex: res.currentTaskIndex,
          allTasksCompleted: res.allTasksCompleted || false,
          completedTaskIds: res.completedTaskIds || [],
          totalPenaltySeconds: res.totalPenaltySeconds || 0,
          unlockedBlocks: res.unlockedBlocks,
          points: res.points,
          explain: res.explain || '',
        };
        setPendingKey(keyData);

        return { correct: true, explain: res.explain || '', unlockedBlock: res.unlockedBlock, points: res.points, keyData };
      } else if (res.answerRevealed) {
        // 3 wrong attempts reached -> answer revealed, block unlocked, advance
        if (!languageLocked) setLanguageLocked(true);
        setLastQuizCorrect(false);
        setLastQuizExplain(res.explain || '');
        const prevTaskTitle = currentTask?.title || `Task ${currentTaskIndex + 1}`;
        setRevealedAnswerInfo({
          revealed: true,
          forTaskId: currentTask?.taskId,
          forTaskTitle: prevTaskTitle,
          answer: res.revealedAnswer,
          explain: res.explain || '',
        });
        setTaskAttemptsCount(0);

        if (res.unlockedBlocks && res.unlockedBlocks.length > 0) {
          setCollectedFragments((prev) => {
            const map = new Map();
            prev.forEach((b) => map.set(b.blockId || b._id, b));
            res.unlockedBlocks.forEach((b) => map.set(b.blockId || b._id, b));
            if (res.unlockedBlock) map.set(res.unlockedBlock.blockId || res.unlockedBlock._id, res.unlockedBlock);
            return Array.from(map.values());
          });
          setCollectedFragmentIds((prev) => {
            const set = new Set(prev);
            res.unlockedBlocks.forEach((b) => set.add(b.blockId || b._id));
            if (res.unlockedBlock) set.add(res.unlockedBlock.blockId || res.unlockedBlock._id);
            return Array.from(set);
          });
        }

        const keyData = {
          taskIndex: currentTaskIndex,
          taskTitle: prevTaskTitle,
          unlockedBlock: res.unlockedBlock,
          nextTask: res.nextTask,
          nextTaskIndex: res.currentTaskIndex,
          allTasksCompleted: res.allTasksCompleted || false,
          completedTaskIds: res.completedTaskIds || [],
          totalPenaltySeconds: res.totalPenaltySeconds || 0,
          unlockedBlocks: res.unlockedBlocks,
          points: res.points,
          explain: res.explain || '',
          answerRevealed: true,
          revealedAnswer: res.revealedAnswer,
        };
        setPendingKey(keyData);

        return {
          correct: false,
          answerRevealed: true,
          revealedAnswer: res.revealedAnswer,
          explain: res.explain || '',
          penalty: res.penalty || 20,
          unlockedBlock: res.unlockedBlock,
          points: res.points,
          keyData,
        };
      } else {
        setLastQuizCorrect(false);
        setLastQuizExplain(res.explain || 'Incorrect answer. Please review logic and try again.');
        setPenaltySeconds(res.totalPenaltySeconds ?? (penaltySeconds + (res.penalty || 20)));
        return {
          correct: false,
          answerRevealed: false,
          attemptsRemaining: res.attemptsRemaining,
          explain: res.explain || 'Incorrect answer. Please review logic and try again.',
          penalty: res.penalty || 20,
          points: res.points,
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
  }, [challengeId, taskSubmitting, taskCooldownRemaining, languageLocked, penaltySeconds, currentTask, currentTaskIndex]);

  const unlockKey = useCallback((keyInfo = null) => {
    const k = keyInfo || pendingKey;
    if (!k) return;

    // Collect all blocks from k.unlockedBlocks and k.unlockedBlock
    const blocksToMerge = [
      ...(Array.isArray(k.unlockedBlocks) ? k.unlockedBlocks : []),
      ...(k.unlockedBlock ? [k.unlockedBlock] : [])
    ];

    if (blocksToMerge.length > 0) {
      setCollectedFragments((prev) => {
        const map = new Map();
        prev.forEach((b) => map.set(b.blockId || b._id, b));
        blocksToMerge.forEach((b) => {
          const id = b.blockId || b._id;
          if (id) map.set(id, b);
        });
        return Array.from(map.values());
      });
      setCollectedFragmentIds((prev) => {
        const set = new Set(prev);
        blocksToMerge.forEach((b) => {
          const id = b.blockId || b._id;
          if (id) set.add(id);
        });
        return Array.from(set);
      });
    }

    if (k.completedTaskIds) {
      setCompletedTaskIds(k.completedTaskIds);
    }
    if (k.totalPenaltySeconds !== undefined) {
      setPenaltySeconds(k.totalPenaltySeconds);
    }
    if (k.points) {
      setPoints(k.points);
    }

    if (k.unlockedBlock) {
      setLastUnlockedBlock({
        ...k.unlockedBlock,
        taskIndex: k.taskIndex,
        taskTitle: k.taskTitle,
      });
    }
    setPendingKey(null);

    if (k.allTasksCompleted) {
      setAllTasksCompleted(true);
      const map = new Map();
      collectedFragments.forEach((b) => map.set(b.blockId || b._id, b));
      blocksToMerge.forEach((b) => {
        const id = b.blockId || b._id;
        if (id) map.set(id, b);
      });
      const allMerged = Array.from(map.values());
      const allMergedIds = Array.from(map.keys());

      const langCfg = (activeChallengeInfo?.languageConfigs || []).find((lc) => lc.language === language);
      const correctOrder = langCfg?.revealOrder || langCfg?.blocks?.map((b) => b.blockId) || [];
      const mixedOrder = getThoroughlyMixedOrder(allMergedIds, correctOrder);

      setShuffledVaultOrder(mixedOrder);
      setAssemblyOrder(mixedOrder);

      const fullFragmentMap = { ...fragmentMap };
      allMerged.forEach((f) => {
        const id = f.blockId || f._id;
        if (id) {
          fullFragmentMap[id] = { id, code: f.code || f.codeSnippet || '', role: f.type || f.role || 'LOGIC' };
        }
      });

      const newFragments = mixedOrder.map((id) => fullFragmentMap[id]).filter(Boolean);
      const newCode = combineFragments(newFragments);
      syncAssemblyToServer(mixedOrder, newCode);
    } else {
      if (k.nextTask) setCurrentTask(k.nextTask);
      if (k.nextTaskIndex !== undefined) setCurrentTaskIndex(k.nextTaskIndex);
    }
  }, [pendingKey, collectedFragments, activeChallengeInfo, language, fragmentMap, syncAssemblyToServer]);

  const startAssemblyPhase = useCallback(async () => {
    setPhase('ASSEMBLE');
    if (!challengeId) return;

    try {
      const res = await sessionApi.getCurrentSession(challengeId);
      if (res.success && res.session) {
        const sess = res.session;
        if (sess.scannedBlocks && sess.scannedBlocks.length > 0) {
          setCollectedFragments(sess.scannedBlocks);
          const allIds = sess.scannedBlocks.map((b) => b.blockId || b._id);
          setCollectedFragmentIds(allIds);

          const existingOrder = sess.assemblyOrder && sess.assemblyOrder.length >= sess.scannedBlocks.length
            ? sess.assemblyOrder
            : (assemblyOrder.length >= sess.scannedBlocks.length ? assemblyOrder : null);

          if (!existingOrder) {
            const langCfg = (activeChallengeInfo?.languageConfigs || []).find((lc) => lc.language === (sess.selectedLanguage || language));
            const correctOrder = langCfg?.revealOrder || langCfg?.blocks?.map((b) => b.blockId) || [];
            const mixed = getThoroughlyMixedOrder(allIds, correctOrder);
            setShuffledVaultOrder(mixed);
            setAssemblyOrder(mixed);

            const fMap = {};
            sess.scannedBlocks.forEach((f) => {
              const id = f.blockId || f._id;
              if (id) fMap[id] = { id, code: f.code || f.codeSnippet || '', role: f.type || f.role || 'LOGIC' };
            });
            const newFrags = mixed.map((id) => fMap[id]).filter(Boolean);
            const newCode = combineFragments(newFrags);
            syncAssemblyToServer(mixed, newCode);
          }
        }
      }
    } catch (_) {}
  }, [challengeId, language, activeChallengeInfo, assemblyOrder, syncAssemblyToServer]);

  const dismissRevealedAnswer = useCallback(() => {
    setRevealedAnswerInfo(null);
  }, []);

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
    setCompileOutput(null);
  }, [fragmentMap, syncAssemblyToServer]);

  const resetAssemblyOrder = useCallback(() => {
    const langCfg = (activeChallengeInfo?.languageConfigs || []).find((lc) => lc.language === language);
    const correctOrder = langCfg?.revealOrder || langCfg?.blocks?.map((b) => b.blockId) || [];
    const baseIds = collectedFragmentIds.length > 0
      ? collectedFragmentIds
      : collectedFragments.map((b) => b.blockId || b._id);
    if (baseIds.length === 0) return;

    const mixed = getThoroughlyMixedOrder(baseIds, correctOrder);

    setShuffledVaultOrder(mixed);
    setAssemblyOrder(mixed);
    const newFragments = mixed.map((id) => fragmentMap[id]).filter(Boolean);
    const newCode = combineFragments(newFragments);
    syncAssemblyToServer(mixed, newCode);
    setCompileOutput(null);
  }, [activeChallengeInfo, language, collectedFragmentIds, collectedFragments, fragmentMap, syncAssemblyToServer]);

  // ── Execution (Real backend / Judge0) ──

  const executeCode = useCallback(async (customInput = null) => {
    setIsCompiling(true);
    setCompileOutput(null);
    try {
      const inputToUse = customInput ?? challenge.sampleInput ?? '';
      const apiRes = await apiRunCode(language, assembledCode, inputToUse, challengeId);
      setCompileOutput(apiRes);
      if (apiRes && apiRes.runCount !== undefined) {
        setPoints((prev) => ({
          ...prev,
          runCount: apiRes.runCount,
          runsRemainingFree: apiRes.runsRemainingFree ?? Math.max(0, 3 - apiRes.runCount),
          runPenaltyApplied: apiRes.runPenaltyApplied ?? 0,
          runPenaltyPoints: apiRes.runPenaltyPoints ?? prev.runPenaltyPoints,
          taskPenaltyPoints: apiRes.taskPenaltyPoints ?? prev.taskPenaltyPoints,
          timePenaltyPoints: apiRes.timePenaltyPoints ?? prev.timePenaltyPoints,
          totalPenaltyPoints: apiRes.totalPenaltyPoints ?? prev.totalPenaltyPoints,
          currentScore: apiRes.currentScore ?? prev.currentScore,
          previousChallengesPenalty: apiRes.previousChallengesPenalty ?? prev.previousChallengesPenalty,
          overallTotalPenaltyPoints: apiRes.overallTotalPenaltyPoints ?? prev.overallTotalPenaltyPoints,
          overallScore: apiRes.overallScore ?? prev.overallScore,
        }));
      }
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
  }, [language, assembledCode, challenge.sampleInput, challengeId]);

  const submitSolution = useCallback(async (participant, isAutoSubmit = false) => {
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
      }).catch(() => {});

      const outcome = await apiSubmitSolution(language, assembledCode, challengeId, isAutoSubmit);
      const isAccepted = outcome.status === 'ACCEPTED' || outcome.success;

      if (outcome && outcome.totalPenaltyPoints !== undefined) {
        setPoints((prev) => ({
          ...prev,
          taskPenaltyPoints: outcome.taskPenaltyPoints ?? prev.taskPenaltyPoints,
          runPenaltyPoints: outcome.runPenaltyPoints ?? prev.runPenaltyPoints,
          timePenaltyPoints: outcome.timePenaltyPoints ?? prev.timePenaltyPoints,
          totalPenaltyPoints: outcome.totalPenaltyPoints ?? prev.totalPenaltyPoints,
          currentScore: outcome.currentScore ?? outcome.score ?? prev.currentScore,
          previousChallengesPenalty: outcome.previousChallengesPenalty ?? prev.previousChallengesPenalty,
          overallTotalPenaltyPoints: outcome.overallTotalPenaltyPoints ?? prev.overallTotalPenaltyPoints,
          overallScore: outcome.overallScore ?? prev.overallScore,
          wrongSubmissionPenalty: outcome.wrongSubmissionPenalty ?? (isAutoSubmit && !isAccepted ? 50 : 0),
        }));
      }

      const calculatedScore = outcome.score !== undefined
        ? outcome.score
        : (isAccepted ? 0 : -(outcome.totalPenaltyPoints || 0));

      const record = {
        ...outcome,
        passed: isAccepted,
        finalScore: calculatedScore,
        score: calculatedScore,
        totalPenaltyPoints: outcome.totalPenaltyPoints ?? (isAccepted ? 0 : Math.abs(calculatedScore)),
        taskPenaltyPoints: outcome.taskPenaltyPoints,
        timePenaltyPoints: outcome.timePenaltyPoints,
        wrongSubmissionPenalty: outcome.wrongSubmissionPenalty ?? (isAutoSubmit && !isAccepted ? 50 : 0),
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
        isAutoSubmit,
      };

      if (isAccepted || isAutoSubmit) {
        setFinalResult(record);
        setPhase('DONE');
      }
      return record;
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'CHALLENGE_LOCKED') {
        setLockedNotice(err.response.data.message || 'This challenge is locked.');
      }
      const unsubmittedTasks = Math.max(0, totalTasks - completedTaskIds.length);
      const taskPenalty = (points?.taskPenaltyPoints || 0) + unsubmittedTasks * 20;
      const timePenalty = 150;
      const wrongSolution = 50;
      const totalCalcPenalty = taskPenalty + (points?.runPenaltyPoints || 0) + timePenalty + wrongSolution;
      const calcScore = isAutoSubmit ? -totalCalcPenalty : 0;

      const errRecord = {
        success: false,
        status: 'WRONG_ANSWER',
        title: isAutoSubmit ? '⌛ TIME EXPIRED (AUTO-SUBMITTED)' : '⚠️ EVALUATION ERROR',
        message: err.response?.data?.message || 'Unable to evaluate submission.',
        passedCount: 0,
        totalCount: 3,
        testResults: [],
        executionTime: '0.00s',
        memory: '0.0 MB',
        isAutoSubmit,
        finalScore: calcScore,
        score: calcScore,
        totalPenaltyPoints: isAutoSubmit ? totalCalcPenalty : 0,
        taskPenaltyPoints: taskPenalty,
        timePenaltyPoints: timePenalty,
        wrongSubmissionPenalty: isAutoSubmit ? 50 : 0,
      };
      if (isAutoSubmit) {
        setPoints((prev) => ({
          ...prev,
          taskPenaltyPoints: taskPenalty,
          timePenaltyPoints: timePenalty,
          totalPenaltyPoints: totalCalcPenalty,
          currentScore: calcScore,
          wrongSubmissionPenalty: 50,
        }));
        setFinalResult(errRecord);
        setPhase('DONE');
      }
      return errRecord;
    } finally {
      setIsValidating(false);
      submittingRef.current = false;
    }
  }, [challengeId, assemblyOrder, assembledCode, language, challenge.title, submissionAttempts, penaltySeconds, collectedFragments.length, quizAttempts]);

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
    setTaskAttemptsCount(0);
    setRevealedAnswerInfo(null);
    setPoints({
      currentScore: 0,
      totalPenaltyPoints: 0,
      taskPenaltyPoints: 0,
      runPenaltyPoints: 0,
      timePenaltyPoints: 0,
      runCount: 0,
      runsRemainingFree: 3,
      timeMinutesExhausted: 0,
    });
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
    setTaskAttemptsCount(0);
    setRevealedAnswerInfo(null);
    setPoints({
      currentScore: 0,
      totalPenaltyPoints: 0,
      taskPenaltyPoints: 0,
      runPenaltyPoints: 0,
      timePenaltyPoints: 0,
      runCount: 0,
      runsRemainingFree: 3,
      timeMinutesExhausted: 0,
    });
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
        taskAttemptsCount,
        revealedAnswerInfo,
        setRevealedAnswerInfo,
        dismissRevealedAnswer,
        pendingKey,
        setPendingKey,
        lastUnlockedBlock,
        setLastUnlockedBlock,
        unlockKey,
        startAssemblyPhase,

        // points & scoring
        points,
        currentScore: points.currentScore,

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
        setCompileOutput,

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
