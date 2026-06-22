import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../tokens/colors.css";
import "../tokens/typography.css";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Loopra — The easiest way to grow and automate audience communication",
    template: "%s | Loopra",
  },
  description:
    "Loopra is a modern communication automation platform for creators, startups, and small businesses.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${font.variable} scroll-smooth`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
