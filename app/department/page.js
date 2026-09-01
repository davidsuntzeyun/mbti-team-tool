import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import { getAllUsers, getUser } from "../../lib/db";
import { getTypeProfile, analyzeGroup, analyzeGroupIdentity, formatTypeCode } from "../../lib/mbti";
import NavTabs from "../components/NavTabs";

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

export default async function DepartmentPage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const me = await getUser(username);
  const allUsers = await getAllUsers();

  const eligibleColleagues = allUsers.filter(
    (u) => u.username.toLowerCase() !== username.toLowerCase() && u.mbtiType
  );

  if (!me?.mbtiType) {
    return (
      <>
        <NavTabs active="/department" username={username} />
        <div className="card">
          <p>Set your own MBTI type on your profile first, then come back here to build your department.</p>
          <a className="btn" href="/profile">Go to your profile</a>
        </div>
      </>
    );
  }

  const selected = normalizeMembers(searchParams?.members).filter((name) =>
    eligibleColleagues.some((c) => c.username === name)
  );

  const hasSelection = normalizeMembers(searchParams?.members).length > 0;
  const validCount = selected.length >= 1;

  let reports = null;
  let group = null;
  let analysis = null;
  let identityAnalysis = null;
  if (hasSelection && validCount) {
    reports = selected.map((name) => eligibleColleagues.find((c) => c.username === name));
    group = [me, ...reports];
    analysis = analyzeGroup(group.map((m) => m.mbtiType));
    identityAnalysis = analyzeGroupIdentity(group.map((m) => m.identity));
  }

  return (
    <>
      <NavTabs active="/department" username={username} />

      <div className="card">
        <span className="pill">No size limit</span>
        <h1 style={{ marginTop: 10 }}>Department Dynamic</h1>
        <p>
          Pick everyone who reports to you, however many that is, and see
          two things: how the department balances as a whole, and a
          personalized note on how to manage each person on it.
        </p>
      </div>

      <div className="card">
        <h2>Build your department</h2>
        <p className="hint" style={{ marginTop: -4 }}>
          You ({getTypeProfile(me.mbtiType)?.archetype}, {formatTypeCode(me.mbtiType, me.identity)}) are
          already in. Pick everyone on your team, unlike Team Dynamic there's no cap here.
        </p>
        {eligibleColleagues.length === 0 ? (
          <p>No colleagues with a saved MBTI type yet, ask them to set their type on their profile first.</p>
        ) : (
          <form method="get">
            <div className="type-grid" style={{ gridTemplateColumns: "1fr" }}>
              {eligibleColleagues.map((c) => {
                const profile = getTypeProfile(c.mbtiType);
                const id = `report-${c.username}`;
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
                      {c.username}{" "}
                      <span className="pill" style={{ marginLeft: "auto" }}>
                        {profile?.archetype} &middot; {formatTypeCode(c.mbtiType, c.identity)}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
            <button className="btn" type="submit">See department dynamic</button>
          </form>
        )}
      </div>

      {group && analysis && (
        <>
          <div className="card">
            <div className="section-label">Your department ({analysis.size})</div>
            {group.map((m) => {
              const profile = getTypeProfile(m.mbtiType);
              return (
                <div key={m.username} className="user-row">
                  <span>{m.username}{m.username === me.username ? " (you)" : ""}</span>
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

          <div className="card">
            <span className="pill">Per report</span>
            <h2 style={{ marginTop: 10 }}>How to manage each person</h2>
            <p className="hint" style={{ marginTop: -4 }}>
              Pulled straight from each person's type profile, from their
              side of the reporting line.
            </p>
          </div>

          {reports.map((r) => {
            const profile = getTypeProfile(r.mbtiType);
            return (
              <div key={r.username} className="card">
                <span className="pill">{formatTypeCode(r.mbtiType, r.identity)}</span>
                <h2 style={{ marginTop: 10 }}>{r.username}</h2>
                <p className="hint" style={{ marginTop: -8, marginBottom: 12 }}>{profile?.archetype}</p>
                {profile?.teamDynamics ? (
                  <>
                    <p>{profile.teamDynamics.asTeamMember}</p>
                    <div className="grid-2" style={{ marginTop: 4 }}>
                      <div>
                        <h3>How to communicate with them</h3>
                        <p>{profile.teamDynamics.communicate}</p>
                      </div>
                      <div>
                        <h3>How to bring out their best</h3>
                        <p>{profile.teamDynamics.bringOutBest}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="hint">No management notes available for this type yet.</p>
                )}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
