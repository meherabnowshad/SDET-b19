// app/admin/users/[id]/page.jsx — admin user detail (GET /users/:id).
"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { userService } from "@/services/user.service";
import { friendlyError } from "@/utils/errors";
import { formatDate, fullName } from "@/utils/format";
import Avatar from "@/components/Avatar";
import { Spinner } from "@/components/Loader";

export default function AdminUserDetailPage({ params }) {
  const { id } = use(params);
  const [u, setU] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await userService.getById(id);
      setU(res.data.data);
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? "User not found."
          : friendlyError(err, "Could not load this user.")
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async () => {
    setToggling(true);
    setNotice("");
    setError("");
    try {
      const res = await userService.setStatus(u.id, !u.isActive);
      setU(res.data.data);
      setNotice(res.data.message);
    } catch (err) {
      setError(friendlyError(err, "Could not update user status."));
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <Spinner label="Loading user..." />;

  if (!u) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "User not found."}</p>
        <Link href="/admin/users" className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline">
          ← Back to users
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin/users" className="text-sm font-medium text-indigo-600 hover:underline">
        ← All users
      </Link>
      {notice && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar user={u} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{fullName(u)}</h1>
            <p className="text-sm text-gray-500">{u.email}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-3">
            <dt className="text-xs uppercase text-gray-400">Role</dt>
            <dd className="mt-1 font-semibold capitalize text-gray-800">{u.role}</dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <dt className="text-xs uppercase text-gray-400">Status</dt>
            <dd className={`mt-1 font-semibold ${u.isActive ? "text-green-700" : "text-red-600"}`}>
              {u.isActive ? "Active" : "Inactive"}
            </dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <dt className="text-xs uppercase text-gray-400">Joined</dt>
            <dd className="mt-1 font-semibold text-gray-800">{formatDate(u.createAt)}</dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <dt className="text-xs uppercase text-gray-400">User ID</dt>
            <dd className="mt-1 font-semibold text-gray-800">#{u.id}</dd>
          </div>
        </dl>
        <button
          onClick={toggleStatus}
          disabled={toggling}
          className={`mt-5 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
            u.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {toggling ? "Saving..." : u.isActive ? "Deactivate User" : "Activate User"}
        </button>
      </section>
    </div>
  );
}
