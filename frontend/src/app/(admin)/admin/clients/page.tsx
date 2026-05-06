"use client";

import { useState, useEffect } from "react";
import { 
    Mail, 
    Search,
    CheckCircle2,
    ServerIcon,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { translateError } from "@/utils/error-translator";

interface ClientLedgerRow {
    id: string;
    full_name: string;
    email: string;
    project_id?: string;
    project_title?: string;
    plan_name?: string;
    project_status?: string;
    subscription_id?: string;
    subscription_status?: string;
    row_id?: number;
}

export default function AdminClients() {
    const { lang } = useLanguage();
    const [clients, setClients] = useState<ClientLedgerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchClients = async () => {
        try {
            const res = await fetch("/api/admin/clients", { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                console.log("DEBUG: Clients fetched successfully, count:", data.length);
                setClients(data);
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(translateError(errorData.error || "Server error", lang));
            }
        } catch (error) {
            toast.error(translateError("Network error.", lang));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);


    const normalizePlanName = (name?: string) => {
        if (!name) return "Standard";
        const n = name.toUpperCase();
        if (n.includes("GROWTH")) return "Growth";
        if (n.includes("ENTERPRISE")) return "Enterprise";
        if (n.includes("PLATINUM")) return "Platinum";
        return "Standard";
    };

    const filteredClients = clients.filter(c => 
        (c.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.project_title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extra-bold tracking-tight"><T en="Client Ledger" bm="Lejar Klien" /></h1>
                    <p className="text-zinc-500 mt-1 uppercase tracking-widest text-xs font-bold"><T en="Account Oversight & Subscription Control" bm="Pengawasan Akaun & Kawalan Langganan" /></p>
                </div>
            </header>


            <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                            type="text" 
                            placeholder={lang === "EN" ? "Find client or project..." : "Cari klien atau projek..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 lg:py-2 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                            suppressHydrationWarning
                        />
                    </div>
                    <div className="hidden md:block text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        <T en="Active Records" bm="Rekod Aktif" />: <span className="text-zinc-900">{filteredClients.length}</span>
                    </div>
                </div>

                <div className="min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-3 text-center">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest"><T en="Synchronizing Ledger..." bm="Menyelaraskan Lejar..." /></p>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <p className="text-zinc-500 font-bold italic"><T en="No intelligence records match your query." bm="Tiada rekod risikan yang sepadan dengan pertanyaan anda." /></p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card List (md:hidden) */}
                            <div className="md:hidden divide-y divide-zinc-50">
                                {filteredClients.map((client) => (
                                    <div key={client.row_id || client.id} className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-black text-zinc-900 tracking-tight">{client.full_name}</span>
                                                <span className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-bold"><Mail className="w-3 h-3" /> {client.email}</span>
                                            </div>
                                            {client.project_status ? (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                                                    client.project_status === 'LIVE' 
                                                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' 
                                                    : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                                                }`}>
                                                    <T en={client.project_status} bm={client.project_status === 'LIVE' ? 'AKTIF' : 'TIDAK AKTIF'} />
                                                </span>
                                            ) : (
                                                <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-100"><T en="Inactive" bm="Tidak Aktif" /></span>
                                            )}
                                        </div>

                                        <div className="bg-zinc-50 rounded-2xl p-4 space-y-2 border border-zinc-100">
                                            <div className="flex items-center gap-2">
                                                <ServerIcon className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-xs font-bold text-zinc-700 truncate">{client.project_title || (lang === 'EN' ? "No Active Repository" : "Tiada Repositori Aktif")}</span>
                                            </div>
                                            {client.plan_name && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3.5 h-3.5" /> {/* Spacer */}
                                                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase font-black tracking-tight">
                                                        <T en="Plan" bm="Pelan" />: {normalizePlanName(client.plan_name)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Table View (Hidden on Mobile) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-50">
                                        <tr>
                                            <th className="px-8 py-5"><T en="Client & Email" bm="Klien & E-mel" /></th>
                                            <th className="px-8 py-5"><T en="Active Project & Plan" bm="Projek Aktif & Pelan" /></th>
                                            <th className="px-8 py-5 text-right pr-12"><T en="Status" bm="Status" /></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {filteredClients.map((client) => (
                                            <tr key={client.row_id || client.id} className="group hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-8 py-7">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-zinc-900">{client.full_name}</span>
                                                        <span className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1 font-medium"><Mail className="w-3 h-3 opacity-50" /> {client.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-7">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <ServerIcon className="w-4 h-4 text-emerald-500/70" />
                                                            <span className="text-sm font-bold text-zinc-800">{client.project_title || (lang === 'EN' ? "No Active Project" : "Tiada Projek Aktif")}</span>
                                                        </div>
                                                        {client.plan_name && (
                                                            <span className="text-[10px] text-zinc-400 ml-6 uppercase font-black tracking-widest"><T en="Plan" bm="Pelan" />: {normalizePlanName(client.plan_name)}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-7 text-right pr-12">
                                                    {client.project_status ? (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                                                            client.project_status === 'LIVE' 
                                                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' 
                                                            : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                                                        }`}>
                                                            {client.project_status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />}
                                                            <T en={client.project_status} bm={client.project_status === 'LIVE' ? 'AKTIF' : 'TIDAK AKTIF'} />
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest opacity-50 italic"><T en="No Status" bm="Tiada Status" /></span>
                                                    )}
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

