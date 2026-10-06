import React, { useState } from 'react';
import Button from '../common/Button';

export default function LoginForm({ onSubmit, isLoading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
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
          Email Address
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-[#141724]/90 border border-purple-500/30 rounded-xl text-white placeholder:text-purple-300/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-xs transition"
          placeholder="hacker@mindcraft.io"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-purple-200/80 mb-1">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-[#141724]/90 border border-purple-500/30 rounded-xl text-white placeholder:text-purple-300/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-xs transition"
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" variant="portal" className="w-full mt-3 rounded-full" isLoading={isLoading}>
        SIGN IN TO CONSOLE
      </Button>
    </form>
  );
}
