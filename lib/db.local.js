// Local data layer for Phase 2 (build locally first).
//
// This is a drop-in stand-in for the Google Sheet described in plan.md.
// It exposes the same shape of functions the app will need once Phase 3
// wires up the real Sheets API — swapping the implementation later should
// not require changing any page or API route that calls these functions.
//
// Schema mirrors plan.md section 6:
//   Users:   { username, password, mbtiType, identity, scores, role, dateCreated, lastUpdated }
//   Guesses: { guesserUsername, guessedUsername, guessedType, reasoning, dateCreated, lastUpdated }

import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const SEED_PATH = path.join(process.cwd(), "data", "db.seed.json");

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = fs.existsSync(SEED_PATH)
      ? JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"))
      : { users: [], guesses: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function now() {
  return new Date().toISOString();
}

// ---------- Users ----------

export function getAllUsers() {
  return readDb().users;
}

export function getUser(username) {
  return readDb().users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
}

export function createUser({ username, password, mbtiType }) {
  const db = readDb();
  if (getUser(username)) {
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
  db.users.push(user);
  writeDb(db);
  return user;
}

export function verifyLogin(username, password) {
  const user = getUser(username);
  if (!user) return null;
  return user.password === password ? user : null;
}

export function updateUserType(username, mbtiType) {
  const db = readDb();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
  if (!user) throw new Error("USER_NOT_FOUND");
  user.mbtiType = mbtiType;
  user.lastUpdated = now();
  writeDb(db);
  return user;
}

// identity may be "A", "T", or null (to clear it, e.g. "skip for now").
export function updateUserIdentity(username, identity) {
  const db = readDb();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
  if (!user) throw new Error("USER_NOT_FOUND");
  user.identity = identity;
  user.lastUpdated = now();
  writeDb(db);
  return user;
}

// scores is { EI, SN, TF, JP, AT }, each a number (-100 to 100) or null.
export function updateUserScores(username, scores) {
  const db = readDb();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
  if (!user) throw new Error("USER_NOT_FOUND");
  user.scores = scores;
  user.lastUpdated = now();
  writeDb(db);
  return user;
}

// role may be "people_manager", "project_manager", "individual_contributor",
// or null (to clear it, e.g. "skip for now").
export function updateUserRole(username, role) {
  const db = readDb();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
  if (!user) throw new Error("USER_NOT_FOUND");
  user.role = role;
  user.lastUpdated = now();
  writeDb(db);
  return user;
}

export function deleteUser(username) {
  const db = readDb();
  db.users = db.users.filter(
    (u) => u.username.toLowerCase() !== String(username).toLowerCase()
  );
  // Also drop guesses this person made, per plan.md admin-controls decision.
  db.guesses = db.guesses.filter(
    (g) => g.guesserUsername.toLowerCase() !== String(username).toLowerCase()
  );
  writeDb(db);
}

// ---------- Guesses ----------

export function getGuessesByUser(guesserUsername) {
  return readDb().guesses.filter(
    (g) =>
      g.guesserUsername.toLowerCase() === String(guesserUsername).toLowerCase()
  );
}

export function upsertGuess({ guesserUsername, guessedUsername, guessedType, reasoning }) {
  const db = readDb();
  const existing = db.guesses.find(
    (g) =>
      g.guesserUsername.toLowerCase() === guesserUsername.toLowerCase() &&
      g.guessedUsername.toLowerCase() === guessedUsername.toLowerCase()
  );
  if (existing) {
    existing.guessedType = guessedType;
    existing.reasoning = reasoning;
    existing.lastUpdated = now();
    writeDb(db);
    return existing;
  }
  const guess = {
    guesserUsername,
    guessedUsername,
    guessedType,
    reasoning,
    dateCreated: now(),
    lastUpdated: now(),
  };
  db.guesses.push(guess);
  writeDb(db);
  return guess;
}

export function deleteGuess(guesserUsername, guessedUsername) {
  const db = readDb();
  db.guesses = db.guesses.filter(
    (g) =>
      !(
        g.guesserUsername.toLowerCase() === guesserUsername.toLowerCase() &&
        g.guessedUsername.toLowerCase() === guessedUsername.toLowerCase()
      )
  );
  writeDb(db);
}

// ---------- Content feedback (thumbs up/down) ----------

export function getContentVotesByUser(username) {
  const db = readDb();
  const votes = (db.contentFeedback || []).filter(
    (v) => v.username.toLowerCase() === String(username).toLowerCase()
  );
  return Object.fromEntries(votes.map((v) => [v.contentKey, v.vote]));
}

export function upsertContentVote({ username, contentKey, vote }) {
  const db = readDb();
  if (!db.contentFeedback) db.contentFeedback = [];
  const existing = db.contentFeedback.find(
    (v) => v.username.toLowerCase() === username.toLowerCase() && v.contentKey === contentKey
  );
  if (existing) {
    existing.vote = vote;
    existing.lastUpdated = now();
    writeDb(db);
    return existing;
  }
  const record = { username, contentKey, vote, dateCreated: now(), lastUpdated: now() };
  db.contentFeedback.push(record);
  writeDb(db);
  return record;
}

// ---------- Official roster (optional, read-only) ----------
//
// The Sheets backend reads this from a "Profile" tab in the live
// spreadsheet. There's no local equivalent, so this just reads an
// optional fixture file (data/official-roster.json, gitignored) already
// in the final expected shape, for testing this feature locally without
// touching the real Sheet.
const OFFICIAL_ROSTER_PATH = path.join(process.cwd(), "data", "official-roster.json");

export function getOfficialRoster() {
  if (!fs.existsSync(OFFICIAL_ROSTER_PATH)) return [];
  return JSON.parse(fs.readFileSync(OFFICIAL_ROSTER_PATH, "utf-8"));
}
