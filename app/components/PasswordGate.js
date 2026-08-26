export default function PasswordGate({ action, title, description, error }) {
  return (
    <div className="card">
      <span className="pill">Locked</span>
      <h1 style={{ marginTop: 10 }}>{title}</h1>
      <p>{description}</p>
      {error && <p className="error">{decodeURIComponent(error)}</p>}
      <form action={action}>
        <label>Password</label>
        <input type="password" name="password" required autoFocus />
        <button className="btn" type="submit">Unlock</button>
      </form>
    </div>
  );
}
