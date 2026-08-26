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
