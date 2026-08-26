import typesData from "../content/types.json";
import snippets from "../content/quickmatch-snippets.json";
import commFeel from "../content/communication-feel.json";
import teamSnippets from "../content/team-dynamics-snippets.json";

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

// Group Team Dynamic analysis. Takes an array of MBTI codes (3-5 people)
// and, for each of the four dichotomies, classifies the group as uniform
// (everyone the same letter), balanced (close to an even split), or
// leaning toward one letter, then returns the matching guidance text
// plus the raw letter counts so the page can render a simple breakdown.
export function analyzeGroup(types) {
  const codes = types.map((t) => t.toUpperCase());
  const size = codes.length;

  const dichotomyResults = DICHOTOMIES.map((d) => {
    const countA = codes.filter((c) => c[d.index] === d.a).length;
    const countB = codes.filter((c) => c[d.index] === d.b).length;
    const bucket = teamSnippets[d.key];

    let classification;
    let text;
    if (countB === 0) {
      classification = `uniform${d.a}`;
      text = bucket[`uniform${d.a}`];
    } else if (countA === 0) {
      classification = `uniform${d.b}`;
      text = bucket[`uniform${d.b}`];
    } else if (Math.abs(countA - countB) <= 1) {
      classification = "balanced";
      text = bucket.balanced;
    } else if (countA > countB) {
      classification = `leaning${d.a}`;
      text = bucket[`leaning${d.a}`];
    } else {
      classification = `leaning${d.b}`;
      text = bucket[`leaning${d.b}`];
    }

    return {
      key: d.key,
      counts: { [d.a]: countA, [d.b]: countB },
      classification,
      text,
    };
  });

  return { size, dichotomyResults };
}
