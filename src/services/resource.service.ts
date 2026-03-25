import api from './api';

export const resourceService = {
  getAll: async (params?: any) => {
    const res = await api.get('/resources', { params });
    return res.data;
  },

  create: async (data: any) => {
    return api.post('/resources', data);
  },

  update: async (id: string, data: any) => {
    return api.patch(`/resources/${id}`, data);
  },

  delete: async (id: string) => {
    return api.delete(`/resources/${id}`);
  }
};
