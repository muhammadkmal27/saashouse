"use client";

import { useEffect, useState } from "react";
import { Search, Sparkles, FolderOpen, ArrowUpRight, Plus, Activity, TrendingUp, Archive, Layers } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
    id: string;
    title: string;
    status: string;
    subscription_status?: string;
    selected_plan?: string;
    created_at: string;
    updated_at: string;
}

export default function ProjectsListPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        fetch("/api/projects", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProjects(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Projects fetch error:", err);
                setLoading(false);
            });
    }, []);

    const getStatusTheme = (status: string) => {
        const s = status.toUpperCase();
        if (s === 'REVIEW') return { color: 'text-amber-500', dot: 'bg-amber-500', label: 'REVIEW' };
        if (s === 'LIVE' || s === 'PAID') return { color: 'text-emerald-500', dot: 'bg-emerald-500', label: 'ACTIVE' };
        return { color: 'text-slate-500', dot: 'bg-slate-400', label: s.replace('_', ' ') };
    };

    const getPlanTheme = (plan: string) => {
        const p = (plan || 'Standard').toLowerCase();
        if (p.includes('platinum')) return 'text-amber-500 font-bold';
        if (p.includes('custom')) return 'text-emerald-500 font-bold'; 
        if (p.includes('enterprise')) return 'text-violet-600 font-bold';
        return 'text-slate-600 font-semibold';
    };

    if (loading) return <div className="p-20 text-center font-bold text-slate-500 animate-pulse">Synchronizing Platforms...</div>;

    const reviewCount = projects.filter(p => p.status.toUpperCase() === 'REVIEW').length;
    const activeCount = projects.filter(p => ['LIVE', 'PAID'].includes(p.status.toUpperCase())).length;

    const filteredProjects = projects.filter(p => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Review' && p.status.toUpperCase() === 'REVIEW') return true;
        if (activeFilter === 'Active' && ['LIVE', 'PAID'].includes(p.status.toUpperCase())) return true;
        if (activeFilter === 'Archived') return false; // None supported yet natively
        return false;
    });

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 px-4 lg:px-8 pt-8 pb-20 bg-[#F8F9FA] min-h-screen">
            
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white shadow-sm px-8 py-10 lg:p-14 lg:pb-12 border border-slate-100/50">
                {/* Background attractive lighting (Mesh Gradient Bloom) */}
                <div className="absolute inset-0 bg-white z-0"></div>
                <div className="absolute -left-32 -bottom-32 w-[35rem] h-[35rem] bg-violet-500/20 rounded-full blur-[120px] z-0 pointer-events-none"></div>
                <div className="absolute -right-20 -top-32 w-[45rem] h-[45rem] bg-violet-500/20 rounded-full blur-[120px] z-0 pointer-events-none"></div>
                <div className="absolute right-1/4 top-1/4 w-[25rem] h-[25rem] bg-pink-400/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>
                <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl z-0 pointer-events-none border border-white/60"></div>
                
                <div className="relative z-10">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-violet-700 shadow-sm border border-violet-200/50 mb-7 backdrop-blur-md">
                        <Sparkles className="w-3.5 h-3.5 text-violet-600" /> Workspace
                    </span>

                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-14">
                        <div>
                            <h1 className="text-[3.5rem] font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-4">
                                My <span className="text-violet-600">Platforms</span>
                            </h1>
                            <p className="text-[14px] text-slate-500 max-w-sm leading-relaxed font-medium">
                                A curated overview of every platform across your infrastructure — track lifecycle, plans, and progress in one place.
                            </p>
                        </div>
                        <Link 
                            href="/app/projects/create" 
                            className="shrink-0 flex items-center justify-center gap-2.5 h-[50px] px-8 rounded-full bg-violet-600 text-white font-semibold text-[14px] shadow-[0_8px_30px_rgba(124,58,237,0.35)] hover:bg-violet-700 transition-all hover:-translate-y-0.5 mt-2 border border-violet-500"
                        >
                            <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />
                            New Project
                        </Link>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="bg-white/95 backdrop-blur-md rounded-[1.25rem] border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-stretch overflow-hidden">
                        
                        {/* Stat Block 1 */}
                        <div className="flex-1 px-8 py-7 border-b md:border-b-0 md:border-r border-slate-100/80">
                            <div className="flex items-center gap-3 mb-4">
                                <Layers className="w-4 h-4 text-slate-400" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Total Platforms</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="text-[2.2rem] font-black text-slate-900 leading-none">{projects.length}</div>
                            </div>
                        </div>

                        {/* Stat Block 2 */}
                        <div className="flex-1 px-8 py-7 border-b md:border-b-0 md:border-r border-slate-100/80">
                            <div className="flex items-center gap-3 mb-4">
                                <Activity className="w-4 h-4 text-amber-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">In Review</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="text-[2.2rem] font-black text-amber-500 leading-none">{reviewCount}</div>
                            </div>
                        </div>

                        {/* Stat Block 3 */}
                        <div className="flex-1 px-8 py-7 border-b md:border-b-0 md:border-r border-slate-100/80">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Active</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="text-[2.2rem] font-black text-emerald-500 leading-none">{activeCount}</div>
                            </div>
                        </div>

                        {/* Stat Block 4 */}
                        <div className="flex-1 px-8 py-7">
                            <div className="flex items-center gap-3 mb-4">
                                <Archive className="w-4 h-4 text-slate-400" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Archived</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="text-[2.2rem] font-black text-slate-400 leading-none">0</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 mb-8 pb-2">
                {/* Search */}
                <div className="relative w-full md:w-[22rem]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search platforms, IDs, plans..." 
                        className="w-full h-[42px] pl-11 pr-5 rounded-full bg-white border border-slate-200/70 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center bg-white border border-slate-200/70 rounded-full p-1 shadow-sm shrink-0">
                    {['All', 'Review', 'Active', 'Archived'].map((f) => (
                        <button 
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all ${
                                activeFilter === f 
                                    ? 'bg-slate-900 text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Header */}
            <div className="flex items-end justify-between mb-8 px-2">
                <div>
                    <h2 className="text-[17px] font-extrabold text-slate-900 leading-tight">All Platforms</h2>
                    <p className="text-[12px] text-slate-500 font-medium mt-1">{filteredProjects.length} projects - sorted by latest activity</p>
                </div>
                <button className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors">
                    View archived —
                </button>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                    const theme = getStatusTheme(project.status);
                    const planText = project.selected_plan || 'Standard';
                    
                    return (
                        <div key={project.id} className="bg-white rounded-[1.75rem] border border-slate-100 p-6 lg:p-7 hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1 transition-all group flex flex-col h-full cursor-pointer" onClick={() => router.push(`/app/projects/${project.id}`)}>
                            
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-[46px] h-[46px] rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                    {project.title.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="text-right">
                                    <div className={`flex items-center justify-end gap-1.5 ${theme.color}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.15em]">{theme.label}</span>
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                        #{project.id.split('-').pop()?.substring(0,6) || 'a1b2c3'}
                                    </div>
                                </div>
                            </div>

                            {/* Card Title */}
                            <div>
                                <h3 className="text-[17px] font-extrabold text-slate-900 truncate mb-1">{project.title}</h3>
                                <p className="text-[11px] font-medium text-slate-400">Initiated {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>

                            <hr className="my-6 border-t border-slate-100/60" />

                            {/* Meta Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-7">
                                <div>
                                    <h4 className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 mb-1.5">Plan</h4>
                                    <p className={`text-[12px] truncate ${getPlanTheme(planText)}`}>
                                        {planText}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 mb-1.5">Subscription</h4>
                                    <p className="text-[12px] font-semibold text-slate-600 truncate">
                                        {project.subscription_status === 'active' ? 'Active' : 'No Subscription'}
                                    </p>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="mt-auto">
                                <div className="w-full h-11 bg-slate-50 group-hover:bg-slate-100 rounded-2xl flex items-center justify-between px-5 transition-colors border border-slate-100 group-hover:border-slate-200">
                                    <span className="text-[11px] font-bold text-slate-700 transition-colors">View Project</span>
                                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-colors" strokeWidth={2.5} />
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>
            
            {filteredProjects.length === 0 && !loading && (
                <div className="p-20 text-center bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                    <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Platforms Found</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">Change your filters or create a new platform to track your lifecycle here.</p>
                </div>
            )}
        </div>
    );
}
