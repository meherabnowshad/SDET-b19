// utils/image.js — shared profile-photo rules (fast browser feedback only;
// the backend enforces the same limits in upload.middleware.js).
import { API_ORIGIN } from "@/services/api";

export const MAX_IMAGE_MB = 2;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const IMAGE_ACCEPT_ATTR = ALLOWED_IMAGE_TYPES.join(",");

// Returns an error message, or null when the file is acceptable.
export function validateImage(file) {
  if (!file) return "Please choose an image file.";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Photo must be a JPG, PNG, GIF or WEBP image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const actual = (file.size / 1024 / 1024).toFixed(1);
    return `Photo must be ${MAX_IMAGE_MB} MB or smaller (this one is ${actual} MB).`;
  }
  return null;
}

// Backend stores paths like "/uploads/abc.png" — prefix the API origin.
export function imageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
