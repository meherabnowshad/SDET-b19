// app/admin/users/page.jsx — admin user management (GET /users, PATCH /:id/status).
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { userService } from "@/services/user.service";
import { friendlyError } from "@/utils/errors";
import { formatDate, fullName } from "@/utils/format";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import { Spinner } from "@/components/Loader";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toggling, setToggling] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await userService.getAll();
      setUsers(res.data.data || []);
    } catch (err) {
      setError(friendlyError(err, "Could not load users."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = async (u) => {
    setToggling(u.id);
    setNotice("");
    setError("");
    try {
      const res = await userService.setStatus(u.id, !u.isActive);
      setUsers((prev) => prev.map((p) => (p.id === u.id ? res.data.data : p)));
      setNotice(res.data.message || `User ${!u.isActive ? "activated" : "deactivated"}.`);
    } catch (err) {
      setError(friendlyError(err, "Could not update user status."));
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">View accounts and activate / deactivate them.</p>
      </div>

      {notice && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <Spinner label="Loading users..." />
      ) : users.length === 0 ? (
        <EmptyState title="No users found." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2 hover:underline">
                      <Avatar user={u} size="sm" />
                      <span className="font-medium text-gray-900">{fullName(u)}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${u.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="mr-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => toggleStatus(u)}
                      disabled={toggling === u.id}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                        u.isActive
                          ? "text-red-600 hover:bg-red-50"
                          : "text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {toggling === u.id ? "Saving..." : u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && users.length > 0 && (
        <p className="text-xs text-gray-400">Joined dates are on each user&apos;s detail page. Total: {users.length}</p>
      )}
    </div>
  );
}
