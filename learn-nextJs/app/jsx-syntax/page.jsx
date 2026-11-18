import PageHeader from '../..//components/PageHeader';

export default function JsxSyntaxPage() {
  const name = 'Alex';
  const isAdmin = true;

  return (
    <>
      <PageHeader
        title="JSX Syntax Rules"
        description="JSX looks like HTML but compiles to JavaScript — a few attribute names and rules differ."
      />
      <div className="demo">
        <h3 style={{ color: 'teal' }}>{name}</h3>
        {isAdmin && <span className="badge">Admin</span>}
        {!isAdmin && <span className="badge">User</span>}

        {/* htmlFor, not for */}
        {isAdmin && 
          <>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="you@example.com" />
          </>
        }
      </div>
    </>
  );
}