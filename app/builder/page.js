import { redirect } from "next/navigation";
import { getSessionUsername, isRosterUnlocked } from "../../lib/session";
import { getAllUsers, getUser, getOfficialRoster } from "../../lib/db";
import {
  getTypeProfile,
  rankComplements,
  analyzeGroup,
  getGapLetters,
  suggestGapFillers,
  buildRadarChart,
  getIdealPercentByLetter,
  getActivities,
  getActivity,
  evaluateActivityFit,
  suggestIdealPeople,
  analyzeGroupIdentity,
  formatTypeCode,
} from "../../lib/mbti";
import { unlockRosterAction } from "../actions";
import NavTabs from "../components/NavTabs";
import PasswordGate from "../components/PasswordGate";

const DICHOTOMY_LABELS = {
  EI: "Energy: Extraversion vs. Introversion",
  SN: "Focus: Sensing vs. Intuition",
  TF: "Decisions: Thinking vs. Feeling",
  JP: "Structure: Judging vs. Perceiving",
};

const ACTIVITY_GROUPS = ["Ideation & Planning", "Analysis & Execution", "People-Facing", "Pressure"];

const LETTER_MEANINGS = {
  E: "Extraversion, draws energy from people and action.",
  I: "Introversion, draws energy from reflection and quiet.",
  S: "Sensing, focuses on concrete facts and present reality.",
  N: "Intuition, focuses on patterns and future possibilities.",
  T: "Thinking, decides based on logic and consistency.",
  F: "Feeling, decides based on values and impact on people.",
  J: "Judging, prefers structure, plans, and closure.",
  P: "Perceiving, prefers flexibility and staying open.",
};

function normalizeMembers(raw) {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export default async function BuilderPage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  if (!isRosterUnlocked()) {
    return (
      <>
        <NavTabs active="/builder" username={username} />
        <PasswordGate
          action={unlockRosterAction}
          redirectTo="/builder"
          title="Team Builder"
          description="Building a team from real colleagues' actual types is locked. Ask whoever shared this tool with you for the password."
          error={searchParams?.gateError}
        />
      </>
    );
  }

  const me = await getUser(username);
  const [allUsers, officialRoster] = await Promise.all([getAllUsers(), getOfficialRoster()]);
  const eligibleColleagues = [...allUsers, ...officialRoster].filter(
    (u) => u.username.toLowerCase() !== username.toLowerCase() && u.mbtiType
  );

  if (!me?.mbtiType) {
    return (
      <>
        <NavTabs active="/builder" username={username} />
        <div className="card">
          <p>Set your own MBTI type on your profile first, then come back here.</p>
          <a className="btn" href="/profile">Go to your profile</a>
        </div>
      </>
    );
  }

  const { mostComplementary, mostCompatible } = rankComplements(me.mbtiType, eligibleColleagues);

  const activities = getActivities();
  const activityKey = typeof searchParams?.activity === "string" ? searchParams.activity : "";
  const activity = getActivity(activityKey);
  const idealPeople = activity ? suggestIdealPeople(activity, [me, ...eligibleColleagues]).slice(0, 5) : null;

  const selected = normalizeMembers(searchParams?.members).filter((name) =>
    eligibleColleagues.some((c) => c.username === name)
  );
  const hasSelection = normalizeMembers(searchParams?.members).length > 0;
  const validCount = selected.length >= 2 && selected.length <= 4;

  let group = null;
  let analysis = null;
  let radar = null;
  let gaps = null;
  let fillers = null;
  let activityFit = null;
  let activityFillers = null;
  let identityAnalysis = null;

  if (hasSelection && validCount) {
    const members = [me, ...selected.map((name) => eligibleColleagues.find((c) => c.username === name))];
    group = members;
    analysis = analyzeGroup(members.map((m) => m.mbtiType));
    identityAnalysis = analyzeGroupIdentity(members.map((m) => m.identity));
    radar = buildRadarChart(analysis, {
      idealPercentByLetter: activity ? getIdealPercentByLetter(activity) : null,
    });
    gaps = getGapLetters(analysis);
    const remaining = eligibleColleagues.filter((c) => !selected.includes(c.username));
    fillers = suggestGapFillers(gaps, remaining).slice(0, 3);

    if (activity) {
      activityFit = evaluateActivityFit(analysis, activity);
      activityFillers = suggestGapFillers(activityFit.gapLetters, remaining).slice(0, 3);
    }
  }

  return (
    <>
      <NavTabs active="/builder" username={username} />

      <div className="card">
        <span className="pill">Build &amp; balance</span>
        <h1 style={{ marginTop: 10 }}>Team Builder</h1>
        <p>
          Two ways to use this: see who on the roster naturally complements
          you or works with you most easily, or build a group and see
          exactly where it's balanced and where it's skewed.
        </p>
      </div>

      <div className="card">
        <h2>Who complements you</h2>
        <p className="hint" style={{ marginTop: -4 }}>
          Based on your type, {getTypeProfile(me.mbtiType)?.archetype} ({formatTypeCode(me.mbtiType, me.identity)}).
        </p>
        {eligibleColleagues.length === 0 ? (
          <p>No colleagues with a saved MBTI type yet.</p>
        ) : (
          <>
            <div className="section-label" style={{ marginTop: 14 }}>Most complementary (fills your gaps)</div>
            {mostComplementary.slice(0, 5).map((c) => (
              <div key={`comp-${c.username}`} className="user-row">
                <span>
                  {c.displayName || c.username}{" "}
                  {c.isOfficial && <span className="pill-official">Official</span>}{" "}
                  <span className="hint" style={{ display: "inline", marginTop: 0 }}>{getTypeProfile(c.mbtiType)?.archetype}</span>
                </span>
                <span className="pill">{formatTypeCode(c.mbtiType, c.identity)} &middot; differs on {c.diffCount}/4</span>
              </div>
            ))}

            <div className="section-label" style={{ marginTop: 18 }}>Most compatible (easiest rapport)</div>
            {mostCompatible.slice(0, 5).map((c) => (
              <div key={`compat-${c.username}`} className="user-row">
                <span>
                  {c.displayName || c.username}{" "}
                  {c.isOfficial && <span className="pill-official">Official</span>}{" "}
                  <span className="hint" style={{ display: "inline", marginTop: 0 }}>{getTypeProfile(c.mbtiType)?.archetype}</span>
                </span>
                <span className="pill">{formatTypeCode(c.mbtiType, c.identity)} &middot; shares {c.sameCount}/4</span>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="card">
        <h2>Build a group and find the gaps</h2>
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
          <p>No colleagues with a saved MBTI type yet.</p>
        ) : (
          <form method="get">
            <label>What's this group for?</label>
            <select name="activity" defaultValue={activityKey}>
              <option value="">General balance (no specific activity)</option>
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
            <p className="hint" style={{ marginTop: 6 }}>
              {activity
                ? activity.description
                : "Pick an activity to compare this group against the ideal mix for that kind of work, or leave it general for an overall balance check."}
            </p>
            <div className="type-grid" style={{ gridTemplateColumns: "1fr", marginTop: 16 }}>
              {eligibleColleagues.map((c) => {
                const profile = getTypeProfile(c.mbtiType);
                const id = `builder-member-${c.username}`;
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
            <button className="btn" type="submit">See the group's balance</button>
          </form>
        )}
      </div>

      {activity && (
        <div className="card">
          <span className="pill">Ideal profile</span>
          <h2 style={{ marginTop: 10 }}>Who tends to excel at {activity.label.toLowerCase()}</h2>
          <p className="hint" style={{ marginTop: -4 }}>
            {activity.idealTypes.map((t, i) => (
              <span key={t}>
                {i > 0 ? ", " : ""}
                {getTypeProfile(t)?.archetype} ({t})
              </span>
            ))}
          </p>

          <div className="section-label" style={{ marginTop: 14 }}>Why these types outshine here</div>
          {activity.idealTypes.map((t) => (
            <div key={t} style={{ marginBottom: 10 }}>
              <div className="user-row" style={{ marginBottom: 2 }}>
                <span><strong>{getTypeProfile(t)?.archetype}</strong> ({t})</span>
              </div>
              <p className="hint" style={{ marginTop: 0 }}>{activity.idealTypeReasons?.[t]}</p>
            </div>
          ))}

          <p>{activity.excelsAt}</p>

          <div className="section-label" style={{ marginTop: 14 }}>From your roster</div>
          {!idealPeople || idealPeople.length === 0 ? (
            <p className="hint">No one on the roster closely matches this profile yet.</p>
          ) : (
            idealPeople.map((c) => (
              <div key={c.username} className="user-row">
                <span>
                  {c.displayName || c.username}{c.username === me.username ? " (you)" : ""}{" "}
                  {c.isOfficial && <span className="pill-official">Official</span>}{" "}
                  <span className="hint" style={{ display: "inline", marginTop: 0 }}>
                    {getTypeProfile(c.mbtiType)?.archetype}
                  </span>
                </span>
                <span className="pill">{formatTypeCode(c.mbtiType, c.identity)} &middot; {c.matchScore === 4 ? "ideal match" : "close match"}</span>
              </div>
            ))
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

          <div className="card">
            <div className="section-label">Group profile</div>
            <svg
              width={radar.size}
              height={radar.size}
              viewBox={`0 0 ${radar.size} ${radar.size}`}
              style={{ display: "block", margin: "8px auto" }}
            >
              {radar.gridPolygons.map((points, i) => (
                <polygon key={i} points={points} fill="none" stroke="#d5dee8" strokeWidth="1" />
              ))}
              {radar.axisLines.map((line) => (
                <line
                  key={line.letter}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#d5dee8"
                  strokeWidth="1"
                />
              ))}
              {radar.idealPolygonPoints && (
                <polygon
                  points={radar.idealPolygonPoints}
                  fill="none"
                  stroke="#c6006f"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
              )}
              <polygon
                points={radar.dataPolygonPoints}
                fill="rgba(0, 121, 193, 0.22)"
                stroke="#0079c1"
                strokeWidth="2"
              />
              {radar.labels.map((l) => (
                <g key={l.letter} style={{ cursor: "help" }}>
                  <title>{`${l.letter}: ${LETTER_MEANINGS[l.letter]} ${l.percent}% of this group.${l.idealPercent !== null ? ` Ideal for this activity: ${l.idealPercent}%.` : ""}`}</title>
                  <circle cx={l.x} cy={l.y} r="16" fill="transparent" />
                  <text
                    x={l.x}
                    y={l.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="#203c6c"
                    style={{ textDecoration: "underline", textDecorationStyle: "dotted" }}
                  >
                    {l.letter} {l.percent}%
                  </text>
                </g>
              ))}
            </svg>
            {radar.idealPolygonPoints && (
              <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 2 }}>
                <span className="hint" style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: "rgba(0, 121, 193, 0.22)", border: "2px solid #0079c1" }} />
                  Your group
                </span>
                <span className="hint" style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 14, height: 0, borderTop: "2px dashed #c6006f" }} />
                  Ideal mix for {activity.label.toLowerCase()}
                </span>
              </div>
            )}
            <p className="hint" style={{ textAlign: "center" }}>
              Each point shows the share of the group with that letter. A
              lopsided shape means the group leans heavily one way on that
              trait, hover a letter on the chart for what it stands for.
            </p>
          </div>

          {activity && activityFit && (
            <div className="card">
              <span className="pill">{activityFit.fitPercent}% fit</span>
              <h2 style={{ marginTop: 10 }}>Fit for {activity.label}</h2>
              <p>{activity.skillsNeeded}</p>

              {activityFit.rows.map((r) => (
                <div key={r.key} className="user-row" style={{ alignItems: "flex-start" }}>
                  <span>
                    {DICHOTOMY_LABELS[r.key]}
                    <br />
                    <span className="hint" style={{ display: "inline", marginTop: 0 }}>
                      Group: {r.actualA}% {r.letterA} / {r.actualB}% {r.letterB} &middot; Ideal: {r.idealA}% {r.letterA} / {r.idealB}% {r.letterB}
                    </span>
                  </span>
                  <span className="pill">
                    {r.neededLetter ? `needs more ${r.neededLetter}` : "good fit"}
                  </span>
                </div>
              ))}

              {activityFit.gapLetters.length === 0 ? (
                <p style={{ marginTop: 14 }}>This group is already a good match for {activity.label.toLowerCase()}, nice fit.</p>
              ) : activityFillers.length === 0 ? (
                <p className="hint" style={{ marginTop: 14 }}>No one left on the roster closes that gap for {activity.label.toLowerCase()} right now.</p>
              ) : (
                <>
                  <div className="section-label" style={{ marginTop: 18 }}>Best fits for {activity.label}</div>
                  {activityFillers.map((c) => (
                    <div key={c.username} className="user-row" style={{ alignItems: "flex-start" }}>
                      <span>
                        {c.displayName || c.username}{" "}
                        {c.isOfficial && <span className="pill-official">Official</span>}{" "}
                        <span className="hint" style={{ display: "inline", marginTop: 0 }}>
                          {getTypeProfile(c.mbtiType)?.archetype}
                        </span>
                      </span>
                      <span className="pill">{formatTypeCode(c.mbtiType, c.identity)} &middot; adds {c.fills.map((f) => f.letter).join(", ")}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

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

          <div className="card">
            <div className="section-label">General balance (regardless of activity)</div>
            {gaps.length === 0 ? (
              <p>This group is already reasonably balanced across all four traits, nice mix.</p>
            ) : (
              <>
                <p>
                  To even this group out, it would help to add someone who is{" "}
                  {gaps.map((g, i) => (
                    <span key={g.key}>
                      {i > 0 ? (i === gaps.length - 1 ? ", and " : ", ") : ""}
                      more <strong>{g.letter}</strong>
                    </span>
                  ))}
                  .
                </p>
                {fillers.length === 0 ? (
                  <p className="hint">No one left on the roster fills those gaps right now.</p>
                ) : (
                  <>
                    <div className="section-label" style={{ marginTop: 14 }}>Best fits from the roster</div>
                    {fillers.map((c) => (
                      <div key={c.username} className="user-row" style={{ alignItems: "flex-start" }}>
                        <span>
                          {c.displayName || c.username}{" "}
                          {c.isOfficial && <span className="pill-official">Official</span>}{" "}
                          <span className="hint" style={{ display: "inline", marginTop: 0 }}>
                            {getTypeProfile(c.mbtiType)?.archetype}
                          </span>
                        </span>
                        <span className="pill">{formatTypeCode(c.mbtiType, c.identity)} &middot; fills {c.fills.map((f) => f.letter).join(", ")}</span>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

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
