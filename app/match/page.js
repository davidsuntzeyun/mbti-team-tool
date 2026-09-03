import { redirect } from "next/navigation";
import { getSessionUsername, isRosterUnlocked } from "../../lib/session";
import { getAllUsers, getUser, getOfficialRoster, getContentVotesByUser } from "../../lib/db";
import { getTypeProfile, quickMatch, getCommunicationFeel, getIdentityMatch, formatTypeCode } from "../../lib/mbti";
import { typeContentKey, matchContentKey, identityMatchContentKey, commFeelContentKey } from "../../lib/feedback";
import NavTabs from "../components/NavTabs";
import ThumbsVote from "../components/ThumbsVote";

export default async function MatchPage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const unlocked = isRosterUnlocked();
  const me = await getUser(username);

  const [allUsers, officialRoster] = await Promise.all([
    getAllUsers(),
    unlocked ? getOfficialRoster() : Promise.resolve([]),
  ]);
  const allColleagues = [...allUsers, ...officialRoster];
  const colleagues = allColleagues.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
  const withUsername = searchParams?.with;
  const colleague = withUsername
    ? allColleagues.find((u) => u.username.toLowerCase() === withUsername.toLowerCase())
    : null;
  const votes = me?.mbtiType && colleague?.mbtiType ? await getContentVotesByUser(username) : {};
  const redirectTo = withUsername ? `/match?with=${encodeURIComponent(withUsername)}` : "/match";

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
        <>
          <div className="card">
            {!unlocked && (
              <p className="hint" style={{ marginTop: 0 }}>
                Showing colleagues who've set up their own profile. Unlock the roster (top right) to also include the official pre-loaded roster.
              </p>
            )}
            <form method="get">
              <label>Match with</label>
              <select name="with" defaultValue={withUsername || ""}>
                <option value="" disabled>Select a colleague&hellip;</option>
                {colleagues.map((c) => (
                  <option key={c.username} value={c.username}>
                    {c.displayName || c.username}{c.isOfficial ? " · Official" : ""}
                  </option>
                ))}
              </select>
              <button className="btn" type="submit">See the match</button>
            </form>
          </div>

          {colleague && <MatchResult me={me} colleague={colleague} votes={votes} redirectTo={redirectTo} />}

          {withUsername && !colleague && (
            <div className="card">
              <p>Couldn't find that colleague. They may have removed their account.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}

function MatchResult({ me, colleague, votes, redirectTo }) {
  if (!colleague.mbtiType) {
    return (
      <div className="card">
        <p>{colleague.displayName || colleague.username} hasn't entered their MBTI type yet, so there's nothing to match against just yet.</p>
      </div>
    );
  }

  const meProfile = getTypeProfile(me.mbtiType);
  const colleagueProfile = getTypeProfile(colleague.mbtiType);
  const colleagueLabel = colleague.displayName || colleague.username;
  const result = quickMatch(me.mbtiType, colleague.mbtiType);
  const feel = getCommunicationFeel(me.mbtiType, colleague.mbtiType);
  const identityMatch = getIdentityMatch(me.identity, colleague.identity);

  return (
    <>
      <div className="card">
        {colleague.isOfficial && <span className="pill-official">Official</span>}
        <h2 style={{ marginTop: colleague.isOfficial ? 10 : 0 }}>
          {meProfile.archetype} ({formatTypeCode(me.mbtiType, me.identity)}){" "}
          <span style={{ color: "#c6c6c6", fontWeight: 400 }}>&times;</span>{" "}
          {colleagueProfile.archetype} ({formatTypeCode(colleague.mbtiType, colleague.identity)})
        </h2>
        <p>
          You ({meProfile.label}) and {colleagueLabel} ({colleagueProfile.label}).
        </p>
      </div>

      <div className="card">
        <div className="section-label">Strengths working together</div>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {result.strengths.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <ThumbsVote contentKey={matchContentKey(me.mbtiType, colleague.mbtiType, "strengths")} vote={votes[matchContentKey(me.mbtiType, colleague.mbtiType, "strengths")]} redirectTo={redirectTo} />
      </div>

      <div className="card">
        <div className="section-label">Weaknesses working together</div>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {result.weaknesses.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <ThumbsVote contentKey={matchContentKey(me.mbtiType, colleague.mbtiType, "weaknesses")} vote={votes[matchContentKey(me.mbtiType, colleague.mbtiType, "weaknesses")]} redirectTo={redirectTo} />
      </div>

      <div className="card">
        <div className="section-label">Likely communication conflicts</div>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {result.conflicts.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <ThumbsVote contentKey={matchContentKey(me.mbtiType, colleague.mbtiType, "conflicts")} vote={votes[matchContentKey(me.mbtiType, colleague.mbtiType, "conflicts")]} redirectTo={redirectTo} />
      </div>

      {identityMatch && (
        <div className="card">
          <span className="pill">Optional 5th trait</span>
          <div className="section-label" style={{ marginTop: 10 }}>Under pressure together</div>
          <p>{identityMatch.strength}</p>
          <p>{identityMatch.weakness}</p>
          <p className="hint">{identityMatch.conflict}</p>
          <ThumbsVote contentKey={identityMatchContentKey(me.identity, colleague.identity, "underPressureTogether")} vote={votes[identityMatchContentKey(me.identity, colleague.identity, "underPressureTogether")]} redirectTo={redirectTo} />
        </div>
      )}

      {colleagueProfile.teamDynamics && (
        <>
          <div className="card">
            <div className="section-label">Team dynamics</div>
            <h2 style={{ marginTop: 0 }}>Working well with {colleagueLabel}</h2>
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
            <ThumbsVote contentKey={typeContentKey(colleague.mbtiType, "teamDynamics:asManager")} vote={votes[typeContentKey(colleague.mbtiType, "teamDynamics:asManager")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">If they are your peer</div>
            <p>{colleagueProfile.teamDynamics.asPeer}</p>
            <ThumbsVote contentKey={typeContentKey(colleague.mbtiType, "teamDynamics:asPeer")} vote={votes[typeContentKey(colleague.mbtiType, "teamDynamics:asPeer")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">If they are your team member</div>
            <p>{colleagueProfile.teamDynamics.asTeamMember}</p>
            <ThumbsVote contentKey={typeContentKey(colleague.mbtiType, "teamDynamics:asTeamMember")} vote={votes[typeContentKey(colleague.mbtiType, "teamDynamics:asTeamMember")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">How to communicate with them</div>
            <p>{colleagueProfile.teamDynamics.communicate}</p>
            <ThumbsVote contentKey={typeContentKey(colleague.mbtiType, "teamDynamics:communicate")} vote={votes[typeContentKey(colleague.mbtiType, "teamDynamics:communicate")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">How to bring out their best</div>
            <p>{colleagueProfile.teamDynamics.bringOutBest}</p>
            <ThumbsVote contentKey={typeContentKey(colleague.mbtiType, "teamDynamics:bringOutBest")} vote={votes[typeContentKey(colleague.mbtiType, "teamDynamics:bringOutBest")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">How {colleagueLabel} likely feels communicating with you</div>
            <p>{feel.howTheyFeelWithYou}</p>
            <ThumbsVote contentKey={commFeelContentKey(colleague.mbtiType, me.mbtiType)} vote={votes[commFeelContentKey(colleague.mbtiType, me.mbtiType)]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">How you likely feel communicating with {colleagueLabel}</div>
            <p>{feel.howYouFeelWithThem}</p>
            <ThumbsVote contentKey={commFeelContentKey(me.mbtiType, colleague.mbtiType)} vote={votes[commFeelContentKey(me.mbtiType, colleague.mbtiType)]} redirectTo={redirectTo} />
          </div>
        </>
      )}
    </>
  );
}
