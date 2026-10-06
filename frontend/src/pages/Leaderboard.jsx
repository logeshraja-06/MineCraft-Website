import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useParticipant } from '../context/ParticipantContext';
import { leaderboardApi } from '../services/leaderboardApi';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import Podium from '../components/leaderboard/Podium';
import { Trophy, Users, RefreshCw, Search, Target, BarChart2 } from 'lucide-react';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { participant } = useParticipant();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/leaderboard', { replace: true });
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#07080D] text-center font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md bg-[#0B0D15] p-8 sm:p-10 border border-purple-900/40 rounded-none space-y-5 text-left"
        >
          <div className="w-12 h-12 bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 rounded-none">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-2xl font-normal text-white tracking-tight">Admin Only Access</h2>
          <p className="text-slate-400 text-sm leading-relaxed font-normal">
            The competition leaderboard is restricted to event administrators to ensure fair gameplay. Official final standings will be published upon tournament conclusion.
          </p>
          <div className="pt-2">
            <Link
              to="/challenges"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-purple-800 hover:bg-slate-100 font-medium rounded-none text-xs tracking-wider transition-colors"
            >
              Return To Challenges
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const fetchLeaderboard = async () => {
    try {
      const res = await leaderboardApi.getLiveLeaderboard();
      if (res.success && Array.isArray(res.rankings)) {
        setRankings(res.rankings);
      }
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    const stopPolling = () => clearInterval(interval);
    window.addEventListener('mindcraft_auth_expired', stopPolling);
    return () => {
      clearInterval(interval);
      window.removeEventListener('mindcraft_auth_expired', stopPolling);
    };
  }, []);

  const topThree = rankings.slice(0, 3);

  const filteredRankings = useMemo(() => {
    if (!searchQuery) return rankings;
    const query = searchQuery.toLowerCase();
    return rankings.filter(r =>
      r.name?.toLowerCase().includes(query) ||
      r.participantId?.toLowerCase().includes(query) ||
      r.college?.toLowerCase().includes(query)
    );
  }, [rankings, searchQuery]);

  const stats = useMemo(() => {
    const totalRanked = rankings.length;
    let totalSolves = 0;
    let topScore = -9999;

    rankings.forEach(r => {
      const solved = r.challengesSolved ?? (r.status?.toUpperCase() === 'ACCEPTED' ? 1 : 0);
      totalSolves += solved;
      const score = r.score ?? r.totalScore ?? 0;
      if (score > topScore) topScore = score;
    });

    if (topScore === -9999) topScore = 0;

    return { totalRanked, totalSolves, topScore };
  }, [rankings]);

  return (
    <div className="min-h-screen bg-[#07080D] font-sans text-slate-100 selection:bg-purple-600 selection:text-white relative overflow-hidden">

      {/* ── TOP SCROLL PROGRESS BAR ── */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-fuchsia-400 to-amber-400 origin-left z-[100] shadow-[0_0_12px_rgba(168,85,247,0.8)]"
      />

      {/* ── SECTION 1: HEADER & PODIUM (DARK SECTION) ── */}
      <section className="w-full bg-[#07080D] py-16 sm:py-20 px-6 sm:px-8 lg:px-12 border-b border-purple-900/20">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Header Row */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div className="space-y-3 max-w-2xl text-left">
              <h1 className="text-4xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
                Tournament Leaderboard
              </h1>
              <p className="text-sm text-slate-400 font-normal leading-relaxed">
                Live rankings across all 3 tiers. Winner criteria: completed all 3 challenges with minimum negative points.
              </p>
            </div>

            {/* Auto Sync & Refresh */}
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Live: {lastRefreshed.toLocaleTimeString()}
              </span>
              <span>·</span>
              <button
                type="button"
                onClick={fetchLeaderboard}
                className="text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh standings"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </motion.div>

          {/* Top 3 Podium Showcase */}
          {topThree.length >= 3 && (
            <div className="pt-4">
              <Podium topThree={topThree} />
            </div>
          )}

        </div>
      </section>

      {/* ── SECTION 2: METRICS & FULL STANDINGS (PURE WHITE SECTION) ── */}
      <section className="w-full bg-white text-slate-900 py-20 px-6 sm:px-8 lg:px-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-10">

          {/* 3 Metrics Cards (Sharp, Editorial Staggered Pop-in) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              {
                icon: <Users className="w-6 h-6 text-slate-700" />,
                label: 'Total Ranked Contestants',
                val: stats.totalRanked
              },
              {
                icon: <Target className="w-6 h-6 text-emerald-700" />,
                label: 'Completed Challenge Solves',
                val: stats.totalSolves
              },
              {
                icon: <BarChart2 className="w-6 h-6 text-amber-700" />,
                label: 'Leading Score',
                val: `${stats.topScore} pts`
              }
            ].map((metric, idx) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5, borderColor: '#7c3aed' }}
                className="border border-slate-200 bg-slate-50/70 p-6 rounded-none flex items-center gap-4 transition-colors shadow-xs"
              >
                <div className="w-12 h-12 bg-white border border-slate-200 flex items-center justify-center rounded-none shrink-0">
                  {metric.icon}
                </div>
                <div>
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                    {metric.label}
                  </span>
                  <div className="text-2xl font-mono font-medium text-slate-900">{metric.val}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Search Bar & Rank Rule Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 text-left"
          >
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-none bg-white placeholder-slate-400 text-slate-900 text-sm focus:outline-none focus:border-slate-800 transition-colors"
                placeholder="Search by contestant name, ID or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="text-xs font-mono text-slate-500">
              Rank Rule: Solves (3/3 first) → Minimum Negative Score → Cumulative Time
            </div>
          </motion.div>

          {/* Full Standings Table */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.7 }}
            className="pt-2"
          >
            <LeaderboardTable
              rankings={filteredRankings}
              currentParticipantId={participant?.participantId}
            />
          </motion.div>

        </div>
      </section>

    </div>
  );
}
