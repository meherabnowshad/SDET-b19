// utils/format.js — date + text helpers.
export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function preview(text, length = 140) {
  if (!text) return "";
  const clean = String(text).trim().replace(/\s+/g, " ");
  return clean.length > length ? `${clean.slice(0, length).trim()}…` : clean;
}

export function fullName(user) {
  if (!user) return "Unknown author";
  const name = `${user.firstname || ""} ${user.lastname || ""}`.trim();
  return name || "Unknown author";
}

export function initials(user) {
  if (!user) return "?";
  return `${user.firstname?.[0] || ""}${user.lastname?.[0] || ""}`.toUpperCase() || "?";
}
