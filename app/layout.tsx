import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ProjectProvider } from "@/components/providers/ProjectProvider";
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
  title: "Studio Shoot at Sight",
  description: "Studio Shoot at Sight photography workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ProjectProvider>{children}</ProjectProvider>
      </body>
    </html>
  );
}
