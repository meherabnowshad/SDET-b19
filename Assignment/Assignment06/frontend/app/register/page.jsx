// app/register/page.jsx — two-step registration with Gmail OTP.
// Step 1: account form → POST /api/auth/register/send-otp.
// Step 2: 6-digit code from email → POST /api/auth/register { ..., otp }.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import { friendlyError } from "@/utils/errors";
import { validateRegister } from "@/utils/validation";

const RESEND_COOLDOWN_S = 30;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const accountPayload = () => ({
    firstname: form.firstname.trim(),
    lastname: form.lastname.trim(),
    email: form.email.trim(),
    password: form.password,
  });

  // Step 1 → request the OTP email.
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const errs = validateRegister(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError("");
    setDevOtp("");
    setLoading(true);
    try {
      const res = await authService.sendRegisterOtp(accountPayload());
      if (res.data?.data?.devOtp) setDevOtp(res.data.data.devOtp);
      setStep("otp");
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setApiError(friendlyError(err, "Could not send the verification code."));
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → verify the code and create the account.
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      setErrors({ otp: "Enter the 6-digit code from your email." });
      return;
    }
    setErrors({});
    setApiError("");
    setLoading(true);
    try {
      await authService.register({ ...accountPayload(), otp: otp.trim() });
      router.push("/login?registered=1");
    } catch (err) {
      setApiError(friendlyError(err, "Verification failed."));
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setApiError("");
    setDevOtp("");
    setLoading(true);
    try {
      const res = await authService.sendRegisterOtp(accountPayload());
      if (res.data?.data?.devOtp) setDevOtp(res.data.data.devOtp);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setApiError(friendlyError(err, "Could not resend the code."));
    } finally {
      setLoading(false);
    }
  };

  const field = (bad) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 ${
      bad ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"
    }`;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      {step === "form" ? (
        <form onSubmit={handleSendOtp} className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8" noValidate>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">
            We&apos;ll email you a verification code to confirm it&apos;s really you.
          </p>

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
            <input type="email" value={form.email} onChange={set("email")} placeholder="you@gmail.com" className={field(errors.email)} />
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
            {loading ? "Sending code..." : "Send Verification Code"}
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Login
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8" noValidate>
          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-gray-800">{form.email.trim()}</span>.
          </p>

          {apiError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</p>
          )}
          {devOtp && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Dev mode — no email configured. Your code is:{" "}
              <span className="font-mono font-bold tracking-widest">{devOtp}</span>
            </p>
          )}

          <label className="mb-1 mt-5 block text-sm font-medium text-gray-700">Verification code</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            inputMode="numeric"
            autoComplete="one-time-code"
            className={`w-full rounded-lg border px-3 py-2.5 text-center text-xl font-mono tracking-[0.5em] outline-none focus:ring-2 focus:ring-indigo-100 ${
              errors.otp ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"
            }`}
          />
          {errors.otp && <p className="mt-1 text-xs text-red-600">{errors.otp}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Create Account"}
          </button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setApiError("");
                setErrors({});
              }}
              className="font-medium text-gray-500 hover:text-gray-700"
            >
              ← Wrong email?
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              className="font-medium text-indigo-600 hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
