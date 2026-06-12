import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://imat.my"),
  title: {
    default: "Pembangunan Laman Web & Sistem Profesional - Imat.my",
    template: "%s | Imat.my",
  },
  description: "SaaS House oleh Imat.my menawarkan perkhidmatan pembangunan laman web premium, aplikasi web moden, dan sistem berprestasi tinggi untuk perniagaan anda.",
  keywords: ["imat", "software house", "bina website", "pembangunan web", "saas", "malaysia", "web developer"],
  authors: [{ name: "Imat.my Team" }],
  creator: "Imat.my",
  openGraph: {
    type: "website",
    locale: "ms_MY",
    url: "https://imat.my",
    title: "Pembangunan Laman Web & Sistem Profesional - Imat.my",
    description: "Perkhidmatan pembangunan laman web premium dan sistem berprestasi tinggi.",
    siteName: "Imat.my",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pembangunan Laman Web & Sistem Profesional - Imat.my",
    description: "Perkhidmatan pembangunan laman web premium dan sistem berprestasi tinggi.",
  },
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
