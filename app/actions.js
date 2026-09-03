"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createUser,
  verifyLogin,
  updateUserType,
  updateUserIdentity,
  updateUserScores,
  updateUserRole,
  deleteUser,
  upsertGuess,
  deleteGuess,
  upsertContentVote,
} from "../lib/db";
import {
  setSessionCookie,
  clearSessionCookie,
  getSessionUsername,
  checkRosterPassword,
  unlockRoster,
  lockRoster,
} from "../lib/session";
import { isValidType, isValidIdentity, isValidRole } from "../lib/mbti";
import { contentAnchorId } from "../lib/feedback";

// Errors are passed back via a `?error=` query param and rendered by the
// destination page's server component. This keeps forms working with
// plain HTML <form action={...}> (progressive enhancement) without
// depending on the experimental useFormState hook.

export async function signupAction(formData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    redirect("/?mode=signup&error=" + encodeURIComponent("Please fill in both a username and a password."));
  }
  if (username.length < 2) {
    redirect("/?mode=signup&error=" + encodeURIComponent("Username needs to be at least 2 characters."));
  }
  if (password.length < 4) {
    redirect(
      "/?mode=signup&error=" +
        encodeURIComponent("Password needs to be at least 4 characters. Pick something you don't mind others seeing.")
    );
  }

  try {
    await createUser({ username, password, mbtiType: null });
  } catch (e) {
    if (e.message === "USERNAME_TAKEN") {
      redirect("/?mode=signup&error=" + encodeURIComponent("That username is already taken. Try another one."));
    }
    console.error("createUser failed:", e);
    redirect("/?mode=signup&error=" + encodeURIComponent("Something went wrong creating your account. Please try again."));
  }

  setSessionCookie(username);
  redirect("/profile");
}

export async function loginAction(formData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  const user = await verifyLogin(username, password);
  if (!user) {
    redirect(
      "/?mode=login&error=" +
        encodeURIComponent("Username or password doesn't match. Check for typos, or create a new account below.")
    );
  }

  setSessionCookie(username);
  redirect("/profile");
}

export async function logoutAction() {
  clearSessionCookie();
  redirect("/");
}

export async function setMyTypeAction(formData) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const mbtiType = String(formData.get("mbtiType") || "").toUpperCase();
  if (!isValidType(mbtiType)) {
    redirect("/profile?error=" + encodeURIComponent("That doesn't look like a valid MBTI type (e.g. INTJ, ESFP)."));
  }

  await updateUserType(username, mbtiType);
  revalidatePath("/profile");
  redirect("/profile");
}

// Identity (Assertive/Turbulent) is optional and separate from the 4-letter
// type. An empty submission ("Skip for now" / clearing the choice) sets it
// back to null rather than erroring, since this is meant to be low-friction.
export async function setMyIdentityAction(formData) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const raw = String(formData.get("identity") || "").toUpperCase();
  if (raw && !isValidIdentity(raw)) {
    redirect("/profile?error=" + encodeURIComponent("That doesn't look like a valid Identity (Assertive or Turbulent)."));
  }

  await updateUserIdentity(username, raw || null);
  revalidatePath("/profile");
  redirect("/profile");
}

// Exact scores from the 16personalities.com result (e.g. -76 for 76%
// Introverted, 84 for 84% Intuitive) are entirely optional and independent
// of each other, someone might only know a couple of them offhand. Any
// field left blank is stored as null rather than blocking the others.
const SCORE_KEYS = ["EI", "SN", "TF", "JP", "AT"];

function parseScoreField(formData, key) {
  const raw = String(formData.get(`score${key}`) || "").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.max(-100, Math.min(100, Math.round(n)));
}

export async function setMyScoresAction(formData) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const scores = {};
  for (const key of SCORE_KEYS) {
    scores[key] = parseScoreField(formData, key);
  }

  await updateUserScores(username, scores);
  revalidatePath("/profile");
  redirect("/profile");
}

// Role (people manager / project manager / individual contributor) is
// optional and separate from the 4-letter type, same low-friction pattern
// as Identity — it only shapes which development topics the Personal
// Growth Plan shows.
export async function setMyRoleAction(formData) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const raw = String(formData.get("role") || "");
  if (raw && !isValidRole(raw)) {
    redirect("/profile?error=" + encodeURIComponent("That doesn't look like a valid role."));
  }

  await updateUserRole(username, raw || null);
  revalidatePath("/profile");
  redirect("/profile");
}

// The padlock icon in the header appears on every page, so its unlock
// popup needs to send the user back to wherever they actually were, not
// a fixed page. Only accept a plain in-app path (starting with a single
// "/", never "//" or an absolute URL) to avoid an open-redirect.
function safeRedirectTarget(raw, fallback = "/profile") {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return fallback;
}

// Unlocks real colleague data across Quick Match, Team Dynamic, Department
// Dynamic, and Team Builder — one shared password for all of them.
export async function unlockRosterAction(formData) {
  const password = String(formData.get("password") || "");
  const target = safeRedirectTarget(formData.get("redirectTo"));

  if (!checkRosterPassword(password)) {
    redirect(`${target}?gateError=` + encodeURIComponent("That's not quite it, try again."));
  }
  unlockRoster();
  redirect(target);
}

// Re-locking never needs the password, same as closing a real padlock.
export async function lockRosterAction(formData) {
  const target = safeRedirectTarget(formData.get("redirectTo"));
  lockRoster();
  redirect(target);
}

export async function deleteMyAccountAction() {
  const username = getSessionUsername();
  if (!username) redirect("/");
  await deleteUser(username);
  clearSessionCookie();
  redirect("/");
}

export async function saveGuessAction(formData) {
  const guesserUsername = getSessionUsername();
  if (!guesserUsername) redirect("/");

  const guessedUsername = String(formData.get("guessedUsername") || "").trim();
  const guessedType = String(formData.get("guessedType") || "").toUpperCase();
  const reasoning = String(formData.get("reasoning") || "").trim();

  if (!guessedUsername || !isValidType(guessedType)) {
    redirect("/guess?error=" + encodeURIComponent("Enter a name and pick a valid MBTI type."));
  }
  if (guessedUsername.toLowerCase() === guesserUsername.toLowerCase()) {
    redirect("/guess?error=" + encodeURIComponent("You can't guess yourself, that's the easy one."));
  }

  await upsertGuess({ guesserUsername, guessedUsername, guessedType, reasoning });
  revalidatePath("/guess");
  redirect("/guess");
}

export async function removeGuessAction(formData) {
  const guesserUsername = getSessionUsername();
  if (!guesserUsername) redirect("/");
  const guessedUsername = String(formData.get("guessedUsername") || "");
  await deleteGuess(guesserUsername, guessedUsername);
  revalidatePath("/guess");
  redirect("/guess");
}

// Thumbs up/down on a content card. contentKey identifies the underlying
// blurb (see lib/feedback.js), not the page, so the same blurb shown on
// multiple pages accumulates one shared tally. redirectTo sends the user
// back to wherever they were, including any query string (e.g. which type
// or colleague they had selected), same pattern as the roster lock.
export async function voteContentAction(formData) {
  const username = getSessionUsername();
  if (!username) redirect("/");

  const contentKey = String(formData.get("contentKey") || "");
  const vote = String(formData.get("vote") || "");
  const target = safeRedirectTarget(formData.get("redirectTo"));

  if (contentKey && (vote === "up" || vote === "down")) {
    await upsertContentVote({ username, contentKey, vote });
    revalidatePath(target.split("?")[0]);
    redirect(`${target}#${contentAnchorId(contentKey)}`);
  }
  redirect(target);
}

// Anyone logged in can remove a roster entry (self-serve or "admin"),
// per the plan.md decision — no separate formal admin role for this v1.
export async function adminDeleteUserAction(formData) {
  const acting = getSessionUsername();
  if (!acting) redirect("/");
  const target = String(formData.get("username") || "");
  await deleteUser(target);
  revalidatePath("/admin");
  redirect("/admin");
}
