import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useParticipant } from '../context/ParticipantContext';
import { useChallenge } from '../hooks/useChallenge';
import { useAuth } from '../hooks/useAuth';
import { challengeApi } from '../services/challengeApi';
import Button from '../components/common/Button';
import { Trophy, Award, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';

export default function Result() {
  const navigate = useNavigate();
  const { participant } = useParticipant();
  const { isAdmin } = useAuth();
  const { challenge, finalResult, isTimeExpired, startChallenge, selectChallenge } = useChallenge();

  const [nextChallenge, setNextChallenge] = useState(null);
  const [allCompleted, setAllCompleted] = useState(false);

  useEffect(() => {
    if (!participant) {
      navigate('/register', { replace: true });
    }
  }, [participant, navigate]);

  const isAccepted = finalResult?.status === 'ACCEPTED';
  const passedTests = finalResult?.passedCount ?? (isAccepted ? (finalResult?.totalCount || 3) : 0);
  const totalTests = finalResult?.totalCount ?? 3;

  useEffect(() => {
    let cancelled = false;

    async function loadProgression() {
      try {
        const res = await challengeApi.getProgress();
        if (cancelled) return;
        if (res.success && Array.isArray(res.progress)) {
          const allDone = res.allCompleted || (res.progress.length > 0 && res.progress.every((p) => p.status === 'COMPLETED'));
          setAllCompleted(allDone);

          const currentId = String(challenge?.id || challenge?.slug || '').toLowerCase();
          const currentItem = res.progress.find(
            (p) =>
              String(p.challengeId).toLowerCase() === currentId ||
              String(p.slug || '').toLowerCase() === currentId
          );
          const currentSeq = currentItem ? (currentItem.sequenceOrder || currentItem.tier || 1) : 1;

          // Find the next sequence challenge
          const next = res.progress.find((p) => (p.sequenceOrder || p.tier) === currentSeq + 1);
          if (next) {
            setNextChallenge(next);
            sessionStorage.setItem('just_unlocked_tier', next.difficulty);
          }
        }
      } catch (err) {
        console.warn('Failed to load progress in Result.jsx:', err);
      }
    }

    loadProgression();
    return () => {
      cancelled = true;
    };
  }, [challenge?.id, challenge?.slug]);

  if (!participant) {
    return null;
  }

  const isAutoSubmit = Boolean(finalResult?.isAutoSubmit);
  const hasTimeExpired = isTimeExpired || isAutoSubmit;

  return (
    <div className="relative min-w-full min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
      {/* Background ambient portal glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-2xl mx-auto text-center space-y-8 font-sans">
        {/* Main Result Card */}
        <div className="relative p-8 md:p-10 rounded-3xl bg-[#0D0F18]/90 border border-purple-500/30 backdrop-blur-2xl shadow-[0_0_60px_rgba(168,85,247,0.18)] space-y-6">
          {/* Creeper / World Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.2 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[11px] font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>SESSION SUMMARY • {challenge?.difficulty?.toUpperCase() || 'CHALLENGE'}</span>
          </div>

          {/* Trophy / Status Icon */}
          <div className="pt-2">
            <div
              className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center transition-all duration-500 ${
                isAccepted
                  ? 'bg-gradient-to-br from-purple-900/60 via-purple-950/80 to-[#0A0B10] border-2 border-purple-400/80 text-purple-200 shadow-[0_0_40px_rgba(168,85,247,0.45)]'
                  : 'bg-gradient-to-br from-rose-950/50 via-[#120B12] to-[#0A0B10] border-2 border-rose-500/50 text-rose-300 shadow-[0_0_35px_rgba(244,63,94,0.3)]'
              }`}
            >
              {isAccepted ? (
                <Trophy className="w-12 h-12 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-bounce" />
              ) : (
                <Award className="w-12 h-12 text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
              )}
            </div>
          </div>

          {/* Headline & Description */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">
              {isAccepted ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-300 to-indigo-300">
                  CHALLENGE COMPLETED
                </span>
              ) : hasTimeExpired ? (
                <span className="text-rose-400">TIME EXPIRED (AUTO-SUBMITTED)</span>
              ) : (
                <span className="text-rose-400">NOT ACCEPTED</span>
              )}
            </h1>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              {isAccepted
                ? 'All test cases verified! Your solution was correctly assembled. 0 negative points applied.'
                : hasTimeExpired
                ? `Time limit expired. Your assembly was automatically submitted and evaluated (${finalResult?.totalPenaltyPoints !== undefined ? `-${finalResult.totalPenaltyPoints}` : (finalResult?.score !== undefined ? `${finalResult.score}` : '-200')} pts penalty applied).`
                : 'Challenge session concluded. Review diagnostics and tournament standings below.'}
            </p>
          </div>

          {isAccepted && allCompleted && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-purple-950/60 to-amber-950/60 border border-amber-400/50 text-amber-200 font-bold text-sm inline-flex items-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
              <span className="text-xl">👑</span>
              <span className="tracking-wider uppercase">ALL CHALLENGES CONQUERED • MASTER OF MINDCRAFT</span>
              <span className="text-xl">🏆</span>
            </div>
          )}

          {/* RESULT METRICS CARD */}
          <div className="p-5 bg-[#07080D]/90 border border-purple-500/20 rounded-2xl shadow-inner grid grid-cols-2 sm:grid-cols-5 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-purple-900/30">
            <div className="pt-2 sm:pt-0">
              <span className="text-[10px] text-purple-300/70 font-semibold uppercase tracking-wider block">Participant</span>
              <p className="text-sm font-bold text-slate-100 truncate mt-1">{participant?.name || 'Participant'}</p>
              {participant?.participantId && (
                <span className="text-[10px] text-purple-400 font-mono block mt-0.5">{participant.participantId}</span>
              )}
            </div>
            <div className="pt-2 sm:pt-0">
              <span className="text-[10px] text-purple-300/70 font-semibold uppercase tracking-wider block">Challenge</span>
              <p className="text-sm font-bold text-purple-300 truncate mt-1">{challenge?.title || 'Active'}</p>
            </div>
            <div className="pt-2 sm:pt-0">
              <span className="text-[10px] text-purple-300/70 font-semibold uppercase tracking-wider block">Status</span>
              <p className={`text-sm font-black mt-1 ${isAccepted ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isAccepted ? 'ACCEPTED' : (hasTimeExpired ? 'TIME EXPIRED' : 'UNFINISHED')}
              </p>
            </div>
            <div className="pt-2 sm:pt-0">
              <span className="text-[10px] text-purple-300/70 font-semibold uppercase tracking-wider block">Tests Passed</span>
              <p className="text-sm font-bold text-slate-100 font-mono mt-1">
                {passedTests} / {totalTests}
              </p>
            </div>
            <div className="pt-2 sm:pt-0">
              <span className="text-[10px] text-purple-300/70 font-semibold uppercase tracking-wider block">Penalty</span>
              <p className={`text-sm font-black font-mono mt-1 ${isAccepted ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isAccepted ? '0 PTS' : (finalResult?.totalPenaltyPoints !== undefined ? `-${finalResult.totalPenaltyPoints} PTS` : (finalResult?.score !== undefined ? `${finalResult.score} PTS` : '-200 PTS'))}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {/* Show NEXT REALM if next challenge exists and not all completed */}
            {nextChallenge && !allCompleted && (
              <button
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm tracking-wide shadow-[0_0_30px_rgba(168,85,247,0.45)] hover:shadow-[0_0_40px_rgba(168,85,247,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                onClick={() => {
                  const nextId = nextChallenge.slug || nextChallenge.challengeId;
                  selectChallenge(nextId);
                  navigate(`/challenge?id=${nextId}`);
                }}
              >
                <span>NEXT REALM ({nextChallenge.difficulty?.toUpperCase()})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* View Standings button */}
            <Link to={isAdmin ? "/admin/leaderboard" : "/leaderboard"}>
              <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-purple-950/80 hover:bg-purple-900/90 text-purple-200 border border-purple-500/40 font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                <span>VIEW STANDINGS</span>
                <Trophy className="w-4 h-4 text-purple-400" />
              </button>
            </Link>

            {/* Roadmap button */}
            <Link to="/challenges">
              <button className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-transparent hover:bg-slate-900/80 text-slate-300 border border-slate-700/60 hover:border-purple-500/40 font-semibold text-sm tracking-wide transition-all">
                <span>MISSION ROADMAP</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
