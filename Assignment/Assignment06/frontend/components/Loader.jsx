// components/Loader.jsx — spinners + skeleton cards for loading states.
export function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-gray-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 h-4 w-1/4 rounded bg-gray-200" />
      <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
      <div className="mb-4 h-4 w-full rounded bg-gray-100" />
      <div className="h-4 w-2/3 rounded bg-gray-100" />
    </div>
  );
}

export function BlogListSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}
