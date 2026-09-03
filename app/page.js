import { redirect } from "next/navigation";
import { getSessionUsername } from "../lib/session";
import { getUser } from "../lib/db";
import { loginAction, signupAction } from "./actions";

// If the cookie points at an account that no longer exists (e.g. it was
// deleted while the browser still had a session), route through
// /api/end-stale-session to clear it instead of blindly redirecting to
// /profile — otherwise "/" sends you to "/profile", which finds no user
// and redirects back to "/", forever.
export default async function HomePage({ searchParams }) {
  const username = getSessionUsername();
  if (username) {
    const user = await getUser(username);
    redirect(user ? "/profile" : "/api/end-stale-session");
  }

  const mode = searchParams?.mode === "signup" ? "signup" : "login";
  const error = searchParams?.error;

  return (
    <>
      <div className="card">
        <span className="pill">MBTI Team Tool</span>
        <h1 style={{ marginTop: 10 }}>Beyond Insights</h1>
        <p>
          Understand yourself, appreciate how your colleagues are wired, and
          get a quick read on how the two of you work best together. Come
          back anytime, not just during the live session.
        </p>
        <p className="hint" style={{ marginTop: -4 }}>
          Don't have your MBTI type yet? Take the free quiz at{" "}
          <a href="https://www.16personalities.com/" target="_blank" rel="noreferrer">16personalities.com</a>{" "}
          first, then come back and create your account.
        </p>
      </div>

      <div className="card">
        <div className="nav-tabs">
          <a href="/?mode=login" className={mode === "login" ? "active" : ""}>
            Log in
          </a>
          <a href="/?mode=signup" className={mode === "signup" ? "active" : ""}>
            Create account
          </a>
        </div>

        {error && <p className="error">{decodeURIComponent(error)}</p>}

        {mode === "login" ? (
          <form action={loginAction}>
            <label>Username</label>
            <input name="username" autoComplete="username" required />
            <label>Password</label>
            <input name="password" type="password" autoComplete="current-password" required />
            <button className="btn" type="submit">Log in</button>
          </form>
        ) : (
          <form action={signupAction}>
            <label>Pick a username</label>
            <input name="username" autoComplete="username" required />
            <label>Pick a password</label>
            <input name="password" type="password" autoComplete="new-password" required />
            <p className="hint">
              Nothing in this tool is confidential, and this login isn't a
              real security system. Pick something you don't mind others
              seeing, not a password you use elsewhere.
            </p>
            <button className="btn" type="submit">Create account</button>
          </form>
        )}
      </div>
    </>
  );
}
