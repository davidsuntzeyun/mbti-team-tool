import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import { getUser } from "../../lib/db";
import { getTypeProfile, MBTI_CODES } from "../../lib/mbti";
import { setMyTypeAction, deleteMyAccountAction } from "../actions";

export default async function ProfilePage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const user = await getUser(username);
  if (!user) redirect("/");

  const error = searchParams?.error;
  const profile = user.mbtiType ? getTypeProfile(user.mbtiType) : null;

  return (
    <>
      <div className="nav-tabs">
        <a href="/profile" className="active">Your Profile</a>
        <a href="/guess">Guess</a>
        <a href="/match">Quick Match</a>
        <a href="/admin">Roster</a>
      </div>

      {!user.mbtiType ? (
        <div className="card">
          <span className="pill">Step 1</span>
          <h1 style={{ marginTop: 10 }}>What's your MBTI type?</h1>
          <p>Enter the type from your MBTI profiling to unlock your personal breakdown.</p>
          {error && <p className="error">{decodeURIComponent(error)}</p>}
          <form action={setMyTypeAction}>
            <label>Your MBTI type</label>
            <select name="mbtiType" defaultValue="">
              <option value="" disabled>Select your type&hellip;</option>
              {MBTI_CODES.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            <button className="btn" type="submit">Save my type</button>
          </form>
        </div>
      ) : (
        <>
          <div className="card">
            <span className="pill">{user.mbtiType}</span>
            <h1 style={{ marginTop: 10 }}>{profile.label}</h1>
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
            <h2>Not feeling accurate?</h2>
            <p>You can update your type anytime, nothing is locked in.</p>
            {error && <p className="error">{decodeURIComponent(error)}</p>}
            <form action={setMyTypeAction}>
              <select name="mbtiType" defaultValue={user.mbtiType}>
                {MBTI_CODES.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <button className="btn btn-outline" type="submit">Update my type</button>
            </form>
          </div>

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
