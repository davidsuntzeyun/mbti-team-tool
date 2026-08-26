"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createUser,
  verifyLogin,
  updateUserType,
  deleteUser,
  upsertGuess,
  deleteGuess,
  getUser,
} from "../lib/db";
import { setSessionCookie, clearSessionCookie, getSessionUsername } from "../lib/session";
import { isValidType } from "../lib/mbti";

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

  const guessedUsername = String(formData.get("guessedUsername") || "");
  const guessedType = String(formData.get("guessedType") || "").toUpperCase();
  const reasoning = String(formData.get("reasoning") || "").trim();

  if (!guessedUsername || !isValidType(guessedType)) {
    redirect("/guess?error=" + encodeURIComponent("Pick a colleague and a valid MBTI type."));
  }
  if (guessedUsername.toLowerCase() === guesserUsername.toLowerCase()) {
    redirect("/guess?error=" + encodeURIComponent("You can't guess yourself, that's the easy one."));
  }
  if (!(await getUser(guessedUsername))) {
    redirect("/guess?error=" + encodeURIComponent("That colleague isn't on the roster."));
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
