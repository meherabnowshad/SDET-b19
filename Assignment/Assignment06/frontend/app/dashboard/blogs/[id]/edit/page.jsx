// app/dashboard/blogs/[id]/edit/page.jsx — GET then PUT /api/blogs/update/:id.
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { blogService } from "@/services/blog.service";
import { friendlyError } from "@/utils/errors";
import BlogForm from "@/components/BlogForm";
import { Spinner } from "@/components/Loader";

export default function EditBlogPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await blogService.getById(id);
        setBlog(res.data.data);
      } catch (err) {
        setError(
          err?.response?.status === 404
            ? "Blog not found."
            : friendlyError(err, "Could not load this blog.")
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (payload) => {
    setError("");
    setPending(true);
    try {
      await blogService.update(id, payload);
      router.push(`/blogs/${id}`);
    } catch (err) {
      setError(friendlyError(err, "Could not update the blog."));
      setPending(false);
    }
  };

  if (loading) {
    return <Spinner label="Loading blog..." />;
  }

  if (!blog) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Blog not found."}</p>
        <Link href="/dashboard/blogs" className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline">
          ← Back to blogs
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Blog</h1>
        <p className="text-sm text-gray-500">Update the title, category or content.</p>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <BlogForm initial={blog} submitLabel="Save Changes" onSubmit={handleSubmit} pending={pending} />
    </div>
  );
}
