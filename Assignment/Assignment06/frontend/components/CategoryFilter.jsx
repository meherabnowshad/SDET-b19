// components/CategoryFilter.jsx — pill-style category selector.
"use client";

import { CATEGORIES } from "@/utils/validation";

export default function CategoryFilter({ value, onChange }) {
  const options = ["All", ...CATEGORIES];
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      {options.map((cat) => {
        const active = (value || "All") === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat === "All" ? "" : cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-indigo-600 text-white shadow"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
