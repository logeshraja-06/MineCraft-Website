import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useChallenge } from '../hooks/useChallenge';
import { useParticipant } from '../context/ParticipantContext';
import { useAuth } from '../hooks/useAuth';
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
  const { isAdmin } = useAuth();
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
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
      case 'hard':
        return 'bg-rose-950/60 text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
      case 'medium':
      default:
        return 'bg-purple-950/60 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]';
    }
  };

  return (
    <div className="min-h-screen bg-[#07080D] text-slate-100 font-mono py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* ── HEADER BANNER ── */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-[#0D0F18]/85 border border-purple-500/25 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.12)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              {/* Creeper badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]" />
                BUILT FOR CREATORS // LINEAR ARENA SEQUENCE
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                MISSION <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">ROADMAP</span>
              </h1>
              <p className="text-xs text-purple-200/70 leading-relaxed font-sans">
                Progress through a strict linear Nether portal sequence: solve Easy first, unlock Medium upon acceptance, then Hard.
                Challenges cannot be skipped or chosen freely.
              </p>

              {currentStep && (
                <div className="pt-2">
                  {participant ? (
                    <button
                      onClick={() => handleStartChallenge(currentStep)}
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-black text-xs sm:text-sm tracking-wider uppercase transition shadow-[0_0_30px_rgba(168,85,247,0.4)] border border-purple-400/40 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{currentStep.hasActiveSession ? 'RESUME ARENA' : 'ENTER THE PORTAL'} (Step {currentStep.sequenceOrder}: {currentStep.difficulty})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-black text-xs sm:text-sm tracking-wider uppercase transition shadow-[0_0_30px_rgba(168,85,247,0.4)] border border-purple-400/40"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>REGISTER TO ENTER THE PORTAL</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Header Stats */}
            <div className="flex flex-row md:flex-col gap-3 min-w-[200px] w-full md:w-auto">
              <div className="flex-1 md:flex-initial p-3.5 rounded-2xl bg-[#141724]/80 border border-purple-500/20 flex items-center justify-between gap-3 shadow-inner">
                <span className="text-[11px] text-purple-200/70 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed
                </span>
                <span className="text-sm font-black text-emerald-400">
                  {completedCount} / 3
                </span>
              </div>
              <div className="flex-1 md:flex-initial p-3.5 rounded-2xl bg-[#141724]/80 border border-purple-500/20 flex items-center justify-between gap-3 shadow-inner">
                <span className="text-[11px] text-purple-200/70 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> Points Earned
                </span>
                <span className="text-sm font-black text-amber-300">
                  {earnedPoints} <span className="text-[10px] text-slate-500">/ {totalPoints || 600}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── TOP-LEVEL STEPPER ── */}
        <div className="p-4 rounded-2xl bg-[#0D0F18]/85 border border-purple-500/20 shadow-md backdrop-blur-xl">
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
          <div className="p-4 rounded-2xl bg-[#0D0F18]/90 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Contestant Registration Required</h4>
                <p className="text-[11px] text-purple-200/60 font-sans">
                  Register your ID to begin the Easy challenge and record your official tournament leaderboard time.
                </p>
              </div>
            </div>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider transition shrink-0 flex items-center gap-1.5 shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-purple-400/40"
            >
              REGISTER TO BEGIN <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* ── ALL CHALLENGES COMPLETED BANNER ── */}
        {allCompleted && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#0D0F18] to-indigo-950/80 border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_35px_rgba(168,85,247,0.25)] text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xl shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                🏆
              </div>
              <div>
                <h3 className="text-sm font-black text-white">ALL CHALLENGES COMPLETED</h3>
                <p className="text-xs text-purple-200/70 font-sans">
                  You have successfully conquered the entire Mind Craft Nether track with {earnedPoints} points!
                </p>
              </div>
            </div>
            {isAdmin ? (
              <Link
                to="/admin/leaderboard"
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs tracking-wider transition shrink-0 border border-purple-400/40 shadow-lg"
              >
                VIEW FINAL STANDINGS
              </Link>
            ) : (
              <div className="px-4 py-2.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold text-xs tracking-wider shrink-0 text-center">
                RESULTS MANAGED BY ADMIN
              </div>
            )}
          </div>
        )}

        {/* ── ROADMAP 3 STEPS ── */}
        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 bg-[#0D0F18]/80 border border-purple-500/15 rounded-2xl animate-pulse h-36"
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
                  className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-xl ${
                    isCompleted
                      ? 'bg-[#0D0F18]/85 border-emerald-500/35 shadow-[0_0_25px_rgba(16,185,129,0.12)]'
                      : isCurrent
                      ? 'bg-[#0D0F18]/90 border-purple-500/50 shadow-[0_0_35px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/30'
                      : 'bg-[#090A10]/70 border-slate-800/80 opacity-60'
                  }`}
                >
                  {/* Left: Step Info */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                        isCompleted
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                          : isCurrent
                          ? 'bg-purple-950/70 text-purple-200 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.35)] animate-pulse'
                          : 'bg-slate-900 text-slate-600 border-slate-800'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : isLocked ? <Lock className="w-4 h-4 text-slate-500" /> : step.sequenceOrder}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase">
                          Step {step.sequenceOrder}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${getDifficultyBadge(
                            step.difficulty
                          )}`}
                        >
                          {step.difficulty}
                        </span>
                        <span className="text-[10px] text-amber-400 font-black flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          {step.points} PTS
                        </span>
                        <span className="text-[10px] text-purple-200/60 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-400" />
                          {step.durationMin}m
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {step.title}
                      </h2>

                      <p className="text-xs text-purple-200/70 max-w-xl font-sans leading-relaxed">
                        {step.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-purple-300/50 pt-1">
                        <span>{step.tasksCount} Progressive Tasks</span>
                        <span>•</span>
                        <span>{step.blocksCount} Code Fragments</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Area */}
                  <div className="shrink-0 w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                    {isCompleted && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Completed ✓</span>
                      </div>
                    )}

                    {isCurrent && participant && (
                      <button
                        onClick={() => handleStartChallenge(step)}
                        className="w-full md:w-auto px-7 py-3 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-black text-xs sm:text-sm tracking-wider uppercase transition shadow-[0_0_30px_rgba(168,85,247,0.45)] border border-purple-400/40 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>{step.hasActiveSession ? 'RESUME ARENA' : 'ENTER THE PORTAL'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {isCurrent && !participant && (
                      <Link
                        to="/register"
                        className="w-full md:w-auto px-7 py-3 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-black text-xs sm:text-sm tracking-wider uppercase transition shadow-[0_0_30px_rgba(168,85,247,0.45)] border border-purple-400/40 flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>REGISTER TO START</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}

                    {isLocked && (
                      <div className="inline-flex items-center gap-2 text-xs text-slate-500 italic">
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
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
