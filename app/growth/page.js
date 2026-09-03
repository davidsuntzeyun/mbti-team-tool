import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import { getUser, getContentVotesByUser } from "../../lib/db";
import { getTypeProfile, getGrowthPlan, getRoleProfile, formatTypeCode } from "../../lib/mbti";
import { typeContentKey } from "../../lib/feedback";
import NavTabs from "../components/NavTabs";
import ThumbsVote from "../components/ThumbsVote";

export default async function GrowthPage() {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const me = await getUser(username);
  if (!me) redirect("/api/end-stale-session");

  if (!me.mbtiType) {
    return (
      <>
        <NavTabs active="/growth" username={username} />
        <div className="card">
          <p>Set your own MBTI type on your profile first, then come back here.</p>
          <a className="btn" href="/profile">Go to your profile</a>
        </div>
      </>
    );
  }

  const profile = getTypeProfile(me.mbtiType);
  const plan = getGrowthPlan(me.mbtiType);
  const roleProfile = me.role ? getRoleProfile(me.role) : null;
  const votes = plan ? await getContentVotesByUser(username) : {};
  const redirectTo = "/growth";

  return (
    <>
      <NavTabs active="/growth" username={username} />

      <div className="card">
        <span className="pill">Personal Growth Plan</span>
        <h1 style={{ marginTop: 10 }}>Bringing out the best in you</h1>
        <p>
          Built from your type, {profile?.archetype} ({formatTypeCode(me.mbtiType, me.identity)}).
          Something to lean into, something to actively manage, and a few
          concrete places to grow next.
        </p>
      </div>

      {plan && (
        <>
          <div className="card">
            <div className="section-label">Develop your strength</div>
            <p>{plan.strength}</p>
            <ThumbsVote contentKey={typeContentKey(me.mbtiType, "growthPlan:strength")} vote={votes[typeContentKey(me.mbtiType, "growthPlan:strength")]} redirectTo={redirectTo} />
          </div>

          <div className="card">
            <div className="section-label">Manage your weakness</div>
            <p>{plan.weakness}</p>
            <ThumbsVote contentKey={typeContentKey(me.mbtiType, "growthPlan:weakness")} vote={votes[typeContentKey(me.mbtiType, "growthPlan:weakness")]} redirectTo={redirectTo} />
          </div>
        </>
      )}

      <div className="card">
        <div className="section-label">Development topics</div>
        {roleProfile ? (
          <>
            <p className="hint" style={{ marginTop: -4 }}>
              Tailored to your role, {roleProfile.label}.
            </p>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {roleProfile.topics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p>
              Set your role on your{" "}
              <a href="/profile">profile</a> (people manager, project
              manager, or individual contributor) to get topics tailored to
              the kind of work you actually do.
            </p>
          </>
        )}
      </div>
    </>
  );
}
