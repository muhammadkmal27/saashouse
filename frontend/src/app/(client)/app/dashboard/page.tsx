"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Sparkles, Folder, Activity, CreditCard, TrendingUp, ChevronRight, LifeBuoy, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCookie } from "@/utils/cookies";
import { T } from "@/components/Translate";

interface Project {
    id: string;
    title: string;
    status: string;
    dev_url?: string;
    prod_url?: string;
    updated_at: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Omega-Onboarding: Google login redirect fallback
        const pendingPlan = getCookie("next-plan");
        if (pendingPlan) {
            router.push(`/app/projects/create?plan=${pendingPlan}`);
            return;
        }

        fetch("/api/projects", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProjects(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Dashboard fetch error:", err);
                setLoading(false);
            });
    }, [router]);

    if (loading) return <div className="p-20 text-center font-bold text-slate-500 animate-pulse"><T en="Synchronizing Workspace..." bm="Menyelaraskan Ruang Kerja..." /></div>;

    return (
        <div className="w-full">

        {/* ─── MOBILE VIEW (lg:hidden) ─── */}
        <div className="lg:hidden -mx-4 -mt-8">
            {/* Hero Greeting Banner */}
            <div className="relative bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 px-5 pt-8 pb-16 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full translate-y-8 -translate-x-8 blur-xl" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest"><T en="Live activity enabled" bm="Aktiviti langsung didayakan" /></span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-white leading-tight mb-1">
                        <T en="Welcome back 👋" bm="Selamat kembali 👋" />
                    </h1>
                    <p className="text-[13px] text-violet-200 font-medium">
                        <T en="Here's your workspace overview." bm="Ini gambaran keseluruhan ruang kerja anda." />
                    </p>
                </div>
            </div>



            {/* Quick Actions */}
            <div className="px-4 pt-6 mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3"><T en="Quick Actions" bm="Tindakan Pantas" /></p>
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { href: "/app/projects/create", icon: PlusCircle, label: <T en="New Project" bm="Projek Baru" />, color: "bg-violet-50 text-violet-600" },
                        { href: "/app/projects", icon: Folder, label: <T en="Projects" bm="Projek" />, color: "bg-violet-50 text-violet-600" },
                        { href: "/app/billing", icon: CreditCard, label: <T en="Billing" bm="Bayaran" />, color: "bg-violet-50 text-violet-600" },
                        { href: "/app/tickets", icon: LifeBuoy, label: <T en="Support" bm="Sokongan" />, color: "bg-violet-50 text-violet-600" },
                    ].map((item, i) => (
                        <Link key={i} href={item.href} className="flex flex-col items-center gap-2 group">
                            <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Progress Section */}
            <div className="px-4 mb-5">
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400"><T en="This week" bm="Minggu ini" /></p>
                            <h3 className="text-base font-bold text-slate-800"><T en="Momentum" bm="Momentum" /></h3>
                        </div>
                        <div className="h-9 w-9 rounded-full bg-violet-50 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-violet-600" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1.5">
                                <span><T en="Tasks resolved" bm="Tugasan diselesaikan" /></span>
                                <span className="font-bold text-slate-800">68%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full bg-violet-600 rounded-full" style={{ width: '68%' }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1.5">
                                <span><T en="Billing progress" bm="Kemajuan Bil" /></span>
                                <span className="font-bold text-slate-800">84%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full bg-violet-600 rounded-full" style={{ width: '84%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Projects List */}
            <div className="px-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400"><T en="Recent Projects" bm="Projek Terkini" /></p>
                    <Link href="/app/projects" className="text-[11px] font-bold text-violet-600"><T en="See all" bm="Lihat semua" /></Link>
                </div>
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                    {projects.slice(0, 4).map(project => (
                        <Link href={`/app/projects/${project.id}`} key={project.id} className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                {project.title.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[13px] text-slate-800 truncate">{project.title}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                    <T en={<>Updated {new Date(project.updated_at).toLocaleDateString('en-GB')}</>} bm={<>Dikemaskini {new Date(project.updated_at).toLocaleDateString('en-GB')}</>} />
                                </div>
                            </div>
                            <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                project.status === 'REVIEW' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                                <T en={project.status.replace(/_/g, ' ')} bm={
                                    project.status === 'REVIEW' ? 'SEMAKAN' :
                                    project.status === 'PAID' ? 'DIBAYAR' :
                                    project.status === 'UNDER_DEVELOPMENT' ? 'DALAM KERJA' :
                                    project.status === 'LIVE' ? 'AKTIF' :
                                    project.status.replace(/_/g, ' ')
                                } />
                            </span>
                        </Link>
                    ))}
                    {projects.length === 0 && (
                        <div className="py-10 text-center text-slate-400 text-sm italic">
                            <T en="No projects yet. Start one now!" bm="Tiada projek lagi. Mulakan sekarang!" />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Floating Add Project Button for Mobile */}
        <div className="fixed bottom-44 right-6 z-50 lg:hidden">
            <Link 
                href="/app/projects/create" 
                className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(124,58,237,0.5)] border-2 border-white/20 active:scale-90 transition-transform"
            >
                <Plus className="w-8 h-8" strokeWidth={3} />
            </Link>
        </div>

        {/* ─── DESKTOP VIEW (hidden lg:block) ─── */}
        <div className="hidden lg:block max-w-7xl mx-auto space-y-10">
                {/* Top Section: Hero + Sidebar Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Left: Massive Hero Card (Span 8) */}
                    <div className="lg:col-span-8 flex flex-col">
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200/60 shadow-sm flex flex-col flex-1">
                            {/* Split background graphic */}
                            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-slate-50 border-l border-slate-100"></div>
                            {/* Glassmorphism Highlight */}
                            <div className="absolute right-0 -top-20 h-64 w-64 rounded-full bg-violet-600/5 blur-3xl"></div>
                            
                            <div className="relative z-10 p-8 pt-10 flex-1">
                                <div className="flex justify-between items-center w-full mb-10">
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-700">
                                        <T en="Workspace Overview" bm="Gambaran Keseluruhan Ruang Kerja" />
                                    </span>
                                    <span className="flex items-center gap-2 text-[10px] font-medium text-emerald-600 bg-white px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                        <T en="Live activity enabled" bm="Aktiviti langsung didayakan" />
                                    </span>
                                </div>

                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1 block"><T en="Welcome back" bm="Selamat kembali" /></h4>
                                <h1 className="text-[2.75rem] font-extrabold tracking-tight text-slate-900 mb-5 leading-[1.05] max-w-[90%]">
                                    <T en="A sharper dashboard for tracking projects without visual clutter." bm="Laman utama yang lebih jelas untuk menjejak projek tanpa gangguan visual." />
                                </h1>
                                <p className="text-[15px] font-medium text-slate-500 mb-10 max-w-lg leading-relaxed">
                                    <T en="Everything important is surfaced in one place with clearer hierarchy, calmer spacing, and a more premium layout." bm="Sekaligus penting dipusatkan di satu tempat dengan hierarki yang lebih jelas, jarak yang lebih selesa, dan susun atur yang premium." />
                                </p>

                                <div className="flex flex-wrap items-center gap-4">
                                    <Link href="/app/projects/create" className="h-[44px] px-6 rounded-full bg-violet-600 text-white font-semibold text-[13px] flex items-center gap-2 shadow-lg shadow-violet-600/20 hover:opacity-90 transition-opacity">
                                        <PlusCircle className="w-[18px] h-[18px]" />
                                        <T en="New Project" bm="Projek Baru" />
                                    </Link>
                                    <button className="h-[44px] px-6 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[13px] flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-sm">
                                        <Sparkles className="w-[18px] h-[18px] text-violet-600" />
                                        <T en="Weekly Summary" bm="Ringkasan Mingguan" />
                                    </button>
                                </div>
                            </div>

                            {/* Top Metrics Row (Nested inside Hero Card) */}
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 px-8 pb-8 pt-4">
                                {/* Metric 1 */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:border-violet-100 transition-all flex flex-col justify-between">
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500"><T en="Active Projects" bm="Projek Aktif" /></span>
                                        <Folder className="w-[18px] h-[18px] text-slate-800" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <div className="text-[2.5rem] leading-none font-extrabold text-slate-900 mb-2">
                                            {projects.filter(p => ['PAID', 'LIVE'].includes(p.status.toUpperCase())).length}
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium"><T en="Ready to launch" bm="Sedia dilancarkan" /></div>
                                    </div>
                                </div>
                                
                                {/* Metric 2 */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:border-violet-100 transition-all flex flex-col justify-between">
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500"><T en="Ongoing Tasks" bm="Tugasan Semasa" /></span>
                                        <Activity className="w-[18px] h-[18px] text-slate-800" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <div className="text-[2.5rem] leading-none font-extrabold text-slate-900 mb-2">
                                            {projects.filter(p => !['LIVE', 'DRAFT'].includes(p.status.toUpperCase())).length}
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                                            <T en="Need attention" bm="Perlu perhatian" />
                                        </div>
                                    </div>
                                </div>

                                {/* Metric 3 */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:border-violet-100 transition-all flex flex-col justify-between">
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500"><T en="Pending Bills" bm="Bil Tertunggak" /></span>
                                        <div className="flex items-center justify-center p-1 bg-slate-100 rounded-md">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[2.5rem] leading-none font-extrabold text-slate-900 mb-2">0</div>
                                        <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap"><T en="Everything settled" bm="Semua diselesaikan" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Momentum & Focus Cards (Span 4) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Momentum Card */}
                        <div className="rounded-[2.5rem] bg-white border border-slate-100 p-8 shadow-sm relative overflow-hidden">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 block"><T en="This week" bm="Minggu ini" /></span>
                            <div className="flex items-start justify-between mb-8">
                                <h2 className="text-[22px] font-bold text-slate-900"><T en="Momentum" bm="Momentum" /></h2>
                                <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
                                    <Activity className="w-[18px] h-[18px]" strokeWidth={2} />
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                                        <span><T en="Tasks resolved" bm="Tugasan diselesaikan" /></span>
                                        <span className="font-bold text-slate-900">68%</span>
                                    </div>
                                    <div className="h-[6px] w-full rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full bg-violet-600 rounded-full" style={{ width: '68%' }}></div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                                        <span><T en="Billing progress" bm="Kemajuan Bil" /></span>
                                        <span className="font-bold text-slate-900">84%</span>
                                    </div>
                                    <div className="h-[6px] w-full rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full bg-violet-600 rounded-full" style={{ width: '84%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Focus Card (stretches to fill gap) */}
                        <div className="flex-1 rounded-[2.5rem] bg-[#F8F9FA] border border-slate-200/50 text-slate-900 p-8 flex flex-col justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 block"><T en="Focus" bm="Fokus" /></span>
                            <h2 className="text-[19px] font-bold mb-3 tracking-tight"><T en="Keep project reviews moving." bm="Teruskan ulasan projek." /></h2>
                            <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                                <T en="Your workspace is quiet right now, so this layout gives more breathing room while still keeping updates visible." bm="Ruang kerja anda tenang buat masa ini, jadi rekaan ini memberi lebih ruang tanpa mengabaikan mesej penting." />
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Recent Architecture + Timeline */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Architecture Card */}
                    <div className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-md overflow-hidden shadow-sm flex flex-col">
                        <div className="p-6 pb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 mb-1 block"><T en="Projects" bm="Projek" /></span>
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <T en="Recent Architecture" bm="Seni Bina Terkini" />
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200">
                                    <T en={<>{projects.length} items</>} bm={<>{projects.length} item</>} />
                                </span>
                            </h2>
                        </div>
                        <div className="divide-y divide-slate-100/50 flex flex-col flex-1">
                            {projects.map(project => (
                                <Link href={`/app/projects/${project.id}`} key={project.id} className="flex w-full items-center gap-4 px-6 py-5 text-left transition-all hover:bg-white/80 group cursor-pointer block text-inherit">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-110 transition-transform">
                                        {project.title.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-slate-800">{project.title}</div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 italic">
                                            <T en={<>Updated {new Date(project.updated_at).toLocaleDateString('en-GB')}</>} bm={<>Dikemaskini {new Date(project.updated_at).toLocaleDateString('en-GB')}</>} />
                                        </div>
                                    </div>
                                    <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        project.status === 'REVIEW' 
                                            ? 'bg-[#9b87f5]/10 text-[#9b87f5] border border-[#9b87f5]/20' 
                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                        <T 
                                            en={project.status.replace(/_/g, ' ')} 
                                            bm={
                                                project.status === 'REVIEW' ? 'SEMAKAN' : 
                                                project.status === 'PAID' ? 'DIBAYAR' : 
                                                project.status === 'UNDER_DEVELOPMENT' ? 'DALAM PEMBANGUNAN' : 
                                                project.status === 'LIVE' ? 'AKTIF' : 
                                                project.status.replace(/_/g, ' ')
                                            } 
                                        />
                                    </span>
                                </Link>
                            ))}
                            {projects.length === 0 && (
                                <div className="p-10 text-center italic text-slate-400 text-sm">
                                    <T en="No architecture registered." bm="Tiada senibina didaftarkan." />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activity Feed Card */}
                    <div className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-md p-8 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 mb-1 block"><T en="Timeline" bm="Garis Masa" /></span>
                                <h2 className="text-2xl font-bold text-slate-900"><T en="Activity Feed" bm="Suapan Aktiviti" /></h2>
                            </div>
                            <button className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-1 before:h-full before:w-0.5 before:bg-slate-100">
                            {projects.slice(0, 3).map((p, i) => (
                                <div key={i} className="relative pl-8">
                                    <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-white shadow-sm"></div>
                                    <div className="text-sm font-semibold text-slate-800"><T en={<>Project <span className="text-violet-600">{p.title}</span> registered</>} bm={<>Projek <span className="text-violet-600">{p.title}</span> didaftarkan</>} /></div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        <T en={<>Lifecycle status updated to {p.status.toLowerCase().replace(/_/g, ' ')}</>} 
                                           bm={<>Status kitaran hayat dikemaskini ke {
                                               p.status === 'REVIEW' ? 'semakan' : 
                                               p.status === 'PAID' ? 'dibayar' : 
                                               p.status === 'UNDER_DEVELOPMENT' ? 'dalam pembangunan' : 
                                               p.status === 'LIVE' ? 'aktif' : 
                                               p.status.toLowerCase().replace(/_/g, ' ')
                                           }</>} />
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-2">
                                        <T en={i === 0 ? "2 MIN AGO" : i === 1 ? "9 MIN AGO" : "14 MIN AGO"} bm={i === 0 ? "2 MIN LALU" : i === 1 ? "9 MIN LALU" : "14 MIN LALU"} />
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
