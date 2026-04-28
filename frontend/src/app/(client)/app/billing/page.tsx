"use client";

import { useState, useEffect } from "react";
import { CreditCard, Zap, CheckCircle2, AlertCircle, Loader2, ArrowLeft, LayoutGrid, User, ShieldCheck } from "lucide-react";

import { fetchPrices, DEFAULT_PRICES } from "@/utils/pricing";
import ServiceAgreementModal from "@/components/modals/ServiceAgreementModal";
import { T } from "@/components/Translate";

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, string>>(DEFAULT_PRICES);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [agreement, setAgreement] = useState<any>(null);
  const [pendingPaymentProjectId, setPendingPaymentProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices().then(setDynamicPrices);
    fetch("/api/status")
      .then(r => r.json())
      .then(setStatus)
      .catch(console.error);
    fetchInitialData();
  }, []);

  const projects = data?.projects || [];
  const selectedProject = projects.find((p: any) => p.id === selectedProjectId);

  const otpDeposit = status?.otp_deposit_price || "200";
  const otpFinal = status?.otp_final_price || "500";
  const otpTotal = (Number(otpDeposit) + Number(otpFinal)).toString();

  const isOTP = (selectedProject?.selected_plan || selectedProject?.requirements?.selected_plan || "").toLowerCase().includes("one-time");
  
  // Calculate relevant price based on status
  let displayPrice = "";
  if (isOTP) {
    if (selectedProject?.status === "REVIEW" || selectedProject?.status === "PAYMENT_PENDING") {
      displayPrice = otpDeposit;
    } else if (selectedProject?.status === "UNDER_DEVELOPMENT") {
      displayPrice = otpFinal;
    } else if (selectedProject?.status === "PAID") {
      displayPrice = "0"; // Deposit paid, waiting for dev
    } else {
      displayPrice = otpTotal;
    }
  }

  const PLAN_DETAILS: Record<string, { label: string; price: string; isOTP?: boolean; priceLabel?: string }> = {
    STANDARD: { label: "Standard Pack", price: dynamicPrices.Standard || "165" },
    GROWTH: { label: "Growth Accelerate", price: dynamicPrices.Growth || "240" },
    ENTERPRISE: { label: "Enterprise Managed", price: dynamicPrices.Enterprise || "410" },
    PLATINUM: { label: "Platinum Elite", price: dynamicPrices.Platinum || "750" },
    "ONE-TIME PURCHASE": { 
      label: "One-Time Purchase", 
      price: displayPrice || otpTotal, 
      isOTP: true,
      priceLabel: (selectedProject?.status === "REVIEW" || selectedProject?.status === "PAYMENT_PENDING") ? "Deposit" : selectedProject?.status === "UNDER_DEVELOPMENT" ? "Final Payment" : "Total"
    },
  };

  const planKey = (selectedProject?.selected_plan || selectedProject?.requirements?.selected_plan || "STANDARD").toUpperCase();
  const currentPlan = PLAN_DETAILS[planKey] || PLAN_DETAILS.STANDARD;

  // Effect to fetch subscription when project is selected
  useEffect(() => {
    if (selectedProjectId) {
        fetchSubscriptionData(selectedProjectId);
        fetchAgreementData(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchAgreementData = async (projectId: string) => {
    try {
        const res = await fetch(`/api/projects/${projectId}/agreement`, { credentials: "include" });
        const agreement = res.ok ? await res.json() : null;
        setAgreement(agreement);
    } catch (e) {
        setAgreement(null);
    }
  }

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
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrf_token="))
        ?.split("=")[1];

      const res = await fetch(`/api/billing/projects/${projectId}/auto-renew`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken || ""
        },
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

  const handlePayNow = async (projectId: string, agreementOverride?: any) => {
    if (!projectId) return;

    // Use current state or provided override
    const proj = projects.find((p: any) => p.id === projectId) || selectedProject;
    const isOTPLocal = (proj?.selected_plan || proj?.requirements?.selected_plan || "").toLowerCase().includes("one-time");
    const paymentTypeLocal = (proj?.status === "REVIEW" || proj?.status === "PAYMENT_PENDING") ? "DEPOSIT" : "FINAL";
    
    // Check for Service Agreement if project is in initial payment stage
    const currentAgreement = agreementOverride || agreement;
    const isInitialStage = (proj?.status === "REVIEW" || proj?.status === "PAYMENT_PENDING");
    
    if (isInitialStage && !currentAgreement) {
        setPendingPaymentProjectId(projectId);
        setIsAgreementOpen(true);
        return;
    }

    setActionLoading(true);
    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrf_token="))
        ?.split("=")[1];

      // Route to ToyyibPay if it's an OTP project
      const endpoint = isOTPLocal ? "/api/billing/toyyibpay/checkout" : "/api/billing/checkout";
      const body = isOTPLocal ? { project_id: projectId, payment_type: paymentTypeLocal } : { project_id: projectId };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || ""
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (res.ok && (result.url || result.checkout_url)) {
        window.location.href = result.url || result.checkout_url;
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

  const sub = data?.sub;

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
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> <T en="Back to Selection" bm="Kembali" />
                </button>
            ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-violet-700 shadow-sm border border-violet-200/50 mb-7 backdrop-blur-md">
                    <CreditCard className="w-3.5 h-3.5 text-violet-600" /> <T en="Billing Management" bm="Pengurusan Pengebilan" />
                </span>
            )}
            
            <h1 className="text-[3.5rem] font-extrabold tracking-tight text-slate-900 mb-4 leading-[1.05]">
                <T en={<>Billing & <span className="text-violet-600">Subscriptions</span></>} bm={<>Pengebilan & <span className="text-violet-600">Langganan</span></>} />
            </h1>
            <p className="text-[15px] font-medium text-slate-500 max-w-xl leading-relaxed">
                {selectedProjectId ? <T en={`Securely managing payment options and automated renewals for ${selectedProject?.title}.`} bm={`Menguruskan pilihan pembayaran dan pembaharuan automatik dengan selamat untuk ${selectedProject?.title}.`} /> : <T en="Select a platform to manage your infrastructure services and premium subscription plan." bm="Pilih platform untuk mengurus perkhidmatan infrastruktur dan pelan langganan premium anda." />}
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
                    <T en="No projects found. Please create your first project to start subscribing." bm="Tiada projek dijumpai.  Sila cipta projek pertama anda untuk mula melanggan." />
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
                            }`} /> <T en={proj.status.replace('_', ' ')} bm={proj.status === 'PAID' ? 'DIBAYAR' : proj.status === 'UNDER_DEVELOPMENT' ? 'DALAM PEMBANGUNAN' : proj.status === 'REVIEW' ? 'SEMAKAN' : proj.status === 'LIVE' ? 'AKTIF' : proj.status.replace('_', ' ')} />
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-violet-600 transition-colors line-clamp-1">{proj.title}</h3>
                        <p className="text-sm text-slate-400 font-medium line-clamp-2 mb-8">{proj.description || <T en="No project description." bm="Tiada penerangan projek." />}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-[10px] font-black uppercase tracking-widest text-violet-700"><T en="Manage Billing" bm="Urus Pengebilan" /></span>
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
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2"><span className="text-violet-600">
                                {planKey.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                            </span> <T en="Plan" bm="Pelan" /></h2>
                            <p className="text-slate-500 font-medium max-w-md">
                                <T en="Automated managed service covers server maintenance, SSL security, and daily data backups." bm="Perkhidmatan terurus automatik kami termasuk jaminan pelayan, SSL kebal, bersama sandaran peribadi." />
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-5xl font-black text-slate-900 tracking-tighter">
                                RM {currentPlan.price} 
                                {currentPlan.isOTP ? (
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-2"><T en={currentPlan.priceLabel || "Package"} bm={currentPlan.priceLabel === "Deposit" ? "Deposit" : currentPlan.priceLabel === "Final Payment" ? "Bayaran Akhir" : "Pakej"} /></span>
                                ) : (
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">/ <T en="mth" bm="bln" /></span>
                                )}
                            </div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">
                                {((['LIVE', 'PAID'].includes(selectedProject?.status)) || (data?.sub?.status?.toLowerCase() === 'active')) 
                                    ? <T en="Active & Paid" bm="Aktif & Dibayar" />
                                    : <T en="Awaiting Activation" bm="Menunggu Pengaktifan" />}
                            </p>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-900 border border-slate-100">
                                <CreditCard className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1"><T en="Current Project Status" bm="Status Projek Terkini" /></h4>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${['LIVE', 'PAID', 'REVIEW'].includes(selectedProject?.status) ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} /> 
                                    <span className="font-black text-lg text-slate-900 uppercase tracking-tighter">
                                        <T en={selectedProject?.status?.replace('_', ' ')} bm={selectedProject?.status === 'PAID' ? 'DIBAYAR' : selectedProject?.status === 'UNDER_DEVELOPMENT' ? 'DALAM PEMBANGUNAN' : selectedProject?.status === 'REVIEW' ? 'SEMAKAN' : selectedProject?.status === 'LIVE' ? 'AKTIF' : selectedProject?.status?.replace('_', ' ')} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {(data?.sub?.status?.toLowerCase() === 'active' || (isOTP && (selectedProject?.status === 'PAID' || selectedProject?.status === 'LIVE'))) ? (
                            <div className="px-10 py-5 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5" /> <T en={selectedProject?.status === 'LIVE' ? 'Fully Paid' : selectedProject?.status === 'PAID' ? 'Payment Verified' : selectedProject?.status === 'REVIEW' ? 'Pending Review' : 'All Systems Go'} bm={selectedProject?.status === 'LIVE' ? 'Selesai Dibayar' : selectedProject?.status === 'PAID' ? 'Pembayaran Sah' : selectedProject?.status === 'REVIEW' ? 'Dalam Semakan' : 'Sistem Beroperasi'} />
                            </div>
                        ) : (
                            <button 
                                onClick={() => handlePayNow(selectedProject?.id)}
                                disabled={actionLoading || (isOTP && (selectedProject?.status === 'PAID' || selectedProject?.status === 'LIVE'))}
                                className="w-full md:w-auto px-12 py-6 bg-violet-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-violet-700 hover:-translate-y-1 transition-all shadow-xl shadow-violet-600/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                            >
                                {actionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CreditCard className="w-6 h-6" /> <T en="Activate Now" bm="Aktifkan Sekarang" /></>}
                            </button>
                        )}
                    </div>
                </div>

                {/* Auto-Renewal Toggle */}
                {sub && sub.project_id === selectedProject?.id && (
                    <div className="bg-white/80 bg-gradient-to-r from-white to-violet-50/40 rounded-[3rem] p-10 border border-violet-100/50 shadow-sm flex items-center justify-between gap-10 group hover:border-violet-300 hover:shadow-xl hover:shadow-violet-200/50 transition-all relative overflow-hidden">
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-violet-300/20 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex-1">
                            <h3 className="font-black text-2xl text-slate-900 mb-2"><T en="Automated Renewal" bm="Pembaharuan Automatik" /></h3>
                            <p className="text-slate-500 font-medium leading-relaxed max-w-xl">
                                <T en="Keep your projects active. When enabled, your subscription will automatically renew via Stripe at the end of the billing cycle." bm="Kekalkan projek anda secara sentiasa aktif. Apabila dibenarkan, langganan anda akan diperbaharui selepas tamat kitaran bulanan." />
                            </p>
                            {sub.cancel_at_period_end && (
                                <p className="text-amber-500 font-black text-[10px] uppercase tracking-widest mt-4"><T en={`Important: Service will end on ${new Date(sub.current_period_end).toISOString().split('T')[0]}`} bm={`Perhatian: Servis akan tamat kelak di ${new Date(sub.current_period_end).toISOString().split('T')[0]}`} /></p>
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
                    <h3 className="font-black text-2xl mb-4 tracking-tight leading-tight"><T en={`Secured via ${isOTP ? "ToyyibPay" : "Stripe"}`} bm={`Djamin oleh ${isOTP ? "ToyyibPay" : "Stripe"}`} /></h3>
                    <p className="text-slate-400 font-medium mb-8 leading-relaxed">
                        <T en={`We partner with ${isOTP ? "ToyyibPay" : "Stripe"} to ensure every transaction is 100% secure with ${isOTP ? "Bank-grade security" : "AES-256 encryption"}.`} bm={`Kami bekerjasama bersama ${isOTP ? "ToyyibPay" : "Stripe"} untuk jamin keberkesanan setiap aliran bayar.`} />
                    </p>
                    <div className="space-y-4">
                        {[
                            { en: "Military Grade", bm: "Gred Ketenteraan" },
                            { en: "No Credit Card Stored", bm: "Tiada Kad Kredit Disimpan" },
                            { en: "Auto-Billing Protection", bm: "Perlindungan Pengebilan Auto" }
                        ].map((tip) => (
                            <div key={tip.en} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-violet-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" /> <T en={tip.en} bm={tip.bm} />
                            </div>
                        ))}
                    </div>
                    </div>
                </div>

                <div className="bg-white/80 bg-gradient-to-br from-white to-violet-50/20 rounded-[3rem] p-10 border border-violet-100/50 shadow-lg shadow-violet-100/20">
                    <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-violet-600" /> <T en="Business Details" bm="Butiran Bisnes" />
                    </h3>
                    <div className="space-y-6">
                        <DetailItem label={<T en="Plan" bm="Kategori Pelan" />} value={currentPlan.label} />
                        <DetailItem label={<T en={isOTP ? "Stage Charge" : "Monthly Charge"} bm={isOTP ? "Caj Serahan" : "Kitaran Bilan"} />} value={`RM ${currentPlan.price}.00`} />
                        <DetailItem label={<T en="Currency" bm="Mata Wang" />} value="MYR" />
                    </div>
                </div>
            </div>
        </div>
      )}

      <ServiceAgreementModal 
          isOpen={isAgreementOpen}
          onClose={() => setIsAgreementOpen(false)}
          project={{ id: selectedProject?.id || "", title: selectedProject?.title || "" }}
          providerName={status?.service_provider_name || "SaaS House Development"}
          providerSignature={status?.service_provider_signature}
          isOTP={isOTP}
          template={isOTP ? status?.agreement_template_otp : status?.agreement_template_saas}
          monthlyPrice={Number(currentPlan.price)}
          planName={currentPlan.name}
          costs={{ 
              deposit: Number(otpDeposit), 
              final: Number(otpFinal) 
          }}
          onSigned={(newAgreement) => {
              setAgreement(newAgreement);
              if (pendingPaymentProjectId) {
                  // Direct redirect - the page will navigate away so no need to close modal or wait
                  handlePayNow(pendingPaymentProjectId, newAgreement);
              }
          }}
      />
    </div>
  );
}

function DetailItem({ label, value }: { label: React.ReactNode; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">{label}</span>
            <span className="text-slate-900 font-black text-lg">{value}</span>
        </div>
    )
}

// Removed redundant ShieldCheck as it is now imported from lucide-react
