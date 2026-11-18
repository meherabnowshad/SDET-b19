import Link from 'next/link';

export default function PageHeader({ title, description }) {
  return (
    <div>
      <Link href="/" className="back-link">← All topics</Link>
      <h1>{title}</h1>
      {description && <p className="description">{description}</p>}
    </div>
  );
}