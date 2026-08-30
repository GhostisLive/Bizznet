import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BizzNet — Provenance-Priced B2B Supply Chain",
  description:
    "Connect every tier of your supply chain with verified ESG provenance. Role-matched network, structured negotiation, and traceability that prices trust.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${ibmPlexMono.variable} h-full antialiased`}>
      {/* DIRECTION CONTRACT
        THESIS: BizzNet is the assay ledger where provenance is priced metal, not a badge.
        Refuses the SaaS hero-metric/plan-card template and generic blue.
        OWN-WORLD: warm graphite-on-parchment ground, paper-lit data panels, committed
        emerald reserved for verified truth, hairline rule lines, Archivo display + IBM Plex Mono
        for ledger data. Evidence shown as plates and stamped seals.
        STORY: A procurement officer lands, sees the marketplace filtering by provenance grade
        in action, understands the mechanism in seconds, and requests early access.
        FIRST VIEWPORT: A live product demo mock dominates — the marketplace with provenance
        filter working, flanked by the value proposition and primary CTA. No decorative hero image.
        FORM: The Independent Assay Ledger, index 5, seed key 76c7fbd0.
        FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
        the verdict, DESIGN.md, and every shipping raster carrying its provenance.
      */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
