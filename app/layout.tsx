import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProfLM",
  description: "The AI coach that asks before it answers. A tutor that makes students explain it back.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=JetBrains+Mono:wght@500&family=Source+Sans+3:wght@400;600&display=swap"
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
