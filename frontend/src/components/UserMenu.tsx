"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, Shield, Bell, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { T } from "@/components/Translate";

export default function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
            router.push("/auth/login");
        } catch (err) {
            console.error("Logout failed", err);
            router.push("/auth/login");
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-800 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-white font-bold text-xs">
                    M {/* Can fetch initials later */}
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in origin-top-right">
                    <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/50">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">Mohamad User</p>
                        <p className="text-xs text-zinc-500">mohamad@example.com</p>
                    </div>
                    
                    <div className="p-2 space-y-1">
                        <Link 
                            href="/app/settings/profile" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:text-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-colors"
                        >
                            <User className="w-4 h-4" /> <T en="Edit Profile" bm="Sunting Profil" />
                        </Link>
                        <Link 
                            href="/app/settings/account" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:text-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-colors"
                        >
                            <Settings className="w-4 h-4" /> <T en="Account Settings" bm="Tetapan Akaun" />
                        </Link>
                        <Link 
                            href="/app/settings/security" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:text-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-colors"
                        >
                            <Shield className="w-4 h-4" /> <T en="Security" bm="Keselamatan" />
                        </Link>
                        <Link 
                            href="/app/settings/notifications" 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:text-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-colors"
                        >
                            <Bell className="w-4 h-4" /> <T en="Notifications" bm="Notifikasi" />
                        </Link>
                    </div>

                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-800/50">
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> <T en="Sign Out" bm="Log Keluar" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
