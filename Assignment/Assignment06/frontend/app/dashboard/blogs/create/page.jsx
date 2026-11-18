// app/dashboard/blogs/create/page.jsx — POST /api/blogs/create.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { blogService } from "@/services/blog.service";
import { friendlyError } from "@/utils/errors";
import BlogForm from "@/components/BlogForm";

export default function CreateBlogPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (payload) => {
    setError("");
    setPending(true);
    try {
      const res = await blogService.create(payload);
      router.push(`/blogs/${res.data.data.id}`);
    } catch (err) {
      setError(friendlyError(err, "Could not publish the blog."));
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Blog</h1>
        <p className="text-sm text-gray-500">Share something with the community.</p>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <BlogForm submitLabel="Publish Blog" onSubmit={handleSubmit} pending={pending} />
    </div>
  );
}
