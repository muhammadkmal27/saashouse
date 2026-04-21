"use client";

import { useState, useEffect } from "react";
import { Mail, BadgeCheck, AlertTriangle, Loader2 } from "lucide-react";

export default function AccountSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [showLocked, setShowLocked] = useState(false);

    useEffect(() => {
        fetch("/api/me", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setEmail(data.user.email || "");
                    setRole(data.user.role || "Client");
                }
            })
            .catch(err => console.error("Failed to fetch account", err))
            .finally(() => setLoading(false));
    }, []);

    const handleLockedFeature = () => {
        setShowLocked(true);
        setTimeout(() => setShowLocked(false), 3000);
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500 relative">
            {/* Locked feature toast */}
            {showLocked && (
                <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right fade-in px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
                    <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black uppercase tracking-tighter leading-none italic">Feature Locked</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Please contact support to update your email</p>
                    </div>
                </div>
            )}

            {/* Account Information Section */}
            <div className="space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Account Information</h2>
                        <p className="text-sm text-slate-500 font-medium">Manage the core details of your SaaS House account.</p>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 animate-spin text-violet-600" />}
                </div>

                <div className={`space-y-6 transition-all duration-500 ${loading ? 'opacity-40 pointer-events-none blur-[1px]' : 'opacity-100'}`}>
                    <div className="bg-slate-50/50 dark:bg-black p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-violet-100/80 text-violet-600 rounded-2xl flex items-center justify-center shadow-inner shadow-white">
                                <Mail className="w-7 h-7" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Email Address</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{email || (loading ? "loading..." : "None")}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleLockedFeature}
                            className="px-6 py-3 bg-white border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-violet-300 transition-all shadow-sm active:scale-95"
                        >
                            Change Email
                        </button>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-black p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-violet-100/80 text-violet-600 rounded-2xl flex items-center justify-center shadow-inner shadow-white">
                                <BadgeCheck className="w-7 h-7" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Account Role</p>
                                <p className="text-xl font-black uppercase text-slate-900 dark:text-white leading-none">{role || (loading ? "..." : "USER")}</p>
                            </div>
                        </div>
                        <span className="px-5 py-2 bg-violet-100/50 text-violet-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-200/50 shadow-sm">
                            Verified Status
                        </span>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className={`pt-10 border-t border-slate-100 dark:border-red-900/30 transition-all duration-700 ${loading ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                <h2 className="text-xl font-black text-red-600 mb-2 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" /> Danger Zone
                </h2>
                <p className="text-sm text-slate-500 font-medium mb-8">Irreversible actions regarding your account and data.</p>
                
                <div className="border border-red-100 bg-red-50/20 dark:border-red-900/50 rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white mb-1 uppercase tracking-tight">Delete Account Permanently</h3>
                        <p className="text-xs text-slate-500 font-medium">Removing your account will purge all associated project data and active subscriptions.</p>
                    </div>
                    <button className="px-8 py-4 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all w-full md:w-auto shadow-sm active:scale-95">
                        Confirm Deletion
                    </button>
                </div>
            </div>
        </div>
    );
}
