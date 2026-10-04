import api from './api';

export const sessionApi = {
  startSession: async ({ challengeId, language }) => {
    const { data } = await api.post('/sessions/start', { challengeId, language });
    return data;
  },
  saveAssembly: async ({ challengeId, assemblyOrder, assembledCode }) => {
    const { data } = await api.put('/sessions/assembly', { challengeId, assemblyOrder, assembledCode });
    return data;
  },
  getCurrentSession: async (challengeId) => {
    const { data } = await api.get(`/sessions/current/${challengeId}`);
    return data;
  },
  getUserSessions: async () => {
    const { data } = await api.get('/sessions/my-sessions');
    return data;
  },
};

export default sessionApi;
