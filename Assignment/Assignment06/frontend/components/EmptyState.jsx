// components/EmptyState.jsx — friendly placeholders when lists are empty.
export default function EmptyState({ title, hint, action }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-xl">
        📝
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-sm text-gray-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
