// Data layer router.
//
// Phase 2 (local build): no Google credentials configured -> uses the local
// JSON file (db.local.js).
// Phase 3+ (production): GOOGLE_SHEET_ID + service account env vars set ->
// uses the real Google Sheet (db.sheets.js).
//
// Every function here returns a Promise either way (db.local.js's plain
// return values are still safely awaitable), so every caller should
// `await` these calls regardless of which backend is active — that's what
// makes this swap a no-op for every page and Server Action.

import * as local from "./db.local";
import * as sheets from "./db.sheets";

const useSheets = Boolean(process.env.GOOGLE_SHEET_ID);
const backend = useSheets ? sheets : local;

export const getAllUsers = (...args) => backend.getAllUsers(...args);
export const getUser = (...args) => backend.getUser(...args);
export const createUser = (...args) => backend.createUser(...args);
export const verifyLogin = (...args) => backend.verifyLogin(...args);
export const updateUserType = (...args) => backend.updateUserType(...args);
export const updateUserIdentity = (...args) => backend.updateUserIdentity(...args);
export const updateUserScores = (...args) => backend.updateUserScores(...args);
export const updateUserRole = (...args) => backend.updateUserRole(...args);
export const deleteUser = (...args) => backend.deleteUser(...args);
export const getGuessesByUser = (...args) => backend.getGuessesByUser(...args);
export const upsertGuess = (...args) => backend.upsertGuess(...args);
export const deleteGuess = (...args) => backend.deleteGuess(...args);
