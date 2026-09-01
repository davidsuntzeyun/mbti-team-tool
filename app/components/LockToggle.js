"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Locked/unlocked padlock, shown top-right of the header on every page.
// Locked: click opens a popup asking for the shared roster password
// (MBTIGURU). Unlocked: click re-locks instantly, no password needed to
// lock again, only to unlock (matches how a real padlock works).
function LockedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UnlockedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 0 1 7.4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function LockToggle({ isUnlocked, unlockAction, lockAction }) {
  const dialogRef = useRef(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const error = searchParams.get("gateError");

  useEffect(() => {
    if (error && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [error]);

  if (isUnlocked) {
    return (
      <form action={lockAction} style={{ display: "inline" }}>
        <input type="hidden" name="redirectTo" value={pathname} />
        <button
          type="submit"
          title="Roster unlocked, click to lock again"
          aria-label="Roster unlocked, click to lock again"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            marginLeft: 12,
            display: "inline-flex",
            color: "var(--bi-white)",
          }}
        >
          <UnlockedIcon />
        </button>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        title="Roster locked, click to unlock"
        aria-label="Roster locked, click to unlock"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          marginLeft: 12,
          display: "inline-flex",
          color: "var(--bi-white)",
        }}
      >
        <LockedIcon />
      </button>

      <dialog
        ref={dialogRef}
        style={{
          border: "none",
          borderRadius: 12,
          padding: 0,
          maxWidth: 340,
          width: "90%",
        }}
      >
        <div style={{ padding: 20 }}>
          <span className="pill">Locked</span>
          <h2 style={{ marginTop: 10 }}>Unlock the roster</h2>
          <p className="hint" style={{ marginTop: -4 }}>
            You can already match, build, and compare using everyone who's
            filled in their own profile. Unlocking adds the official
            pre-loaded roster on top. Ask whoever shared this tool with you
            for the password.
          </p>
          {error && <p className="error">{decodeURIComponent(error)}</p>}
          <form action={unlockAction}>
            <input type="hidden" name="redirectTo" value={pathname} />
            <label>Password</label>
            <input type="password" name="password" required autoFocus />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn" type="submit">Unlock</button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => dialogRef.current?.close()}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
