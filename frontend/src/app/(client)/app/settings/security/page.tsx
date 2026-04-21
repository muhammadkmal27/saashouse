"use client";

import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";

export default function SecuritySettingsPage() {
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

    const [passwords, setPasswords] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (passwords.new_password !== passwords.confirm_password) {
            setMessage({ text: "New passwords do not match", type: "error" });
            return;
        }

        if (passwords.new_password.length < 8) {
            setMessage({ text: "New password must be at least 8 characters long", type: "error" });
            return;
        }

        setSaving(true);

        try {
            const res = await fetch("/api/auth/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    current_password: passwords.current_password,
                    new_password: passwords.new_password,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ text: "Password updated successfully!", type: "success" });
                setPasswords({ current_password: "", new_password: "", confirm_password: "" });
            } else {
                setMessage({ text: data.error || "Failed to update password", type: "error" });
            }
        } catch (err) {
            setMessage({ text: "Network error occurred", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Security & Passwords</h2>
                <p className="text-sm text-slate-500 font-medium">Ensure your account is using a long, random password to stay secure.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-violet-50 text-violet-600 border border-violet-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">Current Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="password" 
                            required
                            value={passwords.current_password}
                            onChange={(e) => setPasswords({...passwords, current_password: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-300"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="pt-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">New Password</label>
                        <input 
                            type="password" 
                            required
                            value={passwords.new_password}
                            onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-300"
                            placeholder="Enter new password"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">Confirm New Password</label>
                        <input 
                            type="password" 
                            required
                            value={passwords.confirm_password}
                            onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-300"
                            placeholder="Type new password again"
                        />
                    </div>
                </div>

                <div className="pt-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-violet-500 animate-pulse" /> Secure Connection
                    </div>
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="px-8 py-3 bg-violet-600 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-violet-700 transition-all disabled:opacity-50 shadow-lg shadow-violet-200/50"
                    >
                        {saving ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </form>
        </div>
    );
}
