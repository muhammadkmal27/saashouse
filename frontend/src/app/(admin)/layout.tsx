"use client";

import Link from "next/link";
import ChatWidget from "@/components/chat/ChatWidget";
import { 
    LayoutDashboard, 
    FolderKanban, 
    Users, 
    CreditCard, 
    Settings, 
    LogOut,
    Menu,
    X,
    Sparkles,
    ClipboardList
} from "lucide-react";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Projects", href: "/admin/projects", icon: FolderKanban },
        { name: "Clients", href: "/admin/clients", icon: Users },
        { name: "Billing", href: "/admin/billing", icon: CreditCard },
        { name: "Tickets", href: "/admin/tickets", icon: ClipboardList },
        { name: "Settings", href: "/admin/settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                    <span className="font-bold text-lg">Admin OS</span>
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
                    {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 
                transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center gap-3 mb-10 px-2 mt-4 md:mt-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg leading-tight uppercase tracking-widest text-emerald-600 dark:text-emerald-400">SaaS House</span>
                            <span className="text-xs font-medium text-zinc-400">ADMIN CONSOLE</span>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1">
                        {navItems.map((item) => (
                            <Link 
                                key={item.name} 
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        <button 
                            onClick={async () => {
                                try {
                                    await fetch("/api/auth/logout", {
                                        method: "POST",
                                        credentials: "include",
                                    });
                                    window.location.href = "/auth/login";
                                } catch (err) {
                                    console.error("Logout failed", err);
                                    window.location.href = "/auth/login";
                                }
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium border-none cursor-pointer"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>

                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
                    {children}
                </div>
                <ChatWidget />
            </main>
        </div>
    );
}
