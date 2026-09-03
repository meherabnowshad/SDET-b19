// components/Sidebar.jsx — dashboard navigation (role-aware, responsive drawer).
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function useSidebarLinks() {
  const { isAdmin } = useAuth();
  const userLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "📊", exact: true },
    { href: "/dashboard/blogs", label: "My Blogs", icon: "📚" },
    { href: "/dashboard/blogs/create", label: "Create Blog", icon: "✍️" },
    { href: "/dashboard/profile", label: "Profile", icon: "👤" },
    { href: "/dashboard/change-password", label: "Change Password", icon: "🔑" },
  ];
  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "📊", exact: true },
    { href: "/dashboard/blogs", label: "All Blogs", icon: "📚" },
    { href: "/dashboard/blogs/create", label: "Create Blog", icon: "✍️" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/dashboard/profile", label: "Profile", icon: "👤" },
    { href: "/dashboard/change-password", label: "Change Password", icon: "🔑" },
  ];
  return isAdmin ? adminLinks : userLinks;
}

function isActiveLink(pathname, link) {
  if (link.exact) return pathname === link.href;
  if (link.href === "/dashboard/blogs") {
    return pathname === "/dashboard/blogs" || pathname.startsWith("/dashboard/blogs/");
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export default function Sidebar({ mobileOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const links = useSidebarLinks();

  const handleLogout = () => {
    onClose?.();
    logout();
    router.replace("/login");
  };

  const nav = (
    <nav className="flex h-full flex-col p-4">
      <div className="space-y-1">
        {links.map((link) => {
          const active = isActiveLink(pathname, link);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => onClose?.()}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <span className="text-base">🚪</span>
        Logout
      </button>
    </nav>
  );

  return (
    <>
      {/* Desktop: static sidebar */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-gray-200 bg-white lg:block">
        {nav}
      </aside>

      {/* Mobile: drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <span className="font-bold text-gray-800">BlogSpace</span>
              <button onClick={onClose} aria-label="Close menu" className="rounded p-1 text-gray-500 hover:bg-gray-100">
                ✕
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
