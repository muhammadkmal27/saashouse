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
            }
        } catch (err) {
            alert("Failed to update status.");
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-zinc-400" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-900 text-white rounded-2xl">
                    <ClipboardList className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900">Task & Ticket Management</h1>
                    <p className="text-sm text-zinc-400 font-medium mt-1">Manage tasks and report errors from all your clients.</p>
                </div>
            </div>

            {/* Tools Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2rem] border border-zinc-100 shadow-xl shadow-zinc-200/40">
                <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                    <input 
                        type="text"
                        placeholder="Search tickets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl text-sm font-bold outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map(s => (
                        <button 
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-400 border border-zinc-100'}`}
                        >
                            {s.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Admin Table-like List */}
            <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-2xl shadow-zinc-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-zinc-50">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Type & Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Title</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {filteredTickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-zinc-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${ticket.type_ === 'BUG' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {ticket.type_ === 'BUG' ? <Bug className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 
                                                ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' : 
                                                'bg-zinc-100 text-zinc-400'
                                            }`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-black text-zinc-900 line-clamp-1">{ticket.title}</p>
                                        {ticket.creator_email && (
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">{ticket.creator_email}</p>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-sm font-medium text-zinc-400">
                                        {new Date(ticket.created_at).toISOString().split('T')[0]}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <select 
                                                onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                                                className="bg-zinc-50 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none"
                                                value={ticket.status}
                                            >
                                                <option value="OPEN">Mark Open</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="RESOLVED">Resolved</option>
                                                <option value="CLOSED">Closed</option>
                                            </select>
                                            <Link 
                                                href={`/admin/tickets/${ticket.id}`}
                                                className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
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
            </div>
        </div>
    );
}
