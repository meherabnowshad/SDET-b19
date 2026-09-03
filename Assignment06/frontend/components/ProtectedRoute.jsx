// components/ProtectedRoute.jsx — client-side guard for auth + admin pages.
// (Real enforcement is the backend's 401/403; this only avoids UI flashes.)
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "./Loader";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, ready, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) router.replace("/login");
    else if (adminOnly && !isAdmin) router.replace("/dashboard");
  }, [ready, isAuthenticated, isAdmin, adminOnly, router]);

  if (!ready || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Spinner label={adminOnly ? "Checking admin access..." : "Checking authentication..."} />
      </div>
    );
  }

  if (adminOnly && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-sm text-gray-500">
          This page is restricted to administrators.
        </p>
      </div>
    );
  }

  return children;
}
