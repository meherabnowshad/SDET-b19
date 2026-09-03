// services/blog.service.js — blog CRUD + public search/filter endpoints.
import api from "./api";

export const blogService = {
  // params: { title?, category? } — both optional, combined with AND by the API.
  list: (params = {}) => api.get("/blogs", { params }),
  getById: (id) => api.get(`/blogs/${id}`),
  // NOTE: never send userId — the backend takes it from the token.
  create: (payload) => api.post("/blogs/create", payload),
  update: (id, payload) => api.put(`/blogs/update/${id}`, payload),
  remove: (id) => api.delete(`/blogs/delete/${id}`),
};
