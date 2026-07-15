import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if this is the mock admin user to prevent automatic logout loop
      const userStr = localStorage.getItem('hindustaan_user');
      let isMockAdmin = false;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          isMockAdmin = user.role === 'admin' && user.id === 'ADM001';
        } catch (e) {}
      }

      if (!isMockAdmin) {
        localStorage.removeItem('hindustaan_user');
        sessionStorage.removeItem('hindustaan_user');
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
