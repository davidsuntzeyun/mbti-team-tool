// Builds stable content keys for the thumbs up/down feedback system.
//
// The same underlying blurb (e.g. INTJ's teamDynamics.asManager text) shows
// up on more than one page (Types, Match, Department), so votes are keyed by
// the content itself, never by the page that happened to render it, and all
// of its appearances roll up into one shared tally in the ContentFeedback
// sheet/tab.
//
// Quick Match's strengths/weaknesses/conflicts and communication-feel lines
// are generated from a pair of types rather than a single one. Those are
// keyed by the actual pair shown (sorted where the content is symmetric, in
// from->to order where it isn't), not by the underlying per-dichotomy
// template, which keeps this simple at the cost of a few more sheet rows.

export function typeContentKey(mbtiType, field) {
  return `type:${mbtiType.toUpperCase()}:${field}`;
}

export function identityContentKey(identityCode, field) {
  return `identity:${identityCode.toUpperCase()}:${field}`;
}

export function typeIdentityContentKey(mbtiType, identityCode, field) {
  return `type:${mbtiType.toUpperCase()}:identity:${identityCode.toUpperCase()}:${field}`;
}

export function matchContentKey(typeA, typeB, field) {
  const [a, b] = [typeA.toUpperCase(), typeB.toUpperCase()].sort();
  return `match:${a}-${b}:${field}`;
}

export function identityMatchContentKey(identityA, identityB, field) {
  const [a, b] = [identityA.toUpperCase(), identityB.toUpperCase()].sort();
  return `identitymatch:${a}-${b}:${field}`;
}

// Asymmetric: "how {fromType} feels communicating with {toType}" reads
// differently depending on direction, so this is not sorted.
export function commFeelContentKey(fromType, toType) {
  return `commfeel:${fromType.toUpperCase()}->${toType.toUpperCase()}`;
}
