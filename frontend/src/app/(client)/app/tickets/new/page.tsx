"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function NewTicketPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
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
            const res = await fetch(`/api/assets/upload`, {
                method: "POST",
                body: uploadData,
                credentials: "include"
            });
            const result = await res.json();
            if (res.ok && result.files && result.files.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    attachment_urls: [...prev.attachment_urls, result.files[0]]
                }));
                toast.success("File uploaded successfully.");
            } else {
                toast.error(result.error || "Failed to upload file.");
            }
        } catch (err) {
            toast.error("Upload failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.project_id || !formData.title || !formData.description) {
            toast.warning("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
                credentials: "include"
            });

            if (res.ok) {
                toast.success("Ticket created successfully!");
                router.push("/app/tickets");
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.error || "Failed to create ticket.");
            }
        } catch (err) {
            toast.error("Network error. Please try again later.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <Link 
                href="/app/tickets"
                className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 font-black uppercase tracking-widest text-[10px] mb-8 group"
            >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>

            <div className="bg-white/80 bg-gradient-to-br from-white to-violet-50/20 rounded-[3rem] p-10 lg:p-12 border border-violet-100/50 shadow-xl shadow-violet-100/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-400/10 rounded-full blur-[80px] pointer-events-none transition-all group-hover:bg-violet-400/20"></div>

                <div className="flex items-center gap-5 mb-12 relative z-10">
                    <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-lg ${type === 'BUG' ? 'bg-orange-500 text-white shadow-orange-500/30' : 'bg-violet-600 text-white shadow-violet-600/30'}`}>
                        {type === 'BUG' ? <Bug className="w-8 h-8" /> : <Zap className="w-8 h-8 fill-white/20" />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
                            {type === 'BUG' ? "Report Issue (Bug)" : "Request Feature"}
                        </h1>
                        <p className="text-slate-500 font-medium">Please provide details to help us take action.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    {/* Project Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
                            <LayoutGrid className="w-3.5 h-3.5" /> Project
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
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4">Subject Title</label>
                        <input 
                            type="text"
                            placeholder="E.g., Payment button doesn't respond..."
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-8 py-5 bg-white border border-slate-200/70 rounded-[1.25rem] font-bold text-slate-900 outline-none focus:ring-4 ring-violet-500/10 focus:border-violet-300 transition-all placeholder:text-slate-300 shadow-sm"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4">Detailed Description (Markdown OK)</label>
                        <textarea 
                            rows={6}
                            placeholder="Explain exactly what happened or what you'd like to see..."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-8 py-5 bg-white border border-slate-200/70 rounded-[1.25rem] font-bold text-slate-900 outline-none focus:ring-4 ring-violet-500/10 focus:border-violet-300 transition-all placeholder:text-slate-300 resize-none shadow-sm"
                        />
                    </div>

                    {/* Attachments */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ml-4">Attachments (Images/Docs)</label>
                        <div className="flex flex-wrap gap-3">
                            {formData.attachment_urls.map((url, i) => (
                                <div key={i} className="group relative w-20 h-20 bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                                    <img src={url} className="w-full h-full object-cover" alt="attachment" />
                                    <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, attachment_urls: prev.attachment_urls.filter((_, idx) => idx !== i) }))}
                                        className="absolute inset-0 bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                    >
                                        <X className="w-5 h-5" />
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
                        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-6 h-6" /> Submit Ticket</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
