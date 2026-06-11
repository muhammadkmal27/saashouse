"use client";

import { useState, useEffect } from "react";
import { 
    Bug, 
    Zap, 
    MessageSquare, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Search,
    Loader2,
    ArrowRight,
    Filter,
    ClipboardList,
    Trash2
} from "lucide-react";
import Link from "next/link";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { translateError } from "@/utils/error-translator";
import { toast } from "sonner";
import { getCookie } from "@/utils/cookies";

type Ticket = {
    id: string;
    project_id: string;
    created_by: string;
    creator_email?: string;
    type_: "BUG" | "FIX" | "FEATURE";
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    title: string;
    description: string;
    attachment_urls: string[];
    created_at: string;
};

export default function AdminTicketsPage() {
    const { lang } = useLanguage();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [deleting, setDeleting] = useState(false);

    const handleRequestOtp = async () => {
        if (!deleteTarget) return;
        setOtpSending(true);
        try {
            const csrfToken = getCookie("csrf_token") || "";
            const res = await fetch(`/api/admin/requests/${deleteTarget.id}/delete/request-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken
                },
                credentials: "include"
            });
            if (res.ok) {
                setOtpSent(true);
                toast.success(lang === "EN" ? "OTP code sent to email" : "Kod OTP dihantar ke e-mel");
            } else {
                const err = await res.json();
                toast.error(err.error || (lang === "EN" ? "Failed to send OTP" : "Gagal menghantar OTP"));
            }
        } catch (e) {
            toast.error(lang === "EN" ? "Connection error" : "Ralat sambungan");
        } finally {
            setOtpSending(false);
        }
    };

    const handleDeleteTicket = async () => {
        if (!deleteTarget || !otpCode) return;
        setDeleting(true);
        try {
            const csrfToken = getCookie("csrf_token") || "";
            const res = await fetch(`/api/admin/requests/${deleteTarget.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken
                },
                credentials: "include",
                body: JSON.stringify({ code: otpCode })
            });
            if (res.ok) {
                toast.success(lang === "EN" ? "Ticket deleted successfully" : "Tiket berjaya dipadamkan");
                setTickets(prev => prev.filter(t => t.id !== deleteTarget.id));
                setDeleteTarget(null);
                setOtpSent(false);
                setOtpCode("");
            } else {
                const err = await res.json();
                toast.error(err.error || (lang === "EN" ? "Failed to delete ticket" : "Gagal memadam tiket"));
            }
        } catch (e) {
            toast.error(lang === "EN" ? "Connection error" : "Ralat sambungan");
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await fetch(`/api/requests`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (err) {
            console.error("Failed to load tickets", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/requests/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
                credentials: "include"
            });
            if (res.ok) {
                fetchTickets();
                toast.success(lang === "EN" ? "Status updated successfully." : "Status berjaya dikemas kini.");
            } else {
                const data = await res.json();
                toast.error(translateError(data.error || "Failed to update status.", lang));
            }
        } catch (err) {
            toast.error(translateError("Network error.", lang));
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-zinc-400" /></div>;

    const translateStatus = (s: string) => {
        switch(s) {
            case "ALL": return <T en="ALL" bm="SEMUA" />;
            case "OPEN": return <T en="OPEN" bm="BUKA" />;
            case "IN_PROGRESS": return <T en="IN PROGRESS" bm="DALAM PROSES" />;
            case "RESOLVED": return <T en="RESOLVED" bm="SELESAI" />;
            case "CLOSED": return <T en="CLOSED" bm="DITUTUP" />;
            default: return s;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-900 text-white rounded-2xl">
                    <ClipboardList className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900"><T en="Task & Ticket Management" bm="Pengurusan Tugasan & Tiket" /></h1>
                    <p className="text-sm text-zinc-400 font-medium mt-1"><T en="Manage tasks and report errors from all your clients." bm="Urus tugasan dan laporan ralat daripada semua klien anda." /></p>
                </div>
            </div>

            {/* Tools Bar (Redesigned for Mobile) */}
            <div className="flex flex-col gap-4 bg-white p-4 rounded-[2.5rem] md:rounded-[2rem] border border-zinc-100 shadow-xl shadow-zinc-200/40">
                <div className="relative w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                    <input 
                        type="text"
                        placeholder={lang === "EN" ? "Search tickets..." : "Cari tiket..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
                        suppressHydrationWarning
                    />
                </div>
                
                {/* Horizontal Scroll for Filters on Mobile */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar-hide -mx-2 px-2 md:mx-0 md:px-0">
                    {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(s => (
                        <button 
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                statusFilter === s 
                                ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20' 
                                : 'bg-white text-zinc-400 border border-zinc-100 hover:bg-zinc-50'
                            }`}
                        >
                            {translateStatus(s)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-zinc-100 shadow-2xl shadow-zinc-200/50 overflow-hidden">
                <div className="min-h-[400px]">
                    {filteredTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4">
                            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                                <Filter className="w-8 h-8 text-zinc-200" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-zinc-400 italic"><T en="No tickets match your intelligence query." bm="Tiada tiket yang sepadan dengan carian anda." /></p>
                                <p className="text-[10px] text-zinc-300 uppercase tracking-widest font-black mt-1"><T en="Adjust your filters or search term" bm="Laraskan penapis atau istilah carian anda" /></p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card List (md:hidden) */}
                            <div className="md:hidden divide-y divide-zinc-50">
                                {filteredTickets.map(ticket => (
                                    <div key={ticket.id} className="p-6 space-y-5">
                                        {/* Type & Status */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl ${ticket.type_ === 'BUG' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                                    {ticket.type_ === 'BUG' ? <Bug className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                                </div>
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{ticket.type_}</span>
                                            </div>
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-lg border uppercase tracking-wider ${
                                                ticket.status === 'RESOLVED' ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' : 
                                                ticket.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20' : 
                                                'bg-zinc-100 text-zinc-400 border-zinc-200'
                                            }`}>
                                                {translateStatus(ticket.status)}
                                            </span>
                                        </div>

                                        {/* Title & Creator */}
                                        <div className="space-y-1.5">
                                            <h3 className="font-black text-zinc-900 text-base leading-tight">{ticket.title}</h3>
                                            {ticket.creator_email && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{ticket.creator_email}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer & Actions */}
                                        <div className="flex flex-col gap-4 pt-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-zinc-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-bold">{new Date(ticket.created_at).toLocaleDateString(lang === "EN" ? 'en-US' : 'ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em]">Ticket #{ticket.id.substring(0, 8)}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setDeleteTarget(ticket)}
                                                    className="w-12 h-12 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-all active:scale-90"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                                <select 
                                                    onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                                                    className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
                                                    value={ticket.status}
                                                >
                                                    <option value="OPEN">{lang === "EN" ? "Mark Open" : "Buka"}</option>
                                                    <option value="IN_PROGRESS">{lang === "EN" ? "In Progress" : "Dalam Proses"}</option>
                                                    <option value="RESOLVED">{lang === "EN" ? "Resolved" : "Selesai"}</option>
                                                    <option value="CLOSED">{lang === "EN" ? "Closed" : "Ditutup"}</option>
                                                </select>
                                                <Link 
                                                    href={`/admin/tickets/${ticket.id}`}
                                                    className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 active:scale-90"
                                                >
                                                    <ArrowRight className="w-5 h-5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Table View (Hidden on Mobile) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-zinc-50">
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400"><T en="Type & Status" bm="Jenis & Status" /></th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400"><T en="Title & Intelligence Source" bm="Tajuk & Sumber Maklumat" /></th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400"><T en="Date Logged" bm="Tarikh Log" /></th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right pr-12"><T en="System Actions" bm="Tindakan Sistem" /></th>
                                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right pr-12"><T en="Delete" bm="Padam" /></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {filteredTickets.map(ticket => (
                                            <tr key={ticket.id} className="hover:bg-zinc-50/50 transition-colors group">
                                                <td className="px-8 py-7">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2.5 rounded-xl ${ticket.type_ === 'BUG' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                                            {ticket.type_ === 'BUG' ? <Bug className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                                        </div>
                                                        <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-wider ${
                                                            ticket.status === 'RESOLVED' ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' : 
                                                            ticket.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20' : 
                                                            'bg-zinc-100 text-zinc-400 border-zinc-200'
                                                        }`}>
                                                            {translateStatus(ticket.status)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-7">
                                                    <p className="font-black text-zinc-900 text-sm line-clamp-1">{ticket.title}</p>
                                                    {ticket.creator_email && (
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight mt-1">{ticket.creator_email}</p>
                                                    )}
                                                </td>
                                                <td className="px-8 py-7">
                                                    <div className="flex items-center gap-2 text-zinc-500">
                                                        <Clock className="w-3.5 h-3.5 text-zinc-300" />
                                                        <span className="text-xs font-bold">{new Date(ticket.created_at).toLocaleDateString(lang === "EN" ? 'en-US' : 'ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-7 text-right pr-12">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <select 
                                                            onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                                                            className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
                                                            value={ticket.status}
                                                        >
                                                            <option value="OPEN">{lang === "EN" ? "Mark Open" : "Buka"}</option>
                                                            <option value="IN_PROGRESS">{lang === "EN" ? "In Progress" : "Dalam Proses"}</option>
                                                            <option value="RESOLVED">{lang === "EN" ? "Resolved" : "Selesai"}</option>
                                                            <option value="CLOSED">{lang === "EN" ? "Closed" : "Ditutup"}</option>
                                                        </select>
                                                        <Link 
                                                            href={`/admin/tickets/${ticket.id}`}
                                                            className="w-10 h-10 flex items-center justify-center bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
                                                        >
                                                            <ArrowRight className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-7 text-right pr-12">
                                                    <button
                                                        onClick={() => setDeleteTarget(ticket)}
                                                        className="w-10 h-10 inline-flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-all active:scale-90"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
            {/* ─── Delete Confirmation Modal ─── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-white border border-zinc-100 rounded-2xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-lg font-bold text-zinc-950">
                                <T en="Confirm Ticket Deletion" bm="Sahkan Pemadaman Tiket" />
                            </h3>
                            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                                <T
                                    en={<>Are you sure you want to delete <span className="font-bold text-red-600">{deleteTarget.title}</span>? This will permanently delete the ticket and all associated comments. This action cannot be undone.</>}
                                    bm={<>Adakah anda pasti mahu memadam <span className="font-bold text-red-600">{deleteTarget.title}</span>? Ini akan memadamkan tiket secara kekal berserta semua komen berkaitan. Tindakan ini tidak boleh diundurkan.</>}
                                />
                            </p>
                        </div>

                        {/* OTP Section */}
                        <div className="space-y-4 pt-2 border-t border-zinc-100">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                <span className="text-xs font-bold text-zinc-700">
                                    <T en="Identity Verification" bm="Pengesahan Identiti" />
                                </span>
                                <button
                                    type="button"
                                    onClick={handleRequestOtp}
                                    disabled={otpSending}
                                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                                >
                                    {otpSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                    {otpSent ? (
                                        <T en="Resend OTP" bm="Hantar Semula OTP" />
                                    ) : (
                                        <T en="Send OTP Code" bm="Hantar Kod OTP" />
                                    )}
                                </button>
                            </div>

                            {otpSent && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                                        <T en="Enter 6-Digit OTP" bm="Masukkan OTP 6-Digit" />
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                        placeholder="123456"
                                        className="w-full text-center tracking-[0.5em] font-mono text-lg font-bold py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-red-400 outline-none transition-colors"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteTarget(null);
                                    setOtpSent(false);
                                    setOtpCode("");
                                }}
                                disabled={deleting}
                                className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-bold transition-all active:scale-95 text-center"
                            >
                                <T en="Cancel" bm="Batal" />
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteTicket}
                                disabled={deleting || !otpCode || otpCode.length !== 6}
                                className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-red-200"
                            >
                                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                <T en="Delete Permanently" bm="Padam Selamanya" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
</div>
    );
}
