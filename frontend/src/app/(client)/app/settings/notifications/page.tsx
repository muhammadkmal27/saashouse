"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, BellRing } from "lucide-react";
import { getCookie } from "@/utils/cookies";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function NotificationsSettingsPage() {
    const { lang } = useLanguage();
    const [toggles, setToggles] = useState({
        project_updates: true,
        billing_alerts: true,
        security_alerts: true,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

    useEffect(() => {
        fetch("/api/me/preferences", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                setToggles({
                    project_updates: data.project_updates,
                    billing_alerts: data.billing_alerts,
                    security_alerts: data.security_alerts,
                });
            })
            .catch(err => console.error("Failed to fetch preferences", err))
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = (key: keyof typeof toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const csrfToken = getCookie("csrf_token") || "";
            const res = await fetch("/api/me/preferences", {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken
                },
                credentials: "include",
                body: JSON.stringify(toggles),
            });

            if (res.ok) {
                setMessage({ text: lang === "EN" ? "Notification preferences saved!" : "Tetapan notifikasi disimpan!", type: "success" });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ text: lang === "EN" ? "Failed to save preferences" : "Gagal menyimpan tetapan", type: "error" });
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
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2"><T en="Notification Preferences" bm="Tetapan Notifikasi" /></h2>
                    <p className="text-sm text-slate-500 font-medium"><T en="Choose what updates you want to receive and where you receive them." bm="Pilih kemas kini yang ingin anda terima dan di mana anda menerimanya." /></p>
                </div>
                {loading && <Loader2 className="w-5 h-5 animate-spin text-violet-600" />}
            </div>

            <div className={`space-y-8 transition-all duration-500 ${loading ? 'opacity-40 pointer-events-none blur-[1px]' : 'opacity-100'}`}>
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-bold transition-all ${
                        message.type === 'success' ? 'bg-violet-50 text-violet-600 border border-violet-200' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-6">
                    
                    {/* Email Section */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm bg-white dark:bg-black">
                        <div className="bg-slate-50/50 dark:bg-slate-900/50 p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-extrabold text-slate-900 flex items-center gap-3 uppercase tracking-widest text-xs">
                                <div className="w-10 h-10 rounded-xl bg-violet-100/80 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-violet-600" />
                                </div>
                                <T en="Email Communications" bm="Komunikasi E-mel" />
                            </h3>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full border border-violet-200/50"><T en="Primary Channel" bm="Saluran Utama" /></span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            
                            {[
                                { key: 'project_updates', label: <T en="Project Updates" bm="Kemas Kini Projek" />, desc: <T en="Get notified when your project status changes or milestones are hit." bm="Dapatkan notifikasi apabila status projek berubah atau pencapaian dicapai." /> },
                                { key: 'billing_alerts', label: <T en="Billing Alerts" bm="Amaran Pengebilan" />, desc: <T en="Invoices, payment failures, and major renewal reminders." bm="Invois, kegagalan pembayaran, dan peringatan pembaharuan utama." /> },
                                { key: 'security_alerts', label: <T en="Security Alerts" bm="Amaran Keselamatan" />, desc: <T en="Get notified of password changes and account-wide security events." bm="Dapatkan notifikasi tentang pertukaran kata laluan dan acara keselamatan akaun." /> }
                            ].map((item) => (
                                <div key={item.key} className="p-8 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                                    <div className="max-w-md">
                                        <p className="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-violet-600 transition-colors uppercase tracking-tight">{item.label}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">{item.desc}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleToggle(item.key as keyof typeof toggles)}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all active:scale-90 ${toggles[item.key as keyof typeof toggles] ? 'bg-violet-600 shadow-lg shadow-violet-600/20' : 'bg-slate-200 dark:bg-zinc-700'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all ${toggles[item.key as keyof typeof toggles] ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            ))}

                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="h-[56px] px-12 bg-violet-600 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-[1.5rem] hover:bg-violet-700 transition-all disabled:opacity-50 shadow-xl shadow-violet-200/50 flex items-center gap-3"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <T en="Store Preferences" bm="Simpan Tetapan" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
