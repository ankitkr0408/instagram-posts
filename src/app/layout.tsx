import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carousel Studio",
  description: "Turn a topic into a polished Instagram carousel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-border bg-surface">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3 text-sm">
            <Link href="/" className="font-semibold">
              Carousel Studio
            </Link>
            <Link href="/" className="text-muted hover:text-foreground">
              New
            </Link>
            <Link href="/settings" className="text-muted hover:text-foreground">
              Settings
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
