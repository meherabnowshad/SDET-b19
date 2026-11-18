// app/admin/layout.jsx — admin shell (same sidebar chrome as dashboard).
"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute adminOnly>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="min-w-0 flex-1">
          <div className="sticky top-16 z-30 border-b border-gray-200 bg-white/95 px-4 py-2 backdrop-blur lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              ☰ Menu
            </button>
          </div>
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
