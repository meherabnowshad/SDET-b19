// services/auth.service.js — thin wrappers over the auth endpoints.
// Pages call these instead of repeating axios + URL logic.
import api from "./api";

export const authService = {
  sendRegisterOtp: (payload) => api.post("/auth/register/send-otp", payload),
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload),
  resetPassword: (token, payload) =>
    api.patch(`/auth/reset-password/${token}`, payload),
};
