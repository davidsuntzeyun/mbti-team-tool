import { isAdminUsername } from "../../lib/session";

const TABS = [
  { href: "/start", label: "Getting Started" },
  { href: "/profile", label: "Your Profile" },
  { href: "/guess", label: "Guess" },
  { href: "/match", label: "Quick Match" },
  { href: "/team", label: "Team Dynamic" },
  { href: "/builder", label: "Team Builder" },
  { href: "/types", label: "Explore Types" },
  { href: "/faq", label: "FAQ" },
];

export default function NavTabs({ active, username }) {
  return (
    <div className="nav-tabs">
      {TABS.map((tab) => (
        <a key={tab.href} href={tab.href} className={active === tab.href ? "active" : ""}>
          {tab.label}
        </a>
      ))}
      {isAdminUsername(username) && (
        <a href="/admin" className={active === "/admin" ? "active" : ""}>
          Roster
        </a>
      )}
    </div>
  );
}
