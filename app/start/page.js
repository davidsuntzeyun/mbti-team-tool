import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import NavTabs from "../components/NavTabs";

const STEPS = [
  {
    step: "1",
    title: "Set your MBTI type",
    href: "/profile",
    label: "Your Profile",
    body: "Everything else in this tool builds on this. Pick the archetype that matches your MBTI profiling, or update it anytime if it doesn't feel right yet.",
  },
  {
    step: "2",
    title: "Read up on any type",
    href: "/types",
    label: "Explore Types",
    body: "Curious what a colleague's type actually means, or just want to understand a type better? Pick any of the 16 archetypes and read its full profile. This one's locked behind its own password, since it's the full write-up for every type, not just yours, ask whoever shared this tool with you.",
  },
  {
    step: "3",
    title: "Guess a colleague, just for fun",
    href: "/guess",
    label: "Guess",
    body: "Type in anyone's name, not just people on the roster, and guess their MBTI type with your reasoning. You'll also see a compatibility read between your type and the one you guessed.",
  },
  {
    step: "4",
    title: "See how you and a colleague work together",
    href: "/match",
    label: "Quick Match",
    body: "Pick a colleague who's already set their type on this tool, and get a breakdown of your strengths, friction points, and how communicating with each other actually feels from both sides.",
  },
  {
    step: "5",
    title: "Check a group's overall dynamic",
    href: "/team",
    label: "Team Dynamic",
    body: "Build a group of 3 to 5 people, you're automatically included, and see where the group is naturally aligned and where it might be lopsided.",
  },
  {
    step: "6",
    title: "Manage your whole department, not just a group",
    href: "/department",
    label: "Department Dynamic",
    body: "The manager's version of Team Dynamic, no size cap. Pick everyone who reports to you and get both the department's overall balance and a personalized note on how to manage each person.",
  },
  {
    step: "7",
    title: "Build the right team for the job",
    href: "/builder",
    label: "Team Builder",
    body: "See who on the roster naturally complements you, or build a group for a specific kind of work, brainstorming, operational execution, client-facing, and more, and see how well it fits.",
  },
  {
    step: "8",
    title: "Get your own development plan",
    href: "/growth",
    label: "Growth Plan",
    body: "A development card built from your type: what to lean into, what to actively manage, and concrete topics to research, tailored to whether you manage people, manage projects, or work as an individual contributor.",
  },
];

export default function StartPage() {
  const username = getSessionUsername();
  if (!username) redirect("/");

  return (
    <>
      <NavTabs active="/start" username={username} />

      <div className="card">
        <span className="pill">Start here</span>
        <h1 style={{ marginTop: 10 }}>Getting started</h1>
        <p>
          This tool has grown a few tabs since you first signed up, here's
          a quick map of what each one does and a sensible order to try
          them in. Nothing is required in any particular sequence, work
          through it however makes sense for you.
        </p>
      </div>

      {STEPS.map((s) => (
        <div key={s.href} className="card">
          <div className="user-row" style={{ alignItems: "flex-start", borderBottom: "none", padding: 0 }}>
            <div>
              <span className="section-label" style={{ marginBottom: 4 }}>Step {s.step} &middot; {s.label}</span>
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>{s.title}</h2>
              <p style={{ margin: 0 }}>{s.body}</p>
            </div>
          </div>
          <a className="btn btn-outline" style={{ marginTop: 14 }} href={s.href}>
            Go to {s.label}
          </a>
        </div>
      ))}

      <div className="card">
        <div className="section-label">A few things worth knowing</div>
        <p style={{ marginBottom: 0 }}>
          Nothing in this tool is confidential, and none of it is meant to
          be used for hiring or performance decisions. If you're ever
          unsure how to use or interpret something here, the <a href="/faq">FAQ</a> covers
          the most common questions.
        </p>
      </div>
    </>
  );
}
