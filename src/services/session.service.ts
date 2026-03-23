import api from './api';

export const sessionService = {
  getAll: async (params: any) => {
    const res = await api.get('/admin/sessions', { params });
    return res.data;
  },

  cancel: async (id: string) => {
    return api.patch(`/admin/sessions/${id}/cancel`);
  },

  delete: async (id: string) => {
    return api.delete(`/admin/sessions/${id}`);
  }
};
