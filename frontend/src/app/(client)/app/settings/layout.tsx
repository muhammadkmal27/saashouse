"use client";
import { T } from "@/components/Translate";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User, Settings, Shield, Bell, ArrowLeft, ArrowRight } from "lucide-react";

import { Suspense, useState, useEffect } from "react";

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    
    // On mobile, we always default to profile if no tab, but we hide the menu
    const [currentTab, setCurrentTab] = useState<string | null>(null);

    useEffect(() => {
        // Always default to profile if nothing is there, on both mobile and desktop
        // since we are removing the mobile "menu list" page.
        setCurrentTab(tabParam || "profile");
    }, [tabParam]);

    const navItems = [
        { path: "/app/settings?tab=profile", activeKey: "profile", icon: User, label: <T en="Edit Profile" bm="Edit Profil" /> },
        { path: "/app/settings?tab=account", activeKey: "account", icon: Settings, label: <T en="Account Info" bm="Maklumat Akaun" /> },
        { path: "/app/settings?tab=security", activeKey: "security", icon: Shield, label: <T en="Security & Passwords" bm="Keselamatan & Kata Laluan" /> },
        { path: "/app/settings?tab=notifications", activeKey: "notifications", icon: Bell, label: <T en="Email Notifications" bm="Notifikasi E-mel" /> },
    ];

    return (
        <div className="max-w-7xl mx-auto py-6 lg:py-10 px-4 lg:px-8 relative min-h-screen">
            {/* Background lighting for premium feel */}
            <div className="absolute top-0 right-10 w-[300px] lg:w-[400px] h-[300px] lg:h-[400px] bg-violet-400/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            {/* Mobile Header (Back to Dashboard) */}
            <div className="lg:hidden mb-8">
                <Link href="/app/dashboard" className="inline-flex items-center gap-1.5 text-violet-600 font-black uppercase tracking-widest text-[9px] bg-violet-50 px-3 py-1.5 rounded-full border border-violet-100 mb-6 active:scale-95 transition-all shadow-sm">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <T en="Back to Dashboard" bm="Ke Dashboard" />
                </Link>
                
                <div className="px-2">
                    <h1 className="text-[2.2rem] font-black tracking-tight text-slate-900 leading-none mb-2">
                        <T en={<>Set<span className="text-violet-600">tings</span></>} bm={<>Te<span className="text-violet-600">tapan</span></>} />
                    </h1>
                    <p className="text-[13px] text-slate-500 font-medium">
                        {currentTab === 'profile' && <T en="Edit your public profile identity" bm="Edit identiti profil awam anda" />}
                        {currentTab === 'account' && <T en="Account access & role information" bm="Maklumat akses & peranan akaun" />}
                        {currentTab === 'security' && <T en="Manage passwords & security" bm="Urus kata laluan & keselamatan" />}
                        {currentTab === 'notifications' && <T en="System communication preferences" bm="Tetapan komunikasi sistem" />}
                    </p>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block mb-14">
                <h1 className="text-[3rem] font-black tracking-tight text-slate-900 leading-none mb-3">
                    <T en={<>Set<span className="text-violet-600">tings</span></>} bm={<>Te<span className="text-violet-600">tapan</span></>} />
                </h1>
                <p className="text-[15px] text-slate-500 font-medium max-w-xl">
                    <T en="Manage your identity, account security protocols, and system communication preferences." bm="Urus identiti anda, protokol keselamatan akaun, dan tetapan komunikasi sistem." />
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
                {/* Side Navigation - Only shown on large screens */}
                <aside className="hidden lg:block w-full lg:w-72 shrink-0 bg-white/50 backdrop-blur-md rounded-[2.5rem] p-3 border border-slate-100 shadow-sm">
                    <nav className="flex flex-col space-y-2">
                        {navItems.map((item) => {
                            const isActive = currentTab === item.activeKey;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    scroll={false}
                                    className={`flex items-center justify-between px-6 py-4 rounded-[1.5rem] text-[13px] font-extrabold uppercase tracking-widest transition-all ${
                                        isActive 
                                            ? "bg-slate-900 text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] scale-[1.02]" 
                                            : "text-slate-500 hover:text-violet-600 hover:bg-violet-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-violet-400' : ''}`} />
                                        {item.label}
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Settings Content - Always shown on all screens now */}
                <div className="flex-1 min-h-[400px] lg:min-h-[600px] w-full">
                    <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-12 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                         {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={null}>
            <SettingsLayoutContent>
                {children}
            </SettingsLayoutContent>
        </Suspense>
    );
}
