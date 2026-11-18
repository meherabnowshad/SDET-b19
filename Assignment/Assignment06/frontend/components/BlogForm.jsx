// components/BlogForm.jsx — shared create/edit form with validation.
"use client";

import { useState } from "react";
import { CATEGORIES, validateBlog } from "@/utils/validation";

export default function BlogForm({ initial = {}, submitLabel, onSubmit, pending }) {
  const [blogTitle, setBlogTitle] = useState(initial.blogTitle || "");
  const [category, setCategory] = useState(initial.category || "");
  const [blog, setBlog] = useState(initial.blog || "");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateBlog({ blogTitle, blog, category });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSubmit({ blogTitle: blogTitle.trim(), blog: blog.trim(), category: category.trim() });
  };

  const inputCls = (bad) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 ${
      bad ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm" noValidate>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Blog Title</label>
        <input
          value={blogTitle}
          onChange={(e) => setBlogTitle(e.target.value)}
          placeholder="Introduction to Playwright"
          className={inputCls(errors.blogTitle)}
        />
        {errors.blogTitle && <p className="mt-1 text-xs text-red-600">{errors.blogTitle}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Testing"
          list="blog-categories"
          className={inputCls(errors.category)}
        />
        <datalist id="blog-categories">
          {CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {errors.category ? (
          <p className="mt-1 text-xs text-red-600">{errors.category}</p>
        ) : (
          <p className="mt-1 text-xs text-gray-400">Suggestions: {CATEGORIES.join(", ")}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Blog Content</label>
        <textarea
          value={blog}
          onChange={(e) => setBlog(e.target.value)}
          placeholder="Write your blog content here..."
          rows={10}
          className={`${inputCls(errors.blog)} resize-y leading-relaxed`}
        />
        {errors.blog && <p className="mt-1 text-xs text-red-600">{errors.blog}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Publishing..." : submitLabel}
      </button>
    </form>
  );
}
