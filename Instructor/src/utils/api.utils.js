// import axios from 'axios';
// import { store } from '../redux/store/store.js';
// import { refreshToken, manualLogout } from '../redux/slices/auth.slice.js';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// // Create axios instance
// export const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true, // Include cookies in requests
// });

// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach(prom => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });

//   isRefreshing = false;
//   failedQueue = [];
// };

// // Response interceptor
// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // If error is not 401, reject normally
//     if (error.response?.status !== 401) {
//       return Promise.reject(error);
//     }

//     // If already refreshing, queue the request
//     if (isRefreshing) {
//       console.log("********isRefreshing************")
//       return new Promise((resolve, reject) => {
//         failedQueue.push({ resolve, reject });
//       }).then(() => apiClient(originalRequest));
//     }

//     // Start refresh token process
//     isRefreshing = true;

//     try {
//       // console.log(first)
//       // Dispatch refresh token action
//       await store.dispatch(refreshToken());

//       // Retry original request
//       processQueue(null);
//       return apiClient(originalRequest);
//     } catch (refreshError) {
//       // Refresh failed, logout user
//       store.dispatch(manualLogout());
//       processQueue(refreshError);
//       window.location.href = '/admin/login';
//       return Promise.reject(refreshError);
//     }
//   }
// );

// /**
//  * API request methods
//  */
// export const api = {
//   get: (url, config) => apiClient.get(url, config),
//   post: (url, data, config) => apiClient.post(url, data, config),
//   put: (url, data, config) => apiClient.put(url, data, config),
//   patch: (url, data, config) => apiClient.patch(url, data, config),
//   delete: (url, config) => apiClient.delete(url, config),
// };

// export default apiClient;


// src/utils/api.utils.js
import axios from 'axios';
import { store } from '../redux/store/store.js';
import { refreshToken as refreshTokenAction, manualLogout } from '../redux/slices/auth.slice.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Primary axios instance (used for normal requests & will keep the response interceptor)
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // include cookies
});

// Auth-only axios instance without the response interceptor
// Use this to call refresh-token so the interceptor won't intercept it and cause recursion.
export const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // no interceptors attached to authClient
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(p => {
    if (error) p.reject(error);
    else p.resolve();
  });
  isRefreshing = false;
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401, reject normally
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // If this is the refresh endpoint itself, avoid trying to refresh again
    if (originalRequest && originalRequest.url && originalRequest.url.includes('/refresh-token')) {
      // Prevent infinite loop - let caller handle the 401
      return Promise.reject(error);
    }
    // =======new change for no refresh in the verify otp page========

    // For OTP verification and other auth endpoints that may return 401 intentionally, don't try to refresh
    if (originalRequest && originalRequest.url && (
      originalRequest.url.includes('/verify-otp') ||
      originalRequest.url.includes('/login') ||
      originalRequest.url.includes('/resend-otp')
    )) {
      // Don't refresh or redirect for these endpoints - let the component handle the error
      return Promise.reject(error);
    }

    // If already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));
    }

    // Start refresh process
    isRefreshing = true;

    try {
      // Use the authClient (no interceptors) to call refresh
      const refreshResponse = await authClient.post('/refresh-token', {}); // instructor refresh token

      // dispatch redux action to update state (if you want)
      await store.dispatch(refreshTokenAction()); // Optional: update redux state if needed

      processQueue(null);
      // Retry original request (it will get new cookies from server-set cookies)
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed, logout user
      processQueue(refreshError);
      store.dispatch(manualLogout());
      // redirect to login page
      window.location.href = '/instructor/login';
      return Promise.reject(refreshError);
    }
  }
);

// Export helper wrapper
export const api = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
};

export default apiClient;