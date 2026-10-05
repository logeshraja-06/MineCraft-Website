import api from './api';

export const participantApi = {
  register: async (participantData) => {
    const { data } = await api.post('/participants/register', participantData);
    return data;
  },
  login: async (credentials) => {
    const { data } = await api.post('/participants/login', credentials);
    return data;
  },
  joinSession: async (sessionCode) => {
    const { data } = await api.post('/participants/join', { sessionCode });
    return data;
  },
  getStatus: async () => {
    const { data } = await api.get('/participants/status');
    return data;
  },
  deleteMe: async (params = {}) => {
    const { data } = await api.delete('/participants/me', { data: params });
    return data;
  },
  logoutAndDelete: async (params = {}) => {
    const { data } = await api.post('/participants/logout-delete', params);
    return data;
  },
};

