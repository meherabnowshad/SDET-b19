// app/dashboard/change-password/page.jsx — PATCH /api/users/password.
"use client";

import { useState } from "react";
import { userService } from "@/services/user.service";
import { friendlyError } from "@/utils/errors";
import { validatePasswordChange } from "@/utils/validation";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validatePasswordChange({ password, confirm });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await userService.changePassword({ password });
      setSuccess(res.data.message || "Password updated successfully.");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setApiError(friendlyError(err, "Could not change the password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
        <p className="text-sm text-gray-500">Choose a new password (min. 6 characters).</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6" noValidate>
        {apiError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</p>}
        {success && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
