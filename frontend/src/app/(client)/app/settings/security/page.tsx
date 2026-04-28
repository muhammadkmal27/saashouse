"use client";

import { useState, useEffect } from "react";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";
import { getCookie } from "@/utils/cookies";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function SecuritySettingsPage() {
    const { lang } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasPassword, setHasPassword] = useState<boolean | null>(null);
    const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

    const [passwords, setPasswords] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    useEffect(() => {
        fetch("/api/me", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                // If password_hash is null, it's an OAuth user who hasn't set a password yet
                setHasPassword(!!data.user?.password_hash);
            })
            .catch(err => console.error("Failed to fetch profile info", err))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (passwords.new_password !== passwords.confirm_password) {
            setMessage({ text: lang === "EN" ? "New passwords do not match" : "Kata laluan baru tidak sepadan", type: "error" });
            return;
        }

        if (passwords.new_password.length < 8) {
            setMessage({ text: lang === "EN" ? "New password must be at least 8 characters long" : "Kata laluan baru mestilah sekurang-kurangnya 8 aksara", type: "error" });
            return;
        }

        setSaving(true);

        try {
            const csrfToken = getCookie("csrf_token") || "";
            const res = await fetch("/api/auth/password", {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken
                },
                credentials: "include",
                body: JSON.stringify({
                    current_password: passwords.current_password,
                    new_password: passwords.new_password,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ text: lang === "EN" ? "Password updated successfully!" : "Kata laluan berjaya dikemas kini!", type: "success" });
                setPasswords({ current_password: "", new_password: "", confirm_password: "" });
                setHasPassword(true); // Now they have a password
            } else {
                setMessage({ text: data.error || (lang === "EN" ? "Failed to update password" : "Gagal mengemas kini kata laluan"), type: "error" });
            }
        } catch (err) {
            setMessage({ text: lang === "EN" ? "Network error occurred" : "Ralat rangkaian berlaku", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2"><T en="Security & Passwords" bm="Keselamatan & Kata Laluan" /></h2>
                <p className="text-sm text-slate-500 font-medium"><T en="Ensure your account is using a long, random password to stay secure." bm="Pastikan akaun anda menggunakan kata laluan yang panjang dan rawak untuk kekal selamat." /></p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-violet-50 text-violet-600 border border-violet-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                {hasPassword && (
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-zinc-300 ml-1"><T en="Current Password" bm="Kata Laluan Semasa" /></label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="password" 
                                required
                                value={passwords.current_password}
                                onChange={(e) => setPasswords({...passwords, current_password: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 ring-violet-500/10 focus:border-violet-300 outline-none transition-all placeholder:text-slate-300 font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                )}

                {!hasPassword && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                        <p className="text-xs text-amber-700 font-bold leading-relaxed">
                            <T 
                                en="You are currently logged in via Google. Since you don't have a local password yet, you can set one now without entering a current password." 
                                bm="Anda sedang log masuk melalui Google. Memandangkan anda belum mempunyai kata laluan tempatan, anda boleh menetapkannya sekarang tanpa perlu memasukkan kata laluan semasa." 
                            />
                        </p>
                    </div>
                )}

                <div className="pt-2 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-zinc-300 ml-1"><T en="New Password" bm="Kata Laluan Baru" /></label>
                        <input 
                            type="password" 
                            required
                            value={passwords.new_password}
                            onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 ring-violet-500/10 focus:border-violet-300 outline-none transition-all placeholder:text-slate-300 font-medium"
                            placeholder={lang === "EN" ? "Enter new password" : "Masukkan kata laluan baru"}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-zinc-300 ml-1"><T en="Confirm New Password" bm="Sahkan Kata Laluan Baru" /></label>
                        <input 
                            type="password" 
                            required
                            value={passwords.confirm_password}
                            onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})}
                            className="w-full px-5 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 ring-violet-500/10 focus:border-violet-300 outline-none transition-all placeholder:text-slate-300 font-medium"
                            placeholder={lang === "EN" ? "Type new password again" : "Taip semula kata laluan baru"}
                        />
                    </div>
                </div>

                <div className="pt-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-violet-500 animate-pulse" /> <T en="Secure Connection" bm="Sambungan Selamat" />
                    </div>
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="px-8 py-4 bg-violet-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-violet-700 transition-all disabled:opacity-50 shadow-lg shadow-violet-200/50 min-w-[200px] flex items-center justify-center"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <T en="Update Password" bm="Kemaskini Kata Laluan" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
