import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useParticipant } from '../context/ParticipantContext';
import { leaderboardApi } from '../services/leaderboardApi';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import Podium from '../components/leaderboard/Podium';
import { Trophy, Users, RefreshCw, Sparkles, Activity, Search, Target, BarChart2 } from 'lucide-react';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { participant } = useParticipant();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/leaderboard', { replace: true });
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#07080D] text-center font-sans relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-md bg-[#0D0F18]/90 p-8 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.2)] border border-purple-500/30 space-y-4 backdrop-blur-xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/60 text-purple-300 border border-purple-500/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Admin Only Access</h2>
          <p className="text-purple-200/70 text-sm leading-relaxed">
            The competition leaderboard is restricted to event administrators. Official final standings and tournament winners will be announced by the coordinators.
          </p>
          <div className="pt-2">
            <Link
              to="/challenges"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-full text-xs tracking-wider transition shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/40"
            >
              RETURN TO CHALLENGES
            </Link>
          </div>
        </div>
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

  // Calculate some fun stats
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
    <div className="relative min-h-screen font-sans overflow-hidden bg-[#07080D] text-slate-100">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-fuchsia-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 z-10">
        {/* Header Section */}
        <div className="text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm cursor-default">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]" />
            <span className="tracking-widest uppercase">Live Tournament Standings</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
            Global <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">Leaderboard</span>
          </h1>
          
          <div className="text-sm text-purple-200/70 max-w-2xl mx-auto leading-relaxed bg-[#0D0F18]/80 p-4 rounded-2xl backdrop-blur-xl border border-purple-500/20 shadow-md">
            <p>Centrally managed across 3 Challenges (Easy, Medium, Hard • 15 mins each).</p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-purple-950/50 px-3 py-1.5 rounded-lg border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-purple-200"><strong className="font-bold text-white">Winner criteria:</strong> Completed all 3 challenges with minimum negative points!</span>
            </div>
          </div>
          
          <div className="text-[11px] font-medium text-purple-300/70 flex items-center justify-center gap-2 pt-2 bg-[#0D0F18]/80 w-fit mx-auto px-4 py-2 rounded-full border border-purple-500/25 backdrop-blur-xl shadow-md">
            <span className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              Auto-sync: {lastRefreshed.toLocaleTimeString()}
            </span>
            <div className="w-px h-3 bg-purple-500/30"></div>
            <button
              onClick={fetchLeaderboard}
              className="text-purple-300 hover:text-white hover:bg-purple-900/40 p-1.5 rounded-full transition-all group"
              title="Refresh leaderboard"
            >
              <RefreshCw className={`w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* TOP 3 PODIUM */}
        {topThree.length >= 3 && (
          <div className="relative z-10">
            <Podium topThree={topThree} />
          </div>
        )}

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto relative z-10 pt-4">
          <div className="bg-[#0D0F18]/85 backdrop-blur-xl border border-purple-500/25 rounded-2xl p-4 flex items-center gap-4 shadow-[0_0_25px_rgba(168,85,247,0.1)] hover:border-purple-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-950/70 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-purple-300/60 font-bold uppercase tracking-widest">Total Ranked</p>
              <h4 className="text-2xl font-black text-white">{stats.totalRanked}</h4>
            </div>
          </div>
          <div className="bg-[#0D0F18]/85 backdrop-blur-xl border border-emerald-500/25 rounded-2xl p-4 flex items-center gap-4 shadow-[0_0_25px_rgba(16,185,129,0.1)] hover:border-emerald-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-300/60 font-bold uppercase tracking-widest">Total Solves</p>
              <h4 className="text-2xl font-black text-white">{stats.totalSolves}</h4>
            </div>
          </div>
          <div className="bg-[#0D0F18]/85 backdrop-blur-xl border border-amber-500/25 rounded-2xl p-4 flex items-center gap-4 shadow-[0_0_25px_rgba(245,158,11,0.1)] hover:border-amber-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-amber-300/60 font-bold uppercase tracking-widest">Highest Score</p>
              <h4 className="text-2xl font-black text-white">{stats.topScore} <span className="text-xs font-medium text-slate-400">pts</span></h4>
            </div>
          </div>
        </div>

        {/* FULL LEADERBOARD TABLE */}
        <div className="space-y-4 relative z-10 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-purple-200/70 px-2 gap-4">
            
            {/* SEARCH BAR */}
            <div className="relative w-full sm:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-purple-400 group-focus-within:text-purple-300 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-purple-500/30 rounded-xl leading-5 bg-[#0D0F18]/90 backdrop-blur-xl placeholder-purple-300/40 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 sm:text-sm transition-all shadow-inner"
                placeholder="Search by name, ID or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="text-[11px] font-medium text-purple-200/60 bg-[#0D0F18]/80 px-4 py-2.5 rounded-xl backdrop-blur-xl border border-purple-500/20 shadow-md flex items-center gap-2">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-950 border border-purple-500/40 text-[9px] font-black text-purple-300">i</span>
              Rank Rule: Solved (3/3 first) → Min Negative Pts → Total Time
            </div>
          </div>
          
          <div className="transform transition-all duration-500">
            <LeaderboardTable
              rankings={filteredRankings}
              currentParticipantId={participant?.participantId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
