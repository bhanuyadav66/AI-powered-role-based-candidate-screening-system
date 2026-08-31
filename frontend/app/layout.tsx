import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "ScreenAI — Candidate Screening System",
  description: "An AI-guided adaptive technical interview platform tailored to your resume and role.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <header className="app-header">
          <div className="app-header-inner">
            <div className="brand-logo">
              <div className="brand-icon">AI</div>
              <span>ScreenAI <span style={{ color: "var(--paper-dim)", fontWeight: 400, fontSize: "0.85rem" }}>· Candidate Portal</span></span>
            </div>
            <div className="header-status">
              <div className="pulse-dot" />
              <span>AI Screener Engine Active</span>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
