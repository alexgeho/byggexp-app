import axios from "axios";
import {
  getToken,
  saveToken,
  removeToken,
  getRefreshToken,
  saveRefreshToken,
  removeRefreshToken,
  removeUser,
} from "../utils/storage";

import { API_BASE_URL } from "../config/env";

export { API_BASE_URL };

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let unauthorizedHandler = null;
let unauthorizedHandlingPromise = null;

const clearStoredAuth = async () => {
  delete api.defaults.headers.common.Authorization;
  await removeToken();
  await removeRefreshToken();
  await removeUser();
};

const handleUnauthorized = async () => {
  if (unauthorizedHandlingPromise) {
    return unauthorizedHandlingPromise;
  }

  unauthorizedHandlingPromise = (async () => {
    try {
      if (typeof unauthorizedHandler === "function") {
        await unauthorizedHandler();
      } else {
        await clearStoredAuth();
      }
    } finally {
      unauthorizedHandlingPromise = null;
    }
  })();

  return unauthorizedHandlingPromise;
};

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403) {
      console.warn(
        "403 Forbidden:",
        error.response?.data?.message || "Access denied",
      );
    }

    // A 401 from a public /auth/* action (login, code-login, magic-login,
    // refresh, register…) means bad credentials/code — NOT an expired session.
    // Reject it straight away so the caller can surface the error (e.g. the
    // login screen's "Invalid email or password") instead of triggering a
    // token refresh + logout side-effect.
    const isAuthRequest = (originalRequest?.url || "").includes("/auth/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          await handleUnauthorized();
          return Promise.reject(error);
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token;

        await saveToken(newAccessToken);
        if (newRefreshToken) {
          await saveRefreshToken(newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await handleUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const fetchData = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    throw error;
  }
};

export default api;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const setAuthToken = async (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    await saveToken(token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    await clearStoredAuth();
  }
};
