import api from './api';

export const challengeApi = {
  getAll: async () => {
    const { data } = await api.get('/challenges');
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/challenges/${id}`);
    return data;
  },
  getActiveChallenge: async () => {
    const { data } = await api.get('/challenges/active');
    return data;
  },
  getBlocks: async (id) => {
    const { data } = await api.get(`/challenges/${id}/blocks`);
    return data;
  },
  revealBlock: async (id, payload = {}) => {
    const { data } = await api.post(`/challenges/${id}/reveal`, payload);
    return data;
  },

  // ── Server-authoritative gameplay API ──────────────────────────────

  /** Start or resume a session; picks language. Returns first task + session state */
  startSession: async (challengeId, language) => {
    const { data } = await api.post(`/challenges/${challengeId}/start-session`, { language });
    return data;
  },

  /** Get current task for the active session */
  getCurrentTask: async (challengeId) => {
    const { data } = await api.get(`/challenges/${challengeId}/current-task`);
    return data;
  },

  /** Submit an answer for the current task */
  submitTaskAnswer: async (challengeId, answer) => {
    const { data } = await api.post(`/challenges/${challengeId}/submit-task`, { answer });
    return data;
  },

  /** Get full session progress (if challengeId provided) or participant tier progression */
  getProgress: async (challengeId) => {
    if (!challengeId) {
      const { data } = await api.get('/challenges/progress');
      return data;
    }
    const { data } = await api.get(`/challenges/${challengeId}/progress`);
    return data;
  },
  /** Get participant tier progression across all challenges */
  getUserProgression: async () => {
    const { data } = await api.get('/challenges/progress');
    return data;
  },
};

