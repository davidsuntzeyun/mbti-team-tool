import { redirect } from "next/navigation";
import { getSessionUsername, isRosterUnlocked } from "../../lib/session";
import { getAllUsers, getUser, getOfficialRoster } from "../../lib/db";
import { getTypeProfile, getActivities, getActivity, rankTaskMatches, formatTypeCode, ACTIVITY_GROUPS } from "../../lib/mbti";
import NavTabs from "../components/NavTabs";

export default async function TaskMatchPage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const unlocked = isRosterUnlocked();
  const me = await getUser(username);

  const activities = getActivities();
  const activityKey = typeof searchParams?.activity === "string" ? searchParams.activity : "";
  const activity = getActivity(activityKey);

  let matches = [];
  if (me?.mbtiType && activity) {
    const [allUsers, officialRoster] = await Promise.all([
      getAllUsers(),
      unlocked ? getOfficialRoster() : Promise.resolve([]),
    ]);
    const eligibleColleagues = [...allUsers, ...officialRoster].filter(
      (u) => u.username.toLowerCase() !== username.toLowerCase() && u.mbtiType
    );
    matches = rankTaskMatches(activity, [me, ...eligibleColleagues]);
  }

  const idealMatches = matches.filter((m) => m.matchScore === 4);
  const closeMatches = matches.filter((m) => m.matchScore === 3);

  return (
    <>
      <NavTabs active="/task-match" username={username} />

      <div className="card">
        <span className="pill">Single task</span>
        <h1 style={{ marginTop: 10 }}>Task Match</h1>
        <p>
          Pick one task and see who on the roster is naturally suited to
          it, and why, without building out a whole group first. For the
          group-fit version of this, see Team Builder.
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
            <h2>What's the task?</h2>
            {!unlocked && (
              <p className="hint" style={{ marginTop: -4 }}>
                Showing colleagues who've set up their own profile. Unlock the roster (top right) to also include the official pre-loaded roster.
              </p>
            )}
            <form method="get">
              <select name="activity" defaultValue={activityKey}>
                <option value="" disabled>Pick a task&hellip;</option>
                {ACTIVITY_GROUPS.map((groupName) => (
                  <optgroup key={groupName} label={groupName}>
                    {activities
                      .filter((a) => a.group === groupName)
                      .map((a) => (
                        <option key={a.key} value={a.key}>{a.label}</option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <button className="btn" type="submit">See who fits</button>
            </form>
          </div>

          {activity && (
            <>
              <div className="card">
                <span className="pill">Ideal profile</span>
                <h2 style={{ marginTop: 10 }}>{activity.label}</h2>
                <p className="hint" style={{ marginTop: -4 }}>{activity.description}</p>
                <p>{activity.skillsNeeded}</p>

                <div className="section-label" style={{ marginTop: 14 }}>Ideal types for this task</div>
                {activity.idealTypes.map((t) => (
                  <div key={t} style={{ marginBottom: 10 }}>
                    <div className="user-row" style={{ marginBottom: 2 }}>
                      <span><strong>{getTypeProfile(t)?.archetype}</strong> ({t})</span>
                    </div>
                    <p className="hint" style={{ marginTop: 0 }}>{activity.idealTypeReasons?.[t]}</p>
                  </div>
                ))}

                <p>{activity.excelsAt}</p>
              </div>

              <div className="card">
                <div className="section-label">Ideal match, from your roster</div>
                <p className="hint" style={{ marginTop: -4 }}>Shares all 4 traits with one of the ideal types above.</p>
                {idealMatches.length === 0 ? (
                  <p className="hint">No one on the roster is an exact match for this task yet.</p>
                ) : (
                  idealMatches.map((c) => (
                    <div key={c.username} style={{ borderBottom: "1px solid #eef2f7", paddingBottom: 10, marginBottom: 10 }}>
                      <div className="user-row" style={{ borderBottom: "none", padding: 0 }}>
                        <span>
                          {c.displayName || c.username}{c.username === me.username ? " (you)" : ""}{" "}
                          {c.isOfficial && <span className="pill-official">Official</span>}{" "}
                          <span className="hint" style={{ display: "inline", marginTop: 0 }}>{getTypeProfile(c.mbtiType)?.archetype}</span>
                        </span>
                        <span className="pill">{formatTypeCode(c.mbtiType, c.identity)}</span>
                      </div>
                      <p className="hint" style={{ marginTop: 6, marginBottom: 0 }}>{activity.idealTypeReasons?.[c.mbtiType]}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="card">
                <div className="section-label">Close match, from your roster</div>
                <p className="hint" style={{ marginTop: -4 }}>Shares 3 of 4 traits with one of the ideal types above.</p>
                {closeMatches.length === 0 ? (
                  <p className="hint">No close matches on the roster right now.</p>
                ) : (
                  closeMatches.map((c) => (
                    <div key={c.username} style={{ borderBottom: "1px solid #eef2f7", paddingBottom: 10, marginBottom: 10 }}>
                      <div className="user-row" style={{ borderBottom: "none", padding: 0 }}>
                        <span>
                          {c.displayName || c.username}{c.username === me.username ? " (you)" : ""}{" "}
                          {c.isOfficial && <span className="pill-official">Official</span>}{" "}
                          <span className="hint" style={{ display: "inline", marginTop: 0 }}>{getTypeProfile(c.mbtiType)?.archetype}</span>
                        </span>
                        <span className="pill">{formatTypeCode(c.mbtiType, c.identity)} &middot; close to {c.closestIdealType}</span>
                      </div>
                      <p className="hint" style={{ marginTop: 6, marginBottom: 0 }}>{activity.idealTypeReasons?.[c.closestIdealType]}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
