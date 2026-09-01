import { cookies } from "next/headers";

const COOKIE_NAME = "mbti_session";

// Simple convenience session, not a security system — matches the
// plan.md decision that this tool holds nothing confidential.
export function getSessionUsername() {
  return cookies().get(COOKIE_NAME)?.value || null;
}

export function setSessionCookie(username) {
  cookies().set(COOKIE_NAME, username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // 180 days — this is meant to be a standing tool
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

// The Roster page is restricted to whoever is logged in as this username.
// Deliberately just a name check, not a real permission system — matches
// the rest of this app's "nothing here is confidential" design. Anyone can
// still remove their own account from their Profile page regardless.
const ADMIN_USERNAME = "admin";

export function isAdminUsername(username) {
  return Boolean(username) && username.toLowerCase() === ADMIN_USERNAME;
}

// Anywhere that shows or uses a real colleague's actual MBTI data (Quick
// Match, Team Dynamic, Department Dynamic, Team Builder — all of which
// pull from the real roster) is gated behind a shared password, separate
// from account login. This protects the real people in the roster, not
// the generic 16-type reference content (Explore Types is intentionally
// open — there's no one's actual data in it).
const ROSTER_PASSWORD = "MBTIGURU";
const ROSTER_GATE_COOKIE = "mbti_roster_unlocked";

export function checkRosterPassword(password) {
  return password === ROSTER_PASSWORD;
}

export function isRosterUnlocked() {
  return cookies().get(ROSTER_GATE_COOKIE)?.value === "1";
}

export function unlockRoster() {
  cookies().set(ROSTER_GATE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}
