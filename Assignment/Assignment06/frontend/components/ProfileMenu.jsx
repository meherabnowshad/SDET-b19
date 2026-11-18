// components/ProfileMenu.jsx — avatar dropdown: Profile / Change Password / Logout.
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { fullName } from "@/utils/format";
import Avatar from "./Avatar";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open ]);

  if (!user) return null;

  const go = (path) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar user={user} size="sm" />
        <span className="hidden max-w-28 truncate text-sm font-medium text-gray-700 sm:block">
          {fullName(user)}
        </span>
        <span className="text-xs text-gray-400">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg" role="menu">
          <div className="border-b border-gray-100 px-4 py-2">
            <p className="truncate text-sm font-semibold text-gray-800">{fullName(user)}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-indigo-700">
              {user.role}
            </span>
          </div>
          <button onClick={() => go("/dashboard/profile")} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
            Profile
          </button>
          <button onClick={() => go("/dashboard/change-password")} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
            Change Password
          </button>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
