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
}

export default function AdminClients() {
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
                const errorText = await res.text();
                console.error(`API Error (${res.status}):`, errorText);
                try {
                    const errorJson = JSON.parse(errorText);
                    toast.error(`Server error: ${errorJson.error || res.statusText}`);
                } catch (e) {
                    toast.error(`Server error (${res.status}): ${errorText.substring(0, 50)}`);
                }
            }
        } catch (error) {
            console.error("Failed to fetch clients:", error);
            toast.error("Network error. Please check your connection.");
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
                    <h1 className="text-3xl font-extra-bold tracking-tight">Client Ledger</h1>
                    <p className="text-zinc-500 mt-1 uppercase tracking-widest text-xs font-bold">Account Oversight & Subscription Control</p>
                </div>
            </header>


            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                            type="text" 
                            placeholder="Find client or project..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                            suppressHydrationWarning
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-3">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Loading Ledger...</p>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-zinc-500 font-bold">No clients found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                                <tr>
                                    <th className="px-8 py-5">Client & Email</th>
                                    <th className="px-8 py-5">Active Project & Plan</th>
                                    <th className="px-8 py-5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {filteredClients.map((client) => (
                                    <tr key={client.project_id || client.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">{client.full_name}</span>
                                                <span className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5"><Mail className="w-3 h-3" /> {client.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <ServerIcon className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-sm font-bold">{client.project_title || "No Active Project"}</span>
                                                </div>
                                                {client.plan_name && (
                                                    <span className="text-[10px] text-zinc-500 ml-6 uppercase font-black tracking-tighter">Plan: {normalizePlanName(client.plan_name)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            {client.project_status ? (
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                    client.project_status === 'LIVE' 
                                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                                    : 'bg-zinc-500/10 text-zinc-500'
                                                }`}>
                                                    <CheckCircle2 className="w-3 h-3" /> {client.project_status}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-zinc-400 font-medium">No Status</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

