import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaaS House | Modern Solutions",
  description: "High-performance SaaS platform for agile teams.",
};

import { Toaster } from "sonner";
import { SocketProvider } from "@/components/providers/SocketProvider";
import ChatWidget from "@/components/chat/ChatWidget";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50`}>
        <SocketProvider>
          {children}
          <Toaster position="top-center" richColors />
        </SocketProvider>
      </body>
    </html>
  );
}
