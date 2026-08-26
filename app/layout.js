import "./globals.css";
import { getSessionUsername } from "../lib/session";
import HeaderNav from "./components/HeaderNav";

export const metadata = {
  title: "MBTI Team Tool | Beyond Insights",
  description:
    "Understand yourself, understand your colleagues, work better together.",
};

export default function RootLayout({ children }) {
  const username = getSessionUsername();
  return (
    <html lang="en">
      <body>
        <HeaderNav username={username} />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
