import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../lib/session";

// A session cookie pointing at a deleted account can't be cleared from a
// page component — Next.js only allows cookie mutation inside a Server
// Action or a Route Handler, never during render. This route exists just
// for that: clear the cookie, then send the browser back to "/" for a
// clean login instead of looping between "/" and "/profile" forever.
export async function GET(request) {
  clearSessionCookie();
  return NextResponse.redirect(new URL("/", request.url));
}
