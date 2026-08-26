import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import { getTypeProfile, isValidType } from "../../lib/mbti";
import NavTabs from "../components/NavTabs";
import TypePicker from "../components/TypePicker";

export default function TypesPage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const selectedCode = typeof searchParams?.type === "string" ? searchParams.type.toUpperCase() : "";
  const profile = isValidType(selectedCode) ? getTypeProfile(selectedCode) : null;

  return (
    <>
      <NavTabs active="/types" username={username} />

      <div className="card">
        <span className="pill">Explore</span>
        <h1 style={{ marginTop: 10 }}>Explore the 16 types</h1>
        <p>
          Curious about a colleague's type, or just want to understand
          someone you work with better? Pick any archetype below to read
          its full profile, no need for them to be on the roster.
        </p>
      </div>

      <div className="card">
        <h2>Pick a type</h2>
        <form method="get">
          <TypePicker name="type" defaultValue={selectedCode} />
          <button className="btn" type="submit">See this profile</button>
        </form>
      </div>

      {profile && (
        <>
          <div className="card">
            <span className="pill">{selectedCode}</span>
            <h1 style={{ marginTop: 10 }}>{profile.archetype}</h1>
            <p className="hint" style={{ marginTop: -8, marginBottom: 12 }}>{profile.label}</p>
            <p>{profile.overview}</p>
          </div>

          <div className="card">
            <div className="section-label">Where they excel</div>
            <p>{profile.bestConditions}</p>
          </div>

          <div className="card">
            <div className="section-label">What drains them</div>
            <p>{profile.challenges}</p>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Communication style</h3>
              <p>{profile.communicationStyle}</p>
            </div>
            <div className="card">
              <h3>Work style</h3>
              <p>{profile.workStyle}</p>
            </div>
          </div>

          {profile.teamDynamics && (
            <>
              <div className="card">
                <div className="section-label">If they are your manager</div>
                <p>{profile.teamDynamics.asManager}</p>
              </div>

              <div className="card">
                <div className="section-label">If they are your peer</div>
                <p>{profile.teamDynamics.asPeer}</p>
              </div>

              <div className="card">
                <div className="section-label">If they are your team member</div>
                <p>{profile.teamDynamics.asTeamMember}</p>
              </div>

              <div className="card">
                <div className="section-label">How to communicate with them</div>
                <p>{profile.teamDynamics.communicate}</p>
              </div>

              <div className="card">
                <div className="section-label">How to bring out their best</div>
                <p>{profile.teamDynamics.bringOutBest}</p>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
