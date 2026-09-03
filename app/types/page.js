import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import { getContentVotesByUser } from "../../lib/db";
import { getTypeProfile, isValidType } from "../../lib/mbti";
import { typeContentKey, typeIdentityContentKey } from "../../lib/feedback";
import NavTabs from "../components/NavTabs";
import TypePicker from "../components/TypePicker";
import ThumbsVote from "../components/ThumbsVote";

export default async function TypesPage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const selectedCode = typeof searchParams?.type === "string" ? searchParams.type.toUpperCase() : "";
  const profile = isValidType(selectedCode) ? getTypeProfile(selectedCode) : null;
  const votes = profile ? await getContentVotesByUser(username) : {};
  const redirectTo = selectedCode ? `/types?type=${encodeURIComponent(selectedCode)}` : "/types";

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
            <ThumbsVote contentKey={typeContentKey(selectedCode, "overview")} vote={votes[typeContentKey(selectedCode, "overview")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">Where they excel</div>
            <p>{profile.bestConditions}</p>
            <ThumbsVote contentKey={typeContentKey(selectedCode, "bestConditions")} vote={votes[typeContentKey(selectedCode, "bestConditions")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">What drains them</div>
            <p>{profile.challenges}</p>
            <ThumbsVote contentKey={typeContentKey(selectedCode, "challenges")} vote={votes[typeContentKey(selectedCode, "challenges")]} redirectTo={redirectTo} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Communication style</h3>
              <p>{profile.communicationStyle}</p>
              <ThumbsVote contentKey={typeContentKey(selectedCode, "communicationStyle")} vote={votes[typeContentKey(selectedCode, "communicationStyle")]} redirectTo={redirectTo} />
            </div>
            <div className="card">
              <h3>Work style</h3>
              <p>{profile.workStyle}</p>
              <ThumbsVote contentKey={typeContentKey(selectedCode, "workStyle")} vote={votes[typeContentKey(selectedCode, "workStyle")]} redirectTo={redirectTo} />
            </div>
          </div>

          <div className="card">
            <div className="section-label">Pet peeves</div>
            <p>{profile.petPeeves}</p>
            <ThumbsVote contentKey={typeContentKey(selectedCode, "petPeeves")} vote={votes[typeContentKey(selectedCode, "petPeeves")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">Their growth edge</div>
            <p>{profile.growthEdge}</p>
            <ThumbsVote contentKey={typeContentKey(selectedCode, "growthEdge")} vote={votes[typeContentKey(selectedCode, "growthEdge")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">Under pressure</div>
            <p>{profile.underPressure}</p>
            <ThumbsVote contentKey={typeContentKey(selectedCode, "underPressure")} vote={votes[typeContentKey(selectedCode, "underPressure")]} redirectTo={redirectTo} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Receiving feedback</h3>
              <p>{profile.feedbackReceiving}</p>
              <ThumbsVote contentKey={typeContentKey(selectedCode, "feedbackReceiving")} vote={votes[typeContentKey(selectedCode, "feedbackReceiving")]} redirectTo={redirectTo} />
            </div>
            <div className="card">
              <h3>Giving feedback</h3>
              <p>{profile.feedbackGiving}</p>
              <ThumbsVote contentKey={typeContentKey(selectedCode, "feedbackGiving")} vote={votes[typeContentKey(selectedCode, "feedbackGiving")]} redirectTo={redirectTo} />
            </div>
          </div>

          {profile.identity && (
            <div className="card">
              <span className="pill">Optional 5th trait</span>
              <h2 style={{ marginTop: 10 }}>Assertive vs. Turbulent</h2>
              <p className="hint" style={{ marginTop: -4 }}>
                Not part of classic MBTI, this is a separate trait for how
                someone tends to handle pressure and setbacks, layered on
                top of the 4-letter type.
              </p>
              <div className="grid-2">
                <div>
                  <h3>{profile.identity.A.label} ({selectedCode}-A)</h3>
                  <p>{profile.identity.A.description}</p>
                  <ThumbsVote contentKey={typeIdentityContentKey(selectedCode, "A", "description")} vote={votes[typeIdentityContentKey(selectedCode, "A", "description")]} redirectTo={redirectTo} />
                </div>
                <div>
                  <h3>{profile.identity.T.label} ({selectedCode}-T)</h3>
                  <p>{profile.identity.T.description}</p>
                  <ThumbsVote contentKey={typeIdentityContentKey(selectedCode, "T", "description")} vote={votes[typeIdentityContentKey(selectedCode, "T", "description")]} redirectTo={redirectTo} />
                </div>
              </div>
            </div>
          )}

          {profile.teamDynamics && (
            <>
              <div className="card">
                <div className="section-label">If they are your manager</div>
                <p>{profile.teamDynamics.asManager}</p>
                <ThumbsVote contentKey={typeContentKey(selectedCode, "teamDynamics:asManager")} vote={votes[typeContentKey(selectedCode, "teamDynamics:asManager")]} redirectTo={redirectTo} />
              </div>

              <div className="card">
                <div className="section-label">If they are your peer</div>
                <p>{profile.teamDynamics.asPeer}</p>
                <ThumbsVote contentKey={typeContentKey(selectedCode, "teamDynamics:asPeer")} vote={votes[typeContentKey(selectedCode, "teamDynamics:asPeer")]} redirectTo={redirectTo} />
              </div>

              <div className="card">
                <div className="section-label">If they are your team member</div>
                <p>{profile.teamDynamics.asTeamMember}</p>
                <ThumbsVote contentKey={typeContentKey(selectedCode, "teamDynamics:asTeamMember")} vote={votes[typeContentKey(selectedCode, "teamDynamics:asTeamMember")]} redirectTo={redirectTo} />
              </div>

              <div className="card">
                <div className="section-label">How to communicate with them</div>
                <p>{profile.teamDynamics.communicate}</p>
                <ThumbsVote contentKey={typeContentKey(selectedCode, "teamDynamics:communicate")} vote={votes[typeContentKey(selectedCode, "teamDynamics:communicate")]} redirectTo={redirectTo} />
              </div>

              <div className="card">
                <div className="section-label">How to bring out their best</div>
                <p>{profile.teamDynamics.bringOutBest}</p>
                <ThumbsVote contentKey={typeContentKey(selectedCode, "teamDynamics:bringOutBest")} vote={votes[typeContentKey(selectedCode, "teamDynamics:bringOutBest")]} redirectTo={redirectTo} />
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
