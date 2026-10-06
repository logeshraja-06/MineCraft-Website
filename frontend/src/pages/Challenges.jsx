import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useChallenge } from '../hooks/useChallenge';
import { useParticipant } from '../context/ParticipantContext';
import { useAuth } from '../hooks/useAuth';
import { challengeApi } from '../services/challengeApi';
import { sessionApi } from '../services/sessionApi';
import Toast from '../components/common/Toast';
import {
  Trophy,
  CheckCircle2,
  Lock,
  ArrowRight,
  Play,
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

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

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
      image: '/tier-easy.jpg',
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
      image: '/tier-medium.jpg',
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
      image: '/tier-hard.jpg',
    },
  ];

  const roadmapSteps = useMemo(() => {
    const sourceList = challenges.length > 0 ? challenges : CANONICAL_FALLBACKS;
    const list = [...sourceList].sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
    const tierImages = ['/tier-easy.jpg', '/tier-medium.jpg', '/tier-hard.jpg'];

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
          status = item.status;
        } else if (seq === 1) {
          status = 'CURRENT';
        }
      } else {
        status = seq === 1 ? 'CURRENT' : 'LOCKED';
      }

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
      const image = tierImages[idx % 3];

      return {
        ...c,
        sequenceOrder: seq,
        status,
        previousTitle,
        hasActiveSession,
        tasksCount,
        blocksCount,
        durationMin,
        image,
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

  const handleStartChallenge = (step) => {
    if (!participant) {
      navigate('/register');
      return;
    }
    const targetSlug = step.slug || step._id;
    selectChallenge(targetSlug);
    navigate(`/challenge?id=${targetSlug}`);
  };

  return (
    <div className="min-h-screen bg-[#07080D] font-sans text-slate-100 selection:bg-purple-600 selection:text-white relative overflow-hidden">

      {/* ── TOP SCROLL PROGRESS BAR ── */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-fuchsia-400 to-amber-400 origin-left z-[100] shadow-[0_0_12px_rgba(168,85,247,0.8)]"
      />

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* ── SECTION 1: HEADER & STATUS (DARK SECTION) ── */}
      <section className="w-full bg-[#07080D] py-16 sm:py-20 px-6 sm:px-8 lg:px-12 border-b border-purple-900/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <motion.div
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-8 space-y-6 text-left"
          >
            <h1 className="text-4xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              Mission Roadmap
            </h1>
            <p className="text-base text-slate-400 font-normal leading-relaxed max-w-2xl">
              Progress through a strict sequential arena track: complete Easy first, unlock Medium upon acceptance, then tackle Hard. Levels cannot be skipped.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              {currentStep && (
                participant ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handleStartChallenge(currentStep)}
                    className="px-8 py-3.5 bg-white text-purple-800 hover:bg-slate-100 font-medium text-sm tracking-wide rounded-none transition-colors duration-200 shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-purple-800 text-purple-800" />
                    <span>{currentStep.hasActiveSession ? 'Resume Arena' : 'Enter The Portal'} ({currentStep.difficulty} · Tier {currentStep.sequenceOrder})</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/register"
                      className="px-8 py-3.5 bg-white text-purple-800 hover:bg-slate-100 font-medium text-sm tracking-wide rounded-none transition-colors duration-200 shadow-sm flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Register To Enter The Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>

          {/* Quick Stats Block */}
          <motion.div
            initial={{ opacity: 0, x: 35, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-4 border border-purple-900/40 bg-[#0B0D15] p-6 rounded-none space-y-4 text-left"
          >
            <div className="text-xs font-mono text-purple-400 uppercase tracking-wider">
              Contestant Progress
            </div>
            <div className="flex justify-between items-center text-sm border-b border-purple-950/80 pb-3">
              <span className="text-slate-400">Completed Tiers</span>
              <span className="font-mono text-white font-medium">{completedCount} / 3</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-purple-950/80 pb-3">
              <span className="text-slate-400">Points Earned</span>
              <span className="font-mono text-emerald-400 font-medium">{earnedPoints} / {totalPoints || 600}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Active Challenge</span>
              <span className="font-mono text-purple-300 font-medium">Tier {currentStep?.sequenceOrder || 1} ({currentStep?.difficulty || 'Easy'})</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── SECTION 2: 3-TIER ROADMAP WITH IMAGES (PURE WHITE SECTION) ── */}
      <section className="w-full bg-white text-slate-900 py-20 px-6 sm:px-8 lg:px-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl text-left space-y-2"
          >
            <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight">
              Linear Arena Sequence
            </h2>
            <p className="text-sm text-slate-500 font-normal leading-relaxed">
              Each tier provides 15 minutes of countdown time. Clear all checkpoints and assemble the solution to unlock the next level.
            </p>
          </motion.div>

          {/* Guest notice if unregistered */}
          {!participant && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              className="p-6 border border-slate-200 bg-slate-50 rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left"
            >
              <div>
                <h4 className="text-base font-medium text-slate-900">Registration Required</h4>
                <p className="text-xs text-slate-600 font-normal mt-1">
                  Register your participant credentials to record official tournament scores and begin Tier 1.
                </p>
              </div>
              <Link
                to="/register"
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-medium text-xs tracking-wide rounded-none transition-colors duration-200 shrink-0"
              >
                Register Now
              </Link>
            </motion.div>
          )}

          {/* 3 Challenge Steps Cascading In */}
          <div className="space-y-8">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-12 border border-slate-200 bg-slate-50 rounded-none animate-pulse h-48" />
              ))
            ) : (
              roadmapSteps.map((step, idx) => {
                const isCompleted = step.status === 'COMPLETED';
                const isCurrent = step.status === 'CURRENT';
                const isLocked = step.status === 'LOCKED';

                return (
                  <motion.div
                    key={step.slug || step._id}
                    initial={{ opacity: 0, y: 50, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                    className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 rounded-none border transition-all duration-300 text-left ${
                      isCurrent
                        ? 'border-purple-600 bg-purple-50/40 shadow-sm'
                        : isCompleted
                        ? 'border-emerald-300 bg-emerald-50/25'
                        : 'border-slate-200 bg-slate-50/40 opacity-75'
                    }`}
                  >
                    {/* Thumbnail Image (Unrounded) */}
                    <div className="lg:col-span-4 overflow-hidden rounded-none border border-slate-200 aspect-[16/10] bg-slate-900">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-full object-cover rounded-none hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Information */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-slate-500 font-medium">Stage 0{step.sequenceOrder}</span>
                        <span>•</span>
                        <span className={`font-medium ${
                          step.difficulty === 'Easy' ? 'text-emerald-700' :
                          step.difficulty === 'Hard' ? 'text-rose-700' : 'text-purple-700'
                        }`}>
                          {step.difficulty}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">{step.durationMin} Mins</span>
                        <span>•</span>
                        <span className="text-slate-500">{step.points} Pts</span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-medium text-slate-900">
                        {step.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        {step.description}
                      </p>

                      <div className="text-xs text-slate-500 font-mono pt-1">
                        {step.tasksCount} Checkpoint Tasks · {step.blocksCount} Code Fragments · 3 Free Runs
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="lg:col-span-3 flex flex-col items-start lg:items-end justify-center gap-3">
                      {isCompleted && (
                        <div className="text-xs font-mono text-emerald-700 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Tier Completed</span>
                        </div>
                      )}

                      {isCurrent && participant && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => handleStartChallenge(step)}
                          className="w-full lg:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-medium text-xs tracking-wider uppercase rounded-none transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                          <span>{step.hasActiveSession ? 'Resume Arena' : 'Enter Portal'}</span>
                        </motion.button>
                      )}

                      {isCurrent && !participant && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full lg:w-auto">
                          <Link
                            to="/register"
                            className="w-full lg:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-medium text-xs tracking-wider uppercase rounded-none transition-colors duration-200 flex items-center justify-center gap-2 block text-center"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Register To Start</span>
                          </Link>
                        </motion.div>
                      )}

                      {isLocked && (
                        <div className="text-xs font-mono text-slate-400 italic flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Complete Stage 0{step.sequenceOrder - 1} first</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

        </div>
      </section>

      {/* ── SECTION 3: ARENA PROTOCOL REFERENCE (DARK SECTION) ── */}
      <section className="w-full bg-[#07080D] text-slate-100 py-20 px-6 sm:px-8 lg:px-12 border-t border-purple-900/20">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl text-left space-y-2"
          >
            <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
              Arena Protocol &amp; Penalties
            </h2>
            <p className="text-sm text-slate-400 font-normal leading-relaxed">
              Important tournament constraints to keep in mind while solving.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              { rule: 'Rule 01 // Elapsed Time', title: '15-Min Timer (-10 pts / min)', desc: 'Every minute that elapses during your hunt deducts -10 points. Minimize stalls and assemble fragments briskly.' },
              { rule: 'Rule 02 // Accuracy', title: '-20 Pts Per Wrong Answer', desc: 'Answering mini tasks incorrectly incurs an immediate -20 pts deduction. Max 3 attempts per task before explanation reveal.' },
              { rule: 'Rule 03 // Compiler', title: '3 Free Runs Allowance', desc: 'First 3 code test runs are 100% free. Any extra test run beyond 3 incurs a -10 pts penalty. Test thoughtfully!' }
            ].map((p, idx) => (
              <motion.div
                key={p.rule}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.25 }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                whileHover={{ y: -6, borderColor: '#9333ea' }}
                className="border border-purple-950/70 bg-[#0B0D15] p-6 rounded-none space-y-3 transition-colors"
              >
                <span className="text-xs font-mono text-purple-400 font-medium uppercase tracking-wider block">
                  {p.rule}
                </span>
                <h3 className="text-xl font-normal text-white">{p.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
