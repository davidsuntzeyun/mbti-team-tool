import Link from "next/link";
import { logoutAction } from "../actions";
import { isAdminUsername } from "../../lib/session";

export default function HeaderNav({ username }) {
  return (
    <header className="header">
      <Link href={username ? "/profile" : "/"} style={{ display: "flex", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.png" alt="Beyond Insights" style={{ height: 34, width: "auto" }} />
      </Link>
      {username && (
        <nav>
          <span style={{ marginRight: 4, opacity: 0.85, fontSize: 13.5 }}>Hi, {username}</span>
          <Link href="/profile">Profile</Link>
          <Link href="/guess">Guess</Link>
          <Link href="/match">Quick Match</Link>
          <Link href="/team">Team Dynamic</Link>
          <Link href="/builder">Team Builder</Link>
          {isAdminUsername(username) && <Link href="/admin">Roster</Link>}
          <form action={logoutAction} style={{ display: "inline" }}>
            <button type="submit">Log out</button>
          </form>
        </nav>
      )}
    </header>
  );
}
