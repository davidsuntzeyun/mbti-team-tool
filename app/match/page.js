import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import { getAllUsers, getUser } from "../../lib/db";
import { getTypeProfile, quickMatch } from "../../lib/mbti";

export default async function MatchPage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const me = await getUser(username);
  const allUsers = await getAllUsers();
  const colleagues = allUsers.filter(
    (u) => u.username.toLowerCase() !== username.toLowerCase()
  );

  const withUsername = searchParams?.with;
  const colleague = withUsername ? await getUser(withUsername) : null;

  return (
    <>
      <div className="nav-tabs">
        <a href="/profile">Your Profile</a>
        <a href="/guess">Guess</a>
        <a href="/match" className="active">Quick Match</a>
        <a href="/admin">Roster</a>
      </div>

      <div className="card">
        <span className="pill">Anytime</span>
        <h1 style={{ marginTop: 10 }}>Quick Match</h1>
        <p>
          Pick any colleague to see how your two types tend to work
          together: your strengths, your friction points, and where
          communication is likely to trip up. Handy any time you're
          starting to work with someone new.
        </p>
      </div>

      {!me?.mbtiType ? (
        <div className="card">
          <p>Set your own MBTI type on your profile first, then come back here.</p>
          <a className="btn" href="/profile">Go to your profile</a>
        </div>
      ) : (
        <div className="card">
          <form method="get">
            <label>Match with</label>
            <select name="with" defaultValue={withUsername || ""}>
              <option value="" disabled>Select a colleague&hellip;</option>
              {colleagues.map((c) => (
                <option key={c.username} value={c.username}>{c.username}</option>
              ))}
            </select>
            <button className="btn" type="submit">See the match</button>
          </form>
        </div>
      )}

      {me?.mbtiType && colleague && (
        <MatchResult me={me} colleague={colleague} />
      )}

      {me?.mbtiType && withUsername && !colleague && (
        <div className="card">
          <p>Couldn't find that colleague. They may have removed their account.</p>
        </div>
      )}
    </>
  );
}

function MatchResult({ me, colleague }) {
  if (!colleague.mbtiType) {
    return (
      <div className="card">
        <p>{colleague.username} hasn't entered their MBTI type yet, so there's nothing to match against just yet.</p>
      </div>
    );
  }

  const meProfile = getTypeProfile(me.mbtiType);
  const colleagueProfile = getTypeProfile(colleague.mbtiType);
  const result = quickMatch(me.mbtiType, colleague.mbtiType);

  return (
    <>
      <div className="card">
        <h2>
          {meProfile.archetype} ({me.mbtiType}){" "}
          <span style={{ color: "#c6c6c6", fontWeight: 400 }}>&times;</span>{" "}
          {colleagueProfile.archetype} ({colleague.mbtiType})
        </h2>
        <p>
          You ({meProfile.label}) and {colleague.username} ({colleagueProfile.label}).
        </p>
      </div>

      <div className="card">
        <div className="section-label">Strengths working together</div>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {result.strengths.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <div className="section-label">Weaknesses working together</div>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {result.weaknesses.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <div className="section-label">Likely communication conflicts</div>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {result.conflicts.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
