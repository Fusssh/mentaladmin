import api from './api';

export const analyticsService = {
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getMoodTrend: async () => {
    const res = await api.get('/admin/analytics/mood-trend');
    return res.data;
  },

  getStressLevels: async () => {
    const res = await api.get('/admin/analytics/stress-levels');
    return res.data;
  },

  getTherapySuccess: async () => {
    const res = await api.get('/admin/analytics/therapy-success');
    return res.data;
  }
};
