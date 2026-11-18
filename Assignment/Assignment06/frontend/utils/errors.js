// utils/errors.js — turn axios/backend failures into friendly messages.
// Never show raw JS errors (e.g. "Network Error" internals) to users.
export function friendlyError(err, fallback = "Something went wrong. Please try again.") {
  const data = err?.response?.data;
  if (data?.message) return data.message;
  if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
    return "Cannot reach the server. Is the backend running?";
  }
  if (err?.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }
  return fallback;
}
