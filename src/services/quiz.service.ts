import api from './api';

export const quizService = {
  getAll: async (params?: any) => {
    const res = await api.get('/quizzes', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/quizzes/${id}`);
    return res.data;
  },

  create: async (data: any) => {
    return api.post('/quizzes', data);
  },

  update: async (id: string, data: any) => {
    return api.put(`/quizzes/${id}`, data);
  },

  delete: async (id: string) => {
    return api.delete(`/quizzes/${id}`);
  }
};
