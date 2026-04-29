"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft,
    User,
    MessageCircle,
    Globe,
    Box,
    Rocket,
    CheckCircle2,
    Send,
    Eye,
    Download,
    Lock,
    Unlock,
    Info,
    Layout,
    Clock,
    MapPin,
    Trash2,
    PlusCircle,
    MessageSquare,
    Camera,
    ExternalLink,
    Printer,
    FileSearch,
    BadgeCheck,
    Calendar,
    Briefcase,
    X,
    MoveVertical,
    Type,
    Maximize2,
    RotateCcw,
    FileText
} from "lucide-react";
import Script from 'next/script';
import Link from "next/link";
import { getAssetUrl } from "@/utils/url";
import ProjectOnboardingReport from "@/components/ProjectOnboardingReport";
import ServiceAgreementDocument from "@/components/ServiceAgreementDocument";

interface Requirements {
  payment_setup?: {
    has_toyyibpay: boolean;
    secret_key?: string;
    category_code?: string;
    ssm_url?: string;
  };
  features?: string[];
  custom_needs?: string;
  sitemap?: string[];
  brand_assets?: {
    theme_color?: string;
    logo_url?: string;
  };
   domain_requested?: string;
   domain_2?: string;
   domain_3?: string;
   competitor_ref?: string;
   social_media?: {
     facebook?: string;
     instagram?: string;
     tiktok?: string;
     linkedin?: string;
   };
   business_email?: string;
   business_address?: string;
   operation_hours?: string;
   project_vision?: string;
}

interface ProjectData {
  id: string;
  client_id: string;
  title: string;
  description: string;
  status: string;
  whatsapp_number: string;
  subscription_status?: string;
  selected_plan?: string;
  client_edit_allowed: boolean;
  requirements?: Requirements;
  dev_url?: string;
  prod_url?: string;
  created_at: string;
}

interface ServiceAgreement {
  id: string;
  client_name: string;
  provider_name: string;
  project_name: string;
  total_cost: number;
  deposit_amount: number;
  balance_amount: number;
  signed_at: string;
  signature_data?: string;
  provider_signature?: string;
}


export default function AdminProjectDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
    const [lineSpacing, setLineSpacing] = useState(1.6);
    const [pageMargin, setPageMargin] = useState(48); // default p-12 is 48px
    const [isExporting, setIsExporting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);
  
  // URL Management States
  const [isEditingStaging, setIsEditingStaging] = useState(false);
  const [isEditingProd, setIsEditingProd] = useState(false);
  const [tempDevUrl, setTempDevUrl] = useState("");
  const [tempProdUrl, setTempProdUrl] = useState("");

  const [activeAsset, setActiveAsset] = useState<string | null>(null);
  const [agreement, setAgreement] = useState<ServiceAgreement | null>(null);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [isAgreementPreviewOpen, setIsAgreementPreviewOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState<'REPORT' | 'AGREEMENT'>('REPORT');

  // Layout Adjustment States for Agreement
  const [sectionGap, setSectionGap] = useState(8);
  const [fontSize, setFontSize] = useState(14);
  const [signatureGap, setSignatureGap] = useState(20);
  const [otpTemplate, setOtpTemplate] = useState<any[]>([]);
  const [saasTemplate, setSaasTemplate] = useState<any[]>([]);

  const resetAgreementLayout = () => {
    setSectionGap(8);
    setFontSize(14);
    setSignatureGap(20);
    setPageMargin(48);
    setLineSpacing(1.6);
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    fetch(`/api/admin/projects/${id}`, { credentials: "include" })
      .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
      })
      .then((data) => {
        setProject(data);
        setTempDevUrl(data.dev_url || "");
        setTempProdUrl(data.prod_url || "");
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    // Fetch Agreement
    fetch(`/api/projects/${id}/agreement`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => setAgreement(data))
      .catch(console.error);

    // Fetch Settings for Templates
    fetch("/api/status", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setOtpTemplate(data.agreement_template_otp || []);
        setSaasTemplate(data.agreement_template_saas || []);
      })
      .catch(console.error);
  }, [id]);

  const handlePermissionToggle = async () => {
    if (!project) return;
    setPermissionLoading(true);
    const newValue = !project.client_edit_allowed;
    
    const csrfToken = document.cookie.split("; ").find((row) => row.startsWith("csrf_token="))?.split("=")[1] || "";
    
    try {
        const res = await fetch(`/api/admin/projects/${id}/permission`, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify({ allowed: newValue }),
            credentials: "include"
        });

        if (res.ok) {
            setProject({ ...project, client_edit_allowed: newValue });
            showNotification(newValue ? "Client Blueprint Access: UNLOCKED" : "Client Blueprint Access: LOCKED", "success");
        } else {
            const errBody = await res.text();
            console.error("SYNC ERROR:", errBody);
            showNotification("Failed to update security parameters", "error");
        }
    } catch (err) {
        showNotification("Network synchronization error", "error");
    } finally {
        setPermissionLoading(false);
    }
  };

  const handleProjectUpdate = async (params: { status?: string, dev_url?: string, prod_url?: string }, silent: boolean = false) => {
    if (!silent) setUpdating(true);
    const csrfToken = document.cookie.split("; ").find((row) => row.startsWith("csrf_token="))?.split("=")[1] || "";

    try {
        const res = await fetch(`/api/admin/projects/${id}`, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify(params),
            credentials: "include"
        });

        if (res.ok) {
            setProject(prev => prev ? { ...prev, ...params } : null);
            if (!silent) showNotification("Architecture Synchronized Successfully");
            setIsEditingStaging(false);
            setIsEditingProd(false);
            if (params.status) router.refresh();
            return true;
        } else {
            const errorMsg = `Server responded with ${res.status}`;
            if (!silent) showNotification(`Update Failed: ${errorMsg}`, "error");
            console.error("Link update failed:", errorMsg);
            return false;
        }
    } catch (err) {
        console.error("Network Error:", err);
        if (!silent) showNotification("Network Error: Could not reach backend", "error");
        return false;
    } finally {
        if (!silent) setUpdating(false);
    }
  };

  const handlePublishStaging = async () => {
    setUpdating(true);
    const success = await handleProjectUpdate({ 
        dev_url: tempDevUrl, 
        status: "UNDER_DEVELOPMENT" 
    }, true);
    
    if (success) {
        showNotification("Environment Deployed: Project is now Under Development");
    } else {
        showNotification("Staging Deployment Failed", "error");
    }
    setUpdating(false);
  };

  const handlePublishProduction = async () => {
    setUpdating(true);
    const success = await handleProjectUpdate({ 
        prod_url: tempProdUrl, 
        status: "LIVE" 
    }, true);
    
    if (success) {
        showNotification("Production Environment Live!");
    } else {
        showNotification("Production Deployment Failed", "error");
    }
    setUpdating(false);
  };

  const handleGenerateInvoice = async () => {
    setUpdating(true);
    const csrfToken = document.cookie.split("; ").find((row) => row.startsWith("csrf_token="))?.split("=")[1] || "";

    try {
        const res = await fetch(`/api/admin/projects/${id}/invoice`, {
            method: "POST",
            headers: {
                "X-CSRF-Token": csrfToken
            },
            credentials: "include"
        });

        if (res.ok) {
            const data = await res.json();
            showNotification(data.message);
            setProject(p => p ? { ...p, status: "PAYMENT_PENDING" } : null);
        } else {
            showNotification("Failed to generate financial record", "error");
        }
    } catch (err) {
        console.error(err);
        showNotification("Error: Script execution failed", "error");
    } finally {
        setUpdating(false);
    }
  };

  const handleExportReportPDF = async () => {
    if (!project) return;
    setIsExporting(true);
    setPrintTarget('REPORT');

    // Wait for the DOM to update so the report is rendered
    await new Promise(resolve => setTimeout(resolve, 500));

    const element = document.getElementById('project-report-print');
    if (!element) {
        setIsExporting(false);
        return;
    }

    const options = {
        margin: [0, 0, 0, 0],
        filename: `Report_${(project.title || 'Project').replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true,
            logging: false,
            scrollY: 0,
            scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
        // @ts-ignore
        if (typeof window.html2pdf !== 'function') {
            showNotification("PDF components are still loading. Please wait a moment.", "error");
            setIsExporting(false);
            return;
        }
        // @ts-ignore
        await window.html2pdf().set(options).from(element).save();
    } catch (error) {
        console.error(error);
    } finally {
        setIsExporting(false);
    }
  };

  const handlePrint = (target: 'REPORT' | 'AGREEMENT' = 'REPORT') => {
    if (target === 'REPORT') {
        handleExportReportPDF();
        return;
    }
    setPrintTarget(target);
    setTimeout(() => {
        window.print();
    }, 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
        case 'LIVE': return 'bg-emerald-500 text-white';
        case 'REVIEW': return 'bg-blue-500 text-white';
        case 'PAID': return 'bg-indigo-600 text-white';
        case 'UNDER_DEVELOPMENT': return 'bg-cyan-500 text-white';
        case 'PAYMENT_PENDING': return 'bg-purple-500 text-white';
        case 'ONBOARDING': return 'bg-orange-500 text-white';
        case 'DRAFT': return 'bg-zinc-500 text-white';
        default: return 'bg-zinc-800 text-zinc-300';
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-zinc-500 animate-pulse">Analyzing Project Requirements...</div>;
  if (!project) return <div className="p-20 text-center text-red-500">Project blueprint not found.</div>;

  const req = project.requirements || {};

  return (
    <div className="min-h-screen bg-zinc-50/50 p-4 md:p-8 pb-32">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="afterInteractive" />

      {/* PRINT VIEWS */}
      <div className="hidden print:block">
        {printTarget === 'REPORT' && <ProjectOnboardingReport project={project} />}
        {printTarget === 'AGREEMENT' && agreement && (
            <ServiceAgreementDocument 
                project={agreement as any} 
                fontSize={fontSize}
                sectionGap={sectionGap}
                signatureGap={signatureGap}
                lineSpacing={lineSpacing}
                padding={pageMargin}
                template={
                  (agreement.plan_name?.toLowerCase() || "").includes("standard") || 
                  (agreement.plan_name?.toLowerCase() || "").includes("growth") || 
                  (agreement.plan_name?.toLowerCase() || "").includes("enterprise") || 
                  (agreement.plan_name?.toLowerCase() || "").includes("platinum")
                  ? saasTemplate
                  : otpTemplate
                }
            />
        )}
      </div>

      {/* Main Container (Hidden in Print to show only Onboarding Report) */}
      <div className="max-w-6xl mx-auto space-y-6 print:hidden">
        
        {/* Navigation & Actions (Hidden in Print) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <Link href="/admin/projects" className="inline-flex items-center gap-2 text-zinc-500 hover:text-indigo-600 transition-colors font-bold text-sm group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                Back to Projects
            </Link>
            
            <div className="flex flex-wrap items-center gap-3">
                <button 
                    onClick={() => handlePrint('REPORT')}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                    <Download className="w-4 h-4" /> {isExporting ? 'Generating...' : 'Download PDF (HQ)'}
                </button>

                <button 
                  onClick={handlePermissionToggle}
                  disabled={permissionLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border-2 ${
                    project.client_edit_allowed 
                    ? 'bg-amber-50 border-amber-200 text-amber-700' 
                    : 'bg-zinc-900 border-zinc-900 text-white'
                  }`}
                >
                  {project.client_edit_allowed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {project.client_edit_allowed ? "Blueprint Unlocked" : "Lock Editor"}
                </button>
            </div>
        </div>

        {/* Project Header Card */}
        <div className="bg-white border-2 border-zinc-200 rounded-3xl p-8 md:p-12 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border-2 ${getStatusBadge(project.status).replace('bg-', 'border-').replace('text-white', 'text-black')}`}>
                            {project.status.replace('_', ' ')}
                        </span>
                        <span className="px-3 py-1 text-[10px] font-bold bg-zinc-100 text-zinc-500 rounded-lg uppercase tracking-wider">
                            Plan: {project.selected_plan || 'Custom Plan'}
                        </span>
                        <span className="px-3 py-1 text-[10px] font-bold bg-zinc-100 text-zinc-500 rounded-lg uppercase tracking-wider">
                            Sub: {project.subscription_status ? (project.subscription_status.charAt(0).toUpperCase() + project.subscription_status.slice(1)) : (project.selected_plan?.toUpperCase().includes('ONE-TIME') && !['REVIEW', 'DRAFT'].includes(project.status.toUpperCase())) ? 'Active (OTP)' : 'Inactive'}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight leading-none uppercase">
                        {project.title}
                    </h1>
                    <p className="text-zinc-500 font-medium max-w-2xl text-lg">
                        {project.description || "Detailed project parameters and technical infrastructure requirements."}
                    </p>
                </div>
                {project.whatsapp_number && (
                    <a 
                      href={`https://wa.me/${project.whatsapp_number}`} 
                      target="_blank" 
                      className="print:hidden flex items-center gap-3 px-6 py-4 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-2xl font-bold transition-all"
                    >
                      <MessageCircle className="w-5 h-5" /> Chat via WhatsApp
                    </a>
                )}
            </div>
        </div>

        {/* Unified Project Brief Grid */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
            {/* LEFT COLUMN: Strategic Vision & Operational Logic */}
            <div className="lg:col-span-2 space-y-6">
                {/* Project Vision - FULL CONTEXT */}
                {req.project_vision && (
                    <div className="bg-white border-2 border-zinc-200 rounded-3xl p-8 md:p-12 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-zinc-400">
                                <FileSearch className="w-6 h-6" />
                                <span className="text-sm font-black uppercase tracking-widest">The Creative Vision</span>
                            </div>
                            <button 
                                onClick={handleExportReportPDF}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                <Download className="w-3.5 h-3.5" /> {isExporting ? 'Exporting...' : 'Download Blueprint'}
                            </button>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                            <p className="text-base md:text-lg font-medium text-zinc-600 leading-relaxed selection:bg-zinc-100 break-words whitespace-pre-wrap">
                                {req.project_vision}
                            </p>
                        </div>
                    </div>
                )}

                {/* Information Grid (Bento Style) */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Documentation Card */}
                    <div className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 text-zinc-400">
                            <BadgeCheck className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Client Identity</span>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group flex justify-between items-center transition-colors">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">SSM Registration</p>
                                    <p className="text-sm font-bold text-zinc-800">
                                        {req.payment_setup?.ssm_url ? "Document Provided" : "No Document (ToyyibPay)"}
                                    </p>
                                </div>
                                {req.payment_setup?.ssm_url && (
                                    <button 
                                        onClick={() => setActiveAsset(getAssetUrl(req.payment_setup!.ssm_url!))}
                                        className="p-2 hover:bg-white rounded-lg transition-all print:hidden"
                                    >
                                        <Download className="w-5 h-5 text-zinc-400 hover:text-indigo-600" />
                                    </button>
                                )}
                            </div>

                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center group">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Brand Assets</p>
                                    <p className="text-sm font-bold text-zinc-800">
                                        {req.brand_assets?.logo_url ? "Logo Asset Linked" : "No Logo Uploaded"}
                                    </p>
                                </div>
                                {req.brand_assets?.logo_url && (
                                    <button 
                                        onClick={() => setActiveAsset(getAssetUrl(req.brand_assets!.logo_url!))}
                                        className="p-2 hover:bg-white rounded-lg transition-all print:hidden"
                                    >
                                        <Eye className="w-5 h-5 text-zinc-400 hover:text-indigo-600" />
                                    </button>
                                )}
                            </div>

                            {req.payment_setup?.has_toyyibpay && (
                                <div className="p-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-3 tracking-widest">ToyyibPay Configuration</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[8px] font-bold text-indigo-300 uppercase">Secret Key</p>
                                            <p className="text-[10px] font-mono font-bold text-indigo-700 truncate">{req.payment_setup.secret_key || "NA"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-indigo-300 uppercase">Category</p>
                                            <p className="text-[10px] font-mono font-bold text-indigo-700">{req.payment_setup.category_code || "NA"}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Business Details Card */}
                    <div className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 text-zinc-400">
                            <Briefcase className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Operations</span>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Business Email</p>
                                <p className="text-sm font-bold text-zinc-800 break-all">{req.business_email || "Not Defined"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Operation Hours</p>
                                <p className="text-sm font-bold text-zinc-800">{req.operation_hours || "Unspecified"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Business Address</p>
                                <p className="text-sm font-bold text-zinc-800 leading-relaxed opacity-80">
                                    {req.business_address || "No Physical Address Provided"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sitemaps & Features */}
                <div className="bg-white border-2 border-zinc-200 rounded-3xl p-8 md:p-12 shadow-sm space-y-12">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Sitemap Vertical List */}
                        {req.sitemap && req.sitemap.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 text-zinc-400 mb-8 font-black uppercase tracking-widest text-[11px]">
                                    <Layout className="w-4 h-4" /> Architecture Hierarchy
                                </div>
                                <div className="space-y-3 relative pl-6 border-l-2 border-zinc-100">
                                    {req.sitemap.map((page, idx) => (
                                        <div key={idx} className="relative group p-2 rounded-lg hover:bg-zinc-50 transition-colors">
                                            <div className="absolute -left-[30px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-zinc-200 z-10" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-bold text-zinc-400 uppercase">Page {idx + 1}</span>
                                                <span className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">{page}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Features & Specifications */}
                        <div className="space-y-8">
                            {req.features && req.features.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 text-zinc-400 mb-6 font-black uppercase tracking-widest text-[11px]">
                                        <BadgeCheck className="w-4 h-4" /> Activated Modules
                                    </div>
                                    <div className="grid gap-2">
                                        {req.features.map((feat, idx) => (
                                            <div key={idx} className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold text-zinc-600 flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                {feat}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {req.custom_needs && (
                                <div className="pt-8 border-t border-zinc-100">
                                    <div className="flex items-center gap-3 text-zinc-400 mb-4 font-black uppercase tracking-widest text-[11px]">
                                        <Info className="w-4 h-4" /> Logic Requirements
                                    </div>
                                    <p className="text-sm text-zinc-600 font-medium leading-relaxed bg-zinc-50 p-6 rounded-2xl border border-dashed border-zinc-200 break-words whitespace-pre-wrap">
                                        {req.custom_needs}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Controls & Metadata */}
            <div className="lg:col-span-1 space-y-6">
                {/* Environment Control */}
                <div className="print:hidden">
                    <div className="bg-zinc-900 rounded-3xl p-8 text-white space-y-6 shadow-xl">
                        <div className="flex items-center gap-3 text-zinc-400 mb-2">
                            <Rocket className="w-5 h-5 text-indigo-400" />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Environment Management</span>
                        </div>

                        <div className="space-y-4">
                            {/* Staging Logic */}
                            {isEditingStaging ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <input 
                                        type="url" 
                                        value={tempDevUrl}
                                        onChange={(e) => setTempDevUrl(e.target.value)}
                                        placeholder="https://staging.example.com"
                                        className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all font-mono"
                                    />
                                    <div className="flex flex-col gap-2">
                                        <button onClick={handlePublishStaging} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                                            Deploy & Notify Client
                                        </button>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleProjectUpdate({ dev_url: tempDevUrl })} className="flex-1 py-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase">Save Only</button>
                                            <button onClick={() => setIsEditingStaging(false)} className="px-4 py-2.5 bg-transparent border border-zinc-800 hover:bg-zinc-800 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    disabled={updating}
                                    onClick={() => setIsEditingStaging(true)}
                                    className="w-full py-4 bg-zinc-800 hover:bg-indigo-600 border border-zinc-700 rounded-2xl font-black flex items-center justify-center gap-3 transition-all active:scale-95"
                                >
                                    <Box className="w-5 h-5" /> {project.dev_url ? "Update Staging Link" : "Initiate Staging"}
                                </button>
                            )}

                            {/* Production Logic */}
                            {isEditingProd ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <input 
                                        type="url" 
                                        value={tempProdUrl}
                                        onChange={(e) => setTempProdUrl(e.target.value)}
                                        placeholder="https://www.example.com"
                                        className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-sm outline-none focus:border-emerald-500 transition-all font-mono"
                                    />
                                    <div className="flex flex-col gap-2">
                                        <button onClick={handlePublishProduction} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20">
                                            Go Live Now
                                        </button>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleProjectUpdate({ prod_url: tempProdUrl })} className="flex-1 py-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase">Save Only</button>
                                            <button onClick={() => setIsEditingProd(false)} className="px-4 py-2.5 bg-transparent border border-zinc-800 hover:bg-zinc-800 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    disabled={updating}
                                    onClick={() => setIsEditingProd(true)}
                                    className="w-full py-4 border-2 border-zinc-800 hover:border-emerald-500 text-zinc-400 hover:text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg"
                                >
                                    <Send className="w-5 h-5" /> {project.prod_url ? "Update Live Link" : "Publish to Production"}
                                </button>
                            )}

                            <div className="pt-6 border-t border-zinc-800">
                            <button 
                                disabled={updating || project.status === "PAYMENT_PENDING"}
                                onClick={handleGenerateInvoice}
                                className="w-full py-4 bg-white text-zinc-900 hover:bg-zinc-100 rounded-2xl font-black flex items-center justify-center gap-3 transition-all"
                            >
                                <FileText className="w-5 h-5" /> {project.status === "PAYMENT_PENDING" ? "Invoice Pending Review" : "Request Payment"}
                            </button>
                            </div>

                            {/* SIGNED AGREEMENT ACCESS */}
                            {agreement && (
                                <div className="pt-6 border-t border-zinc-800 space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-400">
                                        <BadgeCheck className="w-3 h-3" /> Agreement Verified
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setPrintTarget('AGREEMENT');
                                            setIsAgreementPreviewOpen(true);
                                        }}
                                        className="w-full py-4 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-100 rounded-2xl font-black flex items-center justify-center gap-3 transition-all"
                                    >
                                        <Printer className="w-5 h-5" /> Print Agreement
                                    </button>
                                    <div className="px-4 py-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[8px] font-bold text-zinc-500 uppercase">Signed By</span>
                                            <span className="text-[8px] font-mono text-zinc-500">{new Date(agreement.signed_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs font-bold text-zinc-200 truncate">{agreement.client_name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Technical Specs Card (Now following environment) */}
                <div className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-sm space-y-8 print:hidden">
                    {/* Brand Meta */}
                    {req.brand_assets?.theme_color && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-zinc-400 font-black uppercase tracking-widest text-[10px]">
                                <Printer className="w-4 h-4" /> Brand Meta
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                                    <p className="text-[8px] font-bold text-zinc-400 uppercase mb-2">Theme Hex</p>
                                    <p className="text-xs font-mono font-bold text-zinc-800">{req.brand_assets.theme_color}</p>
                                </div>
                                <div 
                                    className="rounded-2xl border-4 border-white shadow-md"
                                    style={{ backgroundColor: req.brand_assets.theme_color }} 
                                />
                            </div>
                        </div>
                    )}

                    {/* Domain Meta */}
                    {(req.domain_requested || req.domain_2 || req.domain_3) && (
                        <div className="space-y-4 pt-8 border-t border-zinc-100">
                             <div className="flex items-center gap-3 text-zinc-400 font-black uppercase tracking-widest text-[10px]">
                                <Globe className="w-4 h-4" /> Target Domains
                            </div>
                            <div className="space-y-2">
                                {req.domain_requested && (
                                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        <p className="text-[7px] font-black text-indigo-300 uppercase">Primary Choice</p>
                                        <p className="text-xs font-bold text-indigo-700">{req.domain_requested}</p>
                                    </div>
                                )}
                                {req.domain_2 && (
                                    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                                        <p className="text-[7px] font-black text-zinc-400 uppercase">Backup Choice 2</p>
                                        <p className="text-xs font-bold text-zinc-500">{req.domain_2}</p>
                                    </div>
                                )}
                                {req.domain_3 && (
                                    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                                        <p className="text-[7px] font-black text-zinc-400 uppercase">Backup Choice 3</p>
                                        <p className="text-xs font-bold text-zinc-500">{req.domain_3}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Competitor Analysis Link */}
                    {req.competitor_ref && (
                        <div className="pt-8 border-t border-zinc-100">
                            <div className="p-5 bg-amber-50 border-2 border-amber-100 rounded-3xl">
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Creative Benchmark</p>
                                <a href={req.competitor_ref} target="_blank" className="text-xs font-bold text-amber-700 hover:text-amber-900 border-b-2 border-amber-200 truncate block">
                                    {(() => { try { return new URL(req.competitor_ref).hostname; } catch { return req.competitor_ref; } })()}
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Social Strategy */}
                {req.social_media && (
                    <div className="bg-white border-2 border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6 print:hidden">
                         <div className="flex items-center gap-3 text-zinc-400 font-black uppercase tracking-widest text-[10px]">
                            <PlusCircle className="w-4 h-4" /> Social Strategy
                        </div>
                        <div className="space-y-3">
                            {req.social_media.facebook && (
                                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex flex-col gap-1">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Facebook</span>
                                    <a href={req.social_media.facebook} target="_blank" className="text-zinc-600 font-bold text-[10px] truncate hover:text-indigo-600 transition-colors">
                                        {req.social_media.facebook}
                                    </a>
                                </div>
                            )}
                            {req.social_media.instagram && (
                                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex flex-col gap-1">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Instagram</span>
                                    <a href={req.social_media.instagram} target="_blank" className="text-zinc-600 font-bold text-[10px] truncate hover:text-indigo-600 transition-colors">
                                        {req.social_media.instagram}
                                    </a>
                                </div>
                            )}
                            {req.social_media.tiktok && (
                                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex flex-col gap-1">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">TikTok</span>
                                    <a href={req.social_media.tiktok} target="_blank" className="text-zinc-600 font-bold text-[10px] truncate hover:text-indigo-600 transition-colors">
                                        {req.social_media.tiktok}
                                    </a>
                                </div>
                            )}
                            {req.social_media.linkedin && (
                                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex flex-col gap-1">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">LinkedIn</span>
                                    <a href={req.social_media.linkedin} target="_blank" className="text-zinc-600 font-bold text-[10px] truncate hover:text-indigo-600 transition-colors">
                                        {req.social_media.linkedin}
                                    </a>
                                </div>
                            )}
                            {!req.social_media.facebook && !req.social_media.instagram && !req.social_media.tiktok && !req.social_media.linkedin && (
                                <p className="text-[10px] font-bold text-zinc-400 italic">No social strategy defined.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Floating Notifications (Hidden in Print) */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden">
            <div className={`
                flex items-center gap-4 px-8 py-5 rounded-2xl shadow-2xl border backdrop-blur-xl
                ${notification.type === 'success' ? 'bg-zinc-900 text-white' : 'bg-red-600 text-white'}
            `}>
                <div className="p-2 bg-white/10 rounded-lg">
                    {notification.type === 'success' ? <BadgeCheck className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Architecture Sync</div>
                    <div className="font-bold tracking-tight">{notification.message}</div>
                </div>
            </div>
        </div>
      )}

      {/* Print-specific Global Styles */}
      <style jsx global>{`
          @media print {
            @page {
                size: A4;
                margin: 0;
            }
            body { 
                background: white !important; 
                color: black !important;
                -webkit-print-color-adjust: exact;
                margin: 0;
                padding: 0;
            }
            /* Hide ALL dashboard elements */
            nav, sidebar, .sidebar, .navbar, aside, 
            footer, header, .print\\:hidden { 
                display: none !important; 
            }
            /* Ensure the report is the only thing centered and visible */
            .print\\:block {
                display: block !important;
            }
          }
        `}</style>


        {/* ASSET VIEWER MODAL */}
        {activeAsset && (
            <div className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in duration-300">
                <div className="relative w-full max-w-5xl h-full flex flex-col bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-zinc-800">
                    {/* Viewer Header */}
                    <div className="flex justify-between items-center p-6 border-b-2 border-zinc-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                                <FileSearch className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Intelligence Asset Viewer</h3>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Viewing Global Repository Asset (Admin View)</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setActiveAsset(null)}
                            className="w-12 h-12 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-red-500 rounded-2xl transition-all border-2 border-zinc-100 active:scale-95"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden bg-zinc-50 flex items-center justify-center p-4">
                        {activeAsset.toLowerCase().endsWith('.pdf') ? (
                            <iframe 
                                src={activeAsset} 
                                className="w-full h-full rounded-2xl border-2 border-zinc-200 shadow-sm"
                                title="Asset View"
                            />
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center p-8">
                                <img 
                                    src={activeAsset} 
                                    alt="Asset View"
                                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white"
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="p-6 bg-zinc-900 text-center">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Corporate Strategic Asset Vault</p>
                    </div>
                </div>
            </div>
        )}

        {/* Agreement Preview Overlay */}
        {isAgreementPreviewOpen && agreement && (
            <div className="fixed inset-0 z-[150] bg-zinc-950 overflow-y-auto custom-scrollbar p-8 print:hidden animate-in fade-in duration-300">

                {/* Control Panel (Moved from component to here for better print control) */}
                <div className="fixed top-32 right-12 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 space-y-6 z-[160] transition-all ring-1 ring-black/5">
                    <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                        <Layout className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 text-center flex-1">Adjust Layout</h3>
                        <button 
                            onClick={resetAgreementLayout}
                            className="p-1 hover:bg-zinc-100 rounded-md transition-colors text-zinc-400 hover:text-zinc-900"
                            title="Reset Layout"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                    <MoveVertical className="w-3 h-3" /> Section Gap
                                </label>
                                <span className="text-[10px] font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-full">{sectionGap}</span>
                            </div>
                            <input 
                                type="range" min="2" max="16" step="1"
                                value={sectionGap}
                                onChange={(e) => setSectionGap(parseInt(e.target.value))}
                                className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                    <Type className="w-3 h-3" /> Font Size
                                </label>
                                <span className="text-[10px] font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-full">{fontSize}px</span>
                            </div>
                            <input 
                                type="range" min="11" max="18" step="0.5"
                                value={fontSize}
                                onChange={(e) => setFontSize(parseFloat(e.target.value))}
                                className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                    <Maximize2 className="w-3 h-3" /> Signature Gap
                                </label>
                                <span className="text-[10px] font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-full">{signatureGap}</span>
                            </div>
                            <input 
                                type="range" min="4" max="40" step="2"
                                value={signatureGap}
                                onChange={(e) => setSignatureGap(parseInt(e.target.value))}
                                className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                                    <Maximize2 className="w-3 h-3" /> Page Margins
                                </label>
                                <span className="text-[10px] font-mono text-zinc-400">{pageMargin}px</span>
                            </div>
                            <input 
                                type="range" 
                                min="20" 
                                max="100" 
                                step="2"
                                value={pageMargin}
                                onChange={(e) => setPageMargin(parseInt(e.target.value))}
                                className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 space-y-3">
                        <button 
                            onClick={async () => {
                                setIsExporting(true);
                                const element = document.getElementById('agreement-document-print');
                                if (!element) return;

                                // Reset scroll of the container to avoid offsets in PDF
                                const container = element.closest('.overflow-y-auto');
                                if (container) container.scrollTop = 0;
                                
                                const options = {
                                    margin: [15, 10, 15, 10], // Top, Left, Bottom, Right in mm
                                    filename: `Agreement_${project.title.replace(/\s+/g, '_')}.pdf`,
                                    image: { type: 'jpeg', quality: 0.98 },
                                    html2canvas: { 
                                        scale: 2, 
                                        useCORS: true, 
                                        letterRendering: true,
                                        logging: false,
                                        scrollY: 0,
                                        scrollX: 0
                                    },
                                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                                };

                                try {
                                    // @ts-ignore
                                    if (typeof window.html2pdf !== 'function') {
                                        showNotification("PDF components are still loading...", "error");
                                        setIsExporting(false);
                                        return;
                                    }
                                    // @ts-ignore
                                    await window.html2pdf().set(options).from(element).save();
                                } catch (error) {
                                    console.error(error);
                                } finally {
                                    setIsExporting(false);
                                }
                            }}
                            disabled={isExporting}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" /> {isExporting ? 'Generating PDF...' : 'Download PDF (HQ)'}
                        </button>

                        <button 
                            onClick={() => window.print()}
                            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                            <Printer className="w-4 h-4" /> Confirm & Print
                        </button>

                        <p className="text-[10px] text-zinc-400 font-medium italic text-center">Final output will follow these adjustments</p>
                    </div>
                </div>

                <button 
                    onClick={() => setIsAgreementPreviewOpen(false)}
                    className="fixed top-8 left-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md z-[160] transition-all group border border-white/10"
                >
                    <div className="flex items-center gap-2">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest mr-2">Exit Preview</span>
                    </div>
                </button>
                
                    <ServiceAgreementDocument 
                        project={agreement as any} 
                        fontSize={fontSize}
                        sectionGap={sectionGap}
                        signatureGap={signatureGap}
                        lineSpacing={lineSpacing}
                        padding={pageMargin}
                        template={
                          (agreement.plan_name?.toLowerCase() || "").includes("standard") || 
                          (agreement.plan_name?.toLowerCase() || "").includes("growth") || 
                          (agreement.plan_name?.toLowerCase() || "").includes("enterprise") || 
                          (agreement.plan_name?.toLowerCase() || "").includes("platinum")
                          ? saasTemplate
                          : otpTemplate
                        }
                    />
            </div>
        )}
    </div>
  );
}
