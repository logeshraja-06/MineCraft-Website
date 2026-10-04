export function formatTime(seconds = 0) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatTimeElapsed(seconds = 0) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

export function getRemainingTime(startTime, totalDurationSeconds = 1200) {
  if (!startTime) return totalDurationSeconds;
  const startMs = typeof startTime === 'string' || startTime instanceof Date
    ? new Date(startTime).getTime()
    : Number(startTime);
  if (isNaN(startMs)) return totalDurationSeconds;
  const elapsed = Math.floor((Date.now() - startMs) / 1000);
  return Math.max(0, totalDurationSeconds - elapsed);
}

