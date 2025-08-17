import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BotStatsProvider } from "@/lib/BotStatsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HoYo Bot Dashboard | Discord Bot Management",
  description: "Admin dashboard for managing HoYo Code Sender Discord bot - monitor servers, manage codes, and view analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BotStatsProvider>
          {children}
        </BotStatsProvider>
      </body>
    </html>
  );
}
