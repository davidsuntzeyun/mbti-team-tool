import typesData from "../content/types.json";
import snippets from "../content/quickmatch-snippets.json";

export const MBTI_CODES = Object.keys(typesData);

export function getTypeProfile(code) {
  if (!code) return null;
  return typesData[code.toUpperCase()] || null;
}

const DICHOTOMIES = [
  { key: "EI", index: 0, a: "E", b: "I" },
  { key: "SN", index: 1, a: "S", b: "N" },
  { key: "TF", index: 2, a: "T", b: "F" },
  { key: "JP", index: 3, a: "J", b: "P" },
];

export function isValidType(code) {
  return typeof code === "string" && MBTI_CODES.includes(code.toUpperCase());
}

// Compares two MBTI codes letter-by-letter and returns a combined
// strengths / weaknesses / conflicts readout, per dichotomy.
export function quickMatch(typeA, typeB) {
  const A = typeA.toUpperCase();
  const B = typeB.toUpperCase();
  const out = { strengths: [], weaknesses: [], conflicts: [] };

  for (const d of DICHOTOMIES) {
    const a = A[d.index];
    const b = B[d.index];
    const bucket = snippets[d.key];
    let entry;
    if (a === b && a === d.a) entry = bucket[`both${d.a}`];
    else if (a === b && a === d.b) entry = bucket[`both${d.b}`];
    else entry = bucket.mixed;

    out.strengths.push(entry.strength);
    out.weaknesses.push(entry.weakness);
    out.conflicts.push(entry.conflict);
  }
  return out;
}
