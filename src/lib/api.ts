import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://hindustaan-os-backend.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/signup')) {
      return config;
    }
    const userStr = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.accessToken) {
          config.headers.Authorization = `Bearer ${user.accessToken}`;
        }
      } catch (e) {
        console.error('Failed to parse user session in request interceptor:', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Do not intercept refresh, login, or logout endpoints to prevent loops
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/logout') ||
        originalRequest.url?.includes('/auth/me')
      ) {
        return Promise.reject(error);
      }

      // Check if this is a mock or demo user to prevent automatic logout/refresh loops
      const userStr = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
      let isMockOrDemoUser = false;
      let user: any = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
          if (user && user.role === 'admin') {
            isMockOrDemoUser = false;
          } else {
            isMockOrDemoUser =
              (user && String(user.accessToken || '').startsWith('mock-token-')) ||
              (user && String(user.id || '').startsWith('demo-')) ||
              (user && String(user.email || '').toLowerCase().endsWith('@hindustaan.in'));
          }
        } catch (e) {}
      }

      if (isMockOrDemoUser) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = user?.refreshToken;
        const baseURL = import.meta.env.VITE_API_URL || 'https://hindustaan-os-backend.onrender.com/api';
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh`,
          refreshToken ? { refreshToken } : {},
          { withCredentials: true }
        );

        if (
          refreshResponse.data &&
          refreshResponse.data.success &&
          (refreshResponse.data.accessToken || refreshResponse.data.token)
        ) {
          const newAccessToken = refreshResponse.data.accessToken || refreshResponse.data.token;
          const newRefreshToken = refreshResponse.data.refreshToken || refreshToken;

          if (user) {
            user.accessToken = newAccessToken;
            if (newRefreshToken) {
              user.refreshToken = newRefreshToken;
            }
            if (localStorage.getItem('hindustaan_user')) {
              localStorage.setItem('hindustaan_user', JSON.stringify(user));
            } else if (sessionStorage.getItem('hindustaan_user')) {
              sessionStorage.setItem('hindustaan_user', JSON.stringify(user));
            }
          }

          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          isRefreshing = false;

          return api(originalRequest);
        } else {
          throw new Error('Refresh token returned unsuccessful response');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem('hindustaan_user');
        sessionStorage.removeItem('hindustaan_user');
        window.dispatchEvent(new Event('auth-logout'));
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
