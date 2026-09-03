// Google Sheets-backed data layer for Phase 3+ (production).
//
// Same function signatures as lib/db.local.js — lib/db.js picks between the
// two automatically based on whether Sheet credentials are configured, so
// no page or Server Action needs to change when we go live.
//
// Required environment variables (set in Vercel, see plan.md section 11):
//   GOOGLE_SHEET_ID               - the spreadsheet ID from its URL
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  - the service account's email
//   GOOGLE_PRIVATE_KEY            - the service account's private key
//                                   (paste as-is; \n escaping is handled below)
//
// Expected tabs (created automatically on first write if missing):
//   Users:   username | password | mbtiType | identity | scoreEI | scoreSN | scoreTF | scoreJP | scoreAT | dateCreated | lastUpdated | role
//   Guesses: guesserUsername | guessedUsername | guessedType | reasoning | dateCreated | lastUpdated
//
// IMPORTANT: schema changes must only ever APPEND a new column to the end
// of USERS_HEADERS / GUESSES_HEADERS below, never insert or reorder one.
// This tab is read/written by column POSITION, not by matching header
// names cell-by-cell — inserting a column in the middle silently shifts
// every later column's data on read (this happened once already: an
// `identity` column inserted before `dateCreated` shifted real dates into
// the wrong fields for every existing user). ensureTab() below also
// guards against this by refusing to run if the sheet's actual header
// row isn't a prefix of what this code expects.

import { google } from "googleapis";
import { parseProfileCode } from "./mbti";

const USERS_TAB = "Users";
const GUESSES_TAB = "Guesses";
const CONTENT_FEEDBACK_TAB = "ContentFeedback";

// Optional, entirely separate from Users/Guesses: a read-only reference
// roster (e.g. exported from a 16personalities.com team results form),
// columns: Your Name | Profile Name | Profile Code | Profile URL | (blank)
// | scoreEI | scoreSN | scoreTF | scoreJP | scoreAT | Profile not correct.
// If this tab doesn't exist, getOfficialRoster() just returns an empty
// list — it's additive, never required.
const PROFILE_TAB = "Profile";
const SCORE_COLUMNS = ["scoreEI", "scoreSN", "scoreTF", "scoreJP", "scoreAT"];
const USERS_HEADERS = [
  "username",
  "password",
  "mbtiType",
  "identity",
  ...SCORE_COLUMNS,
  "dateCreated",
  "lastUpdated",
  "role",
];
const GUESSES_HEADERS = [
  "guesserUsername",
  "guessedUsername",
  "guessedType",
  "reasoning",
  "dateCreated",
  "lastUpdated",
];
const CONTENT_FEEDBACK_HEADERS = ["username", "contentKey", "vote", "dateCreated", "lastUpdated"];

let cachedClient = null;

function getSheetId() {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID is not set");
  return id;
}

async function getSheetsClient() {
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY are not set");
  }

  // Defensive normalization: a key pasted into the Vercel dashboard commonly
  // arrives with stray wrapping quotes (copied straight from .env.local,
  // quotes and all), literal \n escape sequences instead of real newlines,
  // or stray \r from a Windows clipboard. Handle all three.
  let privateKey = rawKey.trim();
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
  privateKey = privateKey.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  await auth.authorize();

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

async function ensureTab(sheets, tabName, headers) {
  const spreadsheetId = getSheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets.some((s) => s.properties.title === tabName);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    return;
  }

  // The tab already exists — verify its header row is still a valid
  // prefix of what this code expects before touching any data. See the
  // note above USERS_HEADERS for why this matters.
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!1:1`,
  });
  const actual = (headerRes.data.values && headerRes.data.values[0]) || [];

  if (actual.length === 0) {
    // Tab exists but has no header row yet — safe to write one.
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    return;
  }

  const expectedPrefix = headers.slice(0, actual.length);
  const matches = actual.every((cell, i) => cell === expectedPrefix[i]);
  if (!matches) {
    throw new Error(
      `${tabName} tab's header row doesn't match what this code expects. ` +
        `Expected it to start with [${expectedPrefix.join(", ")}], but found [${actual.join(", ")}]. ` +
        `Refusing to read or write this tab to avoid corrupting existing data — fix the header row to match, then retry.`
    );
  }

  if (actual.length < headers.length) {
    // The sheet's header is a valid prefix (just missing newer trailing
    // columns) — safe to extend it. Existing data rows are untouched.
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }
}

// Sheets storage is flat (one column per score), but every other layer of
// this app works with a single nested `scores` object, same shape as
// db.local.js. This reconstructs that object from the flat columns; if
// every column is blank, treated as "never set" (null), not an object of
// nulls, matching the local backend's shape exactly.
function scoresFromRow(row) {
  const parsed = {};
  let anySet = false;
  SCORE_COLUMNS.forEach((col) => {
    const key = col.replace("score", "");
    const raw = row[col];
    if (raw === "" || raw === undefined || raw === null) {
      parsed[key] = null;
    } else {
      parsed[key] = Number(raw);
      anySet = true;
    }
  });
  return anySet ? parsed : null;
}

// The inverse of scoresFromRow: writes a nested `scores` object back onto
// the flat scoreEI/scoreSN/... columns so writeTab can serialize it.
function applyScoresToRow(row, scores) {
  SCORE_COLUMNS.forEach((col) => {
    const key = col.replace("score", "");
    const value = scores ? scores[key] : null;
    row[col] = value === null || value === undefined ? "" : value;
  });
}

// Reads a full tab and returns an array of plain objects keyed by the
// header row. Simplest possible approach for a roster this size: read the
// whole tab, mutate in memory, write the whole tab back.
async function readTab(tabName, headers) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSheetId();
  await ensureTab(sheets, tabName, headers);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A2:Z`,
  });
  const rows = res.data.values || [];
  return rows
    .filter((row) => row.some((cell) => cell !== undefined && cell !== ""))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      if ("mbtiType" in obj) obj.mbtiType = obj.mbtiType || null;
      if ("identity" in obj) obj.identity = obj.identity || null;
      if ("role" in obj) obj.role = obj.role || null;
      if ("scoreEI" in obj) obj.scores = scoresFromRow(obj);
      return obj;
    });
}

async function writeTab(tabName, headers, records) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSheetId();
  await ensureTab(sheets, tabName, headers);

  const values = records.map((r) => headers.map((h) => (r[h] === null || r[h] === undefined ? "" : r[h])));

  // Clear the existing data range, then write the header + fresh rows.
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tabName}!A2:Z`,
  });
  if (values.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A2`,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  }
}

function now() {
  return new Date().toISOString();
}

// ---------- Users ----------

export async function getAllUsers() {
  return readTab(USERS_TAB, USERS_HEADERS);
}

export async function getUser(username) {
  const users = await getAllUsers();
  return users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
}

export async function createUser({ username, password, mbtiType }) {
  const users = await getAllUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("USERNAME_TAKEN");
  }
  const user = {
    username,
    password,
    mbtiType: mbtiType || null,
    identity: null,
    scores: null,
    role: null,
    dateCreated: now(),
    lastUpdated: now(),
  };
  applyScoresToRow(user, null);
  users.push(user);
  await writeTab(USERS_TAB, USERS_HEADERS, users);
  return user;
}

export async function verifyLogin(username, password) {
  const user = await getUser(username);
  if (!user) return null;
  return user.password === password ? user : null;
}

export async function updateUserType(username, mbtiType) {
  const users = await getAllUsers();
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user) throw new Error("USER_NOT_FOUND");
  user.mbtiType = mbtiType;
  user.lastUpdated = now();
  await writeTab(USERS_TAB, USERS_HEADERS, users);
  return user;
}

// identity may be "A", "T", or null (to clear it, e.g. "skip for now").
export async function updateUserIdentity(username, identity) {
  const users = await getAllUsers();
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user) throw new Error("USER_NOT_FOUND");
  user.identity = identity;
  user.lastUpdated = now();
  await writeTab(USERS_TAB, USERS_HEADERS, users);
  return user;
}

// scores is { EI, SN, TF, JP, AT }, each a number (-100 to 100) or null.
export async function updateUserScores(username, scores) {
  const users = await getAllUsers();
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user) throw new Error("USER_NOT_FOUND");
  user.scores = scores;
  applyScoresToRow(user, scores);
  user.lastUpdated = now();
  await writeTab(USERS_TAB, USERS_HEADERS, users);
  return user;
}

// role may be "people_manager", "project_manager", "individual_contributor",
// or null (to clear it, e.g. "skip for now").
export async function updateUserRole(username, role) {
  const users = await getAllUsers();
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user) throw new Error("USER_NOT_FOUND");
  user.role = role;
  user.lastUpdated = now();
  await writeTab(USERS_TAB, USERS_HEADERS, users);
  return user;
}

export async function deleteUser(username) {
  const users = await getAllUsers();
  const remainingUsers = users.filter(
    (u) => u.username.toLowerCase() !== String(username).toLowerCase()
  );
  await writeTab(USERS_TAB, USERS_HEADERS, remainingUsers);

  const guesses = await readTab(GUESSES_TAB, GUESSES_HEADERS);
  const remainingGuesses = guesses.filter(
    (g) => g.guesserUsername.toLowerCase() !== String(username).toLowerCase()
  );
  await writeTab(GUESSES_TAB, GUESSES_HEADERS, remainingGuesses);
}

// ---------- Guesses ----------

export async function getGuessesByUser(guesserUsername) {
  const guesses = await readTab(GUESSES_TAB, GUESSES_HEADERS);
  return guesses.filter(
    (g) => g.guesserUsername.toLowerCase() === String(guesserUsername).toLowerCase()
  );
}

export async function upsertGuess({ guesserUsername, guessedUsername, guessedType, reasoning }) {
  const guesses = await readTab(GUESSES_TAB, GUESSES_HEADERS);
  const existing = guesses.find(
    (g) =>
      g.guesserUsername.toLowerCase() === guesserUsername.toLowerCase() &&
      g.guessedUsername.toLowerCase() === guessedUsername.toLowerCase()
  );
  if (existing) {
    existing.guessedType = guessedType;
    existing.reasoning = reasoning;
    existing.lastUpdated = now();
  } else {
    guesses.push({
      guesserUsername,
      guessedUsername,
      guessedType,
      reasoning,
      dateCreated: now(),
      lastUpdated: now(),
    });
  }
  await writeTab(GUESSES_TAB, GUESSES_HEADERS, guesses);
  return existing || guesses[guesses.length - 1];
}

export async function deleteGuess(guesserUsername, guessedUsername) {
  const guesses = await readTab(GUESSES_TAB, GUESSES_HEADERS);
  const remaining = guesses.filter(
    (g) =>
      !(
        g.guesserUsername.toLowerCase() === guesserUsername.toLowerCase() &&
        g.guessedUsername.toLowerCase() === guessedUsername.toLowerCase()
      )
  );
  await writeTab(GUESSES_TAB, GUESSES_HEADERS, remaining);
}

// ---------- Content feedback (thumbs up/down) ----------

export async function getContentVotesByUser(username) {
  const rows = await readTab(CONTENT_FEEDBACK_TAB, CONTENT_FEEDBACK_HEADERS);
  const mine = rows.filter((r) => r.username.toLowerCase() === String(username).toLowerCase());
  return Object.fromEntries(mine.map((r) => [r.contentKey, r.vote]));
}

export async function upsertContentVote({ username, contentKey, vote }) {
  const rows = await readTab(CONTENT_FEEDBACK_TAB, CONTENT_FEEDBACK_HEADERS);
  const existing = rows.find(
    (r) => r.username.toLowerCase() === username.toLowerCase() && r.contentKey === contentKey
  );
  if (existing) {
    existing.vote = vote;
    existing.lastUpdated = now();
  } else {
    rows.push({ username, contentKey, vote, dateCreated: now(), lastUpdated: now() });
  }
  await writeTab(CONTENT_FEEDBACK_TAB, CONTENT_FEEDBACK_HEADERS, rows);
  return existing || rows[rows.length - 1];
}

// ---------- Official roster (optional, read-only) ----------

function slugifyName(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");
}

function scoresFromProfileRow(row) {
  const keys = ["EI", "SN", "TF", "JP", "AT"];
  const parsed = {};
  let anySet = false;
  keys.forEach((key, i) => {
    const raw = row[5 + i]; // columns F-J
    if (raw === undefined || raw === "") {
      parsed[key] = null;
    } else {
      parsed[key] = Number(raw);
      anySet = true;
    }
  });
  return anySet ? parsed : null;
}

// Reads the optional "Profile" tab (see PROFILE_TAB above) and returns it
// in the same shape as a Users row, tagged `isOfficial: true` so pages can
// badge these separately from real sign-ups. Deliberately not a real
// account: `password` is null, so these entries can never be logged into,
// only selected as a colleague in the roster-gated tools. Usernames are
// synthesized from the name and prefixed "official_" so they can never
// collide with a real sign-up's username.
export async function getOfficialRoster() {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets.some((s) => s.properties.title === PROFILE_TAB);
  if (!exists) return [];

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${PROFILE_TAB}!A2:Z`,
  });
  const rows = res.data.values || [];

  const usedUsernames = new Set();
  const roster = [];
  for (const row of rows) {
    const name = (row[0] || "").trim();
    if (!name) continue;

    const { mbtiType, identity } = parseProfileCode(row[2]);
    if (!mbtiType) continue; // can't confidently parse this row's type, skip it

    let base = `official_${slugifyName(name)}`;
    let username = base;
    let n = 2;
    while (usedUsernames.has(username)) {
      username = `${base}${n}`;
      n += 1;
    }
    usedUsernames.add(username);

    roster.push({
      username,
      displayName: name,
      password: null,
      mbtiType,
      identity,
      scores: scoresFromProfileRow(row),
      role: null,
      isOfficial: true,
      dateCreated: null,
      lastUpdated: null,
    });
  }
  return roster;
}
