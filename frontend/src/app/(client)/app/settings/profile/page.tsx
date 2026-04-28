"use client";

import { useState, useEffect } from "react";
import { User, Loader2 } from "lucide-react";
import { getCookie } from "@/utils/cookies";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function ProfileSettingsPage() {
    const { lang } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

    const [formData, setFormData] = useState({
        full_name: "",
        company_name: "",
        phone_number: "",
        bio: "",
    });

    useEffect(() => {
        // Force a slight delay to ensure smooth transition if needed, or fetch immediately
        fetch("/api/me", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (data.profile) {
                    setFormData({
                        full_name: data.profile.full_name || "",
                        company_name: data.profile.company_name || "",
                        phone_number: data.profile.phone_number || "",
                        bio: data.profile.bio || "",
                    });
                }
            })
            .catch(err => console.error("Failed to fetch profile", err))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const csrfToken = getCookie("csrf_token") || "";
            const res = await fetch("/api/me", {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken
                },
                credentials: "include",
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ text: lang === "EN" ? "Profile updated successfully!" : "Profil berjaya dikemas kini!", type: "success" });
            } else {
                setMessage({ text: data.error || (lang === "EN" ? "Failed to update profile" : "Gagal mengemas kini profil"), type: "error" });
            }
        } catch (err) {
            setMessage({ text: lang === "EN" ? "Network error occurred" : "Ralat rangkaian berlaku", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2"><T en="Public Profile" bm="Profil Awam" /></h2>
                    <p className="text-sm text-slate-500 font-medium"><T en="This information will be displayed on your main dashboard and invoices." bm="Maklumat ini akan dipaparkan pada papan pemuka utama dan invois anda." /></p>
                </div>
                {loading && <Loader2 className="w-5 h-5 animate-spin text-violet-600" />}
            </div>

            <div className={`space-y-8 transition-all duration-500 ${loading ? 'opacity-40 pointer-events-none blur-[2px]' : 'opacity-100'}`}>
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-violet-50 text-violet-600 border border-violet-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1"><T en="Full Name" bm="Nama Penuh" /></label>
                        <div className="relative group">
                            <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${loading ? 'text-slate-200' : 'text-slate-400 group-focus-within:text-violet-500'}`} />
                            <input 
                                type="text" 
                                name="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                className="w-full pl-12 pr-5 py-4 bg-slate-50/50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 ring-violet-500/10 focus:border-violet-300 outline-none transition-all placeholder:text-slate-300 font-medium"
                                placeholder={lang === "EN" ? "e.g. John Doe" : "cth. Ahmad Albab"}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1"><T en="Company Name" bm="Nama Syarikat" /></label>
                            <input 
                                type="text" 
                                name="company_name"
                                value={formData.company_name}
                                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50/50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 ring-violet-500/10 focus:border-violet-300 outline-none transition-all placeholder:text-slate-300 font-medium"
                                placeholder={lang === "EN" ? "Company Ltd" : "Syarikat Sdn Bhd"}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1"><T en="Phone Number" bm="Nombor Telefon" /></label>
                            <input 
                                type="text" 
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                                className="w-full px-6 py-4 bg-slate-50/50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 ring-violet-500/10 focus:border-violet-300 outline-none transition-all placeholder:text-slate-300 font-medium"
                                placeholder="+60 12-345 6789"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1"><T en="Short Bio" bm="Bio Ringkas" /></label>
                        <textarea 
                            name="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            rows={4}
                            className="w-full px-6 py-4 bg-slate-50/50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 ring-violet-500/10 focus:border-violet-300 outline-none transition-all placeholder:text-slate-300 resize-none font-medium h-32"
                            placeholder={lang === "EN" ? "Tell us a little bit about yourself..." : "Beritahu kami serba sedikit tentang diri anda..."}
                        />
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={saving || loading}
                            className="h-[56px] px-10 bg-violet-600 text-white font-bold uppercase tracking-[0.1em] text-xs rounded-2xl hover:bg-violet-700 transition-all disabled:opacity-50 shadow-xl shadow-violet-200/50 flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <T en="Save Profile Details" bm="Simpan Butiran Profil" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
