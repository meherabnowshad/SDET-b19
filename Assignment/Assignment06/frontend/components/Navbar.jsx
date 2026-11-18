// components/Navbar.jsx — fixed top bar for every page.
// Guests: logo + search + Login/Register. Auth: logo + search + ProfileMenu.
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProfileMenu from "./ProfileMenu";

function NavbarInner() {
  const { isAuthenticated, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");

  useEffect(() => {
    setQ(searchParams.get("title") || "");
  }, [searchParams]);

  const submitSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("title", q.trim());
    const cat = searchParams.get("category");
    if (cat) params.set("category", cat);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  const linkCls = (active) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
            B
          </span>
          <span className="text-lg font-bold text-gray-900">BlogSpace</span>
        </Link>

        {/* Navbar search (spec §3) — jumps to the homepage list */}
        <form onSubmit={submitSearch} className="mx-auto hidden w-full max-w-md md:block">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Blogs..."
            aria-label="Search blogs"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </form>

        <nav className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/" className={linkCls(pathname === "/")}>
            Blogs
          </Link>
          {!ready ? (
            <span className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : isAuthenticated ? (
            <>
              <Link href="/dashboard" className={linkCls(pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))}>
                Dashboard
              </Link>
              <ProfileMenu />
            </>
          ) : (
            <>
              <Link href="/login" className={linkCls(pathname === "/login")}>
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarInner />
    </Suspense>
  );
}
