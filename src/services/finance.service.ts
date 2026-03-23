import api from './api';

export const financeService = {
  getSummary: async () => {
    const res = await api.get('/admin/revenue/summary');
    return res.data;
  },

  getWithdrawals: async () => {
    const res = await api.get('/admin/withdrawals');
    return res.data;
  },

  getTransactions: async (params?: any) => {
    const res = await api.get('/admin/transactions', { params });
    return res.data;
  },

  approveWithdrawal: async (id: string) => {
    return api.patch(`/admin/withdrawals/${id}/approve`);
  },

  rejectWithdrawal: async (id: string) => {
    return api.patch(`/admin/withdrawals/${id}/reject`);
  }
};
