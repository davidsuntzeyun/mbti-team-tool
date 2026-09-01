import { redirect } from "next/navigation";
import { getSessionUsername, isRosterUnlocked } from "../../lib/session";
import { getAllUsers, getUser, getOfficialRoster } from "../../lib/db";
import { getTypeProfile, analyzeGroup, analyzeGroupIdentity, formatTypeCode } from "../../lib/mbti";
import NavTabs from "../components/NavTabs";
import LockedNotice from "../components/LockedNotice";

const DICHOTOMY_LABELS = {
  EI: "Energy: Extraversion vs. Introversion",
  SN: "Focus: Sensing vs. Intuition",
  TF: "Decisions: Thinking vs. Feeling",
  JP: "Structure: Judging vs. Perceiving",
};

function normalizeMembers(raw) {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export default async function TeamPage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const unlocked = isRosterUnlocked();
  const me = await getUser(username);

  let eligibleColleagues = [];
  if (unlocked) {
    const [allUsers, officialRoster] = await Promise.all([getAllUsers(), getOfficialRoster()]);
    eligibleColleagues = [...allUsers, ...officialRoster].filter(
      (u) => u.username.toLowerCase() !== username.toLowerCase() && u.mbtiType
    );
  }

  const selected = normalizeMembers(searchParams?.members).filter((name) =>
    eligibleColleagues.some((c) => c.username === name)
  );

  const hasSelection = normalizeMembers(searchParams?.members).length > 0;
  const validCount = selected.length >= 2 && selected.length <= 4;

  let group = null;
  let analysis = null;
  let identityAnalysis = null;
  if (unlocked && hasSelection && validCount) {
    const members = [me, ...selected.map((name) => eligibleColleagues.find((c) => c.username === name))];
    group = members;
    analysis = analyzeGroup(members.map((m) => m.mbtiType));
    identityAnalysis = analyzeGroupIdentity(members.map((m) => m.identity));
  }

  return (
    <>
      <NavTabs active="/team" username={username} />

      <div className="card">
        <span className="pill">3 to 5 people</span>
        <h1 style={{ marginTop: 10 }}>Team Dynamic</h1>
        <p>
          Build a group of 3 to 5 people (you're automatically included) and
          see how the group tends to work together as a whole: where you're
          naturally aligned, where the group might be lopsided, and what to
          watch for when you're all in a room together.
        </p>
      </div>

      {!unlocked ? (
        <LockedNotice what="Team Dynamic" />
      ) : !me?.mbtiType ? (
        <div className="card">
          <p>Set your own MBTI type on your profile first, then come back here to build a group.</p>
          <a className="btn" href="/profile">Go to your profile</a>
        </div>
      ) : (
        <div className="card">
          <h2>Build your group</h2>
          <p className="hint" style={{ marginTop: -4 }}>
            You ({getTypeProfile(me.mbtiType)?.archetype}, {formatTypeCode(me.mbtiType, me.identity)}) are
            already in. Pick 2 to 4 more colleagues to complete a group of 3 to 5.
          </p>
          {hasSelection && !validCount && (
            <p className="error">
              Pick between 2 and 4 colleagues (a group of 3 to 5 including you). You picked {selected.length}.
            </p>
          )}
          {eligibleColleagues.length === 0 ? (
            <p>No colleagues with a saved MBTI type yet, ask them to set their type on their profile first.</p>
          ) : (
            <form method="get">
              <div className="type-grid" style={{ gridTemplateColumns: "1fr" }}>
                {eligibleColleagues.map((c) => {
                  const profile = getTypeProfile(c.mbtiType);
                  const id = `member-${c.username}`;
                  return (
                    <div key={c.username} className="user-row" style={{ padding: "6px 0" }}>
                      <label htmlFor={id} style={{ display: "flex", alignItems: "center", gap: 10, margin: 0, fontWeight: 500 }}>
                        <input
                          type="checkbox"
                          id={id}
                          name="members"
                          value={c.username}
                          defaultChecked={selected.includes(c.username)}
                          style={{ width: "auto" }}
                        />
                        {c.displayName || c.username}{" "}
                        {c.isOfficial && <span className="pill-official">Official</span>}{" "}
                        <span className="pill" style={{ marginLeft: "auto" }}>
                          {profile?.archetype} &middot; {formatTypeCode(c.mbtiType, c.identity)}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
              <button className="btn" type="submit">See group dynamic</button>
            </form>
          )}
        </div>
      )}

      {group && analysis && (
        <>
          <div className="card">
            <div className="section-label">Your group ({analysis.size})</div>
            {group.map((m) => {
              const profile = getTypeProfile(m.mbtiType);
              return (
                <div key={m.username} className="user-row">
                  <span>
                    {m.displayName || m.username}{m.username === me.username ? " (you)" : ""}{" "}
                    {m.isOfficial && <span className="pill-official">Official</span>}
                  </span>
                  <span className="pill">{profile?.archetype} &middot; {formatTypeCode(m.mbtiType, m.identity)}</span>
                </div>
              );
            })}
          </div>

          {analysis.dichotomyResults.map((d) => (
            <div key={d.key} className="card">
              <div className="section-label">{DICHOTOMY_LABELS[d.key]}</div>
              <p className="hint" style={{ marginTop: -6 }}>
                {Object.entries(d.counts).map(([letter, count], i, arr) => (
                  <span key={letter}>
                    {letter}: {count}
                    {i < arr.length - 1 ? <span style={{ margin: "0 8px" }}>&middot;</span> : null}
                  </span>
                ))}
              </p>
              <p>{d.text}</p>
            </div>
          ))}

          {identityAnalysis && (
            <div className="card">
              <span className="pill">Optional 5th trait</span>
              <div className="section-label" style={{ marginTop: 10 }}>Handling pressure: Assertive vs. Turbulent</div>
              <p className="hint" style={{ marginTop: -6 }}>
                A: {identityAnalysis.counts.A} &middot; T: {identityAnalysis.counts.T}
                {identityAnalysis.consideredCount < identityAnalysis.totalSize
                  ? ` (based on the ${identityAnalysis.consideredCount} of ${identityAnalysis.totalSize} who've set this)`
                  : ""}
              </p>
              <p>{identityAnalysis.text}</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
