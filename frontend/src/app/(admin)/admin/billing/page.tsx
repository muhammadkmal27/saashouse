"use client";

import { useState, useEffect, useMemo } from "react";

import {
  TrendingUp, FolderKanban, Users, Zap, Download,
  AlertCircle, CheckCircle2, XCircle, Loader2, Plus, ArrowUpRight,
  Info, ArrowRight, Clock
} from "lucide-react";
import Link from "next/link";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { translateError } from "@/utils/error-translator";
import { toast } from "sonner";

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

/* ─── Constants ─── */

/* ─── Page Component ─── */
export default function AdminBillingPage() {
  const { lang } = useLanguage();
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
    try {
      const daysParam = daysFilter === "All" ? "" : `?days=${daysFilter.replace("d", "")}`;
      const url = `/api/admin/stats${daysParam}`;

      const [statsRes, ledgerRes] = await Promise.all([
        fetch(url, { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/clients", { credentials: "include", cache: "no-store" }),
      ]);
      
      const statsData = statsRes.ok ? await statsRes.json() : null;
      const ledgerData = ledgerRes.ok ? await ledgerRes.json() : [];

      if (statsData) setStats(statsData);
      if (ledgerData) setLedger(ledgerData);
    } catch (err) {
      console.error("Failed to load billing data", err);
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
    const msg = lang === "EN" ? "Cancel this subscription? This cannot be undone." : "Batalkan langganan ini? Tindakan ini tidak boleh diundur.";
    if (!confirm(msg)) return;
    setCanceling(subscriptionId);
    try {
      const res = await fetch(`/api/admin/subscription/${subscriptionId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        toast.success(lang === "EN" ? "Subscription cancelled." : "Langganan dibatalkan.");
        await fetchData();
      } else {
        const data = await res.json();
        toast.error(translateError(data.error || "Failed to cancel subscription.", lang));
      }
    } catch {
      toast.error(translateError("Network error.", lang));
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
    <div className="space-y-8 animate-fade-in pb-12 md:pb-0">

      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900"><T en="Revenue overview" bm="Gambaran keseluruhan hasil" /></h1>
          <p className="text-sm text-zinc-400 font-medium mt-1">
            <T en="Snapshot of subscriptions, MRR and upcoming invoices." bm="Ringkasan langganan, MRR dan invois akan datang." />
          </p>
        </div>

        {/* Right side controls (Redesigned for Mobile) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Time filters */}
          <div className="flex items-center bg-zinc-100 rounded-2xl p-1.5 sm:p-1">
            {(["7d", "30d", "90d", "All"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDaysFilter(t)}
                className={`flex-1 sm:flex-none px-4 py-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-full text-xs font-bold transition-all ${
                  daysFilter === t
                    ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {t === "All" ? <T en="All" bm="Semua" /> : t}
              </button>
            ))}
          </div>

          {/* Export */}
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-zinc-900 text-white rounded-2xl text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> <T en="Export Data" bm="Eksport Data" />
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Total Collected */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 shadow-sm group hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">
              <T en="LIVE" bm="LANGSUNG" /> <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1"><T en="Total Verified Revenue" bm="Jumlah Hasil Disahkan" /></p>
          <p className="text-2xl font-black text-zinc-900 tracking-tight">
            RM {stats?.total_revenue?.toLocaleString(lang === "EN" ? "en-US" : "ms-MY") ?? "0"}
          </p>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 shadow-sm group hover:border-emerald-200 transition-colors">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderKanban className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1"><T en="Active Client Repositories" bm="Repositori Klien Aktif" /></p>
          <p className="text-2xl font-black text-zinc-900 tracking-tight">
            {stats?.active_projects ?? 0} <span className="text-sm font-bold text-zinc-400 ml-1"><T en="Nodes" bm="Nod" /></span>
          </p>
        </div>

        {/* Total Clients */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 p-6 shadow-sm group hover:border-emerald-200 transition-colors sm:col-span-2 lg:col-span-1">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1"><T en="Global Intelligence Base" bm="Pangkalan Risikan Global" /></p>
          <p className="text-2xl font-black text-zinc-900 tracking-tight">
            {stats?.total_clients ?? 0} <span className="text-sm font-bold text-zinc-400 ml-1"><T en="Partners" bm="Rakan Kongsi" /></span>
          </p>
        </div>
      </div>

      {/* ─── Verified Payment Ledger ─── */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-8 py-6 border-b border-zinc-100 gap-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-zinc-900"><T en="Verified Payments" bm="Pembayaran Disahkan" /></h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{filteredLedger.length} <T en="Records Synchronized" bm="Rekod Diselaraskan" /></p>
            </div>
          </div>

          <div className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-100">
             <T en="Live Ledger Feed" bm="Suapan Lejar Langsung" />
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[300px]">
          {filteredLedger.length === 0 ? (
            <div className="text-center py-24 px-8">
              <div className="flex flex-col items-center gap-4">
                 <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                    <Info className="w-8 h-8 text-zinc-200" />
                 </div>
                 <div>
                    <p className="text-sm font-bold text-zinc-400"><T en="No verified payments found." bm="Tiada pembayaran disahkan ditemui." /></p>
                    <p className="text-[10px] text-zinc-300 uppercase tracking-widest font-black mt-1"><T en="Refine your time filter or check Stripe dashboard" bm="Laraskan penapis masa anda atau semak papan pemuka Stripe" /></p>
                 </div>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Card View (md:hidden) */}
              <div className="md:hidden divide-y divide-zinc-50">
                {filteredLedger.map((row) => {
                  const amount = row.amount || 0;
                  return (
                    <div key={row.row_id || row.id} className="p-6 space-y-5">
                      {/* Client & Amount */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-lg shadow-zinc-900/10">
                            {getInitial(row.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-zinc-900 text-sm truncate tracking-tight">{row.full_name}</p>
                            <p className="text-[10px] text-zinc-400 font-bold truncate tracking-tight">{row.email}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-zinc-900">RM {amount.toFixed(2)}</p>
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest"><T en="Verified" bm="Disahkan" /></span>
                        </div>
                      </div>

                      {/* Project & Details */}
                      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-3">
                        <div className="flex items-start gap-3">
                          <FolderKanban className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-zinc-800">{row.project_title || (lang === "EN" ? "Direct Subscription" : "Langganan Terus")}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">{row.description || (row.plan_name ? `${row.plan_name} Plan` : (lang === "EN" ? "Core Service" : "Perkhidmatan Teras"))}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50">
                          <div className="flex items-center gap-2 text-zinc-500">
                            <Clock className="w-3.5 h-3.5 text-zinc-300" />
                            <span className="text-[10px] font-bold">{row.created_at ? new Date(row.created_at).toLocaleDateString(lang === "EN" ? 'en-US' : 'ms-MY', { day: 'numeric', month: 'short' }) : "-"}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                            row.payment_source?.toLowerCase() === 'toyyibpay' 
                            ? 'bg-amber-50 text-amber-600 border-amber-100' 
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            {row.payment_source || "Stripe"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-1">
                        {row.subscription_id && (
                          <a
                            href={`https://dashboard.stripe.com/${isLiveMode ? "" : "test/"}subscriptions/${row.subscription_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-600 active:bg-zinc-50 transition-colors"
                          >
                             Stripe <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {row.subscription_id && row.subscription_status === "active" && (
                          <button
                            onClick={() => handleCancel(row.subscription_id!)}
                            disabled={canceling === row.subscription_id}
                            className="flex-1 py-3 border border-red-100 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30 active:bg-red-100 transition-colors"
                          >
                            {canceling === row.subscription_id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : <T en="Cancel Sub" bm="Batal Sub" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (Hidden on Mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/30">
                      <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400"><T en="Client / Email" bm="Klien / E-mel" /></th>
                      <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400"><T en="Project / Description" bm="Projek / Penerangan" /></th>
                      <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400"><T en="Source" bm="Sumber" /></th>
                      <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400"><T en="Verified Amount" bm="Jumlah Disahkan" /></th>
                      <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400"><T en="Payment Date" bm="Tarikh Pembayaran" /></th>
                      <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400"><T en="Actions" bm="Tindakan" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredLedger.map((row) => {
                      const amount = row.amount || 0;
                      return (
                        <tr key={row.row_id || row.id} className="hover:bg-zinc-50/60 transition-colors group">
                          {/* Client */}
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-lg shadow-zinc-900/10">
                                {getInitial(row.full_name)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-zinc-900 text-sm truncate tracking-tight">{row.full_name}</p>
                                <p className="text-[10px] text-zinc-400 font-bold truncate tracking-tight">{row.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Project & Description */}
                          <td className="py-5 px-8">
                             <p className="font-bold text-zinc-800 text-sm">{row.project_title || (lang === "EN" ? "Direct Product Sub" : "Langganan Produk Terus")}</p>
                             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{row.description || (row.plan_name ? `${row.plan_name} Plan` : "")}</p>
                          </td>
       
                          {/* Source */}
                          <td className="py-5 px-8">
                              <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                row.payment_source?.toLowerCase() === 'toyyibpay' 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}>
                                {row.payment_source || "Stripe"}
                              </span>
                          </td>
       
                          {/* Amount */}
                          <td className="py-5 px-8 whitespace-nowrap">
                             <div className="flex flex-col">
                                <span className="text-sm font-black text-zinc-900">RM {amount.toFixed(2)}</span>
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest"><T en="Verified" bm="Disahkan" /></span>
                             </div>
                          </td>

                          {/* Date */}
                          <td className="py-5 px-8 whitespace-nowrap">
                             <div className="flex items-center gap-3 text-zinc-500">
                                <Clock className="w-4 h-4 text-zinc-300" />
                                <span className="text-xs font-bold">{row.created_at ? new Date(row.created_at).toLocaleDateString(lang === "EN" ? 'en-US' : 'ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}</span>
                             </div>
                          </td>

                          {/* Actions */}
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-5">
                              {row.subscription_id && (
                                <a
                                  href={`https://dashboard.stripe.com/${isLiveMode ? "" : "test/"}subscriptions/${row.subscription_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-10 h-10 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-all group/link"
                                  title={lang === "EN" ? "View on Stripe" : "Lihat di Stripe"}
                                >
                                   <ArrowRight className="w-4 h-4 text-zinc-400 group-hover/link:text-zinc-900" />
                                </a>
                              )}
                              {row.subscription_id && row.subscription_status === "active" && (
                                <button
                                  onClick={() => handleCancel(row.subscription_id!)}
                                  disabled={canceling === row.subscription_id}
                                  className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/40 hover:text-red-600 transition-colors disabled:opacity-30"
                                >
                                  {canceling === row.subscription_id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <T en="Cancel" bm="Batal" />}
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
            </>
          )}
        </div>

        {/* Premium Footer */}
        <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50/40 flex justify-between items-center">
           <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">
              {filteredLedger.length} <T en="Verified Nodes Listed" bm="Nod Disahkan Disenaraikan" />
           </p>
           <p className="text-[10px] text-zinc-300 font-black uppercase tracking-[0.2em]">
              SaaS House Architecture
           </p>
        </div>
      </div>
    </div>
  );
}
