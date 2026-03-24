import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BPG Agency — Marketing Platform",
  description: "Samarqanddagi BPG marketing agentligi ish boshqaruv tizimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} antialiased text-sm bg-black text-white`} suppressHydrationWarning>
        <AppShell>
           {children}
        </AppShell>
      </body>
    </html>
  );
}
