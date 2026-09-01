import { redirect } from "next/navigation";
import { getSessionUsername, isRosterUnlocked } from "../../lib/session";
import { getAllUsers, getUser } from "../../lib/db";
import { getTypeProfile, quickMatch, getCommunicationFeel, getIdentityMatch, formatTypeCode } from "../../lib/mbti";
import { unlockRosterAction } from "../actions";
import NavTabs from "../components/NavTabs";
import PasswordGate from "../components/PasswordGate";

export default async function MatchPage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  if (!isRosterUnlocked()) {
    return (
      <>
        <NavTabs active="/match" username={username} />
        <PasswordGate
          action={unlockRosterAction}
          redirectTo="/match"
          title="Quick Match"
          description="Matching against a real colleague's actual type is locked. Ask whoever shared this tool with you for the password."
          error={searchParams?.gateError}
        />
      </>
    );
  }

  const me = await getUser(username);
  const allUsers = await getAllUsers();
  const colleagues = allUsers.filter(
    (u) => u.username.toLowerCase() !== username.toLowerCase()
  );

  const withUsername = searchParams?.with;
  const colleague = withUsername ? await getUser(withUsername) : null;

  return (
    <>
      <NavTabs active="/match" username={username} />

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
  const feel = getCommunicationFeel(me.mbtiType, colleague.mbtiType);
  const identityMatch = getIdentityMatch(me.identity, colleague.identity);

  return (
    <>
      <div className="card">
        <h2>
          {meProfile.archetype} ({formatTypeCode(me.mbtiType, me.identity)}){" "}
          <span style={{ color: "#c6c6c6", fontWeight: 400 }}>&times;</span>{" "}
          {colleagueProfile.archetype} ({formatTypeCode(colleague.mbtiType, colleague.identity)})
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

      {identityMatch && (
        <div className="card">
          <span className="pill">Optional 5th trait</span>
          <div className="section-label" style={{ marginTop: 10 }}>Under pressure together</div>
          <p>{identityMatch.strength}</p>
          <p>{identityMatch.weakness}</p>
          <p className="hint">{identityMatch.conflict}</p>
        </div>
      )}

      {colleagueProfile.teamDynamics && (
        <>
          <div className="card">
            <div className="section-label">Team dynamics</div>
            <h2 style={{ marginTop: 0 }}>Working well with {colleague.username}</h2>
            <p>
              The intention here is simple: make sure you are working well
              together. Understanding your communication style and theirs
              helps the two of you get the most out of the team, whatever
              the reporting line looks like.
            </p>
          </div>

          <div className="card">
            <div className="section-label">If they are your manager</div>
            <p>{colleagueProfile.teamDynamics.asManager}</p>
          </div>

          <div className="card">
            <div className="section-label">If they are your peer</div>
            <p>{colleagueProfile.teamDynamics.asPeer}</p>
          </div>

          <div className="card">
            <div className="section-label">If they are your team member</div>
            <p>{colleagueProfile.teamDynamics.asTeamMember}</p>
          </div>

          <div className="card">
            <div className="section-label">How to communicate with them</div>
            <p>{colleagueProfile.teamDynamics.communicate}</p>
          </div>

          <div className="card">
            <div className="section-label">How to bring out their best</div>
            <p>{colleagueProfile.teamDynamics.bringOutBest}</p>
          </div>

          <div className="card">
            <div className="section-label">How {colleague.username} likely feels communicating with you</div>
            <p>{feel.howTheyFeelWithYou}</p>
          </div>

          <div className="card">
            <div className="section-label">How you likely feel communicating with {colleague.username}</div>
            <p>{feel.howYouFeelWithThem}</p>
          </div>
        </>
      )}
    </>
  );
}
