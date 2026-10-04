import React, { useState, useEffect } from 'react';
import { useParticipant } from '../context/ParticipantContext';
import { leaderboardApi } from '../services/leaderboardApi';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import Podium from '../components/leaderboard/Podium';
import { Trophy, Users, RefreshCw } from 'lucide-react';

export default function Leaderboard() {
  const { participant } = useParticipant();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

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

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10 font-mono">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
          <Trophy className="w-3.5 h-3.5 text-[#F28C0F]" />
          <span>TOURNAMENT STANDINGS</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">Live Leaderboard</h1>
        <p className="text-xs text-slate-600 max-w-xl mx-auto">
          Centrally managed across 3 Challenges (Easy, Medium, Hard • 15 mins each). Participants start at 0 points.
          <strong className="text-orange-600 ml-1">Winner: Completed all 3 challenges with minimum negative points!</strong>
        </p>
        <div className="text-[11px] text-slate-500 flex items-center justify-center gap-2 pt-1">
          <span>Auto-sync: {lastRefreshed.toLocaleTimeString()}</span>
          <button
            onClick={fetchLeaderboard}
            className="text-[#F28C0F] hover:text-orange-600 transition"
            title="Refresh leaderboard"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {topThree.length >= 3 && <Podium topThree={topThree} />}

      {/* FULL LEADERBOARD TABLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <span className="flex items-center gap-1.5 font-bold">
            <Users className="w-4 h-4 text-[#F28C0F]" /> Total Ranked Participants: {rankings.length}
          </span>
          <span className="text-[11px] text-slate-500">
            Rank Rule: Solved (3/3 first) → Minimum Negative Points → Total Time
          </span>
        </div>
        <LeaderboardTable
          rankings={rankings}
          currentParticipantId={participant?.participantId}
        />
      </div>
    </div>
  );
}
