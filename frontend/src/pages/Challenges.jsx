import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useChallenge } from '../hooks/useChallenge';
import { useParticipant } from '../context/ParticipantContext';
import { challengeApi } from '../services/challengeApi';
import { sessionApi } from '../services/sessionApi';
import Toast from '../components/common/Toast';
import MissionStepper from '../components/challenge/MissionStepper';
import {
  Trophy,
  CheckCircle2,
  Lock,
  ArrowRight,
  Play,
  Layers,
  Clock,
  UserPlus,
  Flame,
} from 'lucide-react';

export default function Challenges() {
  const navigate = useNavigate();
  const location = useLocation();
  const { participant } = useParticipant();
  const { selectChallenge } = useChallenge();

  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info');

  // Handle incoming lock or completion error from navigation state
  useEffect(() => {
    if (location.state?.lockError) {
      setToastMessage(location.state.lockError);
      setToastType('error');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load challenges, progress, and active sessions
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        const [challengesRes, progRes, sessRes] = await Promise.all([
          challengeApi.getAll().catch(() => ({ success: false, challenges: [] })),
          participant ? challengeApi.getProgress().catch(() => null) : Promise.resolve(null),
          participant ? sessionApi.getUserSessions().catch(() => null) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        let serverList = [];
        if (challengesRes && challengesRes.success && Array.isArray(challengesRes.challenges)) {
          serverList = challengesRes.challenges;
        }

        if (progRes && progRes.success) {
          setProgressData(progRes);
        }

        if (sessRes && sessRes.success && Array.isArray(sessRes.sessions)) {
          setActiveSessions(sessRes.sessions.filter((s) => s.status === 'ACTIVE' && !s.isCompleted));
        }

        setChallenges(serverList);
      } catch (err) {
        console.error('Failed to load roadmap data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [participant]);

  const CANONICAL_FALLBACKS = [
    {
      _id: 'ch-05',
      slug: 'ch-05',
      title: 'Challenge 5 – Greatest Among Three Numbers',
      difficulty: 'Easy',
      points: 100,
      sequenceOrder: 1,
      timeLimitSeconds: 1200,
      description: 'Find the greatest among three integers with optimal comparison logic and edge-case validation.',
    },
    {
      _id: 'ch-06',
      slug: 'ch-06',
      title: 'Challenge 6 – Count Primes up to N',
      difficulty: 'Medium',
      points: 200,
      sequenceOrder: 2,
      timeLimitSeconds: 1200,
      description: 'Implement an efficient primality count algorithm (Sieve of Eratosthenes) up to integer N.',
    },
    {
      _id: 'ch-07',
      slug: 'ch-07',
      title: 'Challenge 7 – Longest Increasing Subsequence',
      difficulty: 'Hard',
      points: 300,
      sequenceOrder: 3,
      timeLimitSeconds: 1200,
      description: 'Determine the length of the longest strictly increasing subsequence in an array using dynamic programming.',
    },
  ];

  // Map the 3 canonical challenges into roadmap steps (Easy -> Medium -> Hard)
  const roadmapSteps = useMemo(() => {
    const sourceList = challenges.length > 0 ? challenges : CANONICAL_FALLBACKS;
    const list = [...sourceList].sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));

    return list.map((c, idx) => {
      const seq = c.sequenceOrder || idx + 1;
      let status = 'LOCKED';
      let previousTitle = '';

      if (idx > 0 && list[idx - 1]) {
        previousTitle = list[idx - 1].title;
      }

      if (participant && progressData?.progress) {
        const item = progressData.progress.find(
          (p) =>
            String(p.challengeId).toLowerCase() === String(c._id).toLowerCase() ||
            String(p.slug || '').toLowerCase() === String(c.slug || '').toLowerCase()
        );
        if (item) {
          status = item.status; // 'COMPLETED' | 'CURRENT' | 'LOCKED'
        } else if (seq === 1) {
          status = 'CURRENT';
        }
      } else {
        // Guest or pending progress data: Step 1 is CURRENT
        status = seq === 1 ? 'CURRENT' : 'LOCKED';
      }

      // Check for active session on this challenge
      const hasActiveSession = activeSessions.some((s) => {
        const sessChalId = typeof s.challengeId === 'object' ? s.challengeId?._id : s.challengeId;
        return (
          String(sessChalId).toLowerCase() === String(c._id).toLowerCase() ||
          String(s.challengeId?.slug || '').toLowerCase() === String(c.slug || '').toLowerCase()
        );
      });

      const tasksCount = Array.isArray(c.tasks) ? c.tasks.length : 3;
      const blocksCount = c.languageConfigs?.[0]?.blockCount || tasksCount;
      const durationMin = Math.round((c.timeLimitSeconds || 1200) / 60);

      return {
        ...c,
        sequenceOrder: seq,
        status,
        previousTitle,
        hasActiveSession,
        tasksCount,
        blocksCount,
        durationMin,
      };
    });
  }, [challenges, progressData, activeSessions, participant]);

  const currentStep = useMemo(() => {
    return roadmapSteps.find((s) => s.status === 'CURRENT') || roadmapSteps[0] || null;
  }, [roadmapSteps]);


  const completedCount = useMemo(() => {
    return roadmapSteps.filter((s) => s.status === 'COMPLETED').length;
  }, [roadmapSteps]);

  const earnedPoints = useMemo(() => {
    return roadmapSteps
      .filter((s) => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + (Number(s.points) || 0), 0);
  }, [roadmapSteps]);

  const totalPoints = useMemo(() => {
    return roadmapSteps.reduce((sum, s) => sum + (Number(s.points) || 0), 0);
  }, [roadmapSteps]);

  const allCompleted = progressData?.allCompleted || completedCount === 3;

  const handleStartChallenge = (step) => {
    if (!participant) {
      navigate('/register');
      return;
    }
    const targetSlug = step.slug || step._id;
    selectChallenge(targetSlug);
    navigate(`/challenge?id=${targetSlug}`);
  };

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-50 text-emerald-600 border-emerald-300';
      case 'hard':
        return 'bg-rose-50 text-rose-600 border-rose-300';
      case 'medium':
      default:
        return 'bg-amber-50 text-amber-600 border-amber-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-mono py-8 px-4 sm:px-6 lg:px-8">
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {/* ── HEADER BANNER ── */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 text-[11px] font-bold uppercase tracking-widest">
                <Layers className="w-3.5 h-3.5" /> LINEAR ARENA SEQUENCE
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                MISSION ROADMAP
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Progress through a strict linear sequence: Easy first, unlock Medium upon acceptance, then Hard.
                Challenges cannot be skipped or chosen freely.
              </p>

              {currentStep && (
                <div className="pt-2">
                  {participant ? (
                    <button
                      onClick={() => handleStartChallenge(currentStep)}
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-[#F28C0F] hover:bg-orange-500 active:scale-95 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase transition shadow-lg shadow-orange-500/25 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>{currentStep.hasActiveSession ? 'RESUME ARENA' : 'START CHALLENGE'} (Step {currentStep.sequenceOrder}: {currentStep.difficulty})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-[#F28C0F] hover:bg-orange-500 active:scale-95 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase transition shadow-lg shadow-orange-500/25"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>REGISTER TO START CHALLENGE</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Header Stats */}
            <div className="flex flex-row md:flex-col gap-3 min-w-[200px] w-full md:w-auto">
              <div className="flex-1 md:flex-initial p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                </span>
                <span className="text-sm font-black text-emerald-600">
                  {completedCount} / 3
                </span>
              </div>
              <div className="flex-1 md:flex-initial p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" /> Points Earned
                </span>
                <span className="text-sm font-black text-amber-600">
                  {earnedPoints} <span className="text-[10px] text-slate-400">/ {totalPoints || 600}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── TOP-LEVEL STEPPER ── */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md">
          <MissionStepper
            progress={roadmapSteps.map((s) => ({
              sequenceOrder: s.sequenceOrder,
              difficulty: s.difficulty,
              status: s.status,
              title: s.title,
            }))}
          />
        </div>

        {/* ── GUEST / UNREGISTERED NOTICE ── */}
        {!participant && (
          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-600 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Contestant Registration Required</h4>
                <p className="text-[11px] text-slate-600 font-sans">
                  Register your ID to begin the Easy challenge and record your official tournament leaderboard time.
                </p>
              </div>
            </div>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-[#F28C0F] hover:bg-orange-500 text-slate-950 font-bold text-xs tracking-wider transition shrink-0 flex items-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              REGISTER TO BEGIN <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* ── ALL CHALLENGES COMPLETED BANNER ── */}
        {allCompleted && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-emerald-50 to-orange-50 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-600 flex items-center justify-center text-xl shrink-0">
                🏆
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">ALL CHALLENGES COMPLETED</h3>
                <p className="text-xs text-amber-800 font-sans">
                  You have successfully solved the entire Mind Craft mission track with {earnedPoints} points!
                </p>
              </div>
            </div>
            <Link
              to="/leaderboard"
              className="px-5 py-2.5 rounded-xl bg-[#F28C0F] hover:bg-orange-500 text-slate-950 font-black text-xs tracking-wider transition shrink-0"
            >
              VIEW FINAL STANDINGS
            </Link>
          </div>
        )}

        {/* ── ROADMAP 3 STEPS ── */}
        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 bg-white border border-slate-200 rounded-2xl animate-pulse h-36"
              />
            ))
          ) : (
            roadmapSteps.map((step) => {
              const isCompleted = step.status === 'COMPLETED';
              const isCurrent = step.status === 'CURRENT';
              const isLocked = step.status === 'LOCKED';

              return (
                <div
                  key={step.slug || step._id}
                  className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                    isCompleted
                      ? 'bg-white border-emerald-300 shadow-sm'
                      : isCurrent
                      ? 'bg-white border-orange-400 shadow-lg ring-1 ring-orange-300'
                      : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  {/* Left: Step Info */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                          : isCurrent
                          ? 'bg-orange-50 text-orange-600 border-orange-400 shadow-sm shadow-orange-500/20'
                          : 'bg-slate-200 text-slate-400 border-slate-300'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : isLocked ? <Lock className="w-4 h-4 text-slate-400" /> : step.sequenceOrder}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-bold uppercase">
                          Step {step.sequenceOrder}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${getDifficultyBadge(
                            step.difficulty
                          )}`}
                        >
                          {step.difficulty}
                        </span>
                        <span className="text-[10px] text-amber-600 font-black flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500" />
                          {step.points} PTS
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {step.durationMin}m
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                        {step.title}
                      </h2>

                      <p className="text-xs text-slate-600 max-w-xl font-sans leading-relaxed">
                        {step.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span>{step.tasksCount} Progressive Tasks</span>
                        <span>•</span>
                        <span>{step.blocksCount} Code Fragments</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Area */}
                  <div className="shrink-0 w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                    {isCompleted && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Completed ✓</span>
                      </div>
                    )}

                    {isCurrent && participant && (
                      <button
                        onClick={() => handleStartChallenge(step)}
                        className="w-full md:w-auto px-7 py-3 rounded-2xl bg-[#F28C0F] hover:bg-orange-500 active:scale-95 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>{step.hasActiveSession ? 'RESUME ARENA' : 'START CHALLENGE'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {isCurrent && !participant && (
                      <Link
                        to="/register"
                        className="w-full md:w-auto px-7 py-3 rounded-2xl bg-[#F28C0F] hover:bg-orange-500 active:scale-95 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>REGISTER TO START</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}

                    {isLocked && (
                      <div className="inline-flex items-center gap-2 text-xs text-slate-500 italic">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Complete {step.previousTitle || 'previous challenge'} to unlock</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
