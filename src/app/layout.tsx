import type { Metadata } from "next";
import "../layout-primitives.css";
import "../styles.css";

export const metadata: Metadata = {
  title: {
    default: "Global Investment Portal | Knight Frank",
    template: "%s | Knight Frank",
  },
  description:
    "Explore global real estate investment opportunities with Knight Frank.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
