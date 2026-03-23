import api from './api';

export const userService = {
  // Common User Management
  getUsers: async (params: any) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  blockUser: async (id: string, blocked: boolean) => {
    return api.patch(`/admin/users/${id}/block`, { blocked });
  },

  deleteUser: async (id: string) => {
    return api.delete(`/admin/users/${id}`);
  },

  getUserById: async (id: string) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  // Admin Creation (Secret)
  createAdmin: async (data: any) => {
    return api.post('/admin/users/create-admin', data);
  },

  // Doctor Specifics
  getDoctors: async (params: any) => {
    const res = await api.get('/admin/doctors', { params });
    return res.data;
  },

  approveDoctor: async (id: string) => {
    return api.patch(`/admin/doctors/${id}/approve`);
  },

  rejectDoctor: async (id: string) => {
    return api.patch(`/admin/doctors/${id}/reject`);
  },

  getDoctorClients: async (id: string) => {
    const res = await api.get(`/admin/doctors/${id}/clients`);
    return res.data;
  },

  getDoctorSessions: async (id: string) => {
    const res = await api.get(`/admin/doctors/${id}/sessions`);
    return res.data;
  },

  getDoctorDashboard: async (id: string) => {
    const res = await api.get(`/admin/doctors/${id}/dashboard`);
    return res.data;
  },

  // Patient Specifics
  getPatientActivity: async (id: string) => {
    const res = await api.get(`/api/admin/patients/${id}/activity`);
    return res.data;
  }
};
