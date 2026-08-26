import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import { getUser } from "../../lib/db";
import { getTypeProfile } from "../../lib/mbti";
import { setMyTypeAction, deleteMyAccountAction } from "../actions";
import TypePicker from "../components/TypePicker";
import NavTabs from "../components/NavTabs";

export default async function ProfilePage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const user = await getUser(username);
  if (!user) redirect("/");

  const error = searchParams?.error;
  const profile = user.mbtiType ? getTypeProfile(user.mbtiType) : null;

  return (
    <>
      <NavTabs active="/profile" username={username} />

      {!user.mbtiType ? (
        <div className="card">
          <span className="pill">Step 1</span>
          <h1 style={{ marginTop: 10 }}>What's your MBTI type?</h1>
          <p>Pick the archetype that matches your MBTI profiling to unlock your personal breakdown. Know your letters instead? Each card shows its code too.</p>
          {error && <p className="error">{decodeURIComponent(error)}</p>}
          <form action={setMyTypeAction}>
            <TypePicker name="mbtiType" required />
            <button className="btn" type="submit">Save my type</button>
          </form>
        </div>
      ) : (
        <>
          <div className="card">
            <span className="pill">{user.mbtiType}</span>
            <h1 style={{ marginTop: 10 }}>{profile.archetype}</h1>
            <p className="hint" style={{ marginTop: -8, marginBottom: 12 }}>{profile.label}</p>
            <p>{profile.overview}</p>
          </div>

          <div className="card">
            <div className="section-label">Where you excel</div>
            <p>{profile.bestConditions}</p>
          </div>

          <div className="card">
            <div className="section-label">What drains you</div>
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

          <div className="card">
            <div className="section-label">Pet peeves</div>
            <p>{profile.petPeeves}</p>
          </div>

          <div className="card">
            <div className="section-label">Your growth edge</div>
            <p>{profile.growthEdge}</p>
          </div>

          <div className="card">
            <div className="section-label">Under pressure</div>
            <p>{profile.underPressure}</p>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Receiving feedback</h3>
              <p>{profile.feedbackReceiving}</p>
            </div>
            <div className="card">
              <h3>Giving feedback</h3>
              <p>{profile.feedbackGiving}</p>
            </div>
          </div>

          <details className="card" open={Boolean(error)}>
            <summary className="collapsible-summary">
              <h2 style={{ display: "inline" }}>Not feeling accurate?</h2>
            </summary>
            <p>You can update your type anytime, nothing is locked in.</p>
            {error && <p className="error">{decodeURIComponent(error)}</p>}
            <form action={setMyTypeAction}>
              <TypePicker name="mbtiType" defaultValue={user.mbtiType} />
              <button className="btn btn-outline" type="submit">Update my type</button>
            </form>
          </details>

          <div className="card">
            <h2>Account</h2>
            <p>You can remove your account and your guesses at any time.</p>
            <form action={deleteMyAccountAction}>
              <button className="btn btn-danger" type="submit">Delete my account</button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
