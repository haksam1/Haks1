import axios from 'axios';
import { queueToast } from '../lib/toast-events';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ft_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/api/auth/')) {
      localStorage.removeItem('ft_token');
      localStorage.removeItem('ft_user');
      queueToast({
        title: 'Session expired',
        message: 'Please sign in again to continue.',
        variant: 'error',
      });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
