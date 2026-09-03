import { voteContentAction } from "../actions";

// Thumbs up/down feedback on a single piece of content. Server component,
// no client JS: each thumb is its own tiny form posting to the shared
// voteContentAction, same progressive-enhancement pattern as the rest of
// this app's forms. The count is never shown to the viewer, this is a
// one-way signal back to whoever maintains the content, read straight out
// of the ContentFeedback sheet/tab. `vote` reflects this viewer's own past
// choice ("up", "down", or undefined), so the selected thumb stays
// highlighted next time they see this card.
function ThumbIcon({ direction }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ transform: direction === "down" ? "scaleY(-1)" : undefined }}
    >
      <path
        d="M7 22H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3m0 11V11m0 11h10.5a2 2 0 0 0 1.94-1.515l1.5-6A2 2 0 0 0 19 11h-5.5V5a2 2 0 0 0-2-2L9 9v13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThumbsVote({ contentKey, vote, redirectTo }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, marginTop: 12 }}>
      <form action={voteContentAction} style={{ display: "inline" }}>
        <input type="hidden" name="contentKey" value={contentKey} />
        <input type="hidden" name="vote" value="up" />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <button
          type="submit"
          title="This feels accurate"
          aria-label="This feels accurate"
          aria-pressed={vote === "up"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "inline-flex",
            color: vote === "up" ? "var(--bi-blue)" : "#c3ccd6",
          }}
        >
          <ThumbIcon direction="up" />
        </button>
      </form>
      <form action={voteContentAction} style={{ display: "inline" }}>
        <input type="hidden" name="contentKey" value={contentKey} />
        <input type="hidden" name="vote" value="down" />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <button
          type="submit"
          title="This doesn't feel accurate"
          aria-label="This doesn't feel accurate"
          aria-pressed={vote === "down"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "inline-flex",
            color: vote === "down" ? "var(--bi-magenta)" : "#c3ccd6",
          }}
        >
          <ThumbIcon direction="down" />
        </button>
      </form>
    </div>
  );
}
