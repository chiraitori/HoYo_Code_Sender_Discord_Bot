import type { Metadata } from "next";
import "./globals.css";
import { BotStatsProvider } from "@/lib/BotStatsContext";

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
      <body className="font-sans antialiased">
        <BotStatsProvider>
          {children}
        </BotStatsProvider>
      </body>
    </html>
  );
}
