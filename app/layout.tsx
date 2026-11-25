import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { PortfolioFooter } from "@/components/portfolio-footer";
import { SiteHeader } from "@/components/site-header";
import { FIRM } from "@/lib/firm";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: `${FIRM.name} — Intake desk`,
  description:
    "Fictional law-firm intake assistant for Harlow & Pierce LLP. It collects facts, screens conflicts, and books consultations. It does not give legal advice.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} antialiased`}>
        <SiteHeader />
        {children}
        <PortfolioFooter />
      </body>
    </html>
  );
}
