"use client";

import { useEffect, useState, useMemo } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { Search, Eye, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors active:scale-95"
                >
                  Manage Project
                </Link>
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
                  { en: "Actions", bm: "Tindakan" }
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
                  <td colSpan={7} className="text-center py-16 text-zinc-400 text-sm italic">
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

    </div>
  );
}
