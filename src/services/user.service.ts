import api from './api';

export const userService = {
  // ── Common User Management ─────────────────────────────────────────────────

  getUsers: async (params: any) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  getUserById: async (id: string) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  deleteUser: async (id: string) => {
    return api.delete(`/admin/users/${id}`);
  },

  /**
   * FIX: API has two separate endpoints — /block sets blocked=true, /unblock sets blocked=false.
   * The old implementation sent a body to /block which was ignored by the server.
   */
  blockUser: async (id: string, shouldBlock: boolean) => {
    const endpoint = shouldBlock
      ? `/admin/users/${id}/block`
      : `/admin/users/${id}/unblock`;
    return api.patch(endpoint);
  },

  // ── Admin Creation ─────────────────────────────────────────────────────────

  createAdmin: async (data: any) => {
    return api.post('/admin/users/create-admin', data);
  },

  // ── Doctor Specifics ───────────────────────────────────────────────────────

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

  // ── Patient Specifics ──────────────────────────────────────────────────────

  getPatientActivity: async (id: string) => {
    const res = await api.get(`/admin/patients/${id}/activity`);
    return res.data;
  },
};