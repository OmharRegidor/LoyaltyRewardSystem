import type React from "react";
import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import type { Viewport } from "next";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NoxaLoyalty",
  description:
    "A modern loyalty rewards platform designed for small businesses in the Philippines. QR code points, digital rewards, and customer insights all in one place.",
  icons: {
    icon: [
      { url: "/icon-dark-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/logoloyalty.png", type: "image/png", sizes: "500x500" },
    ],
    apple: "/apple-icon.png",
  },
  verification: {
    google: "Dgx2ZvrJ-ekme1Xukh3K2nqvYKUL8KKlRSqkSIwLAY4",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#7F0404",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} scroll-smooth`}>
      <body className="font-sans antialiased overflow-x-hidden" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
