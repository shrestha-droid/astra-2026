import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({ variable: "--font-lexend", subsets: ["latin"], weight: ["200", "300", "400", "500"] });
const serif = Instrument_Serif({ variable: "--font-display", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata: Metadata = {
  title: "SatGuard India · Astro World (T22) · ASTRA 2026",
  description: "Which Indian satellites can help in a disaster, and are they safe from debris? Team Astro World, ASTRA 2026.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${lexend.variable} ${serif.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
