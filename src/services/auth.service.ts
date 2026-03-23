import api from './api';

export const authService = {
  login: async (credentials: any) => {
    const response = await api.post('/admin/auth/login', credentials);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};
