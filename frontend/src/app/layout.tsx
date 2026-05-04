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
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import ChatWidget from "@/components/chat/ChatWidget";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" style={{ colorScheme: 'light' }}>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
      </head>
      <body className={`${inter.className} antialiased bg-white text-zinc-900`}>
        <LanguageProvider>
          <SocketProvider>
            {children}
            <Toaster position="top-center" richColors />
          </SocketProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
