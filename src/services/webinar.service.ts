import api from './api';

export const webinarService = {
  getAll: async (params?: any) => {
    const res = await api.get('/webinars', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/webinars/${id}`);
    return res.data;
  },

  create: async (data: any) => {
    const res = await api.post('/webinars', data);
    return res.data;
  },

  update: async (id: string, data: any) => {
    const res = await api.put(`/webinars/${id}`, data);
    return res.data;
  },

  cancel: async (id: string) => {
    const res = await api.patch(`/webinars/${id}/cancel`);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/webinars/${id}`);
    return res.data;
  }
};
