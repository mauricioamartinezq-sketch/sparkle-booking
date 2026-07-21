import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sparkle — Window, Pressure Wash & Gutter Booking",
  description:
    "Book window cleaning, pressure washing, soft washing, gutter cleaning, and holiday lights in minutes.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E9C8B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <header className="mx-auto max-w-5xl px-6 pt-6 flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-medium text-ink">
            Sparkle
          </Link>
          <Link
            href="/login/"
            className="text-sm font-medium text-aqua-700 hover:text-aqua-900 transition-colors"
          >
            Sign in
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
