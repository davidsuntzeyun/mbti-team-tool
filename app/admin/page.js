import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import { getAllUsers } from "../../lib/db";
import { adminDeleteUserAction } from "../actions";

export default async function AdminPage() {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const allUsers = await getAllUsers();
  const users = allUsers.sort((a, b) => a.username.localeCompare(b.username));

  return (
    <>
      <div className="nav-tabs">
        <a href="/profile">Your Profile</a>
        <a href="/guess">Guess</a>
        <a href="/match">Quick Match</a>
        <a href="/admin" className="active">Roster</a>
      </div>

      <div className="card">
        <span className="pill">{users.length} on the roster</span>
        <h1 style={{ marginTop: 10 }}>Team roster</h1>
        <p>
          Everyone who has created an account. Remove your own entry
          anytime from your profile, or clean up someone else's here if
          they made a mistake or asked you to.
        </p>
      </div>

      <div className="card">
        {users.length === 0 ? (
          <p>No one has signed up yet.</p>
        ) : (
          users.map((u) => (
            <div key={u.username} className="user-row">
              <div>
                <strong>{u.username}</strong>{" "}
                {u.mbtiType ? (
                  <span className="pill">{u.mbtiType}</span>
                ) : (
                  <span className="hint" style={{ marginTop: 0 }}>hasn't set a type yet</span>
                )}
              </div>
              <form action={adminDeleteUserAction}>
                <input type="hidden" name="username" value={u.username} />
                <button
                  className="btn btn-danger"
                  style={{ marginTop: 0, padding: "6px 12px", fontSize: 13 }}
                  type="submit"
                >
                  {u.username === username ? "Delete my account" : "Remove"}
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </>
  );
}
