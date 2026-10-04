import api from './api';

export const adminApi = {
  // Overview / Dashboard
  getOverview: async () => {
    const { data } = await api.get('/admin/overview');
    return data;
  },

  // Challenges
  getChallenges: async (params = {}) => {
    const { data } = await api.get('/admin/challenges', { params });
    return data;
  },
  getChallenge: async (id) => {
    const { data } = await api.get(`/admin/challenges/${id}`);
    return data;
  },
  createChallenge: async (challengeData) => {
    const { data } = await api.post('/admin/challenges', challengeData);
    return data;
  },
  updateChallenge: async (id, challengeData) => {
    const { data } = await api.put(`/admin/challenges/${id}`, challengeData);
    return data;
  },
  deleteChallenge: async (id) => {
    const { data } = await api.delete(`/admin/challenges/${id}`);
    return data;
  },
  duplicateChallenge: async (id) => {
    const { data } = await api.post(`/admin/challenges/${id}/duplicate`);
    return data;
  },

  // Code Block Generator & Manager
  generateBlocks: async (id = 'preview', payload) => {
    const { data } = await api.post(`/admin/challenges/${id}/generate-blocks`, payload);
    return data;
  },
  getBlocks: async (id) => {
    const { data } = await api.get(`/admin/challenges/${id}/blocks`);
    return data;
  },
  updateBlocks: async (id, blocks) => {
    const { data } = await api.put(`/admin/challenges/${id}/blocks`, { blocks });
    return data;
  },

  // Test Cases
  getTestCases: async (id) => {
    const { data } = await api.get(`/admin/challenges/${id}/test-cases`);
    return data;
  },
  updateTestCases: async (id, testCases) => {
    const { data } = await api.post(`/admin/challenges/${id}/test-cases`, { testCases });
    return data;
  },

  // Participants
  getParticipants: async (params = {}) => {
    const { data } = await api.get('/admin/participants', { params });
    return data;
  },
  getParticipant: async (id) => {
    const { data } = await api.get(`/admin/participants/${id}`);
    return data;
  },
  toggleParticipantStatus: async (id) => {
    const { data } = await api.put(`/admin/participants/${id}/status`);
    return data;
  },
  resetParticipant: async (id) => {
    const { data } = await api.post(`/admin/participants/${id}/reset`);
    return data;
  },
  deleteParticipant: async (id) => {
    const { data } = await api.delete(`/admin/participants/${id}`);
    return data;
  },


  // Live Sessions
  getSessions: async () => {
    const { data } = await api.get('/admin/sessions');
    return data;
  },
  endSession: async (id) => {
    const { data } = await api.post(`/admin/sessions/${id}/end`);
    return data;
  },
  extendSession: async (id, minutes = 5) => {
    const { data } = await api.post(`/admin/sessions/${id}/extend`, { minutes });
    return data;
  },
  resetSession: async (id) => {
    const { data } = await api.post(`/admin/sessions/${id}/reset`);
    return data;
  },

  // Submissions
  getSubmissions: async (params = {}) => {
    const { data } = await api.get('/admin/submissions', { params });
    return data;
  },
  getSubmission: async (id) => {
    const { data } = await api.get(`/admin/submissions/${id}`);
    return data;
  },

  // Leaderboard
  getLeaderboard: async () => {
    const { data } = await api.get('/admin/leaderboard');
    return data;
  },

  // Settings
  getSettings: async () => {
    const { data } = await api.get('/admin/settings');
    return data;
  },
  updateSettings: async (settings) => {
    const { data } = await api.put('/admin/settings', settings);
    return data;
  },

  // Report Exports (Real File Downloads)
  downloadExcel: async () => {
    const response = await api.get('/admin/reports/export/excel', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `blind-coding-results-${dateStr}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  downloadPdf: async () => {
    const response = await api.get('/admin/reports/export/pdf', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `blind-coding-results-${dateStr}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  // Export Results (CSV or XLSX)
  exportLeaderboard: async (format = 'csv') => {
    const response = await api.get(`/admin/leaderboard/export?format=${format}`, { responseType: 'blob' });
    const mime = format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
    const url = window.URL.createObjectURL(new Blob([response.data], { type: mime }));
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `mindcraft-results-${dateStr}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  // Download participant name list
  exportParticipants: async (format = 'csv') => {
    const response = await api.get(`/admin/participants/export?format=${format}`, { responseType: 'blob' });
    const mime = format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
    const url = window.URL.createObjectURL(new Blob([response.data], { type: mime }));
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `mindcraft-participants-${dateStr}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  // Freeze Leaderboard toggle
  freezeLeaderboard: async (isFrozen = true) => {
    const { data } = await api.post('/admin/leaderboard/freeze', { isFrozen });
    return data;
  },

  // Change Admin Password
  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.put('/admin/change-password', { currentPassword, newPassword });
    return data;
  },

  // Generate QR batch for challenge
  generateQRs: async (challengeId) => {
    const { data } = await api.post(`/admin/challenges/${challengeId}/generate-qr`);
    return data;
  },
};

