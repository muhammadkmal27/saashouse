"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { 
    ArrowLeft, 
    Send, 
    Paperclip, 
    X, 
    Loader2,
    Bug,
    Zap,
    LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getCookie } from "@/utils/cookies";
import { translateError } from "@/utils/error-translator";

function NewTicketForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { lang } = useLanguage();
    const type = searchParams.get("type") || "BUG";
    
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        project_id: "",
        title: "",
        description: "",
        type_: type,
        attachment_urls: [] as string[]
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch(`/api/projects`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
                if (data.length > 0) setFormData(prev => ({ ...prev, project_id: data[0].id }));
            }
        } catch (err) {
            console.error("Failed to load projects", err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append("file", file);

        try {
            setLoading(true);
            const csrfToken = getCookie("csrf_token") || "";
            const res = await fetch(`/api/assets/upload`, {
                method: "POST",
                headers: { "X-CSRF-Token": csrfToken },
                body: uploadData,
                credentials: "include"
            });
            const result = await res.json();
            if (res.ok && result.files && result.files.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    attachment_urls: [...prev.attachment_urls, result.files[0]]
                }));
                toast.success(lang === "EN" ? "File uploaded successfully." : "Fail berjaya dimuat naik.");
            } else {
                toast.error(translateError(result.error || "Failed to upload file.", lang));
            }
        } catch (err) {
            toast.error(translateError("Upload failed.", lang));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.project_id || !formData.title || !formData.description) {
            toast.warning(lang === "EN" ? "Please fill in all required fields." : "Sila lengkapkan semua medan yang diperlukan.");
            return;
        }

        setSubmitting(true);
        try {
            const csrfToken = getCookie("csrf_token") || "";
            const res = await fetch(`/api/requests`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken
                },
                body: JSON.stringify(formData),
                credentials: "include"
            });

            if (res.ok) {
                toast.success(lang === "EN" ? "Ticket created successfully!" : "Tiket berjaya dicipta!");
                router.push("/app/tickets");
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(translateError(errorData.error || "Failed to create ticket.", lang));
            }
        } catch (err) {
            toast.error(translateError("Network error. Please try again later.", lang));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#FDFDFF]">
            
            {/* ─── MOBILE VIEW (lg:hidden) ─── */}
            <div className="lg:hidden -mx-5 -mt-8">
                {/* Mobile Header Banner */}
                <div className={`px-5 pt-14 pb-16 relative overflow-hidden ${type === 'BUG' ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-violet-600 to-indigo-800'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10 blur-2xl opacity-60" />
                    <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-black/5 rounded-full blur-xl" />
                    
                    <div className="relative z-10">
                        <Link 
                            href="/app/tickets"
                            className="flex items-center gap-2 text-white/70 font-black uppercase tracking-widest text-[10px] mb-6 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> <T en="Back" bm="Kembali" />
                        </Link>
                        
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                                {type === 'BUG' ? <Bug className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white fill-white/20" />}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
                                    {type === 'BUG' ? <T en="Report Issue (Bug)" bm="Lapor Isu (Ralat Sistem)" /> : <T en="Request Feature" bm="Mohon Fungsi Sistem" />}
                                </h1>
                                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                    <T en="Please provide details to help us take action." bm="Sila berikan butiran untuk membantu kami mengambil tindakan." />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Form Container */}
                <div className="px-5 -mt-8 relative z-20 pb-20">
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-50 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Project Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                    <LayoutGrid className="w-3.5 h-3.5 text-violet-500" /> <T en="Select Project" bm="Pilih Projek" />
                                </label>
                                <select 
                                    value={formData.project_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                                    className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-300 transition-all appearance-none"
                                >
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"><T en="Subject Title" bm="Tajuk Subjek" /></label>
                                <input 
                                    type="text"
                                    placeholder={lang === "EN" ? "Summary of the issue..." : "Ringkasan isu..."}
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-300 transition-all placeholder:text-slate-300"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"><T en="Description" bm="Huraian" /></label>
                                <textarea 
                                    rows={5}
                                    placeholder={lang === "EN" ? "What happened?" : "Apa yang berlaku?"}
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 text-xs outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-300 transition-all placeholder:text-slate-300 resize-none"
                                />
                            </div>

                            {/* Attachments */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"><T en="Media Attachments" bm="Lampiran Media" /></label>
                                <div className="flex flex-wrap gap-2.5">
                                    {formData.attachment_urls.map((url, i) => (
                                        <div key={i} className="group relative w-16 h-16">
                                            <div className="w-full h-full bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                                                <img src={url} className="w-full h-full object-cover" alt="attachment" />
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, attachment_urls: prev.attachment_urls.filter((_, idx) => idx !== i) }))}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-lg z-20 border-2 border-white flex items-center justify-center"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="w-16 h-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-violet-600 hover:border-violet-300 transition-all cursor-pointer">
                                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={loading} />
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-violet-500" /> : <Paperclip className="w-4 h-4" />}
                                    </label>
                                </div>
                            </div>

                            {/* Submit */}
                            <button 
                                type="submit"
                                disabled={submitting}
                                className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg disabled:opacity-50 border ${type === 'BUG' ? 'bg-orange-500 text-white shadow-orange-200 border-orange-400' : 'bg-violet-600 text-white shadow-violet-200 border-violet-500'}`}
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> <T en="Submit Ticket" bm="Hantar Tiket" /></>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* ─── DESKTOP VIEW (hidden lg:block) ─── */}
            <div className="hidden lg:block max-w-3xl mx-auto py-10">
                <Link 
                    href="/app/tickets"
                    className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 font-black uppercase tracking-widest text-[10px] mb-8 group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> <T en="Back to Support" bm="Kembali ke Sokongan" />
                </Link>

                <div className="bg-white/80 bg-gradient-to-br from-white to-violet-50/20 rounded-[3rem] p-10 lg:p-12 border border-violet-100/50 shadow-xl shadow-violet-100/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-400/10 rounded-full blur-[80px] pointer-events-none transition-all group-hover:bg-violet-400/20"></div>

                    <div className="flex items-center gap-5 mb-12 relative z-10">
                        <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-lg ${type === 'BUG' ? 'bg-orange-500 text-white shadow-orange-500/30' : 'bg-violet-600 text-white shadow-violet-600/30'}`}>
                            {type === 'BUG' ? <Bug className="w-8 h-8" /> : <Zap className="w-8 h-8 fill-white/20" />}
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
                                {type === 'BUG' ? <T en="Report Issue (Bug)" bm="Lapor Isu (Ralat Sistem)" /> : <T en="Request Feature" bm="Mohon Fungsi Sistem" />}
                            </h1>
                            <p className="text-slate-500 font-medium"><T en="Please provide details to help us take action." bm="Sila berikan butiran untuk membantu kami mengambil tindakan." /></p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        {/* Project Selection */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
                                <LayoutGrid className="w-3.5 h-3.5" /> <T en="Project" bm="Projek" />
                            </label>
                            <select 
                                value={formData.project_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                                className="w-full px-8 py-5 bg-white border border-slate-200/70 rounded-[1.25rem] font-bold text-slate-900 outline-none focus:ring-4 ring-violet-500/10 focus:border-violet-300 transition-all appearance-none cursor-pointer shadow-sm"
                            >
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Title */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4"><T en="Subject Title" bm="Tajuk Subjek" /></label>
                            <input 
                                type="text"
                                placeholder={lang === "EN" ? "E.g., Payment button doesn't respond..." : "Cth: Butang pembayaran tidak bertindak balas..."}
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-8 py-5 bg-white border border-slate-200/70 rounded-[1.25rem] font-bold text-slate-900 outline-none focus:ring-4 ring-violet-500/10 focus:border-violet-300 transition-all placeholder:text-slate-300 shadow-sm"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4"><T en="Detailed Description (Markdown OK)" bm="Huraian Terperinci (Markah OK)" /></label>
                            <textarea 
                                rows={6}
                                placeholder={lang === "EN" ? "Explain exactly what happened or what you'd like to see..." : "Terangkan dengan tepat apa yang berlaku atau apa yang anda ingin lihat..."}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-8 py-5 bg-white border border-slate-200/70 rounded-[1.25rem] font-bold text-slate-900 outline-none focus:ring-4 ring-violet-500/10 focus:border-violet-300 transition-all placeholder:text-slate-300 resize-none shadow-sm"
                            />
                        </div>

                        {/* Attachments */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4"><T en="Attachments (Images/Docs)" bm="Lampiran (Imej/Dokumen)" /></label>
                            <div className="flex flex-wrap gap-3">
                                {formData.attachment_urls.map((url, i) => (
                                    <div key={i} className="group relative w-20 h-20">
                                        <div className="w-full h-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                            <img src={url} className="w-full h-full object-cover" alt="attachment" />
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, attachment_urls: prev.attachment_urls.filter((_, idx) => idx !== i) }))}
                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg z-20 hover:scale-110 active:scale-95 transition-all border-2 border-white flex items-center justify-center"
                                            title="Remove attachment"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                <label className="w-20 h-20 bg-white shadow-sm rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-violet-600 hover:border-violet-300 transition-all cursor-pointer">
                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={loading} />
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-violet-500" /> : <Paperclip className="w-5 h-5" />}
                                </label>
                            </div>
                        </div>

                        {/* Submit */}
                        <button 
                            type="submit"
                            disabled={submitting}
                            className="w-full py-6 mt-4 bg-violet-600 text-white rounded-[2rem] font-extrabold uppercase tracking-widest hover:bg-violet-700 hover:-translate-y-1 transition-all shadow-[0_8px_30px_rgba(124,58,237,0.35)] flex items-center justify-center gap-3 disabled:opacity-50 border border-violet-500"
                        >
                            {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-6 h-6" /> <T en="Submit Ticket" bm="Hantar Tiket" /></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function NewTicketPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center font-bold text-zinc-500 animate-pulse italic">Initializing Strategic Communication...</div>}>
            <NewTicketForm />
        </Suspense>
    );
}
