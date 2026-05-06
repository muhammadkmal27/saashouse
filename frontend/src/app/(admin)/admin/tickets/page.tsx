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
    ClipboardList
} from "lucide-react";
import Link from "next/link";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { translateError } from "@/utils/error-translator";
import { toast } from "sonner";

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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
