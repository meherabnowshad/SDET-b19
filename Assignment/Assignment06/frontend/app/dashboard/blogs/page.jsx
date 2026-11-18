// app/dashboard/blogs/page.jsx — blog management table (mine, or all for admin).
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { blogService } from "@/services/blog.service";
import { friendlyError } from "@/utils/errors";
import { formatDate, fullName } from "@/utils/format";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Spinner } from "@/components/Loader";

export default function ManageBlogsPage() {
  const { user, isAdmin } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await blogService.list();
      const all = res.data.data || [];
      setBlogs(isAdmin ? all : all.filter((b) => b.userId === user?.id));
    } catch (err) {
      setError(friendlyError(err, "Could not load blogs."));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.id]);

  useEffect(() => {
    if (user) fetchBlogs();
  }, [user, fetchBlogs]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await blogService.remove(pendingDelete.id);
      setNotice(`“${pendingDelete.blogTitle}” deleted successfully.`);
      setPendingDelete(null);
      fetchBlogs();
    } catch (err) {
      setNotice("");
      setError(friendlyError(err, "Could not delete the blog."));
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isAdmin ? "All Blogs" : "My Blogs"}</h1>
          <p className="text-sm text-gray-500">
            {isAdmin ? "Manage every user's blogs." : "Manage the blogs you published."}
          </p>
        </div>
        <Link
          href="/dashboard/blogs/create"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + New Blog
        </Link>
      </div>

      {notice && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <Spinner label="Loading blogs..." />
      ) : blogs.length === 0 ? (
        <EmptyState
          title={isAdmin ? "No blogs found." : "You haven't created any blogs yet."}
          hint="Publish your first blog to see it here."
          action={
            <Link
              href="/dashboard/blogs/create"
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Create Blog
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {blogs.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="max-w-56 truncate px-4 py-3 font-medium text-gray-900">
                    <Link href={`/blogs/${b.id}`} className="hover:text-indigo-600 hover:underline">
                      {b.blogTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.category}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Avatar user={b.author} size="xs" />
                      <span className="text-gray-700">{fullName(b.author)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(b.createAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/blogs/${b.id}/edit`}
                      className="mr-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setPendingDelete(b)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this blog?"
          message={`Are you sure you want to delete “${pendingDelete.blogTitle}”? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
