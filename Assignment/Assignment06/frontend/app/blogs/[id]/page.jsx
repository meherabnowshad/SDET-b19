// app/blogs/[id]/page.jsx — public blog details (GET /api/blogs/:id).
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { blogService } from "@/services/blog.service";
import { friendlyError } from "@/utils/errors";
import { formatDate, fullName } from "@/utils/format";
import Avatar from "@/components/Avatar";
import { Spinner } from "@/components/Loader";

export default function BlogDetailsPage({ params }) {
  const { id } = use(params);
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setError("");
      try {
        const res = await blogService.getById(id);
        setBlog(res.data.data);
      } catch (err) {
        if (err?.response?.status === 404) setNotFound(true);
        else setError(friendlyError(err, "Could not load this blog."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Spinner label="Loading blog..." />
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Blog Not Found</h1>
        <p className="mt-2 text-sm text-gray-500">
          This blog doesn&apos;t exist or it was deleted.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to blogs
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-indigo-600 hover:underline">
          ← Back to blogs
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">
        ← All blogs
      </Link>
      <article className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {blog.category}
        </span>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-gray-900">{blog.blogTitle}</h1>
        <div className="mt-4 flex items-center gap-3 border-b border-gray-100 pb-5">
          <Avatar user={blog.author} size="md" />
          <div>
            <p className="text-sm font-semibold text-gray-800">{fullName(blog.author)}</p>
            <p className="text-xs text-gray-500">Published {formatDate(blog.createAt)}</p>
          </div>
        </div>
        <div className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-700">
          {blog.blog}
        </div>
      </article>
    </main>
  );
}
