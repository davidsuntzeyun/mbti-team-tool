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
