"use client";

import { useEffect, useState } from "react";
import { 
    Users, 
    Briefcase, 
    TrendingUp, 
    ArrowUpRight, 
    BarChart3,
    Clock
} from "lucide-react";
import Link from "next/link";

interface AdminStats {
    total_mrr: number;
    total_clients: number;
    active_projects: number;
}

interface RecentProject {
    id: string;
    title: string;
    status: string;
    subscription_status?: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, projectsRes] = await Promise.all([
                    fetch("/api/admin/stats", { credentials: "include" }),
                    fetch("/api/admin/projects", { credentials: "include" })
                ]);

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json();
                    if (Array.isArray(projectsData)) {
                        setRecentProjects(projectsData.slice(0, 5));
                    }
                }
                
                setLoading(false);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'LIVE': return 'bg-emerald-500';
            case 'REVIEW': return 'bg-blue-500';
            case 'ONBOARDING': return 'bg-orange-500';
            case 'DRAFT': return 'bg-zinc-400';
            default: return 'bg-zinc-500';
        }
    };

    if (loading) return <div className="p-8 text-zinc-500 font-bold animate-pulse">Loading System Oversight...</div>;

    return (
        <div className="space-y-10 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extra-bold tracking-tight">System Oversight</h1>
                    <p className="text-zinc-500 mt-1 uppercase tracking-widest text-xs font-bold">Agency Performance & Monitoring</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    Real-time Data Active
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">
                            +0% <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-1">Total MRR</h3>
                    <p className="text-3xl font-black">RM {stats?.total_mrr.toLocaleString() || "0.00"}</p>
                </div>

                <div className="p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                            <Briefcase className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-1">Active Projects</h3>
                    <p className="text-3xl font-black">{stats?.active_projects || 0} Projects</p>
                </div>

                <div className="p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-1">Total Clients</h3>
                    <p className="text-3xl font-black">{stats?.total_clients || 0} Klien</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Projects Table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden">
                    <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-emerald-500" /> Recent Activity
                        </h3>
                        <Link href="/admin/projects" className="text-sm font-bold text-emerald-600 dark:text-emerald-400">View All</Link>
                    </div>
                    <div className="p-6 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs font-bold uppercase text-zinc-400">
                                <tr>
                                    <th className="px-4 py-3">Project</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Subscription</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 animate-slide-up">
                                {recentProjects.map((row: any) => (
                                    <tr key={row.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-4 py-6 font-bold text-sm">{row.title}</td>
                                        <td className="px-4 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase text-white ${getStatusColor(row.status)}`}>
                                                {row.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-6">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${row.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                                {row.subscription_status === 'active' ? 'Active' : 'No subscription'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {recentProjects.length === 0 && (
                            <div className="p-12 text-center text-zinc-500 italic">No recent activity detected.</div>
                        )}
                    </div>
                </div>

                {/* Quick Actions & Health */}
                <div className="space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-emerald-600 text-white shadow-2xl shadow-emerald-600/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-2">Agency Support</h3>
                            <p className="text-emerald-100 text-sm leading-relaxed mb-8">
                                System is automatically monitoring project statuses. You can review submissions in real-time.
                            </p>
                            <Link 
                                href="/admin/tickets" 
                                className="inline-block px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl shadow-lg hover:bg-emerald-50 transition-colors"
                            >
                                Review Submissions
                            </Link>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-zinc-900 border border-zinc-800">
                        <h3 className="text-xl font-bold mb-6">System Health</h3>
                        <div className="space-y-6">
                            {[
                                { name: "PostgreSQL Database", status: "Operational", color: "bg-emerald-500" },
                                { name: "Axum API Engine", status: "Operational", color: "bg-emerald-500" },
                                { name: "Stripe Webhooks", status: "Standby", color: "bg-orange-500" },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-400">{s.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${s.color}`}></span>
                                        <span className="text-xs font-bold text-zinc-200">{s.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
