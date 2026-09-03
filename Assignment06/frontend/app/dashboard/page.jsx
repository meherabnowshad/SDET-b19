// app/dashboard/page.jsx — welcome, stats, quick create, recent blogs.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { blogService } from "@/services/blog.service";
import { userService } from "@/services/user.service";
import { friendlyError } from "@/utils/errors";
import { formatDate, fullName } from "@/utils/format";
import Avatar from "@/components/Avatar";
import { Spinner } from "@/components/Loader";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [userCount, setUserCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const mine = isAdmin
          ? await blogService.list()
          : await blogService.list().then((res) => ({
              ...res,
              data: {
                ...res.data,
                data: (res.data.data || []).filter((b) => b.userId === user?.id),
              },
            }));
        const all = mine.data.data || [];
        setBlogs(all);
        if (isAdmin) {
          try {
            const u = await userService.getAll();
            setUserCount(u.data.count ?? u.data.data?.length ?? 0);
          } catch {
            setUserCount(null);
          }
        }
      } catch (err) {
        setError(friendlyError(err, "Could not load dashboard data."));
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user, isAdmin]);

  const myBlogs = isAdmin ? blogs : blogs.filter((b) => b.userId === user?.id);
  const recent = [...myBlogs].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="flex flex-wrap items-center gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
        <Avatar user={user} size="lg" className="ring-white/30" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">Welcome, {user?.firstname || "friend"} 👋</h1>
          <p className="text-sm text-indigo-100">
            {fullName(user)} · <span className="capitalize">{user?.role}</span> · {user?.email}
          </p>
        </div>
        <Link
          href="/dashboard/blogs/create"
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          ✍️ Quick Create Blog
        </Link>
      </section>

      {loading ? (
        <Spinner label="Loading dashboard..." />
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : (
        <>
          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">{isAdmin ? "Total Blogs" : "My Blogs"}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{myBlogs.length}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Categories used</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {new Set(myBlogs.map((b) => b.category)).size}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">{isAdmin ? "Total Users" : "Role"}</p>
              <p className="mt-1 text-3xl font-bold capitalize text-gray-900">
                {isAdmin ? (userCount ?? "—") : user?.role}
              </p>
            </div>
          </section>

          {/* Recent */}
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {isAdmin ? "Recent Blogs" : "My Recent Blogs"}
              </h2>
              <Link href="/dashboard/blogs" className="text-sm font-semibold text-indigo-600 hover:underline">
                {isAdmin ? "Manage all →" : "Manage mine →"}
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                {isAdmin ? "No blogs yet." : "You haven't created any blogs yet."}{" "}
                <Link href="/dashboard/blogs/create" className="font-medium text-indigo-600 hover:underline">
                  Create one now.
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recent.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/blogs/${b.id}`} className="truncate text-sm font-semibold text-gray-800 hover:text-indigo-600">
                        {b.blogTitle}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {b.category} · {formatDate(b.createAt)}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/blogs/${b.id}/edit`}
                      className="shrink-0 rounded-lg px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                      Edit
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
