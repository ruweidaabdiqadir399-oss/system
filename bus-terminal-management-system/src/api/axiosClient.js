import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('btms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh-token rotation: on 401 swap tokens and retry once.
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Temporary diagnostic: log full error details so the real cause is visible in DevTools.
    console.error('[API Error]', {
      url: original?.url,
      method: original?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('btms_refresh_token');
    if (!refreshToken) {
      clearSession();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        })
        .catch((err) => Promise.reject(err));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = data.data;
      localStorage.setItem('btms_token', accessToken);
      localStorage.setItem('btms_refresh_token', newRefreshToken);
      apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      processQueue(null, accessToken);
      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearSession();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

function clearSession() {
  localStorage.removeItem('btms_token');
  localStorage.removeItem('btms_refresh_token');
  localStorage.removeItem('btms_user');
  // Hard redirect to login without importing router
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// Unwrap the standard API envelope { success, data, message, meta? }
export const unwrap = (response) => response.data.data;
export const unwrapPaginated = (response) => ({
  items: response.data.data,
  ...response.data.meta,
});
