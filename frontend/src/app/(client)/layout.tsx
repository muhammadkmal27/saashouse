"use client";
import { LayoutDashboard, Briefcase, FileText, Settings, Bell, LogOut, Receipt } from "lucide-react";
import Link from "next/link";
import ChatWidget from "@/components/chat/ChatWidget";
import UserMenu from "@/components/UserMenu";
import LanguageToggle from "@/components/LanguageToggle";
import { T } from "@/components/Translate";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/app/dashboard" className="text-xl font-bold tracking-tight px-2">
              SaaS House
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/app/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-900 bg-zinc-100 dark:text-zinc-50 dark:bg-zinc-900">
                <LayoutDashboard className="w-4 h-4" />
                <T en="Dashboard" bm="Papan Pemuka" />
              </Link>
              <Link href="/app/projects" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <Briefcase className="w-4 h-4" />
                <T en="Projects" bm="Projek" />
              </Link>
              <Link href="/app/billing" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <Receipt className="w-4 h-4" />
                <T en="Billing" bm="Pengebilan" />
              </Link>
              <Link href="/app/tickets" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <FileText className="w-4 h-4" />
                <T en="Support & Tasks" bm="Sokongan & Tugasan" />
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <UserMenu />
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}
