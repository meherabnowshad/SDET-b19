// app/reset-password/[token]/page.jsx — PATCH /api/auth/reset-password/:token.
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { friendlyError } from "@/utils/errors";
import { validatePasswordChange } from "@/utils/validation";

export default function ResetPasswordPage({ params }) {
  const { token } = use(params);
  const router = useRouter();
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
    setLoading(true);
    try {
      const res = await authService.resetPassword(token, { password });
      setSuccess(res.data.message || "Password successfully changed.");
      setTimeout(() => router.replace("/login"), 1800);
    } catch (err) {
      setApiError(friendlyError(err, "Could not reset the password."));
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8" noValidate>
        <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
        <p className="mt-1 text-sm text-gray-500">Choose a new password for your account.</p>

        {apiError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</p>}
        {success && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success} Redirecting to login…</p>}

        <label className="mb-1 mt-5 block text-sm font-medium text-gray-700">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 6 characters"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}

        <label className="mb-1 mt-4 block text-sm font-medium text-gray-700">Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat new password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}

        <button
          type="submit"
          disabled={loading || !!success}
          className="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            ← Back to login
          </Link>
        </p>
      </form>
    </main>
  );
}
