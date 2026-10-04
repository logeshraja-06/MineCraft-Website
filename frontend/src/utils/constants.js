export const APP_NAME = "MIND CRAFT";
export const APP_SUBTITLE = "Quiz Hunt & Code Assembly Platform";

export const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';

export const DEFAULT_DURATION_SECONDS = 20 * 60; // 20 minutes

/** ms penalty added to ranking time per wrong quiz answer */
export const WRONG_ANSWER_PENALTY_SECONDS = 20;
/** seconds the quiz is locked after a wrong answer before the next question loads */
export const WRONG_ANSWER_COOLDOWN_SECONDS = 3;

export const STORAGE_KEYS = {
  PARTICIPANT:        'mc_participant',
  CHALLENGE_SESSION:  'mc_challenge_session',
  START_TIME:         'mc_start_time',
  // ── new gameplay keys (prefixed mc_) ──
  PHASE:              'mc_phase',
  LANGUAGE_LOCKED:    'mc_language_locked',
  CHEST_STATES:       'mc_chest_states',
  ACTIVE_CHEST_ID:    'mc_active_chest_id',
  EARNED_KEYS:        'mc_earned_keys',
  COLLECTED_FRAGMENTS:'mc_collected_fragments',
  SHUFFLED_VAULT:     'mc_shuffled_vault',
  ASSEMBLY_ORDER:     'mc_assembly_order',
  PENALTY_SECONDS:    'mc_penalty_seconds',
  QUIZ_ATTEMPTS:      'mc_quiz_attempts',
  SUBMISSION_ATTEMPTS:'mc_submission_attempts',
  FINAL_RESULT:       'mc_final_result',
  // ── legacy / shared ──
  QR_PROGRESS:        'mc_qr_progress',
  UNLOCKED_BLOCKS:    'mc_unlocked_blocks',
  LEADERBOARD:        'mc_leaderboard',
  ADMIN_CHALLENGES:   'mc_admin_challenges',
};

export const SUPPORTED_LANGUAGES = [
  { id: 'python', name: 'Python 3', extension: '.py',   monacoLang: 'python', icon: '🐍' },
  { id: 'c',      name: 'C',        extension: '.c',    monacoLang: 'c',      icon: '🔵' },
  { id: 'cpp',    name: 'C++',      extension: '.cpp',  monacoLang: 'cpp',    icon: '⚡' },
  { id: 'java',   name: 'Java',     extension: '.java', monacoLang: 'java',   icon: '☕' },
];

export const STATUS_TYPES = {
  IDLE:               'IDLE',
  COMPILING:          'COMPILING',
  RUNNING:            'RUNNING',
  VALIDATING:         'VALIDATING',
  ACCEPTED:           'ACCEPTED',
  WRONG_ANSWER:       'WRONG_ANSWER',
  COMPILATION_ERROR:  'COMPILATION_ERROR',
  RUNTIME_ERROR:      'RUNTIME_ERROR',
  TIME_EXPIRED:       'TIME_EXPIRED',
};

/** Whether to use mock judge instead of real Judge0 backend */
export const USE_MOCK_JUDGE = import.meta.env.VITE_USE_MOCK_JUDGE === 'true';

/**
 * Clears ALL mc_* and temporary gameplay session keys from localStorage
 * so the next user never sees the previous user's name/progress/prefill.
 */
export function clearCompetitionStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('mc_') || key.startsWith('mindcraft_game_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

