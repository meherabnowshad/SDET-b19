// components/Avatar.jsx — profile photo with initials fallback.
// Backend paths ("/uploads/...") are prefixed with the API origin.
"use client";

import { useState } from "react";
import { imageUrl } from "@/utils/image";
import { initials } from "@/utils/format";

export default function Avatar({ user, size = "md", className = "" }) {
  // Track WHICH url failed, not just that a failure happened — so a new
  // profileImage (e.g. right after upload) is always retried instead of
  // staying stuck on the initials fallback until a page reload.
  const [failedSrc, setFailedSrc] = useState(null);
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-20 w-20 text-2xl",
  };
  const box = sizes[size] || sizes.md;
  const src = user?.profileImage ? imageUrl(user.profileImage) : null;

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt={user?.firstname ? `${user.firstname}'s avatar` : "Avatar"}
        onError={() => setFailedSrc(src)}
        className={`${box} shrink-0 rounded-full object-cover ring-2 ring-indigo-100 ${className}`}
      />
    );
  }
  return (
    <span
      className={`${box} flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ${className}`}
      aria-label="Default avatar"
    >
      {initials(user)}
    </span>
  );
}
