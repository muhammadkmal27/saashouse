"use client";
import { T } from "@/components/Translate";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { User, Settings, Shield, Bell } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab") || "profile";

    const navItems = [
        { path: "/app/settings?tab=profile", activeKey: "profile", icon: User, label: <T en="Edit Profile" bm="Edit Profil" /> },
        { path: "/app/settings?tab=account", activeKey: "account", icon: Settings, label: <T en="Account Info" bm="Maklumat Akaun" /> },
        { path: "/app/settings?tab=security", activeKey: "security", icon: Shield, label: <T en="Security & Passwords" bm="Keselamatan & Kata Laluan" /> },
        { path: "/app/settings?tab=notifications", activeKey: "notifications", icon: Bell, label: <T en="Email Notifications" bm="Notifikasi E-mel" /> },
    ];

    return (
        <div className="max-w-7xl mx-auto py-10 px-6 lg:px-8 relative">
            {/* Background lighting for premium feel */}
            <div className="absolute top-0 right-10 w-[400px] h-[400px] bg-violet-400/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            <div className="mb-14">
                <h1 className="text-[3rem] font-black tracking-tight text-slate-900 leading-none mb-3">
                    <T en={<>Set<span className="text-violet-600">tings</span></>} bm={<>Te<span className="text-violet-600">tapan</span></>} />
                </h1>
                <p className="text-[15px] text-slate-500 font-medium max-w-xl">
                    <T en="Manage your identity, account security protocols, and system communication preferences." bm="Urus identiti anda, protokol keselamatan akaun, dan tetapan komunikasi sistem." />
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 items-start">
                {/* Side Navigation */}
                <aside className="w-full lg:w-72 shrink-0 bg-white/50 backdrop-blur-md rounded-[2.5rem] p-3 border border-slate-100 shadow-sm">
                    <nav className="flex flex-col space-y-1">
                        {navItems.map((item) => {
                            const isActive = currentTab === item.activeKey;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    scroll={false}
                                    className={`flex items-center gap-3.5 px-6 py-4 rounded-[1.5rem] text-[13px] font-extrabold uppercase tracking-widest transition-all ${
                                        isActive 
                                            ? "bg-slate-900 text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] scale-[1.02]" 
                                            : "text-slate-500 hover:text-violet-600 hover:bg-violet-50"
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-violet-400' : ''}`} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Settings Content */}
                <div className="flex-1 min-h-[600px] w-full">
                    <div className="bg-white rounded-[2.5rem] p-10 lg:p-12 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                         {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
