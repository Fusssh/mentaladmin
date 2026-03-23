import api from './api';

export const resourceService = {
  getAll: async (params?: any) => {
    const res = await api.get('/admin/resources', { params });
    return res.data;
  },

  create: async (data: any) => {
    return api.post('/admin/resources', data);
  },

  update: async (id: string, data: any) => {
    return api.put(`/admin/resources/${id}`, data);
  },

  delete: async (id: string) => {
    return api.delete(`/admin/resources/${id}`);
  }
};
