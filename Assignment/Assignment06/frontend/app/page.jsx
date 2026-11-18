// app/page.jsx — public homepage: browse + search + filter blogs.
// Data always comes from GET /api/blogs (never hardcoded).
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { blogService } from "@/services/blog.service";
import { friendlyError } from "@/utils/errors";
import { useAuth } from "@/contexts/AuthContext";
import BlogCard from "@/components/BlogCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import EmptyState from "@/components/EmptyState";
import { BlogListSkeleton } from "@/components/Loader";

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, ready } = useAuth();

  const [title, setTitle] = useState(searchParams.get("title") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Keep state in sync when the navbar search navigates here with ?title=.
  useEffect(() => {
    setTitle(searchParams.get("title") || "");
    setCategory(searchParams.get("category") || "");
  }, [searchParams]);

  const fetchBlogs = useCallback(async (t, c) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (t.trim()) params.title = t.trim();
      if (c) params.category = c;
      const res = await blogService.list(params);
      setBlogs(res.data.data || []);
    } catch (err) {
      setError(friendlyError(err, "Could not load blogs."));
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce the title search so we don't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => fetchBlogs(title, category), 350);
    return () => clearTimeout(id);
  }, [title, category, fetchBlogs]);

  const syncUrl = (t, c) => {
    const params = new URLSearchParams();
    if (t.trim()) params.set("title", t.trim());
    if (c) params.set("category", c);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  };

  const handleTitle = (v) => {
    setTitle(v);
    syncUrl(v, category);
  };

  const handleCategory = (c) => {
    setCategory(c);
    syncUrl(title, c);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-10 text-white sm:px-10">
        <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">
          Discover stories, share ideas.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-indigo-100 sm:text-base">
          Browse blogs on testing, automation, programming, DevOps and AI — or join
          BlogSpace to publish your own.
        </p>
        {ready && !isAuthenticated && (
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Get Started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white ring-1 ring-white/50 hover:bg-white/10"
            >
              Login
            </Link>
          </div>
        )}
      </section>

      {/* Search + filter */}
      <section className="mb-6 space-y-4">
        <SearchBar value={title} onChange={handleTitle} />
        <CategoryFilter value={category} onChange={handleCategory} />
        {(title.trim() || category) && !loading && (
          <p className="text-sm text-gray-500">
            {blogs.length} result{blogs.length === 1 ? "" : "s"}
            {title.trim() && <> for “<span className="font-medium">{title.trim()}</span>”</>}
            {category && <> in <span className="font-medium">{category}</span></>}
          </p>
        )}
      </section>

      {/* List */}
      {loading ? (
        <BlogListSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            onClick={() => fetchBlogs(title, category)}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      ) : blogs.length === 0 ? (
        <EmptyState
          title="No blogs found."
          hint={
            title.trim() || category
              ? "Try a different search term or category."
              : "Be the first to publish — create an account and write something great."
          }
          action={
            !title.trim() && !category && ready && !isAuthenticated ? (
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Create an account
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((b) => (
            <BlogCard key={b.id} blog={b} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8"><BlogListSkeleton /></div>}>
      <HomeInner />
    </Suspense>
  );
}
