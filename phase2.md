# Phase 2 — Content Ideas (discussion draft)

Not a build spec yet. Capturing the ideas from our conversation so we can keep
discussing before committing to any of it.

## Two buckets

Content ideas split into two categories that trade off against each other:

- **Genuinely useful** — deepens actual day-to-day teamwork, helps people make
  a real decision (how to run a meeting, how to disagree, how to give
  feedback).
- **Pique interest** — keeps people coming back to the tool between live
  sessions, more social/fun than analytical.

## Genuinely useful

### 1. "Working with me" one-pager
A single shareable card per person that pulls together what's already in
`types.json` (communication style, feedback preferences, under-pressure
behavior, growth edge, pet peeves) into one scannable summary. Something
someone could paste into a Slack bio or hand to a new manager/teammate.

- Mostly a **new view**, not new writing — the content already exists.
- Cheapest of the "useful" ideas to build.
- Open question: is this a standalone page, or a mode on the existing
  Profile page?

### 2. Conflict / disagreement script
None of the current content tells you *how to push back* on a given type,
only how they communicate generally. A new field per type: "how to disagree
with a [type] without it landing badly."

- Requires **new content**: 16 bespoke blurbs, same shape as the Assertive/
  Turbulent work.
- Could extend into Quick Match (a "how to disagree with this specific
  person" combined readout) the same way Identity did.

### 3. Department Dynamic (manager's team-view)
Reframes the earlier "manager's team-view" idea as its own feature,
parallel to the existing Team Dynamic page. A manager picks their reports
(their whole department, not capped at 3-5 like Team Dynamic/Team Builder)
and gets:

- The aggregate group-balance view Team Dynamic already produces (EI/SN/TF/JP
  split across the department).
- Plus, per report, a personalized "how to manage this person" pulled from
  the existing `teamDynamics.asTeamMember` / `communicate` / `bringOutBest`
  fields — so it's not just a balance chart, it's an actual per-person
  management guide.

- Mostly **reuses existing logic and content** (`analyzeGroup` + the
  `teamDynamics` fields already in `types.json`).
- **Decided: unlimited group size.** No 3-5 cap like Team Dynamic/Team
  Builder — a manager can add their whole department. `analyzeGroup`'s
  percent-based classification already generalizes to any size; the balance
  view and radar chart just need to actually be tested at larger N (e.g. a
  department of 12-15) rather than assumed to hold up.

### 4. Personal Growth Plan
A per-person development card, distinct from the existing "growth edge"
text on Profile. Structure:

- **Develop your strength** — lean into what the type is already good at.
- **Manage your weakness** — the blind spot to watch for, not just what
  drains them (drawing on `challenges` / `underPressure`, but framed as
  "manage," not just "avoid").
- **Development topics to research** — concrete things to go learn (e.g.
  "delegation," "active listening," "giving structured feedback"), not just
  a description of the trait.
- All three tailored not just by MBTI type, but by **role**: people manager,
  project manager, or individual contributor. The same type can have a very
  different growth focus depending on which of the three they are.

- Ties directly to Beyond Insights' mission ("bringing out the best in
  you"), so this one is on-brand, not just useful.
- **Decided: 16 + 3, not 48.** Type-specific strength/weakness (16 blurbs,
  reusing existing fields where possible) combined with role-specific
  development topic lists (3), rather than fully bespoke content for every
  type × role combination.
- Requires a new "role" field on the user profile (people manager / project
  manager / individual contributor), similar to how Identity was added.

## Pique interest

### 5. Type distribution / team superlatives
Aggregate stats across the whole roster ("we're 40% N, only 2 ESTJs on the
team") or generated "superlatives" from real data (most-common pairing,
rarest type on the team, etc.).

- Cheap to build, no new per-type content needed — just aggregation over
  `getAllUsers()`.
- Doesn't deepen anyone's actual teamwork, but drives repeat visits.

## Tradeoff

Ideas 1 and 3 (working-with-me card, Department Dynamic) mostly reorganize
content and logic that already exists. Idea 2 (conflict script) and idea 4
(Personal Growth Plan) both need real new writing — idea 4 has the added
wrinkle of a second dimension (role) multiplying the content matrix. Idea 5
(fun/aggregate stats) is cheap either way but is decoration, not
decision-support.

## Decisions made so far

- Department Dynamic: **unlimited group size**, no 3-5 cap.
- Personal Growth Plan: **16 + 3 content model** (type-specific
  strength/weakness combined with role-specific topic lists), not 48
  bespoke combinations.

## Open questions still to resolve before building anything

- Which of these (if any) is worth doing first?
- Does the "working with me" card replace part of the existing Profile page,
  or live alongside it / on Explore Types too?
- Should the conflict script live per-type only, or also get a Quick Match
  pairwise version like Identity did?
- Department Dynamic: at unlimited size, does the existing radar chart
  still read well, or does it need a different visualization once a
  department gets past ~10-15 people?
- Personal Growth Plan: is the new "role" field required or optional (like
  Identity), and where does someone set it — Profile, or its own step?
- Is the fun/aggregate stats idea worth it at all, or lower priority than
  it sounds?
