"use client";

import { useState, useEffect } from "react";
import { CreditCard, Zap, CheckCircle2, AlertCircle, Loader2, ArrowLeft, LayoutGrid, User, ShieldCheck } from "lucide-react";

const PLAN_DETAILS: Record<string, { label: string; price: string }> = {
  STANDARD: { label: "Standard Pack", price: "165" },
  GROWTH: { label: "Growth Accelerate", price: "190" },
  ENTERPRISE: { label: "Enterprise Managed", price: "260" },
  PLATINUM: { label: "Platinum Elite", price: "400" },
};

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Effect to fetch subscription when project is selected
  useEffect(() => {
    if (selectedProjectId) {
        fetchSubscriptionData(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const projRes = await fetch(`/api/projects`, { credentials: "include" });
      const projects = await projRes.json();
      
      setData((prev: any) => ({ ...prev, projects }));

      // Auto-select if only 1 project
      if (projects.length === 1) {
        setSelectedProjectId(projects[0].id);
      }
    } catch (err) {
      setError("Failed to load project data.");
    } finally {
      if (!selectedProjectId || (data?.projects?.length === 1)) {
        setLoading(false);
      }
    }
  };

  const fetchSubscriptionData = async (projectId: string) => {
    try {
        setLoading(true);
        const subRes = await fetch(`/api/billing/subscription?project_id=${projectId}`, { credentials: "include" });
        const sub = subRes.ok ? await subRes.json() : null;
        setData((prev: any) => ({ ...prev, sub }));
    } catch (err) {
        console.error("No active sub for this project");
        setData((prev: any) => ({ ...prev, sub: null }));
    } finally {
        setLoading(false);
    }
  }

  const handleToggleAutoRenew = async (projectId: string, currentStatus: boolean) => {
    if (!projectId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/billing/projects/${projectId}/auto-renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cancel_at_period_end: currentStatus }),
      });

      if (res.ok) {
        await fetchSubscriptionData(projectId);
      } else {
        alert("Failed to update auto-renewal settings.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayNow = async (projectId: string) => {
    if (!projectId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ project_id: projectId }),
      });

      const result = await res.json();
      if (res.ok && result.url) {
        window.location.href = result.url;
      } else {
        alert("Failed to start checkout session.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data?.projects) return <div className="p-12 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-violet-600" /></div>;

  const projects = data?.projects || [];
  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);
  const sub = data?.sub;

  const planKey = (selectedProject?.requirements?.selected_plan || "STANDARD").toUpperCase();
  const currentPlan = PLAN_DETAILS[planKey] || PLAN_DETAILS.STANDARD;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-sm px-8 py-10 lg:p-14 lg:pb-12">
        {/* Background attractive lighting (Mesh Gradient Bloom) */}
        <div className="absolute inset-0 bg-white z-0"></div>
        <div className="absolute -left-20 -bottom-20 w-[30rem] h-[30rem] bg-violet-400/20 rounded-full blur-[100px] z-0 pointer-events-none"></div>
        <div className="absolute right-0 -top-20 w-[40rem] h-[40rem] bg-violet-500/20 rounded-full blur-[120px] z-0 pointer-events-none"></div>
        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl z-0 pointer-events-none"></div>
        
        <div className="relative z-10">
            {selectedProjectId && projects.length > 1 ? (
                <button 
                    onClick={() => setSelectedProjectId(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 border border-slate-200/60 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-violet-700 hover:border-violet-200 mb-6 transition-all shadow-sm backdrop-blur-md group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Selection
                </button>
            ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-violet-700 shadow-sm border border-violet-200/50 mb-7 backdrop-blur-md">
                    <CreditCard className="w-3.5 h-3.5 text-violet-600" /> Billing Management
                </span>
            )}
            
            <h1 className="text-[3.5rem] font-extrabold tracking-tight text-slate-900 mb-4 leading-[1.05]">
                Billing & <span className="text-violet-600">Subscriptions</span>
            </h1>
            <p className="text-[15px] font-medium text-slate-500 max-w-xl leading-relaxed">
                {selectedProjectId ? `Securely managing payment options and automated renewals for ${selectedProject?.title}.` : "Select a platform to manage your infrastructure services and premium subscription plan."}
            </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 border border-red-100 font-bold text-sm">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {!selectedProjectId ? (
        /* PHASE 1: PROJECT SELECTION GRID */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length === 0 ? (
                <div className="sm:col-span-2 lg:col-span-3 p-16 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 italic text-slate-400 font-medium">
                    No projects found. Please create your first project to start subscribing.
                </div>
            ) : (
                projects.map((proj: any) => (
                    <button 
                        key={proj.id}
                        onClick={() => setSelectedProjectId(proj.id)}
                        className="group relative bg-white/80 bg-gradient-to-br from-white to-violet-50/40 rounded-[2.5rem] p-8 text-left border border-violet-100/50 shadow-xl shadow-violet-100/30 hover:border-violet-400 hover:shadow-violet-200/50 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-300/15 rounded-full blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-[0.08] transition-opacity text-violet-900 pointer-events-none">
                            <LayoutGrid className="w-24 h-24" />
                        </div>
                        
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 ${
                            proj.status === 'LIVE' ? 'bg-emerald-50 text-emerald-600' : 
                            proj.status === 'PAID' ? 'bg-indigo-50 text-indigo-600' :
                            proj.status === 'UNDER_DEVELOPMENT' ? 'bg-cyan-50 text-cyan-500' :
                            'bg-amber-50 text-amber-600'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                proj.status === 'LIVE' ? 'bg-emerald-500' : 
                                proj.status === 'PAID' ? 'bg-indigo-500' :
                                proj.status === 'UNDER_DEVELOPMENT' ? 'bg-cyan-500' :
                                'bg-amber-500 animate-pulse'
                            }`} /> {proj.status.replace('_', ' ')}
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-violet-600 transition-colors line-clamp-1">{proj.title}</h3>
                        <p className="text-sm text-slate-400 font-medium line-clamp-2 mb-8">{proj.description || "No project description."}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-black uppercase tracking-widest text-violet-700">Manage Billing</span>
                            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </div>
                        </div>
                    </button>
                ))
            )}
        </div>
      ) : (
        /* PHASE 2: BILLING DETAILS FOR SELECTED PROJECT */
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Subscription Card */}
                <div className="bg-white/80 bg-gradient-to-br from-white to-violet-50/30 rounded-[3rem] p-10 border border-violet-100/50 shadow-xl shadow-violet-100/40 relative overflow-hidden group">
                    {/* Purple gradient accent */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-400/10 rounded-full blur-[80px] pointer-events-none transition-all group-hover:bg-violet-400/20"></div>
                    <div className="absolute top-0 right-0 p-12 opacity-[0.04] -mr-10 -mt-10 pointer-events-none text-violet-700 group-hover:opacity-[0.06] transition-opacity">
                        <Zap className="w-64 h-64" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.15em] mb-5 shadow-lg shadow-violet-600/20">
                                <Zap className="w-3.5 h-3.5 text-white fill-white/20" /> {currentPlan.label}
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2"><span className="text-violet-600">{selectedProject?.requirements?.selected_plan || "Standard"}</span> Plan</h2>
                            <p className="text-slate-500 font-medium max-w-md">
                                Automated managed service covers server maintenance, SSL security, and daily data backups.
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-5xl font-black text-slate-900 tracking-tighter">RM {currentPlan.price} <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">/ mth</span></div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">
                                {(['LIVE', 'PAID', 'REVIEW'].includes(selectedProject?.status) && data?.sub?.status?.toLowerCase() === 'active') 
                                    ? "Active & Paid" 
                                    : "Awaiting Activation"}
                            </p>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-900 border border-slate-100">
                                <CreditCard className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Current Project Status</h4>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${['LIVE', 'PAID', 'REVIEW'].includes(selectedProject?.status) ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} /> 
                                    <span className="font-black text-lg text-slate-900 uppercase tracking-tighter">{selectedProject?.status?.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </div>

                        {data?.sub?.status?.toLowerCase() === 'active' ? (
                            <div className="px-10 py-5 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5" /> {selectedProject?.status === 'PAID' ? 'Payment Verified' : selectedProject?.status === 'REVIEW' ? 'Pending Review' : 'All Systems Go'}
                            </div>
                        ) : (
                            <button 
                                onClick={() => handlePayNow(selectedProject?.id)}
                                disabled={actionLoading}
                                className="w-full md:w-auto px-12 py-6 bg-violet-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-violet-700 hover:-translate-y-1 transition-all shadow-xl shadow-violet-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CreditCard className="w-6 h-6" /> Activate Now</>}
                            </button>
                        )}
                    </div>
                </div>

                {/* Auto-Renewal Toggle */}
                {sub && sub.project_id === selectedProject?.id && (
                    <div className="bg-white/80 bg-gradient-to-r from-white to-violet-50/40 rounded-[3rem] p-10 border border-violet-100/50 shadow-sm flex items-center justify-between gap-10 group hover:border-violet-300 hover:shadow-xl hover:shadow-violet-200/50 transition-all relative overflow-hidden">
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-violet-300/20 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex-1">
                            <h3 className="font-black text-2xl text-slate-900 mb-2">Automated Renewal</h3>
                            <p className="text-slate-500 font-medium leading-relaxed max-w-xl">
                                Keep your projects active. When enabled, your subscription will automatically renew via Stripe at the end of the billing cycle.
                            </p>
                            {sub.cancel_at_period_end && (
                                <p className="text-amber-500 font-black text-[10px] uppercase tracking-widest mt-4">Important: Service will end on {new Date(sub.current_period_end).toISOString().split('T')[0]}</p>
                            )}
                        </div>
                        
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={!sub.cancel_at_period_end} 
                                onChange={(e) => handleToggleAutoRenew(selectedProject?.id, !e.target.checked)}
                            />
                            <div className="w-20 h-10 bg-slate-100 rounded-full peer peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-8 after:w-8 after:transition-all peer-checked:after:translate-x-10 shadow-inner"></div>
                        </label>
                    </div>
                )}
            </div>

            {/* Sidebar Information */}
            <div className="space-y-6">
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-violet-900/20 relative overflow-hidden group">
                    {/* Glowing Premium Core inside dark card */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-violet-600/40 rounded-full blur-[70px] pointer-events-none group-hover:bg-violet-500/50 transition-colors duration-700"></div>
                    <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-violet-900/50 rounded-full blur-[50px] pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-violet-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(124,58,237,0.4)]">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h3 className="font-black text-2xl mb-4 tracking-tight leading-tight">Secured via Stripe</h3>
                    <p className="text-slate-400 font-medium mb-8 leading-relaxed">
                        We partner with Stripe to ensure every transaction is 100% secure with AES-256 encryption.
                    </p>
                    <div className="space-y-4">
                        {["Military Grade (AES-256)", "No Credit Card Data Stored", "Auto-Billing Protection"].map((tip) => (
                            <div key={tip} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-violet-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" /> {tip}
                            </div>
                        ))}
                    </div>
                    </div>
                </div>

                <div className="bg-white/80 bg-gradient-to-br from-white to-violet-50/20 rounded-[3rem] p-10 border border-violet-100/50 shadow-lg shadow-violet-100/20">
                    <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-violet-600" /> Business Details
                    </h3>
                    <div className="space-y-6">
                        <DetailItem label="Plan" value={selectedProject?.requirements?.selected_plan || "Standard"} />
                        <DetailItem label="Monthly Charge" value={`RM ${currentPlan.price}.00`} />
                        <DetailItem label="Currency" value="MYR" />
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">{label}</span>
            <span className="text-slate-900 font-black text-lg">{value}</span>
        </div>
    )
}

// Removed redundant ShieldCheck as it is now imported from lucide-react
