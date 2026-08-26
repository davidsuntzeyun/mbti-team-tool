import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import { getAllUsers, getGuessesByUser } from "../../lib/db";
import { getTypeProfile } from "../../lib/mbti";
import { saveGuessAction, removeGuessAction } from "../actions";
import TypePicker from "../components/TypePicker";
import NavTabs from "../components/NavTabs";

export default async function GuessPage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const error = searchParams?.error;
  const editTarget = searchParams?.edit;

  const allUsers = await getAllUsers();
  const colleagues = allUsers.filter(
    (u) => u.username.toLowerCase() !== username.toLowerCase()
  );
  const myGuesses = await getGuessesByUser(username);
  const guessMap = Object.fromEntries(myGuesses.map((g) => [g.guessedUsername, g]));
  const editing = editTarget ? guessMap[editTarget] : null;

  return (
    <>
      <NavTabs active="/guess" username={username} />

      <div className="card">
        <span className="pill">Just for fun</span>
        <h1 style={{ marginTop: 10 }}>Guess your colleagues</h1>
        <p>
          Pick a few colleagues and guess their MBTI type, with your
          reasoning. There's no pressure to be right, the actual answers get
          revealed live in the session. Explaining your reasoning is what
          makes this useful, not the score.
        </p>
      </div>

      {colleagues.length === 0 ? (
        <div className="card">
          <p>No other colleagues have created an account yet. Check back once more of the team has joined.</p>
        </div>
      ) : (
        <div className="card">
          <h2>{editing ? `Update your guess for ${editTarget}` : "Add a guess"}</h2>
          {error && <p className="error">{decodeURIComponent(error)}</p>}
          <form action={saveGuessAction}>
            <label>Colleague</label>
            <select name="guessedUsername" defaultValue={editTarget || ""} required>
              <option value="" disabled>Select a colleague&hellip;</option>
              {colleagues.map((c) => (
                <option key={c.username} value={c.username}>
                  {c.username}{guessMap[c.username] ? " (already guessed)" : ""}
                </option>
              ))}
            </select>
            <label>Your guess</label>
            <TypePicker name="guessedType" defaultValue={editing?.guessedType || ""} required />
            <label>Why do you think so?</label>
            <textarea
              name="reasoning"
              defaultValue={editing?.reasoning || ""}
              placeholder="e.g. they're always the one keeping our meetings on schedule..."
            />
            <button className="btn" type="submit">{editing ? "Update guess" : "Save guess"}</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Your guesses so far ({myGuesses.length})</h2>
        {myGuesses.length === 0 ? (
          <p>You haven't guessed anyone yet.</p>
        ) : (
          myGuesses.map((g) => (
            <div key={g.guessedUsername} className="user-row" style={{ alignItems: "flex-start" }}>
              <div>
                <h3 style={{ marginBottom: 2 }}>
                  {g.guessedUsername} <span className="pill">{g.guessedType}</span>{" "}
                  <span className="hint" style={{ display: "inline", marginTop: 0 }}>
                    {getTypeProfile(g.guessedType)?.archetype}
                  </span>
                </h3>
                {g.reasoning && <p style={{ margin: 0 }}>{g.reasoning}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <a className="btn btn-outline" style={{ marginTop: 0, padding: "6px 12px", fontSize: 13 }} href={`/guess?edit=${encodeURIComponent(g.guessedUsername)}`}>
                  Edit
                </a>
                <form action={removeGuessAction}>
                  <input type="hidden" name="guessedUsername" value={g.guessedUsername} />
                  <button className="btn btn-danger" style={{ marginTop: 0, padding: "6px 12px", fontSize: 13 }} type="submit">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
