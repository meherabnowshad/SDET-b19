// app/register/page.jsx — POST /api/auth/register, then redirect to login.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { friendlyError } from "@/utils/errors";
import { validateRegister } from "@/utils/validation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateRegister(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError("");
    setLoading(true);
    try {
      await authService.register({
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      router.push("/login?registered=1");
    } catch (err) {
      setApiError(friendlyError(err, "Registration failed."));
      setLoading(false);
    }
  };

  const field = (bad) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 ${
      bad ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"
    }`;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8" noValidate>
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">Join BlogSpace and start publishing.</p>

        {apiError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
            <input value={form.firstname} onChange={set("firstname")} placeholder="John" className={field(errors.firstname)} />
            {errors.firstname && <p className="mt-1 text-xs text-red-600">{errors.firstname}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
            <input value={form.lastname} onChange={set("lastname")} placeholder="Doe" className={field(errors.lastname)} />
            {errors.lastname && <p className="mt-1 text-xs text-red-600">{errors.lastname}</p>}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={field(errors.email)} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="Min. 6 characters" className={field(errors.password)} />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
            <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" className={field(errors.confirm)} />
            {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}
