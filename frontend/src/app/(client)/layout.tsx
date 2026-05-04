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
            <Link href="/app/dashboard" className="flex items-center gap-2 text-xl font-black tracking-tighter px-2 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-purple-500/10">
                <img src="/logo_new.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-violet-950 to-zinc-700 dark:from-white dark:via-purple-200 dark:to-zinc-400">SaaS House</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/app/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-900 bg-zinc-100 dark:text-zinc-50 dark:bg-zinc-900">
                <LayoutDashboard className="w-4 h-4" />
                <T en="Dashboard" bm="Laman Utama" />
              </Link>
              <Link href="/app/projects" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <Briefcase className="w-4 h-4" />
                <T en="Projects" bm="Projek" />
              </Link>
              <Link href="/app/billing" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <Receipt className="w-4 h-4" />
                <T en="Billing" bm="Pembayaran" />
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
      <main className="flex-1 container mx-auto px-4 py-8 pb-28 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 w-full border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          <Link href="/app/dashboard" className="flex flex-col items-center gap-1 group">
            <LayoutDashboard className="w-6 h-6 text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 uppercase tracking-widest"><T en="Dashboard" bm="Utama"/></span>
          </Link>
          <Link href="/app/projects" className="flex flex-col items-center gap-1 group">
            <Briefcase className="w-6 h-6 text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 uppercase tracking-widest"><T en="Projects" bm="Projek"/></span>
          </Link>
          <Link href="/app/billing" className="flex flex-col items-center gap-1 group">
            <Receipt className="w-6 h-6 text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 uppercase tracking-widest"><T en="Billing" bm="Bayaran"/></span>
          </Link>
          <Link href="/app/tickets" className="flex flex-col items-center gap-1 group">
            <FileText className="w-6 h-6 text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 uppercase tracking-widest"><T en="Tasks" bm="Tugasan"/></span>
          </Link>
        </div>
      </div>

      <ChatWidget />
    </div>
  );
}
