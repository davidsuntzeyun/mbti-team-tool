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
//   Users:   username | password | mbtiType | dateCreated | lastUpdated
//   Guesses: guesserUsername | guessedUsername | guessedType | reasoning | dateCreated | lastUpdated

import { google } from "googleapis";

const USERS_TAB = "Users";
const GUESSES_TAB = "Guesses";
const USERS_HEADERS = ["username", "password", "mbtiType", "dateCreated", "lastUpdated"];
const GUESSES_HEADERS = [
  "guesserUsername",
  "guessedUsername",
  "guessedType",
  "reasoning",
  "dateCreated",
  "lastUpdated",
];

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
  }
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
    dateCreated: now(),
    lastUpdated: now(),
  };
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
