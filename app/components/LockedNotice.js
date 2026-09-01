export default function LockedNotice({ what }) {
  return (
    <div className="card">
      <span className="pill">Locked</span>
      <h2 style={{ marginTop: 10 }}>Unlock the roster to continue</h2>
      <p style={{ marginBottom: 0 }}>
        {what} needs the shared roster password, since it works with a real
        colleague's actual type. Click the padlock icon at the top right of
        the page to unlock it.
      </p>
    </div>
  );
}
