"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, FolderKanban, Users, Zap, Download,
  AlertCircle, CheckCircle2, XCircle, Loader2, Plus, ArrowUpRight,
  Info, ArrowRight, Clock
} from "lucide-react";
import Link from "next/link";

/* ─── Types ─── */
type Stats = {
  total_mrr: number;
  total_revenue: number;
  total_clients: number;
  active_projects: number;
};

type LedgerRow = {
  id: string;
  full_name: string;
  email: string;
  project_id?: string;
  project_title?: string;
  plan_name?: string;
  project_status?: string;
  subscription_id?: string;
  subscription_status?: string;
  next_billing?: string;
  amount?: number;
  payment_source?: string;
  description?: string;
  created_at?: string;
  row_id?: number;
};

/* ─── Helpers ─── */
const PLAN_COLORS: Record<string, string> = {
  STANDARD:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  GROWTH:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  ENTERPRISE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PLATINUM:   "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const STATUS_COLORS: Record<string, string> = {
  PAID:              "bg-emerald-50 text-emerald-700 border-emerald-200",
  LIVE:              "bg-emerald-50 text-emerald-700 border-emerald-200",
  UNDER_DEVELOPMENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REVIEW:            "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAYMENT_PENDING:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  DRAFT:             "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELED_BY_ADMIN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IN_REVIEW:         "bg-emerald-50 text-emerald-700 border-emerald-200",
  ONBOARDING:        "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PRICE_MAP: Record<string, number> = {
  STANDARD: 165,
  GROWTH: 240,
  ENTERPRISE: 410,
  PLATINUM: 750,
};

function getInitial(name: string): string {
  return (name?.charAt(0) || "?").toUpperCase();
}

function getInitialColor(name: string): string {
  const colors = [
    "bg-emerald-500", "bg-blue-500", "bg-violet-500",
    "bg-rose-500", "bg-amber-500", "bg-teal-500",
  ];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { month: "short", day: "2-digit" });
  } catch {
    return "—";
  }
}

/* ─── Constants ─── */

/* ─── Page Component ─── */
export default function AdminBillingPage() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [ledger, setLedger]     = useState<LedgerRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [canceling, setCanceling] = useState<string | null>(null);

  /* filters */
  const [subFilter, setSubFilter]   = useState<"all" | "active" | "none">("all");
  const [daysFilter, setDaysFilter] = useState<"7d" | "30d" | "90d" | "All">("All");

  const isLiveMode = process.env.NEXT_PUBLIC_STRIPE_PK?.startsWith("pk_live") ?? false;

  const fetchData = async () => {
    setLoading(true);
    console.log("DEBUG: fetchData triggered. daysFilter =", daysFilter);
    try {
      const daysParam = daysFilter === "All" ? "" : `?days=${daysFilter.replace("d", "")}`;
      const url = `/api/admin/stats${daysParam}`;
      console.log("DEBUG: Fetching stats from:", url);

      const [statsRes, ledgerRes] = await Promise.all([
        fetch(url, { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/clients", { credentials: "include", cache: "no-store" }),
      ]);
      
      const statsData = statsRes.ok ? await statsRes.json() : null;
      const ledgerData = ledgerRes.ok ? await ledgerRes.json() : [];
      
      console.log("DEBUG: Received stats:", statsData);
      console.log("DEBUG: Received ledger size:", ledgerData.length);

      if (statsData) setStats(statsData);
      if (ledgerData) setLedger(ledgerData);
    } catch (err) {
      console.error("DEBUG error: Failed to load billing data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (filteredLedger.length === 0) return;
    
    // Headers
    const headers = ["Client", "Email", "Project", "Description", "Source", "Amount (RM)", "Date"];
    
    // Convert rows to CSV strings
    const rows = filteredLedger.map(r => [
      r.full_name || "N/A",
      r.email || "N/A",
      r.project_title || "No Project",
      r.description || "N/A",
      r.payment_source || "Stripe",
      r.amount ? r.amount.toFixed(2) : "0.00",
      r.created_at ? new Date(r.created_at).toLocaleDateString() : "N/A"
    ].map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `billing_export_${daysFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => { fetchData(); }, [daysFilter]);

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm("Cancel this subscription? This cannot be undone.")) return;
    setCanceling(subscriptionId);
    try {
      const res = await fetch(`/api/admin/subscription/${subscriptionId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        await fetchData();
      } else {
        alert("Failed to cancel subscription.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setCanceling(null);
    }
  };

  /* ─── Filtered Data ─── */
  const filteredLedger = useMemo(() => {
    let list = ledger;

    // Time filter (local)
    if (daysFilter !== "All") {
      const days = parseInt(daysFilter.replace("d", ""));
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      console.log("DEBUG: Filtering ledger by date. Cutoff =", cutoff.toISOString());
      list = list.filter(r => {
        if (!r.created_at) return false;
        const subDate = new Date(r.created_at);
        return subDate >= cutoff;
      });
      console.log("DEBUG: Ledger filtered from", ledger.length, "to", list.length);
    }

    if (subFilter === "active") return list.filter(r => r.subscription_status === "active");
    if (subFilter === "none")   return list.filter(r => !r.subscription_status || r.subscription_status !== "active");
    return list;
  }, [ledger, subFilter, daysFilter]);

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ─── Header ─── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>

          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Revenue overview</h1>
          <p className="text-sm text-zinc-400 font-medium mt-1">
            Snapshot of subscriptions, MRR and upcoming invoices.
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Time filters (visual only) */}
          <div className="flex items-center bg-zinc-100 rounded-full p-1">
            {(["7d", "30d", "90d", "All"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDaysFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  daysFilter === t
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Export */}
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total MRR */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
              +0% <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Collected</p>
          <p className="text-2xl font-black text-zinc-900 tracking-tight">
            RM {stats?.total_revenue?.toLocaleString("en-MY") ?? "0"}
          </p>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Active Projects</p>
          <p className="text-2xl font-black text-zinc-900 tracking-tight">
            {stats?.active_projects ?? 0} Projects
          </p>
        </div>

        {/* Total Clients */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Clients</p>
          <p className="text-2xl font-black text-zinc-900 tracking-tight">
            {stats?.total_clients ?? 0} Klien
          </p>
        </div>
      </div>

      {/* ─── Verified Payment Ledger (Stripe Only) ─── */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 border-b border-zinc-100 gap-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-zinc-900">Verified Payments</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-emerald-600 font-black uppercase tracking-widest">{filteredLedger.length} Verified Transactions</p>
            </div>
          </div>

          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">
             Live Revenue Feed
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/30">
                {["Client / Email", "Project / Description", "Source", "Verified Amount", "Payment Date", "Actions"].map(h => (
                  <th key={h} className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                       <Info className="w-8 h-8 text-zinc-200" />
                       <p className="text-sm font-bold text-zinc-400">No verified payments found in this duration.</p>
                       <p className="text-[10px] text-zinc-300 uppercase tracking-widest font-black">Check Stripe Dashboard for Pending Invoices</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLedger.map((row) => {
                const planUpper = (row.plan_name || "").toUpperCase();
                const amount = row.amount || 0;

                return (
                  <tr key={row.row_id || row.id} className="hover:bg-zinc-50/60 transition-colors group">
                    {/* Client */}
                    <td className="py-4 px-4 max-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-black shrink-0 bg-zinc-900 shadow-lg shadow-zinc-900/10">
                          {getInitial(row.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-zinc-900 text-sm truncate">{row.full_name}</p>
                          <p className="text-[10px] text-zinc-400 font-bold truncate tracking-tight" title={row.email}>{row.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Project & Description */}
                    <td className="py-4 px-4">
                       <p className="font-bold text-zinc-700 text-sm">{row.project_title || "Direct Product Sub"}</p>
                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">{row.description || (row.plan_name ? `${row.plan_name} Plan` : "")}</p>
                    </td>
 
                    {/* Source */}
                    <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                          row.payment_source?.toLowerCase() === 'toyyibpay' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {row.payment_source || "Stripe"}
                        </span>
                    </td>
 
                    {/* Amount */}
                    <td className="py-4 px-4 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-zinc-900">RM {amount.toFixed(2)}</span>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">Verified</span>
                       </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap">
                       <div className="flex items-center gap-2 text-zinc-500">
                          <Clock className="w-3.5 h-3.5 text-zinc-300" />
                          <span className="text-xs font-bold">{row.created_at ? new Date(row.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}</span>
                       </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-4">
                        {row.subscription_id && (
                          <a
                            href={`https://dashboard.stripe.com/${isLiveMode ? "" : "test/"}subscriptions/${row.subscription_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-zinc-100 hover:bg-zinc-200 p-2 rounded-lg transition-colors group/link"
                            title="View on Stripe"
                          >
                             <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover/link:text-zinc-900" />
                          </a>
                        )}
                        {row.subscription_id && row.subscription_status === "active" && (
                          <button
                            onClick={() => handleCancel(row.subscription_id!)}
                            disabled={canceling === row.subscription_id}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-600 transition-colors disabled:opacity-30"
                          >
                            {canceling === row.subscription_id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Cancel"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ─── Premium Footer ─── */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/40 flex justify-between items-center">
           <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
              {filteredLedger.length} Verified Transactions Listed
           </p>
           <p className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">
              SaaS House Billing Engine
           </p>
        </div>
      </div>
    </div>
  );
}
