import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { OpsToasts } from "@/components/ops-toasts";
import { PortfolioFooter } from "@/components/portfolio-footer";
import { Providers } from "@/components/providers";
import { SiteDock } from "@/components/site-dock";
import { SiteHeader } from "@/components/site-header";
import { FIRM } from "@/lib/firm";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const serif = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: `${FIRM.name} — Intake desk`,
  description: "Fictional law-firm intake assistant for Harlow & Pierce LLP. It collects facts, screens conflicts, and books consultations. It does not give legal advice.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <SiteHeader />
          {children}
          <PortfolioFooter />
          <SiteDock />
          <OpsToasts />
        </Providers>
      </body>
    </html>
  );
}
