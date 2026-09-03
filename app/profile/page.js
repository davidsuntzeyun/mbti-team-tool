import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import { getUser, getContentVotesByUser } from "../../lib/db";
import { getTypeProfile, getIdentityProfile, getTypeIdentityProfile, getRoleProfile, formatTypeCode } from "../../lib/mbti";
import { typeContentKey, identityContentKey, typeIdentityContentKey } from "../../lib/feedback";
import { setMyTypeAction, setMyIdentityAction, setMyScoresAction, setMyRoleAction, deleteMyAccountAction } from "../actions";
import TypePicker from "../components/TypePicker";
import IdentityPicker from "../components/IdentityPicker";
import RolePicker from "../components/RolePicker";
import NavTabs from "../components/NavTabs";
import ThumbsVote from "../components/ThumbsVote";

const SCORE_FIELDS = [
  { key: "EI", label: "Extraverted / Introverted", hint: "Positive = Extraverted, negative = Introverted." },
  { key: "SN", label: "Intuitive / Observant", hint: "Positive = Intuitive, negative = Observant (Sensing)." },
  { key: "TF", label: "Thinking / Feeling", hint: "Positive = Thinking, negative = Feeling." },
  { key: "JP", label: "Judging / Prospecting", hint: "Positive = Judging, negative = Prospecting (Perceiving)." },
  { key: "AT", label: "Assertive / Turbulent", hint: "Positive = Assertive, negative = Turbulent." },
];

export default async function ProfilePage({ searchParams }) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const user = await getUser(username);
  if (!user) redirect("/api/end-stale-session");

  const error = searchParams?.error;
  const profile = user.mbtiType ? getTypeProfile(user.mbtiType) : null;
  const identityProfile = user.identity ? getIdentityProfile(user.identity) : null;
  const typeIdentityProfile = user.identity ? getTypeIdentityProfile(user.mbtiType, user.identity) : null;
  const roleProfile = user.role ? getRoleProfile(user.role) : null;
  const votes = user.mbtiType ? await getContentVotesByUser(username) : {};
  const redirectTo = "/profile";

  return (
    <>
      <NavTabs active="/profile" username={username} />

      {!user.mbtiType ? (
        <div className="card">
          <span className="pill">Step 1</span>
          <h1 style={{ marginTop: 10 }}>What's your MBTI type?</h1>
          <p>Pick the archetype that matches your MBTI profiling to unlock your personal breakdown. Know your letters instead? Each card shows its code too.</p>
          <p className="hint" style={{ marginTop: -4 }}>
            Don't have a result yet? Take the free quiz at{" "}
            <a href="https://www.16personalities.com/" target="_blank" rel="noreferrer">16personalities.com</a>{" "}
            and come back here with your archetype.
          </p>
          {error && <p className="error">{decodeURIComponent(error)}</p>}
          <form action={setMyTypeAction}>
            <TypePicker name="mbtiType" required />
            <button className="btn" type="submit">Save my type</button>
          </form>
        </div>
      ) : (
        <>
          <div className="card">
            <span className="pill">{formatTypeCode(user.mbtiType, user.identity)}</span>
            <h1 style={{ marginTop: 10 }}>{profile.archetype}</h1>
            <p className="hint" style={{ marginTop: -8, marginBottom: 12 }}>{profile.label}</p>
            <p>{profile.overview}</p>
            <ThumbsVote contentKey={typeContentKey(user.mbtiType, "overview")} vote={votes[typeContentKey(user.mbtiType, "overview")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">Where you excel</div>
            <p>{profile.bestConditions}</p>
            <ThumbsVote contentKey={typeContentKey(user.mbtiType, "bestConditions")} vote={votes[typeContentKey(user.mbtiType, "bestConditions")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">What drains you</div>
            <p>{profile.challenges}</p>
            <ThumbsVote contentKey={typeContentKey(user.mbtiType, "challenges")} vote={votes[typeContentKey(user.mbtiType, "challenges")]} redirectTo={redirectTo} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Communication style</h3>
              <p>{profile.communicationStyle}</p>
              <ThumbsVote contentKey={typeContentKey(user.mbtiType, "communicationStyle")} vote={votes[typeContentKey(user.mbtiType, "communicationStyle")]} redirectTo={redirectTo} />
            </div>
            <div className="card">
              <h3>Work style</h3>
              <p>{profile.workStyle}</p>
              <ThumbsVote contentKey={typeContentKey(user.mbtiType, "workStyle")} vote={votes[typeContentKey(user.mbtiType, "workStyle")]} redirectTo={redirectTo} />
            </div>
          </div>

          <div className="card">
            <div className="section-label">Pet peeves</div>
            <p>{profile.petPeeves}</p>
            <ThumbsVote contentKey={typeContentKey(user.mbtiType, "petPeeves")} vote={votes[typeContentKey(user.mbtiType, "petPeeves")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">Your growth edge</div>
            <p>{profile.growthEdge}</p>
            <ThumbsVote contentKey={typeContentKey(user.mbtiType, "growthEdge")} vote={votes[typeContentKey(user.mbtiType, "growthEdge")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">Under pressure</div>
            <p>{profile.underPressure}</p>
            <ThumbsVote contentKey={typeContentKey(user.mbtiType, "underPressure")} vote={votes[typeContentKey(user.mbtiType, "underPressure")]} redirectTo={redirectTo} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Receiving feedback</h3>
              <p>{profile.feedbackReceiving}</p>
              <ThumbsVote contentKey={typeContentKey(user.mbtiType, "feedbackReceiving")} vote={votes[typeContentKey(user.mbtiType, "feedbackReceiving")]} redirectTo={redirectTo} />
            </div>
            <div className="card">
              <h3>Giving feedback</h3>
              <p>{profile.feedbackGiving}</p>
              <ThumbsVote contentKey={typeContentKey(user.mbtiType, "feedbackGiving")} vote={votes[typeContentKey(user.mbtiType, "feedbackGiving")]} redirectTo={redirectTo} />
            </div>
          </div>

          <div className="card">
            <span className="pill">Optional</span>
            <h2 style={{ marginTop: 10 }}>Assertive or Turbulent?</h2>
            <p className="hint" style={{ marginTop: -4 }}>
              Not part of classic MBTI, this is a separate, optional trait
              for how you tend to handle pressure and setbacks. Skip it if
              you're not sure, you can always come back to it.
            </p>
            {identityProfile ? (
              <>
                <p>{identityProfile.overview}</p>
                <ThumbsVote contentKey={identityContentKey(user.identity, "overview")} vote={votes[identityContentKey(user.identity, "overview")]} redirectTo={redirectTo} />
                {typeIdentityProfile && (
                  <>
                    <p>{typeIdentityProfile.description}</p>
                    <ThumbsVote contentKey={typeIdentityContentKey(user.mbtiType, user.identity, "description")} vote={votes[typeIdentityContentKey(user.mbtiType, user.identity, "description")]} redirectTo={redirectTo} />
                  </>
                )}
                <details style={{ marginTop: 10 }}>
                  <summary className="collapsible-summary">
                    <h3 style={{ display: "inline", marginBottom: 0 }}>Change this</h3>
                  </summary>
                  <form action={setMyIdentityAction} style={{ marginTop: 10 }}>
                    <IdentityPicker name="identity" defaultValue={user.identity} />
                    <button className="btn btn-outline" type="submit">Update</button>
                  </form>
                </details>
              </>
            ) : (
              <form action={setMyIdentityAction}>
                <IdentityPicker name="identity" defaultValue={user.identity} />
                <button className="btn" type="submit">Save</button>
              </form>
            )}
          </div>

          <div className="card">
            <span className="pill">Optional</span>
            <h2 style={{ marginTop: 10 }}>Your exact scores</h2>
            <p className="hint" style={{ marginTop: -4 }}>
              If you have your result from{" "}
              <a href="https://www.16personalities.com/" target="_blank" rel="noreferrer">16personalities.com</a>,
              add the exact percentage for each trait here. Every field is
              optional, fill in as many or as few as you know, and leave the
              rest blank.
            </p>
            <form action={setMyScoresAction}>
              {SCORE_FIELDS.map((f) => (
                <div key={f.key}>
                  <label>{f.label}</label>
                  <input
                    type="number"
                    name={`score${f.key}`}
                    min={-100}
                    max={100}
                    defaultValue={user.scores?.[f.key] ?? ""}
                    placeholder="e.g. -76"
                  />
                  <p className="hint" style={{ marginTop: 2 }}>{f.hint}</p>
                </div>
              ))}
              <button className="btn" type="submit">Save scores</button>
            </form>
          </div>

          <div className="card">
            <span className="pill">Optional</span>
            <h2 style={{ marginTop: 10 }}>What's your role?</h2>
            <p className="hint" style={{ marginTop: -4 }}>
              This only shapes your{" "}
              <a href="/growth">Personal Growth Plan</a>, picking which
              development topics get suggested to you. Skip it if you're not
              sure, you can always come back to it.
            </p>
            {roleProfile ? (
              <>
                <p>Currently set to <strong>{roleProfile.label}</strong>.</p>
                <details style={{ marginTop: 10 }}>
                  <summary className="collapsible-summary">
                    <h3 style={{ display: "inline", marginBottom: 0 }}>Change this</h3>
                  </summary>
                  <form action={setMyRoleAction} style={{ marginTop: 10 }}>
                    <RolePicker name="role" defaultValue={user.role} />
                    <button className="btn btn-outline" type="submit">Update</button>
                  </form>
                </details>
              </>
            ) : (
              <form action={setMyRoleAction}>
                <RolePicker name="role" defaultValue={user.role} />
                <button className="btn" type="submit">Save</button>
              </form>
            )}
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
