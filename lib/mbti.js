import typesData from "../content/types.json";
import snippets from "../content/quickmatch-snippets.json";
import commFeel from "../content/communication-feel.json";

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

// How communicating feels, from each person's point of view, based on
// the Extraversion/Introversion and Thinking/Feeling letters (the two
// dichotomies that shape the actual feel of a conversation).
function eiFeelLine(from, to) {
  if (from[0] === to[0]) {
    return from[0] === "E" ? commFeel.EI.bothE : commFeel.EI.bothI;
  }
  return from[0] === "E" ? commFeel.EI.E_with_I : commFeel.EI.I_with_E;
}

function tfFeelLine(from, to) {
  if (from[2] === to[2]) {
    return from[2] === "T" ? commFeel.TF.bothT : commFeel.TF.bothF;
  }
  return from[2] === "T" ? commFeel.TF.T_with_F : commFeel.TF.F_with_T;
}

// Returns how "them" likely feels communicating with "you", and how
// "you" likely feel communicating with "them" — two distinct directions,
// since the same pairing can feel different depending on whose side
// you're standing on.
export function getCommunicationFeel(myType, theirType) {
  const my = myType.toUpperCase();
  const their = theirType.toUpperCase();

  return {
    howTheyFeelWithYou: `${eiFeelLine(their, my)} ${tfFeelLine(their, my)}`,
    howYouFeelWithThem: `${eiFeelLine(my, their)} ${tfFeelLine(my, their)}`,
  };
}
