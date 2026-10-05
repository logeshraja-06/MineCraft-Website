import React, { useState, useEffect, useMemo } from 'react';
import { useParticipant } from '../context/ParticipantContext';
import { leaderboardApi } from '../services/leaderboardApi';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import Podium from '../components/leaderboard/Podium';
import { Trophy, Users, RefreshCw, Sparkles, Activity, Search, Target, BarChart2 } from 'lucide-react';

export default function Leaderboard() {
  const { participant } = useParticipant();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="relative min-h-screen font-sans overflow-hidden bg-slate-50/30">
      {/* Dynamic Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F28C0F] rounded-full mix-blend-multiply blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-amber-400 rounded-full mix-blend-multiply blur-[100px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-orange-300 rounded-full mix-blend-multiply blur-[150px] opacity-20 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-orange-200/60 text-orange-700 text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-default">
            <Activity className="w-4 h-4 text-[#F28C0F] animate-pulse" />
            <span className="tracking-widest uppercase">Live Tournament Standings</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 drop-shadow-sm">
            Global <span className="bg-gradient-to-r from-[#F28C0F] to-amber-500 bg-clip-text text-transparent">Leaderboard</span>
          </h1>
          
          <div className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed bg-white/50 p-4 rounded-2xl backdrop-blur-sm border border-white/60 shadow-sm">
            <p>Centrally managed across 3 Challenges (Easy, Medium, Hard • 15 mins each).</p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-orange-800"><strong className="font-bold">Winner criteria:</strong> Completed all 3 challenges with minimum negative points!</span>
            </div>
          </div>
          
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-2 pt-2 bg-white/50 w-fit mx-auto px-4 py-2 rounded-full border border-slate-200/60 backdrop-blur-sm shadow-sm">
            <span className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              Auto-sync: {lastRefreshed.toLocaleTimeString()}
            </span>
            <div className="w-px h-3 bg-slate-300"></div>
            <button
              onClick={fetchLeaderboard}
              className="text-[#F28C0F] hover:text-orange-600 hover:bg-orange-50 p-1.5 rounded-full transition-all group"
              title="Refresh leaderboard"
            >
              <RefreshCw className={`w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin text-orange-500' : ''}`} />
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
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Ranked</p>
              <h4 className="text-2xl font-black text-slate-800">{stats.totalRanked}</h4>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Solves</p>
              <h4 className="text-2xl font-black text-slate-800">{stats.totalSolves}</h4>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Highest Score</p>
              <h4 className="text-2xl font-black text-slate-800">{stats.topScore} <span className="text-xs font-medium text-slate-400">pts</span></h4>
            </div>
          </div>
        </div>

        {/* FULL LEADERBOARD TABLE */}
        <div className="space-y-4 relative z-10 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 px-2 gap-4">
            
            {/* SEARCH BAR */}
            <div className="relative w-full sm:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[#F28C0F] transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200/60 rounded-xl leading-5 bg-white/70 backdrop-blur-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F28C0F]/50 focus:border-[#F28C0F] sm:text-sm transition-all shadow-sm"
                placeholder="Search by name, ID or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="text-[11px] font-medium text-slate-500 bg-white/60 px-4 py-2.5 rounded-xl backdrop-blur-sm border border-slate-200/60 shadow-sm flex items-center gap-2">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-200/80 text-[9px] font-black text-slate-600">i</span>
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
