// services/user.service.js — profile + admin user-management endpoints.
import api from "./api";

export const userService = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (payload) => api.put("/users/profile/update", payload),
  uploadImage: (file) => {
    const form = new FormData();
    form.append("image", file);
    return api.patch("/users/profile/image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  changePassword: (payload) => api.patch("/users/password", payload),

  // Admin
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  setStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
};
