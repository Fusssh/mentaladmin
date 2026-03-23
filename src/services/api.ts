import axios from 'axios';

// In production, the VITE_API_URL should be set in the .env file.
// In development, we can still fall back to '/api' for proxy support if needed,
// but for production level consistency, we favor the environment variable.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 401) {
      console.error('Unauthorized access - logging out...');
      localStorage.removeItem('token');
      // The application should handle the redirect to login via AuthContext/Router
    }

    // Standardized error object for services
    return Promise.reject({
      status,
      message,
      data: error.response?.data,
      originalError: error,
    });
  }
);

export default api;
