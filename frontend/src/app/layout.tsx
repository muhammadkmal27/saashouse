import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://imat.my"),
  title: {
    default: "Sistem Pengurusan Tiket - Imat.my",
    template: "%s | Imat.my",
  },
  description: "Platform SaaS pengurusan tiket yang moden, pantas, dan efisien untuk pasukan tangkas di Malaysia.",
  keywords: ["imat", "sistem tiket", "saas", "malaysia", "pengurusan projek", "customer support"],
  authors: [{ name: "Imat.my Team" }],
  creator: "Imat.my",
  openGraph: {
    type: "website",
    locale: "ms_MY",
    url: "https://imat.my",
    title: "Sistem Pengurusan Tiket - Imat.my",
    description: "Platform SaaS pengurusan tiket yang moden, pantas, dan efisien.",
    siteName: "Imat.my",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistem Pengurusan Tiket - Imat.my",
    description: "Platform SaaS pengurusan tiket yang moden, pantas, dan efisien.",
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
