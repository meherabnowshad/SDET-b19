// components/BlogCard.jsx — public blog preview card.
import Link from "next/link";
import Avatar from "./Avatar";
import { formatDate, fullName, preview } from "@/utils/format";

const CATEGORY_STYLES = {
  Testing: "bg-emerald-100 text-emerald-700",
  Automation: "bg-violet-100 text-violet-700",
  Programming: "bg-blue-100 text-blue-700",
  DevOps: "bg-orange-100 text-orange-700",
  AI: "bg-fuchsia-100 text-fuchsia-700",
};

export default function BlogCard({ blog }) {
  const badge = CATEGORY_STYLES[blog.category] || "bg-gray-100 text-gray-700";
  return (
    <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>
          {blog.category}
        </span>
        <span className="text-xs text-gray-400">{formatDate(blog.createAt)}</span>
      </div>
      <h3 className="clamp-2 text-lg font-bold text-gray-900">{blog.blogTitle}</h3>
      <p className="clamp-3 mt-2 flex-1 text-sm leading-relaxed text-gray-600">
        {preview(blog.blog)}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar user={blog.author} size="sm" />
          <span className="truncate text-sm font-medium text-gray-700">
            {fullName(blog.author)}
          </span>
        </div>
        <Link
          href={`/blogs/${blog.id}`}
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
        >
          Read More →
        </Link>
      </div>
    </article>
  );
}
