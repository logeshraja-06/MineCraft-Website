import React, { useState } from 'react';
import Button from '../common/Button';

export default function ParticipantForm({ onJoin, isLoading, error }) {
  const [teamName, setTeamName] = useState('');
  const [sessionCode, setSessionCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onJoin({ teamName, sessionCode: sessionCode.toUpperCase().trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-mono">
      {error && (
        <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
          {error}
        </div>
      )}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-200/80 mb-1">
          Team / Participant Name
        </label>
        <input
          type="text"
          required
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-[#141724]/90 border border-purple-500/30 rounded-xl text-white placeholder:text-purple-300/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-xs transition"
          placeholder="ByteBusters"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-200/80 mb-1">
          Event Session Code
        </label>
        <input
          type="text"
          required
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-[#141724]/90 border border-purple-500/30 rounded-xl text-white placeholder:text-purple-300/40 font-mono tracking-widest uppercase focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-xs transition"
          placeholder="MINDCRAFT-2026"
        />
      </div>
      <Button type="submit" variant="portal" className="w-full mt-3 rounded-full" isLoading={isLoading}>
        ENTER THE ARENA
      </Button>
    </form>
  );
}
