export default function WelcomeCard({ name, role }) {
  return (
    <div className="demo">
      <h3>Welcome, {name}!</h3>
      <p>Role: {role}</p>
    </div>
  );
}