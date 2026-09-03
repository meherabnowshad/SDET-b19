// app/login/page.jsx — POST /api/auth/login, then dashboard.
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyError } from "@/utils/errors";
import { validateLogin } from "@/utils/validation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateLogin({ email, password });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError("");
    setLoading(true);
    try {
      const res = await authService.login({ email: email.trim(), password });
      // Backend shape: { success, token, data: user }. Load fresh profile
      // so the navbar avatar is correct immediately.
      login(res.data.token, res.data.data);
      try {
        const me = await userService.getProfile();
        login(res.data.token, me.data.data);
      } catch {
        /* cached login data is fine */
      }
      router.replace("/dashboard");
    } catch (err) {
      setApiError(friendlyError(err, "Login failed."));
      setLoading(false);
    }
  };

  const field = (bad) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 ${
      bad ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"
    }`;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8" noValidate>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">Log in to manage your blogs.</p>

        {justRegistered && !apiError && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Registration successful. Please log in.
          </p>
        )}
        {apiError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</p>
        )}

        <div className="mt-5">
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={field(errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link href="/forgot-password" className="text-sm text-indigo-600 hover:underline">
              Forgot Password?
            </Link>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={field(errors.password)}
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 rounded accent-indigo-600"
            />
            Show password
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
