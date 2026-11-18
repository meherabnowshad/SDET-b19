import Link from 'next/link';

const componentLinks = [
  ['/creating-component', '1. Creating a Component'],
  ['/using-components', '2. Using Components (Props)'],
  ['/nested-components', '3. Sibling Components'],
  ['/fragments', '4. Fragments'],
];

const jsxEventsLinks = [
  ['/jsx-syntax', '5. JSX Syntax Rules'],
  ['/conditional-rendering', '6. Conditional Rendering'],
  ['/rendering-lists', '7. Rendering Lists (map + key)'],
  ['/events', '8. Event Handling'],
];

const hookLinks = [
  ['/hooks/use-state', '1. useState'],
  ['/hooks/use-effect', '2. useEffect'],
  ['/hooks/use-router', '3. useRouter'],
  ['/hooks/use-params', '4. useParams'],
  ['/hooks/use-ref', '5. useRef'],
  ['/hooks/use-callback', '6. useCallback'],
  ['/hooks/use-memo', '7. useMemo'],
  ['/hooks/use-context', '8. useContext'],
  ['/hooks/use-reducer', '9. useReducer'],
];

export default function HomePage() {
  return (
    <div>
      <h1>Next.js Demo Project</h1>
      <p className="description">One simple file per concept — components, JSX, events, and every hook.</p>

      <nav className="home-nav">
        <h2>Components</h2>
        <ul>
          {componentLinks.map(([href, label]) => (
            <li key={href}><Link href={href}>{label}</Link></li>
          ))}
        </ul>

        <h2>JSX & Events</h2>
        <ul>
          {jsxEventsLinks.map(([href, label]) => (
            <li key={href}><Link href={href}>{label}</Link></li>
          ))}
        </ul>

        <h2>Hooks</h2>
        <ul>
          {hookLinks.map(([href, label]) => (
            <li key={href}><Link href={href}>{label}</Link></li>
          ))}
        </ul>
      </nav>
    </div>
  );
}