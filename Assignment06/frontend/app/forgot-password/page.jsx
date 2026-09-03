// app/forgot-password/page.jsx — POST /api/auth/forgot-password.
"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { friendlyError } from "@/utils/errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setError("");
    setSuccess("");
    setDevResetUrl("");
    setLoading(true);
    try {
      const res = await authService.forgotPassword({ email: email.trim() });
      setSuccess(
        res.data.message ||
          "If an account exists for this email, a password reset link has been sent."
      );
      // Dev convenience: the API returns the reset link (no real mailer).
      if (res.data?.data?.resetUrl) setDevResetUrl(res.data.data.resetUrl);
    } catch (err) {
      setError(friendlyError(err, "Could not send the reset link."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8" noValidate>
        <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your account email and we&apos;ll send a reset link.
        </p>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {success && (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <p>{success}</p>
            {devResetUrl && (
              <p className="mt-2 break-all text-xs">
                Dev reset link:{" "}
                <Link href={devResetUrl.replace(/^https?:\/\/[^/]+/, "")} className="font-medium underline">
                  open reset page
                </Link>
              </p>
            )}
          </div>
        )}

        <label className="mb-1 mt-5 block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
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
