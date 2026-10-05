/**
 * gameAudio.js — Synthesized Web Audio API sound system for Mind Craft Arena.
 * 100% self-contained, 0 external assets, 0ms latency, works across all browsers.
 */

function getAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!window.__mcAudioCtx) {
      window.__mcAudioCtx = new AudioCtx();
    }
    if (window.__mcAudioCtx.state === 'suspended') {
      window.__mcAudioCtx.resume().catch(() => {});
    }
    return window.__mcAudioCtx;
  } catch (_) {
    return null;
  }
}

/**
 * Crystalline key unlock chime (upon earning a key or opening key celebration modal)
 */
export function playKeyUnlockFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [
    { freq: 523.25, time: 0.00, dur: 0.25 }, // C5
    { freq: 659.25, time: 0.10, dur: 0.30 }, // E5
    { freq: 783.99, time: 0.20, dur: 0.35 }, // G5
    { freq: 1046.50, time: 0.32, dur: 0.50 }, // C6
    { freq: 1318.51, time: 0.44, dur: 0.80 }, // E6 (sparkle ring)
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + time);

    // Warm bell envelope
    gain.gain.setValueAtTime(0.001, now + time);
    gain.gain.linearRampToValueAtTime(0.18, now + time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur);
  });
}

/**
 * Key hover chime
 */
export function playKeyHover() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
}

/**
 * Mechanical key insert into chest lock
 */
export function playKeyInsert() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Metallic slide
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.16);

  // Click
  setTimeout(() => {
    try {
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(1200, ctx.currentTime);
      clickOsc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);

      clickGain.gain.setValueAtTime(0.12, ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(ctx.currentTime);
      clickOsc.stop(ctx.currentTime + 0.07);
    } catch (_) {}
  }, 140);
}

/**
 * Mechanical lock turn & unlatch
 */
export function playLockTurn() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Ratchet click
  [0, 0.06, 0.13].forEach((t, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400 + i * 180, now + t);
    gain.gain.setValueAtTime(0.15, now + t);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + t);
    osc.stop(now + t + 0.06);
  });

  // Resonant unseal hum
  const hum = ctx.createOscillator();
  const humGain = ctx.createGain();
  hum.type = 'sine';
  hum.frequency.setValueAtTime(220, now + 0.18);
  hum.frequency.exponentialRampToValueAtTime(440, now + 0.5);

  humGain.gain.setValueAtTime(0.001, now + 0.18);
  humGain.gain.linearRampToValueAtTime(0.12, now + 0.25);
  humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

  hum.connect(humGain);
  humGain.connect(ctx.destination);
  hum.start(now + 0.18);
  hum.stop(now + 0.6);
}

/**
 * Grand chest open fanfare with sub-bass impact, golden brass swell, and shimmer
 */
export function playChestOpenFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // 1. Sub-bass chest opening impact
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(90, now);
  sub.frequency.exponentialRampToValueAtTime(35, now + 0.6);

  subGain.gain.setValueAtTime(0.35, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

  sub.connect(subGain);
  subGain.connect(ctx.destination);
  sub.start(now);
  sub.stop(now + 0.7);

  // 2. Triumphant Brass/Chime chords (C maj9: C, E, G, B, D)
  const chord = [
    { freq: 261.63, delay: 0.05, dur: 1.2 }, // C4
    { freq: 329.63, delay: 0.10, dur: 1.2 }, // E4
    { freq: 392.00, delay: 0.16, dur: 1.3 }, // G4
    { freq: 493.88, delay: 0.22, dur: 1.4 }, // B4
    { freq: 523.25, delay: 0.30, dur: 1.6 }, // C5
    { freq: 659.25, delay: 0.40, dur: 1.8 }, // E5
    { freq: 783.99, delay: 0.50, dur: 2.0 }, // G5
    { freq: 1046.50, delay: 0.62, dur: 2.2 }, // C6
  ];

  chord.forEach(({ freq, delay, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + delay);

    gain.gain.setValueAtTime(0.001, now + delay);
    gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + delay);
    osc.stop(now + delay + dur);
  });
}

/**
 * Ethereal crystalline relic sound when code fragment ascends
 */
export function playRelicAscend() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  [1046.50, 1318.51, 1567.98, 2093.00].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.001, now + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 1.0);
  });
}
