"use client";

import { useState, useEffect } from "react";
import { 
    Bug, 
    Zap, 
    MessageSquare, 
    Clock, 
    CheckCircle2, 
    Search,
    Loader2,
    Inbox,
    Hash,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Ticket = {
    id: string;
    project_id: string;
    created_by: string;
    type_: "BUG" | "FIX" | "FEATURE";
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    title: string;
    description: string;
    attachment_urls: string[];
    created_at: string;
};

const timeAgo = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(ms / 3600000);
    if (hours < 1) return `Just now`;
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

export default function TicketsPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<string>("ALL");

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

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                             t.description.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "ALL" || t.type_ === filter;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-violet-600" /></div>;

    const openBugs = tickets.filter(t => t.type_ === 'BUG' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
    const featureReqs = tickets.filter(t => t.type_ === 'FEATURE').length;
    const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 px-4 lg:px-8 pt-8 pb-20 bg-[#F8F9FA] min-h-screen">
            
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white shadow-sm px-8 py-10 lg:p-14 lg:pb-12 border border-slate-100/50">
                {/* Background attractive lighting (Mesh Gradient Bloom) */}
                <div className="absolute inset-0 bg-white z-0"></div>
                <div className="absolute -left-32 -bottom-32 w-[35rem] h-[35rem] bg-violet-500/15 rounded-full blur-[120px] z-0 pointer-events-none"></div>
                <div className="absolute -right-20 -top-32 w-[45rem] h-[45rem] bg-violet-500/15 rounded-full blur-[120px] z-0 pointer-events-none"></div>
                <div className="absolute right-1/4 top-1/4 w-[25rem] h-[25rem] bg-pink-400/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>
                <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl z-0 pointer-events-none border border-white/60"></div>
                
                <div className="relative z-10">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 shadow-sm border border-slate-200/60 mb-7 backdrop-blur-md">
                        <Hash className="w-3.5 h-3.5 text-slate-400" /> Support Center
                    </span>

                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-14">
                        <div>
                            <h1 className="text-[3.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-3">
                                Project Support & <span className="text-violet-600">Tasks</span>
                            </h1>
                            <p className="text-[14px] text-slate-500 max-w-lg leading-relaxed font-medium">
                                Have an issue or a new idea? We're here to help realize your digital vision.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 shrink-0 mt-3">
                            <Link 
                                href="/app/tickets/new?type=BUG" 
                                className="flex items-center justify-center gap-2.5 h-[50px] px-7 rounded-full bg-white text-orange-600 font-bold text-[13px] hover:bg-orange-50 transition-all border border-slate-200 shadow-sm hover:-translate-y-0.5"
                            >
                                <Bug className="w-[18px] h-[18px] text-orange-500" />
                                Report Bug
                            </Link>
                            <Link 
                                href="/app/tickets/new?type=FEATURE" 
                                className="flex items-center justify-center gap-2.5 h-[50px] px-8 rounded-full bg-violet-600 text-white font-semibold text-[14px] shadow-[0_8px_30px_rgba(124,58,237,0.35)] hover:bg-violet-700 transition-all hover:-translate-y-0.5 border border-violet-500"
                            >
                                <Zap className="w-[18px] h-[18px]" strokeWidth={2.5} />
                                Request Feature
                            </Link>
                        </div>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="bg-white/95 backdrop-blur-md rounded-[1.25rem] border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-stretch overflow-hidden">
                        
                        <div className="flex-1 px-8 py-7 border-b md:border-b-0 md:border-r border-slate-100/80 flex items-center gap-5 relative group overflow-hidden">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-slate-100/50 rounded-full blur-2xl group-hover:bg-violet-100 transition-colors pointer-events-none"></div>
                            <div className="w-[42px] h-[42px] bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center relative z-10">
                                <MessageSquare className="w-4 h-4 text-slate-800" strokeWidth={2.5} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[2rem] font-black text-slate-900 leading-none mb-1">{tickets.length}</div>
                                <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Total Tickets</div>
                            </div>
                        </div>

                        <div className="flex-1 px-8 py-7 border-b md:border-b-0 md:border-r border-slate-100/80 flex items-center gap-5 relative group overflow-hidden">
                            <div className="absolute right-2 top-2 rounded-full w-20 h-20 bg-orange-100/30 blur-2xl group-hover:bg-orange-200/40 transition-colors pointer-events-none"></div>
                            <div className="w-[42px] h-[42px] bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center relative z-10">
                                <Bug className="w-4 h-4 text-slate-800" strokeWidth={2.5} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[2rem] font-black text-slate-900 leading-none mb-1">{openBugs}</div>
                                <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Open Bugs</div>
                            </div>
                        </div>

                        <div className="flex-1 px-8 py-7 border-b md:border-b-0 md:border-r border-slate-100/80 flex items-center gap-5 relative group overflow-hidden">
                            <div className="absolute right-2 top-2 rounded-full w-20 h-20 bg-violet-100/30 blur-2xl group-hover:bg-violet-200/40 transition-colors pointer-events-none"></div>
                            <div className="w-[42px] h-[42px] bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center relative z-10">
                                <Zap className="w-4 h-4 text-slate-800" strokeWidth={2.5} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[2rem] font-black text-slate-900 leading-none mb-1">{featureReqs}</div>
                                <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Feature Requests</div>
                            </div>
                        </div>

                        <div className="flex-1 px-8 py-7 flex items-center gap-5 relative group overflow-hidden">
                            <div className="absolute right-2 top-2 rounded-full w-20 h-20 bg-emerald-100/30 blur-2xl group-hover:bg-emerald-200/40 transition-colors pointer-events-none"></div>
                            <div className="w-[42px] h-[42px] bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center relative z-10">
                                <CheckCircle2 className="w-4 h-4 text-slate-800" strokeWidth={2.5} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[2rem] font-black text-slate-900 leading-none mb-1">{resolvedCount}</div>
                                <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Resolved</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 mb-6 pb-2">
                {/* Search */}
                <div className="relative w-full md:flex-1 md:max-w-3xl">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search tickets..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-[46px] pl-[3.25rem] pr-5 rounded-full bg-white border border-slate-200/70 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center bg-white border border-slate-200/70 rounded-full p-1 shadow-sm shrink-0">
                    {['ALL', 'BUG', 'FEATURE'].map((f) => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2 rounded-full text-[11px] font-bold transition-all ${
                                filter === f 
                                    ? 'bg-slate-900 text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {f === 'ALL' ? 'All' : f === 'BUG' ? 'Bug' : 'Feature'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tickets Grid */}
            {filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Inbox className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-800 font-bold text-lg">Ticket Inbox Empty</p>
                        <p className="text-slate-500 font-medium text-sm">Have an issue or a new idea? Click a button above to start!</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredTickets.map((ticket) => {
                        const isBug = ticket.type_ === 'BUG';

                        return (
                            <div 
                                key={ticket.id} 
                                onClick={() => router.push(`/app/tickets/${ticket.id}`)} 
                                className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1 transition-all group flex flex-col h-full cursor-pointer relative overflow-hidden"
                            >
                                {/* Watermark */}
                                <div className="absolute -right-8 top-12 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity pointer-events-none">
                                    {isBug ? <Bug className="w-48 h-48 text-orange-600" /> : <Zap className="w-48 h-48 text-violet-600" />}
                                </div>

                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        {isBug ? (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50/80 text-orange-600 text-[9px] font-black uppercase tracking-widest border border-orange-100/50 rounded-full">
                                                <Bug className="w-3 h-3" /> BUG
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 text-[9px] font-black uppercase tracking-widest border border-violet-100/50 rounded-full">
                                                <Hash className="w-3 h-3 text-violet-500" /> FEATURE
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                ticket.status === 'RESOLVED' ? 'bg-emerald-500' :
                                                ticket.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                                'bg-amber-500'
                                            }`}></div>
                                            {ticket.status.replace('_', '-')}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="mb-4">
                                        <h3 className="text-lg font-extrabold text-slate-900 mb-2 truncate group-hover:text-violet-700 transition-colors">{ticket.title}</h3>
                                        <p className="text-[13px] font-medium text-slate-500 line-clamp-2 leading-relaxed">{ticket.description}</p>
                                    </div>

                                    <div className="flex-1"></div>

                                    {/* Footer */}
                                    <div className="mt-8 pt-5 border-t border-slate-100/80 flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-slate-400">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold">
                                                <Clock className="w-3.5 h-3.5" />
                                                {timeAgo(ticket.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                0 {/* Future placeholder for comments */}
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-extrabold text-slate-800 uppercase tracking-[0.1em] flex items-center group-hover:text-violet-600 transition-colors">
                                            OPEN DISCUSSION <ArrowRight className="w-3 h-3 ml-1" strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
