// utils/validation.js — frontend form validation (mirrors backend rules).
// Backend validation still applies; this is for instant user feedback.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CATEGORIES = ["Testing", "Automation", "Programming", "DevOps", "AI"];

export function validateRegister({ firstname, lastname, email, password, confirm }) {
  const errors = {};
  if (!firstname?.trim()) errors.firstname = "First name is required.";
  if (!lastname?.trim()) errors.lastname = "Last name is required.";
  if (!email?.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters.";
  if (password !== confirm) errors.confirm = "Passwords do not match.";
  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email?.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  return errors;
}

export function validateBlog({ blogTitle, blog, category }) {
  const errors = {};
  if (!blogTitle?.trim()) errors.blogTitle = "Blog title is required.";
  else if (blogTitle.trim().length > 255) errors.blogTitle = "Title cannot exceed 255 characters.";
  if (!blog?.trim()) errors.blog = "Blog content is required.";
  if (!category?.trim()) errors.category = "Category is required.";
  return errors;
}

export function validatePasswordChange({ password, confirm }) {
  const errors = {};
  if (!password) errors.password = "New password is required.";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters.";
  if (password !== confirm) errors.confirm = "Passwords do not match.";
  return errors;
}

export function validateProfile({ firstname, lastname }) {
  const errors = {};
  if (!firstname?.trim()) errors.firstname = "First name is required.";
  if (!lastname?.trim()) errors.lastname = "Last name is required.";
  return errors;
}
