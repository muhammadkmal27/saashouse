"use client";

import { useEffect, useState, useMemo } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { Search, Eye, Lock, Unlock, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getCookie } from "@/utils/cookies";

interface Project {
  id: string;
  title: string;
  description?: string;
  client_name: string;
  client_email: string;
  plan_name?: string;
  status: string;
  subscription_status?: string;
  client_edit_allowed: boolean;
  created_at: string;
}

const normalizePlanName = (name?: string): string => {
  if (!name) return "Standard";
  const n = name.toUpperCase();
  if (n.includes("PLATINUM")) return "Platinum";
  if (n.includes("ENTERPRISE")) return "Enterprise";
  if (n.includes("GROWTH")) return "Growth";
  if (n.includes("ONE_TIME") || n.includes("PURCHASE") || n.includes("OWNERSHIP")) return "One-Time Purchase";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const STATUS_LABEL: Record<string, string> = {
  UNDER_DEVELOPMENT: "In Dev",
  PAYMENT_PENDING:   "Pending",
  CANCELED_BY_ADMIN: "Canceled",
  IN_REVIEW:         "In Review",
  ONBOARDING:        "Onboarding",
  LIVE:              "Live",
  REVIEW:            "Review",
  DRAFT:             "Draft",
  PAID:              "Paid",
};

const getStatusLabel = (status: string): string => {
  const key = status.toUpperCase().replace(/\s+/g, "_");
  return STATUS_LABEL[key] ?? status.replace(/_/g, " ");
};

// Keep track of processed IDs across page navigations in this session
const processedProjectIds = new Set<string>();

export default function AdminProjects() {
  const { lang } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]               = useState<"all" | "active" | "inactive">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleRequestOtp = async () => {
    if (!deleteTarget) return;
    setOtpSending(true);
    try {
      const csrfToken = getCookie("csrf_token") || "";
      const res = await fetch(`/api/admin/projects/${deleteTarget.id}/delete/request-otp`, {
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

  const handleDeleteProject = async () => {
    if (!deleteTarget || !otpCode) return;
    setDeleting(true);
    try {
      const csrfToken = getCookie("csrf_token") || "";
      const res = await fetch(`/api/admin/projects/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify({ code: otpCode })
      });
      if (res.ok) {
        toast.success(lang === "EN" ? "Project deleted successfully" : "Projek berjaya dipadamkan");
        setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
        setDeleteTarget(null);
        setOtpSent(false);
        setOtpCode("");
      } else {
        const err = await res.json();
        toast.error(err.error || (lang === "EN" ? "Failed to delete project" : "Gagal memadam projek"));
      }
    } catch (e) {
      toast.error(lang === "EN" ? "Connection error" : "Ralat sambungan");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/projects", { credentials: "include" })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => { if (Array.isArray(data)) setProjects(data); setLoading(false); })
      .catch(err => { console.error("Failed to fetch projects:", err); setLoading(false); });
  }, []);

  const { lastEvent } = useSocket();

  // Handle NewProject event from Global Socket
  useEffect(() => {
    if (lastEvent?.type === "NewProject") {
      const newProject = lastEvent.data.project;
      
      // Update projects list immediately
      setProjects(prev => {
        if (prev.some(p => p.id === newProject.id)) return prev;
        return [newProject, ...prev];
      });

      // Avoid duplicate toasts for the same project in this session (persisted across mounts)
      if (processedProjectIds.has(newProject.id)) return;
      processedProjectIds.add(newProject.id);

      // Only show toast if the project is actually "new" (created in last 15s)
      const createdAt = new Date(newProject.created_at).getTime();
      const now = Date.now();
      const isFresh = (now - createdAt) < 15000; // 15 seconds threshold

      if (isFresh) {
        toast.success(lang === "EN" ? "New Project Deployed" : "Projek Baru Dilancarkan", {
          description: lang === "EN" ? `${newProject.title} has been added by a client.` : `${newProject.title} telah ditambah oleh klien.`,
          duration: 10000,
        });
      }
    }
  }, [lastEvent]);

  const filtered = useMemo(() => {
    let list = projects;
    
    // 1. Subscription Filter
    if (filter === "active") {
      list = list.filter(p => p.subscription_status === "active");
    } else if (filter === "inactive") {
      list = list.filter(p => p.subscription_status !== "active");
    }

    // 2. Payment Filter
    if (paymentFilter === "paid") {
      list = list.filter(p => p.status === "PAID" || p.status === "LIVE");
    } else if (paymentFilter === "unpaid") {
      list = list.filter(p => p.status !== "PAID" && p.status !== "LIVE");
    }

    // 3. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.client_name.toLowerCase().includes(q) ||
        p.client_email.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, search, filter, paymentFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900"><T en="Projects" bm="Projek" /></h1>
        <p className="text-sm text-zinc-400 font-medium mt-1">
          <T en="Manage and monitor all client projects across your platform." bm="Urus dan pantau semua projek klien di seluruh platform anda." />
        </p>
      </div>

      {/* ─── Search + Filter ─── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === "EN" ? "Search projects..." : "Cari projek..."}
            className="w-full pl-10 pr-4 py-3 lg:py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-700 placeholder-zinc-400 outline-none focus:border-emerald-400 transition-colors shadow-sm"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
          {/* Subscription Filter */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1"><T en="Subscription" bm="Langganan" /></span>
            <div className="flex items-center bg-zinc-100 rounded-full p-1 shadow-inner w-full sm:w-auto overflow-x-auto no-scrollbar">
              {(["all", "active", "inactive"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    filter === f
                      ? "bg-zinc-900 text-white shadow-md"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Filter */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1"><T en="Payment" bm="Pembayaran" /></span>
            <div className="flex items-center bg-zinc-100 rounded-full p-1 shadow-inner w-full sm:w-auto overflow-x-auto no-scrollbar">
              {(["all", "paid", "unpaid"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setPaymentFilter(f)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    paymentFilter === f
                      ? "bg-violet-600 text-white shadow-md"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Card List (md:hidden) ─── */}
      <div className="md:hidden space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-zinc-100 text-zinc-400 text-sm italic">
            <T en="No projects found." bm="Tiada projek ditemui." />
          </div>
        ) : (
          filtered.map(project => (
            <div key={project.id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-zinc-900 leading-tight">{project.title}</p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">#{project.id.slice(0, 8)}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wide">
                  <span className="w-1 h-1 rounded-full bg-white/70" />
                  {getStatusLabel(project.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-3 border-y border-zinc-50">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400"><T en="Owner" bm="Pemilik" /></p>
                  <p className="font-bold text-emerald-600 text-xs truncate">{project.client_name}</p>
                  <p className="text-[9px] text-zinc-400 truncate font-medium">{project.client_email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400"><T en="Plan & Subscription" bm="Pelan & Langganan" /></p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[9px] font-black uppercase tracking-wide">
                      {normalizePlanName(project.plan_name)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border ${
                      project.subscription_status === "active" 
                        ? "bg-emerald-500 text-white border-emerald-600" 
                        : "bg-zinc-100 text-zinc-400 border-zinc-200"
                    }`}>
                      {project.subscription_status ? project.subscription_status.replace(/_/g, " ") : <T en="No Sub" bm="Tiada Langganan" />}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[9px] font-bold ${
                  project.client_edit_allowed
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-zinc-100 border-zinc-200 text-zinc-500"
                }`}>
                  {project.client_edit_allowed
                    ? <><Unlock className="w-3 h-3" /> <T en="Sync Active" bm="Sinkronasi Aktif" /></>
                    : <><Lock className="w-3 h-3" /> <T en="Locked" bm="Dikunci" /></>
                  }
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeleteTarget(project)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors active:scale-95 border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors active:scale-95"
                  >
                    Manage Project
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Table (Hidden on Mobile) ─── */}
      <div className="hidden md:block bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                {[
                  { en: "Project", bm: "Projek" },
                  { en: "Owner", bm: "Pemilik" },
                  { en: "Plan", bm: "Pelan" },
                  { en: "Sync Mode", bm: "Mod Sinkronasi" },
                  { en: "Subscription", bm: "Langganan" },
                  { en: "Status", bm: "Status" },
                  { en: "Actions", bm: "Tindakan" },
                  { en: "Delete", bm: "Padam" }
                ].map(h => (
                  <th key={h.en} className="text-left py-3.5 px-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <T en={h.en} bm={h.bm} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-zinc-400 text-sm italic">
                    <T en="No projects found." bm="Tiada projek ditemui." />
                  </td>
                </tr>
              ) : filtered.map(project => (
                <tr key={project.id} className="border-b border-zinc-50 last:border-b-0 hover:bg-zinc-50/60 transition-colors">

                  {/* Project */}
                  <td className="py-4 px-5">
                    <p className="font-bold text-zinc-900 text-sm">{project.title}</p>
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5">#{project.id.slice(0, 8)}</p>
                  </td>

                  {/* Owner */}
                  <td className="py-4 px-5">
                    <p className="font-bold text-emerald-600 text-sm">{project.client_name}</p>
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{project.client_email}</p>
                  </td>

                  {/* Plan */}
                  <td className="py-4 px-5">
                    <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-wide">
                      {normalizePlanName(project.plan_name)}
                    </span>
                  </td>

                  {/* Sync Mode */}
                  <td className="py-4 px-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold ${
                      project.client_edit_allowed
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-zinc-100 border-zinc-200 text-zinc-500"
                    }`}>
                      {project.client_edit_allowed
                        ? <><Unlock className="w-3 h-3" /> <T en="Sync Active" bm="Sinkronasi Aktif" /></>
                        : <><Lock className="w-3 h-3" /> <T en="Locked" bm="Dikunci" /></>
                      }
                    </div>
                  </td>

                  {/* Subscription Status */}
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap border ${
                      project.subscription_status === "active" 
                        ? "bg-emerald-500 text-white border-emerald-600" 
                        : "bg-zinc-100 text-zinc-400 border-zinc-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${project.subscription_status === "active" ? "bg-white/70" : "bg-zinc-300"}`} />
                      {project.subscription_status ? project.subscription_status.replace(/_/g, " ") : <T en="No Sub" bm="Tiada Langganan" />}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                      {getStatusLabel(project.status)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-5">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> <T en="Inspect" bm="Periksa" />
                    </Link>
                  </td>

                  {/* Delete */}
                  <td className="py-4 px-5">
                    <button
                      onClick={() => setDeleteTarget(project)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> <T en="Delete" bm="Padam" />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 text-xs text-zinc-400 font-medium">
          <T 
            en={<>Showing <span className="font-bold text-zinc-600">{filtered.length}</span> projects</>} 
            bm={<>Memaparkan <span className="font-bold text-zinc-600">{filtered.length}</span> projek</>} 
          />
        </div>
      </div>
      {/* ─── Delete Confirmation Modal ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-zinc-100 rounded-2xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-lg font-bold text-zinc-950">
                <T en="Confirm Project Deletion" bm="Sahkan Pemadaman Projek" />
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                <T
                  en={<>Are you sure you want to delete <span className="font-bold text-red-600">{deleteTarget.title}</span>? This will permanently delete the project and all related subscriptions and invoices. This action cannot be undone.</>}
                  bm={<>Adakah anda pasti mahu memadam <span className="font-bold text-red-600">{deleteTarget.title}</span>? Ini akan memadamkan projek secara kekal berserta semua langganan dan invois yang berkaitan. Tindakan ini tidak boleh diundurkan.</>}
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
                onClick={handleDeleteProject}
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
  );
}
