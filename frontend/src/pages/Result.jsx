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
    if (!isAccepted) return;
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
  }, [isAccepted, challenge?.id, challenge?.slug]);

  if (!participant) {
    return null;
  }

  const isAutoSubmit = Boolean(finalResult?.isAutoSubmit);
  const hasTimeExpired = isTimeExpired || isAutoSubmit;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-8 font-mono">
      <div className="space-y-4">
        <div
          className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-xl ${
            isAccepted
              ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600 shadow-emerald-500/10'
              : 'bg-rose-50 border-2 border-rose-500 text-rose-600 shadow-rose-500/10'
          }`}
        >
          {isAccepted ? <Trophy className="w-10 h-10 animate-bounce text-[#F28C0F]" /> : <Award className="w-10 h-10" />}
        </div>

        <h1 className="text-3xl font-black text-slate-900">
          {isAccepted ? '🏆 CHALLENGE COMPLETED' : (hasTimeExpired ? '⌛ TIME EXPIRED (AUTO-SUBMITTED)' : 'NOT ACCEPTED')}
        </h1>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          {isAccepted
            ? 'All test cases verified! Your solution was correctly assembled. 0 negative points applied.'
            : hasTimeExpired
            ? 'Time limit expired. Your assembly was automatically submitted and evaluated (-50 pts penalty applied).'
            : 'Challenge session concluded. Review diagnostics and tournament standings below.'}
        </p>

        {isAccepted && allCompleted && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 font-bold text-sm inline-flex items-center gap-2 shadow-sm">
            <span>🏆</span>
            <span>ALL CHALLENGES COMPLETED</span>
          </div>
        )}
      </div>

      {/* RESULT METRICS CARD */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Participant</span>
          <p className="text-sm font-bold text-slate-800 truncate mt-1">{participant?.name || 'Participant'}</p>
          {participant?.participantId && (
            <span className="text-[10px] text-[#F28C0F] block">{participant.participantId}</span>
          )}
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Challenge</span>
          <p className="text-sm font-bold text-[#F28C0F] truncate mt-1">{challenge?.title || 'Active Challenge'}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Status</span>
          <p className={`text-sm font-bold mt-1 ${isAccepted ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isAccepted ? 'ACCEPTED' : (hasTimeExpired ? 'TIME EXPIRED' : 'UNFINISHED')}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Tests Passed</span>
          <p className="text-sm font-bold text-slate-800 mt-1">
            {passedTests} / {totalTests}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Penalty Applied</span>
          <p className={`text-sm font-bold mt-1 ${isAccepted ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isAccepted ? '0 PTS (NO PENALTY)' : '-50 PTS'}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        {/* On ACCEPTED: show NEXT CHALLENGE if not all completed */}
        {isAccepted && nextChallenge && !allCompleted && (
          <Button
            variant="primary"
            size="lg"
            className="bg-[#F28C0F] hover:bg-orange-500 text-slate-950 font-black shadow-lg shadow-orange-500/20"
            onClick={() => {
              const nextId = nextChallenge.slug || nextChallenge.challengeId;
              selectChallenge(nextId);
              navigate(`/challenge?id=${nextId}`);
            }}
          >
            NEXT CHALLENGE ({nextChallenge.difficulty?.toUpperCase()}) →
          </Button>
        )}

        {/* View Standings button */}
        <Link to={isAdmin ? "/admin/leaderboard" : "/leaderboard"}>
          <Button
            variant="primary"
            size="lg"
            className="bg-[#F28C0F] hover:bg-orange-500 text-slate-950 font-black shadow-lg shadow-orange-500/20"
          >
            VIEW STANDINGS 🏆
          </Button>
        </Link>

        {/* Roadmap button */}
        <Link to="/challenges">
          <Button variant="outline" size="lg">
            MISSION ROADMAP
          </Button>
        </Link>
      </div>
    </div>
  );
}
