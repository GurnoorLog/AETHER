import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aether — The AI Tutor That Never Forgets",
  description:
    "Upload anything—notes, slides, or entire textbooks. Experience a human-like conversational journey that adapts to your learning pace in real-time.",
};

import Providers from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-deep-onyx text-white overflow-x-hidden min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
