import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "BPG Ish Kalendari",
  description: "Samarqanddagi BPG marketing agentligi ish boshqaruv tizimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={cn("dark", "font-sans", geist.variable)}>
      <body className={`${inter.className} antialiased flex h-screen overflow-hidden text-sm`}>
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <Header />
          <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
