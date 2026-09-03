// services/api.js — one shared axios instance for the whole app.
// baseURL is written once; the interceptor attaches the JWT automatically.
import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// Backend origin (for /uploads/... image paths), derived from the API URL.
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("blogspace_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
