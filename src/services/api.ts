import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`; // Adjust if the auth format differs (e.g. no Bearer)
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized explicitly
      localStorage.removeItem('token');
      // Redirect to login handled at the app router or auth context level
    }
    return Promise.reject(error);
  }
);

export default api;
