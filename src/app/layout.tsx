import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppShell } from "@/components/layout/app-shell";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bench",
    template: "%s · Bench",
  },
  description:
    "Which model actually wins your work. Blind head-to-heads on your own tasks, compounded into a routing table and the number your guessing costs.",
  applicationName: "Bench",
  authors: [{ name: "Bench" }],
  keywords: ["model evaluation", "blind comparison", "model routing", "LLM cost", "AI spend"],
  openGraph: {
    title: "Bench",
    description:
      "Which model actually wins your work. Blind head-to-heads on your own tasks, compounded into a routing table.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#17181c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Applies the stored theme before first paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-md focus:border focus:border-line focus:bg-overlay focus:px-3 focus:py-1.5 focus:text-[13px] focus:text-ink focus:shadow-md"
        >
          Skip to content
        </a>
        <AppShell>
          <div id="main">{children}</div>
        </AppShell>
      </body>
    </html>
  );
}
