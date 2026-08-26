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

// Simple shared-password gates for Guess and Quick Match — a bit of fun
// friction for the live session, not real access control. Once someone
// enters the right password on a device, that page stays unlocked there.
const GUESS_PASSWORD = "fun";
const MATCH_PASSWORD = "compatability";
const TEAM_PASSWORD = "teamwork";
const BUILDER_PASSWORD = "balance";
const GUESS_GATE_COOKIE = "mbti_guess_unlocked";
const MATCH_GATE_COOKIE = "mbti_match_unlocked";
const TEAM_GATE_COOKIE = "mbti_team_unlocked";
const BUILDER_GATE_COOKIE = "mbti_builder_unlocked";

export function checkGuessPassword(password) {
  return password === GUESS_PASSWORD;
}

export function checkMatchPassword(password) {
  return password === MATCH_PASSWORD;
}

export function checkTeamPassword(password) {
  return password === TEAM_PASSWORD;
}

export function checkBuilderPassword(password) {
  return password === BUILDER_PASSWORD;
}

export function isGuessUnlocked() {
  return cookies().get(GUESS_GATE_COOKIE)?.value === "1";
}

export function unlockGuess() {
  cookies().set(GUESS_GATE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export function isMatchUnlocked() {
  return cookies().get(MATCH_GATE_COOKIE)?.value === "1";
}

export function unlockMatch() {
  cookies().set(MATCH_GATE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export function isTeamUnlocked() {
  return cookies().get(TEAM_GATE_COOKIE)?.value === "1";
}

export function unlockTeam() {
  cookies().set(TEAM_GATE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export function isBuilderUnlocked() {
  return cookies().get(BUILDER_GATE_COOKIE)?.value === "1";
}

export function unlockBuilder() {
  cookies().set(BUILDER_GATE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}
