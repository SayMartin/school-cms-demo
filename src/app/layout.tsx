import type { Metadata } from "next";
import localFont from "next/font/local";
import { eq } from "drizzle-orm";
import { PublicLayout } from "@/components/public-layout";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SoapBubblesBg } from "@/components/soap-bubbles-faceless";
import { getDb } from "@/lib/db/client";
import { typographySettings, bgGradientSettings } from "@/lib/db/schema";
import "./globals.css";

const geist = localFont({
  src: [
    { path: "./fonts/geist-latin.woff2", weight: "100 900", style: "normal" },
    {
      path: "./fonts/geist-latin-ext.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
});

const DEFAULTS = {
  h1Font: "Geist",
  h2Font: "Geist",
  h3Font: "Geist",
  bodyFont: "Geist",
};

function fontValue(name: string) {
  return name === "Geist"
    ? "var(--font-geist-sans), sans-serif"
    : `'${name}', sans-serif`;
}

async function getBgGradient() {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(bgGradientSettings)
      .where(eq(bgGradientSettings.id, "main"))
      .limit(1);
    return row ?? { color1: "#FDFCF8", color2: "#F7F4ED" };
  } catch {
    return { color1: "#FDFCF8", color2: "#F7F4ED" };
  }
}

async function getTypography() {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(typographySettings)
      .where(eq(typographySettings.id, "main"))
      .limit(1);
    return row ?? DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export const metadata: Metadata = {
  title: {
    default: "Demo Folk High School",
    template: "%s | Demo Folk High School",
  },
  description:
    "Popular education for the future — connection and opportunity, together.",
  icons: {
    icon: "/school-logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [typo, bg] = await Promise.all([getTypography(), getBgGradient()]);

  const cssVars = `
    :root {
      --font-h1:   ${fontValue(typo.h1Font)};
      --font-h2:   ${fontValue(typo.h2Font)};
      --font-h3:   ${fontValue(typo.h3Font)};
      --font-body: ${fontValue(typo.bodyFont)};
    }
  `.trim();

  return (
    <html
      lang="en"
      className={`${geist.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        {/* No font <link> here. Every selectable typeface is self-hosted and
            declared in fonts-google.css, which globals.css imports — a page
            load contacts no third party at all. */}
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body className="flex min-h-full flex-col">
        {/* Gradient backdrop. Fixed div instead of body background-attachment:fixed
            because iOS Safari ignores background-attachment:fixed and would stretch
            the gradient across the full scroll height instead of the viewport. */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -1,
            background: `linear-gradient(to bottom, ${bg.color1} 0%, ${bg.color2} 100%)`,
          }}
        />
        <SoapBubblesBg />
        {/* z-[1] creates a stacking context above the canvas (z-0) but below nothing —
            content here is always in front of the bubble animation */}
        <div className="relative z-[1] flex flex-col flex-1">
          <PublicLayout>{children}</PublicLayout>
          <Footer />
          <ScrollToTop />
        </div>
      </body>
    </html>
  );
}
