import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: false,
});

// Attach JWT from localStorage on each request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize errors.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Something went wrong";
    if (error.response?.status === 401) {
      // token expired/invalid
      localStorage.removeItem("gp_token");
    }
    return Promise.reject(new Error(message));
  },
);

export default api;
