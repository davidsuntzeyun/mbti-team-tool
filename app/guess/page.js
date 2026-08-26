import { redirect } from "next/navigation";
import { getSessionUsername, isGuessUnlocked } from "../../lib/session";
import { getAllUsers, getUser, getGuessesByUser } from "../../lib/db";
import { getTypeProfile, quickMatch } from "../../lib/mbti";
import { saveGuessAction, removeGuessAction, unlockGuessAction } from "../actions";
import TypePicker from "../components/TypePicker";
import NavTabs from "../components/NavTabs";
import PasswordGate from "../components/PasswordGate";

export default async function GuessPage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  if (!isGuessUnlocked()) {
    return (
      <>
        <NavTabs active="/guess" username={username} />
        <PasswordGate
          action={unlockGuessAction}
          title="Guess your colleagues"
          description="This part of the tool is locked until the live session. Ask your facilitator for the password."
          error={searchParams?.gateError}
        />
      </>
    );
  }

  const error = searchParams?.error;
  const editTarget = searchParams?.edit;

  const me = await getUser(username);
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
          Type in anyone's name and guess their MBTI type, with your
          reasoning. There's no pressure to be right, the actual answers get
          revealed live in the session. Explaining your reasoning is what
          makes this useful, not the score.
        </p>
      </div>

      <div className="card">
        <h2>{editing ? `Update your guess for ${editTarget}` : "Add a guess"}</h2>
        {error && <p className="error">{decodeURIComponent(error)}</p>}
        <form action={saveGuessAction}>
          <label>Name</label>
          <input
            type="text"
            name="guessedUsername"
            list="colleague-suggestions"
            defaultValue={editTarget || ""}
            placeholder="Type a name..."
            required
          />
          {colleagues.length > 0 && (
            <datalist id="colleague-suggestions">
              {colleagues.map((c) => (
                <option key={c.username} value={c.username} />
              ))}
            </datalist>
          )}
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

      <div className="card">
        <h2>Your guesses so far ({myGuesses.length})</h2>
        {myGuesses.length === 0 ? (
          <p>You haven't guessed anyone yet.</p>
        ) : (
          myGuesses.map((g) => {
            const compatibility = me?.mbtiType ? quickMatch(me.mbtiType, g.guessedType) : null;
            return (
              <div key={g.guessedUsername} style={{ borderBottom: "1px solid #eef2f7", paddingBottom: 8, marginBottom: 8 }}>
                <div className="user-row" style={{ alignItems: "flex-start", borderBottom: "none", padding: 0 }}>
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

                {compatibility ? (
                  <details style={{ marginTop: 6 }}>
                    <summary className="collapsible-summary" style={{ fontSize: 13, fontWeight: 600, color: "#0079c1" }}>
                      See compatibility with {g.guessedUsername}
                    </summary>
                    <p className="hint" style={{ marginTop: 6 }}>
                      Just for fun, based on your type ({me.mbtiType}) and the type you guessed for
                      them, this works whether or not {g.guessedUsername} is actually on this tool.
                    </p>
                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                      {compatibility.strengths.map((s, i) => (
                        <li key={i} style={{ fontSize: 13.5, color: "var(--bi-gray)" }}>{s}</li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <p className="hint" style={{ marginTop: 6 }}>
                    <a href="/profile">Set your own MBTI type</a> to see a compatibility readout for this guess.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
