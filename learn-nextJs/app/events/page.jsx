'use client';
import { useState } from 'react';
import PageHeader from '../../components/PageHeader';

export default function EventsPage() {
  const [log, setLog] = useState([]);
  const [lastKey, setLastKey] = useState('');
  const addLog = (msg) => setLog((prev) => [msg, ...prev].slice(0, 1));

  const handleChange = (e) => {
    // e.target.name / e.target.value — which field fired, and its current value
    addLog(`onChange on "${e.target.name}": "${e.target.value}"`);
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // stops the browser's default page reload
    addLog('onSubmit fired (preventDefault stopped the page reload)');
  };

  return (
    <>
      <PageHeader
        title="React Event Handling"
        description="Events are camelCase (onClick, onChange...) and take a function, not a string. Every handler receives an event object 'e'."
      />
      <div className="demo">
        <button onClick={() => addLog('onClick fired')}>Click me</button>

        <div
          style={{ border: '1px dashed #aaa', padding: 10, margin: '8px 0', textAlign: 'center' }}
          onMouseEnter={() => addLog('onMouseEnter fired')}
          onMouseLeave={() => addLog('onMouseLeave fired')}
        >
          Hover over me
        </div>

        <form onSubmit={handleSubmit}>
          <input name="firstName" placeholder="Name" onChange={handleChange} />
          <input
            placeholder="Press a key..."
            onKeyDown={(e) => setLastKey(e.key)}
          />
          <button type="submit">Submit form</button>
        </form>
        <p className="note">Last key pressed: {lastKey || '—'}</p>

        <h4>Event log:</h4>
        <ul>{log.map((entry, i) => <li key={i}>{entry}</li>)}</ul>
      </div>
    </>
  );
}




