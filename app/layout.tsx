import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Aether — The AI Tutor That Never Forgets",
  description:
    "Upload anything—notes, slides, or entire textbooks. Experience a human-like conversational journey that adapts to your learning pace in real-time.",
  manifest: "/manifest.webmanifest",
};

import Providers from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${syne.variable}`}>
      <body className="bg-deep-onyx text-foreground overflow-x-hidden min-h-screen antialiased font-sans" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(function(){}); }`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
