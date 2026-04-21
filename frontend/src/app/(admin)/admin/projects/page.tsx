"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Eye, Lock, Unlock } from "lucide-react";
import Link from "next/link";

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
  return "Standard";
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

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "active">("all");

  useEffect(() => {
    fetch("/api/admin/projects", { credentials: "include" })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => { if (Array.isArray(data)) setProjects(data); setLoading(false); })
      .catch(err => { console.error("Failed to fetch projects:", err); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let list = projects;
    if (filter === "active") list = list.filter(p => p.subscription_status === "active");
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
  }, [projects, search, filter]);

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
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Projects</h1>
        <p className="text-sm text-zinc-400 font-medium mt-1">
          Manage and monitor all client projects across your platform.
        </p>
      </div>

      {/* ─── Search + Filter ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by project, owner or ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-700 placeholder-zinc-400 outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center bg-zinc-100 rounded-full p-1">
          {(["all", "active"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                filter === f
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                {["Project", "Owner", "Plan", "Sync Mode", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left py-3.5 px-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-zinc-400 text-sm italic">
                    No projects found.
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
                        ? <><Unlock className="w-3 h-3" /> Sync Active</>
                        : <><Lock className="w-3 h-3" /> Locked</>
                      }
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
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
                      <Eye className="w-3.5 h-3.5" /> Inspect
                    </Link>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 text-xs text-zinc-400 font-medium">
          Showing <span className="font-bold text-zinc-600">{filtered.length}</span> projects
        </div>
      </div>

    </div>
  );
}
