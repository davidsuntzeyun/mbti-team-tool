import { redirect } from "next/navigation";
import { getSessionUsername } from "../../lib/session";
import NavTabs from "../components/NavTabs";
import faqData from "../../content/faq.json";

export default function FaqPage() {
  const username = getSessionUsername();
  if (!username) redirect("/");

  return (
    <>
      <NavTabs active="/faq" username={username} />

      <div className="card">
        <span className="pill">FAQ</span>
        <h1 style={{ marginTop: 10 }}>Common questions</h1>
        <p>
          Answers to what people usually ask about MBTI, personality tests
          in general, and how this tool is meant to be used, and not used,
          at Beyond Insights.
        </p>
      </div>

      {Object.entries(faqData).map(([category, questions]) => (
        <div key={category} className="card">
          <div className="section-label">{category}</div>
          {questions.map((item, i) => (
            <details key={i} style={{ marginTop: i === 0 ? 10 : 14 }}>
              <summary className="collapsible-summary" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--bi-navy)" }}>
                {item.q}
              </summary>
              <p style={{ marginTop: 8 }}>{item.a}</p>
            </details>
          ))}
        </div>
      ))}
    </>
  );
}
