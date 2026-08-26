import typesData from "../content/types.json";
import snippets from "../content/quickmatch-snippets.json";
import commFeel from "../content/communication-feel.json";
import teamSnippets from "../content/team-dynamics-snippets.json";
import activitiesData from "../content/activities.json";

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
      percents: {
        [d.a]: size ? Math.round((countA / size) * 100) : 0,
        [d.b]: size ? Math.round((countB / size) * 100) : 0,
      },
      classification,
      text,
    };
  });

  return { size, dichotomyResults };
}

const DICHOTOMY_BY_KEY = Object.fromEntries(DICHOTOMIES.map((d) => [d.key, d]));

// Ranks a list of colleagues against "myType" two ways: by how many
// dichotomies they differ on (most complementary, fills gaps you don't
// naturally cover) and by how many they share (most compatible, easiest
// day-to-day rapport). Same underlying comparison, opposite sort order.
export function rankComplements(myType, colleagues) {
  const my = myType.toUpperCase();

  const scored = colleagues.map((c) => {
    const t = c.mbtiType.toUpperCase();
    let sameCount = 0;
    const shared = [];
    const different = [];
    DICHOTOMIES.forEach((d) => {
      if (my[d.index] === t[d.index]) {
        sameCount++;
        shared.push(d.key);
      } else {
        different.push(d.key);
      }
    });
    return { ...c, sameCount, diffCount: 4 - sameCount, shared, different };
  });

  const byName = (a, b) => a.username.localeCompare(b.username);

  const mostComplementary = [...scored].sort(
    (a, b) => b.diffCount - a.diffCount || byName(a, b)
  );
  const mostCompatible = [...scored].sort(
    (a, b) => b.sameCount - a.sameCount || byName(a, b)
  );

  return { mostComplementary, mostCompatible };
}

// From a group analysis, returns the dichotomies that are NOT balanced,
// each paired with the underrepresented letter (the one the group needs
// more of to even itself out).
export function getGapLetters(analysis) {
  const gaps = [];
  analysis.dichotomyResults.forEach((d) => {
    if (d.classification === "balanced") return;
    const [letterA, letterB] = Object.keys(d.counts);
    const underLetter = d.counts[letterA] < d.counts[letterB] ? letterA : letterB;
    gaps.push({ key: d.key, letter: underLetter });
  });
  return gaps;
}

// Given the group's gap letters and a pool of colleagues NOT already in
// the group, ranks candidates by how many of the group's gaps they'd
// personally fill, most useful first.
export function suggestGapFillers(gapLetters, candidates) {
  if (gapLetters.length === 0) return [];

  const scored = candidates.map((c) => {
    const t = c.mbtiType.toUpperCase();
    const fills = gapLetters.filter((g) => t[DICHOTOMY_BY_KEY[g.key].index] === g.letter);
    return { ...c, fills };
  });

  return scored
    .filter((c) => c.fills.length > 0)
    .sort((a, b) => b.fills.length - a.fills.length || a.username.localeCompare(b.username));
}

// Wheel order for the radar chart: each letter's opposite sits directly
// across the circle from it (E/I, S/N, T/F, J/P each 180 degrees apart).
const RADAR_ORDER = ["E", "S", "T", "J", "I", "N", "F", "P"];

// Turns a group analysis into plain SVG geometry (grid rings, axis lines,
// the data polygon, and label positions) so the page component can drop
// it straight into an <svg> with no client-side charting library.
export function buildRadarChart(analysis, { size = 260, rings = 4 } = {}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 34; // leave room for labels

  const percentByLetter = {};
  analysis.dichotomyResults.forEach((d) => {
    Object.entries(d.counts).forEach(([letter, count]) => {
      percentByLetter[letter] = analysis.size ? Math.round((count / analysis.size) * 100) : 0;
    });
  });

  function pointAt(index, radius) {
    const angle = (Math.PI / 180) * (index * 45 - 90);
    return {
      x: Math.round((cx + radius * Math.cos(angle)) * 100) / 100,
      y: Math.round((cy + radius * Math.sin(angle)) * 100) / 100,
    };
  }

  const gridPolygons = [];
  for (let r = 1; r <= rings; r++) {
    const radius = (maxRadius * r) / rings;
    const points = RADAR_ORDER.map((_, i) => pointAt(i, radius));
    gridPolygons.push(points.map((p) => `${p.x},${p.y}`).join(" "));
  }

  const axisLines = RADAR_ORDER.map((letter, i) => {
    const outer = pointAt(i, maxRadius);
    return { letter, x1: cx, y1: cy, x2: outer.x, y2: outer.y };
  });

  const dataPoints = RADAR_ORDER.map((letter, i) => {
    const percent = percentByLetter[letter] || 0;
    return pointAt(i, (percent / 100) * maxRadius);
  });
  const dataPolygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const labels = RADAR_ORDER.map((letter, i) => {
    const pos = pointAt(i, maxRadius + 20);
    return { letter, percent: percentByLetter[letter] || 0, x: pos.x, y: pos.y };
  });

  return { size, cx, cy, gridPolygons, axisLines, dataPolygonPoints, labels };
}

// Activities: pre-defined "ideal" trait mixes for common kinds of work
// (brainstorming, operational execution, and so on), so a group can be
// checked against what a specific activity tends to need, not just
// generic internal balance.
export function getActivities() {
  return Object.entries(activitiesData).map(([key, a]) => ({ key, ...a }));
}

export function getActivity(key) {
  if (!key || !activitiesData[key]) return null;
  return { key, ...activitiesData[key] };
}

// How far a threshold percentage-point gap has to be before we bother
// flagging it as something the group is short on for this activity.
const ACTIVITY_FIT_THRESHOLD = 15;

// Compares a group's analysis against one activity's ideal mix, dichotomy
// by dichotomy, and reports where the group is short and by how much.
export function evaluateActivityFit(analysis, activity) {
  const rows = DICHOTOMIES.map((d) => {
    const result = analysis.dichotomyResults.find((r) => r.key === d.key);
    const idealA = activity.ideal[d.key][d.a];
    const idealB = 100 - idealA;
    const actualA = result.percents[d.a];
    const actualB = result.percents[d.b];
    const diff = actualA - idealA; // negative: short on A; positive: short on B

    let neededLetter = null;
    if (diff < -ACTIVITY_FIT_THRESHOLD) neededLetter = d.a;
    else if (diff > ACTIVITY_FIT_THRESHOLD) neededLetter = d.b;

    return {
      key: d.key,
      letterA: d.a,
      letterB: d.b,
      idealA,
      idealB,
      actualA,
      actualB,
      neededLetter,
    };
  });

  const gapLetters = rows
    .filter((r) => r.neededLetter)
    .map((r) => ({ key: r.key, letter: r.neededLetter }));

  const fitPercent = Math.round(
    ((rows.length - gapLetters.length) / rows.length) * 100
  );

  return { rows, gapLetters, fitPercent };
}
