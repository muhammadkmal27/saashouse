"use client";

import { useEffect, useState, use } from "react";
import { 
    ArrowLeft, 
    Clock, 
    Layout, 
    Globe, 
    Star, 
    ShieldCheck, 
    CheckCircle2, 
    Package, 
    Box, 
    Rocket, 
    ArrowRight, 
    UploadCloud, 
    Search, 
    FileSearch, 
    Camera, 
    Cpu,
    Lock,
    Unlock,
    Info,
    MapPin,
    Trash2,
    PlusCircle,
    Eye,
    Download,
    Zap,
    MessageCircle,
    MessageSquare,
    Globe2,
    ExternalLink,
    X,
    FileText,
    Sparkles,
    Lightbulb,
    Mail,
    Folder,
    Pen
} from "lucide-react";
import Link from "next/link";
import { getAssetUrl } from "@/utils/url";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteCookie } from "@/utils/cookies";

interface Requirements {
    selected_plan?: string;
    domain_requested?: string;
    domain_2?: string;
    domain_3?: string;
    features?: string[];
    custom_needs?: string;
    sitemap?: string[];
    brand_assets?: {
        theme_color?: string;
        logo_url?: string;
    };
    payment_setup?: {
        has_toyyibpay: boolean;
        ssm_url?: string;
        secret_key?: string;
        category_code?: string;
    };
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

interface Project {
    id: string;
    title: string;
    description?: string;
    status: string;
    dev_url?: string;
    prod_url?: string;
    subscription_status?: string;
    selected_plan?: string;
    client_edit_allowed: boolean;
    created_at: string;
    requirements?: Requirements;
}

export default function ClientProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Update Mode States
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Project>>({});
    const [isSaving, setIsSaving] = useState(false);
    
    // Onboarding-style Stepper States
    const [step, setStep] = useState(1);
    const [ssmFile, setSsmFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    
    // Asset Viewer State
    const [activeAsset, setActiveAsset] = useState<string | null>(null);

    const nextStep = () => setStep((p) => Math.min(p + 1, 6));
    const prevStep = () => setStep((p) => Math.max(p - 1, 1));

    const handleFileUpload = async (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            toast.error(`File "${file.name}" exceeds 10MB capacity.`);
            throw new Error("File too large");
        }

        const data = new FormData();
        data.append("file", file);
        try {
            const res = await fetch("/api/assets/upload", {
                method: "POST",
                body: data,
                credentials: "include",
            });
            if (!res.ok) {
                const errBody = await res.text();
                throw new Error(`Upload failed: ${res.status} - ${errBody}`);
            }
            const result = await res.json();
            return result.files[0]; 
        } catch (e: any) {
            console.error("Critical Upload Error:", e.message);
            toast.error("Upload failed: Check file size and connection.");
            throw e; 
        }
    };

    useEffect(() => {
        fetch(`/api/projects/${id}`, { credentials: "include" })
            .then(async (res) => {
                if (!res.ok) throw new Error("Project not found or unauthorized");
                return res.json();
            })
            .then(data => {
                // Normalize requirements to ensure required arrays exist
                const normalizedReq = {
                    ...data.requirements,
                    features: data.requirements?.features || [],
                    sitemap: data.requirements?.sitemap || [],
                };
                
                setProject({ ...data, requirements: normalizedReq });
                setEditData({
                    title: data.title,
                    requirements: normalizedReq
                });
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    const handleUpdate = async () => {
        setIsSaving(true);
        try {
            let finalRequirements = JSON.parse(JSON.stringify(editData.requirements || {}));
            
            // Handle File Uploads
            if (ssmFile) {
                toast.info("Uploading SSM Document...");
                const ssmUrl = await handleFileUpload(ssmFile);
                if (ssmUrl) {
                    if (!finalRequirements.payment_setup) finalRequirements.payment_setup = { has_toyyibpay: false };
                    finalRequirements.payment_setup.ssm_url = ssmUrl;
                }
            }

            if (logoFile) {
                toast.info("Uploading Brand Logo...");
                const logoUrl = await handleFileUpload(logoFile);
                if (logoUrl) {
                    if (!finalRequirements.brand_assets) finalRequirements.brand_assets = { theme_color: "#10B981" };
                    finalRequirements.brand_assets.logo_url = logoUrl;
                }
            }

            const res = await fetch(`/api/projects/${id}/requirements`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalRequirements),
                credentials: "include"
            });

            if (res.ok) {
                const getRes = await fetch(`/api/projects/${id}`, { credentials: "include" });
                if (getRes.ok && getRes.headers.get("content-type")?.includes("application/json")) {
                    const refreshed = await getRes.json();
                    setProject(refreshed);
                }
                setIsEditing(false);
                toast.success("Strategic Blueprint Synchronized!");
            } else {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errData = await res.json();
                    toast.error(errData.error || "Failed to synchronize updates");
                } else {
                    const errText = await res.text();
                    toast.error(`Server error: ${errText.substring(0, 100)}`);
                }
            }
        } catch (err: any) {
            console.error("SYNC_ERROR:", err);
            toast.error(`Sync error: ${err.message || "Unknown communication failure"}`);
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusColor = (status?: string) => {
        if (!status) return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        switch (status.toUpperCase()) {
            case 'LIVE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'REVIEW': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'PAYMENT_PENDING': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'ONBOARDING': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-zinc-500 animate-pulse uppercase tracking-tighter italic">Loading Blueprint...</div>;
    if (error || !project) return <div className="p-20 text-center font-bold text-red-500">Error: {error || "Project Not Found"}</div>;

    const req = project.requirements || {};
    const planName = project.selected_plan || "Custom Plan";

    return (
        <div className="max-w-6xl mx-auto space-y-6 pt-10 pb-12 bg-[#FAFAFC] min-h-screen px-4 md:px-0">
            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="flex items-center gap-5">
                    <Link 
                        href="/app/projects"
                        className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center hover:bg-zinc-50 transition-all text-zinc-400 hover:text-zinc-800 shadow-sm shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 -ml-0.5" />
                    </Link>
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                            <span className="px-3 py-0.5 text-[10px] font-bold rounded-full bg-violet-600 text-white">
                                {project.status === 'REVIEW' ? 'In Review' : project.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-semibold text-zinc-500">
                                {project.subscription_status === 'active' ? 'Active Subscription' : 'No Active Subscription'}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">{project.title}</h1>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    {!project.client_edit_allowed && (
                        <div className="flex items-center gap-2 px-5 py-3 bg-zinc-50 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-zinc-200">
                           <Lock className="w-4 h-4" /> Finalized
                        </div>
                    )}
                    <button 
                        onClick={() => project.client_edit_allowed && setIsEditing(true)}
                        disabled={!project.client_edit_allowed}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 text-sm ${
                            project.client_edit_allowed 
                            ? 'bg-violet-600 text-white hover:bg-violet-700' 
                            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" /> Update Blueprint
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-12 gap-6">
                {/* Main Content (Left Col) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* Project Vision / The Grand Strategy */}
                    <div className="bg-white rounded-2xl p-7 shadow-sm border border-zinc-100/80">
                        <div className="flex items-start gap-4 mb-3">
                            <div className="w-11 h-11 rounded-[0.85rem] bg-violet-600 flex items-center justify-center shrink-0 shadow-sm">
                                <Lightbulb className="w-5 h-5 text-white" />
                            </div>
                            <div className="pt-0.5">
                                <h2 className="text-[15px] font-bold text-zinc-900 leading-tight">The Grand Strategy</h2>
                                <p className="text-[13px] font-medium text-zinc-400">Project Vision & Direction</p>
                            </div>
                        </div>
                        <p className="text-[13px] text-zinc-500 leading-relaxed whitespace-pre-wrap pt-2">
                            {req.project_vision || "Our ecommerce platform targets the Malaysian market with a comprehensive approach to digital retail. We focus on localized payment gateways, Bahasa Malaysia support, and partnerships with local logistics providers. The strategy encompasses mobile-first design, social commerce integration, and compliance with Malaysian digital commerce regulations for sustainable growth."}
                        </p>
                    </div>

                    {/* Business Parameters */}
                    <div className="bg-white rounded-2xl p-7 shadow-sm border border-zinc-100/80">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-11 h-11 rounded-[0.85rem] bg-violet-600 flex items-center justify-center shrink-0 shadow-sm">
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div className="pt-0.5">
                                <h2 className="text-[15px] font-bold text-zinc-900 leading-tight">Business Parameters</h2>
                                <p className="text-[13px] font-medium text-zinc-400">Core business information</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4 mb-4">
                            {/* Contact */}
                            <div className="space-y-3">
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <MessageSquare className="w-3 h-3 text-zinc-400" /> CONTACT
                                </div>
                                <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-zinc-50">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">EMAIL</p>
                                    <p className="text-[13px] font-semibold text-zinc-800 break-words">{req.business_email || "akmal@gmail.com"}</p>
                                </div>
                                <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-zinc-50">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">HOURS</p>
                                    <p className="text-[13px] font-semibold text-zinc-800">{req.operation_hours || "6 – 10 PM"}</p>
                                </div>
                            </div>

                            {/* HQ Location */}
                            <div className="space-y-3">
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <MapPin className="w-3 h-3 text-zinc-400" /> HQ LOCATION
                                </div>
                                <div className="bg-[#F8FAFC] rounded-2xl p-4 h-[calc(100%-1.75rem)] border border-zinc-50">
                                    <p className="text-[13px] font-semibold text-zinc-800 leading-relaxed">
                                        {req.business_address || "No 1, Jln Beruang Rusia"}
                                    </p>
                                </div>
                            </div>

                            {/* Social */}
                            <div className="space-y-3">
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <Globe2 className="w-3 h-3 text-zinc-400" /> SOCIAL
                                </div>
                                <div className="bg-[#F8FAFC] rounded-2xl p-3 border border-zinc-50 h-[calc(100%-1.75rem)] flex flex-col justify-between">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold text-violet-600 uppercase tracking-widest">FACEBOOK</span>
                                        <a href={req.social_media?.facebook || "#"} target="_blank" className="text-[11px] font-medium text-zinc-500 truncate hover:text-violet-600 transition-colors">
                                            {req.social_media?.facebook || "https://example.com"}
                                        </a>
                                    </div>
                                    <div className="flex flex-col gap-0.5 pt-2">
                                        <span className="text-[9px] font-bold text-violet-600 uppercase tracking-widest">INSTAGRAM</span>
                                        <a href={req.social_media?.instagram || "#"} target="_blank" className="text-[11px] font-medium text-zinc-500 truncate hover:text-violet-600 transition-colors">
                                            {req.social_media?.instagram || "https://example.com"}
                                        </a>
                                    </div>
                                    <div className="flex flex-col gap-0.5 pt-2">
                                        <span className="text-[9px] font-bold text-violet-600 uppercase tracking-widest">TIKTOK</span>
                                        <a href={req.social_media?.tiktok || "#"} target="_blank" className="text-[11px] font-medium text-zinc-500 truncate hover:text-violet-600 transition-colors">
                                            {req.social_media?.tiktok || "https://example.com"}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Design Benchmark */}
                        <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 mt-6 flex justify-between items-center">
                            <div>
                                <p className="text-[9px] font-bold text-violet-600 uppercase tracking-widest mb-0.5">DESIGN BENCHMARK</p>
                                <a href={req.competitor_ref || "#"} target="_blank" className="text-[13px] font-semibold text-zinc-900 hover:text-violet-600 transition-colors">
                                    {req.competitor_ref || "https://example.com"}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Platform Architecture */}
                    <div className="bg-white rounded-2xl p-7 shadow-sm border border-zinc-100/80">
                        <div className="flex items-start gap-4 mb-8">
                            <div className="w-11 h-11 rounded-[0.85rem] bg-violet-600 flex items-center justify-center shrink-0 shadow-sm">
                                <Layout className="w-5 h-5 text-white" />
                            </div>
                            <div className="pt-0.5">
                                <h2 className="text-[15px] font-bold text-zinc-900 leading-tight">Platform Architecture</h2>
                                <p className="text-[13px] font-medium text-zinc-400">Pages, modules & protocols</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                            {/* Sitemap */}
                            <div>
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 ml-1 mb-5">
                                    <Globe className="w-3 h-3 text-zinc-400" /> SITEMAP
                                </div>
                                <div className="space-y-4 ml-1">
                                    {(req.sitemap && req.sitemap.length > 0 ? req.sitemap : ["Home", "About Us", "Contact", "Profile", "Logout"]).map((page, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <span className="text-[11px] font-bold text-zinc-400 w-5 font-mono">
                                                {(idx + 1).toString().padStart(2, '0')}
                                            </span>
                                            <div className="h-[2px] w-6 bg-[#F1F5F9]"></div>
                                            <span className="text-[13px] font-semibold text-zinc-800">{page}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Logic Modules & Protocol */}
                            <div className="space-y-7">
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 ml-1 mb-3">
                                        <Cpu className="w-3 h-3 text-zinc-400" /> LOGIC MODULES
                                    </div>
                                    <div className="space-y-2">
                                        {(req.features && req.features.length > 0 ? req.features : ["Appointment Scheduler", "Service Catalog", "Location Mapping", "Staff Directory"]).map((feat, idx) => (
                                            <div key={idx} className="bg-[#F8FAFC] border border-zinc-100 rounded-xl px-4 py-2.5 flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-600"></div>
                                                <span className="text-[13px] font-semibold text-zinc-800">{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-violet-50 rounded-xl p-5 border border-violet-100">
                                    <p className="text-[9px] font-bold text-violet-600 uppercase tracking-widest mb-3">CUSTOM PROTOCOL</p>
                                    <div className="space-y-2">
                                        {req.custom_needs ? (
                                             <p className="text-xs text-violet-600 font-semibold leading-relaxed whitespace-pre-wrap">
                                                 {req.custom_needs}
                                             </p>
                                        ) : (
                                            <div className="space-y-2.5">
                                                <div className="h-1.5 bg-violet-200 rounded-full w-full"></div>
                                                <div className="h-1.5 bg-violet-200 rounded-full w-5/6"></div>
                                                <div className="h-1.5 bg-violet-200 rounded-full w-4/6"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (Right Col) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Active Plan Card */}
                    <div className="bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-2xl p-7 text-white shadow-sm relative overflow-hidden h-auto flex flex-col">
                        <div className="flex items-center gap-2 text-white/80 text-[10px] uppercase font-bold tracking-widest w-full mb-3 relative z-10">
                            <Star className="w-3 h-3 text-white" /> ACTIVE PLAN
                        </div>
                        <h2 className="text-2xl font-extrabold mb-5 tracking-tight relative z-10">{planName}</h2>
                        <div className="space-y-2 relative z-10">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
                                <ShieldCheck className="w-4 h-4 text-white" />
                                <span className="text-[12px] font-semibold tracking-wide">Enterprise Security</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
                                <Zap className="w-4 h-4 text-white" />
                                <span className="text-[12px] font-semibold tracking-wide">Priority Sync</span>
                            </div>
                        </div>
                        {/* Decorative background sweeps */}
                        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="absolute bottom-0 right-0 -mr-6 -mb-6 w-24 h-24 bg-black/10 rounded-full blur-xl pointer-events-none"></div>
                    </div>

                    {/* Environment Access */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100/80">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 ml-1">ENVIRONMENT ACCESS</p>
                        <div className="space-y-2">
                            {project.dev_url ? (
                                <a href={project.dev_url} target="_blank" className="flex items-center justify-between bg-[#F8FAFC] p-4 rounded-[14px] hover:bg-zinc-100 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <Box className="w-4 h-4 text-zinc-400 group-hover:text-violet-600" />
                                        <span className="text-[13px] font-semibold text-zinc-600 group-hover:text-zinc-900">Build in Progress...</span>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-zinc-300" />
                                </a>
                            ) : (
                                <div className="flex items-center justify-between bg-[#F8FAFC] p-4 rounded-[14px]">
                                    <div className="flex items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                        <span className="text-[13px] font-semibold text-zinc-500">Build in Progress...</span>
                                    </div>
                                </div>
                            )}

                            {project.prod_url ? (
                                <a href={project.prod_url} target="_blank" className="flex items-center justify-between bg-[#F8FAFC] p-4 rounded-[14px] hover:bg-zinc-100 transition-colors group border border-zinc-50">
                                    <div className="flex items-center gap-3">
                                        <Rocket className="w-4 h-4 text-zinc-400 group-hover:text-violet-600" />
                                        <span className="text-[13px] font-semibold text-zinc-600 group-hover:text-zinc-900">Live Status</span>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-zinc-300" />
                                </a>
                            ) : (
                                <div className="flex items-center gap-3 bg-[#F8FAFC] p-4 rounded-[14px]">
                                    <Pen className="w-4 h-4 text-zinc-400" />
                                    <span className="text-[13px] font-semibold text-zinc-500">Draft Status</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Records & Branding */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100/80">
                        <div className="flex items-center gap-3 mb-5 ml-1">
                            <div className="w-8 h-8 rounded-[0.6rem] bg-violet-600 flex items-center justify-center shrink-0">
                                <Folder className="w-4 h-4 text-white fill-white" />
                            </div>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-900">Records & Branding</h3>
                        </div>
                        
                        <div className="space-y-1">
                             <div className="flex items-center justify-between group py-1.5 px-2">
                                 <div className="flex items-center gap-3">
                                     {/* Simple document outline */}
                                     <FileText className="w-4 h-4 text-zinc-400" />
                                     <span className="text-[13px] font-medium text-zinc-800">SSM Record</span>
                                 </div>
                                 <button 
                                     onClick={() => req.payment_setup?.ssm_url && setActiveAsset(getAssetUrl(req.payment_setup.ssm_url))}
                                     disabled={!req.payment_setup?.ssm_url}
                                     className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 transition-colors"
                                 >
                                     <Download className="w-3.5 h-3.5" />
                                 </button>
                             </div>
                             <div className="h-[1px] w-full bg-zinc-100 my-1"></div>
                             <div className="flex items-center justify-between group py-1.5 px-2">
                                 <div className="flex items-center gap-3">
                                     <Globe className="w-4 h-4 text-zinc-400" />
                                     <span className="text-[13px] font-medium text-zinc-800">Brand Identity</span>
                                 </div>
                                 <button 
                                     onClick={() => req.brand_assets?.logo_url && setActiveAsset(getAssetUrl(req.brand_assets.logo_url))}
                                     disabled={!req.brand_assets?.logo_url}
                                     className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30 transition-colors"
                                 >
                                     <Download className="w-3.5 h-3.5" />
                                 </button>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* UPDATE MODAL OVERLAY (COMPREHENSIVE BLUEPRINT EDITOR) */}
            {isEditing && (
              <div className="fixed inset-0 z-[150] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300 overflow-y-auto">
                 <div className="bg-white w-full max-w-4xl min-h-[70vh] md:max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl border-2 border-zinc-200 flex flex-col relative my-8">
                    
                    {/* Modal Header & Progress */}
                    <div className="p-8 md:p-10 border-b-2 border-zinc-100 bg-white">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <div className="flex items-center gap-3 text-zinc-400 font-black text-[10px] uppercase tracking-widest mb-2 italic underline decoration-indigo-500/30">
                                    <Cpu className="w-4 h-4" /> Intelligence Sync Engine
                                </div>
                                <h2 className="text-4xl font-black uppercase tracking-tight text-zinc-900">Blueprint Editor</h2>
                            </div>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="w-12 h-12 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-red-500 rounded-2xl transition-all font-black border-2 border-zinc-100"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Progress Bar (1-6) */}
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-700 ${step >= i ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Form Content */}
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white custom-scrollbar">
                        <div className="max-w-2xl mx-auto">
                            {step === 1 && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-zinc-900 uppercase">1. Financial Gateway</h2>
                                        <p className="text-zinc-500 font-medium text-sm">Coordinate your site's payment infrastructure.</p>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setEditData({ ...editData, requirements: { ...editData.requirements, payment_setup: { ...editData.requirements?.payment_setup, has_toyyibpay: true } } })}
                                            className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${editData.requirements?.payment_setup?.has_toyyibpay ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                                        >
                                            Established ToyyibPay
                                        </button>
                                        <button 
                                            onClick={() => setEditData({ ...editData, requirements: { ...editData.requirements, payment_setup: { ...editData.requirements?.payment_setup, has_toyyibpay: false } } })}
                                            className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${!editData.requirements?.payment_setup?.has_toyyibpay ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                                        >
                                            New Registration Request
                                        </button>
                                    </div>

                                    {editData.requirements?.payment_setup?.has_toyyibpay ? (
                                        <div className="space-y-4 pt-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Secret Key</label>
                                                <input 
                                                    type="password"
                                                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono text-sm"
                                                    value={editData.requirements?.payment_setup?.secret_key || ""}
                                                    onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, payment_setup: { ...editData.requirements?.payment_setup, secret_key: e.target.value, has_toyyibpay: true } } })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Category Code</label>
                                                <input 
                                                    type="text"
                                                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono text-sm"
                                                    value={editData.requirements?.payment_setup?.category_code || ""}
                                                    onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, payment_setup: { ...editData.requirements?.payment_setup, category_code: e.target.value, has_toyyibpay: true } } })}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pt-4 p-10 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50 flex flex-col items-center justify-center gap-6">
                                            <UploadCloud className="w-12 h-12 text-zinc-200" />
                                            <div className="text-center">
                                                <p className="font-black text-zinc-900 uppercase tracking-widest text-xs mb-1">Official SSM Document</p>
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase">Format: PDF, JPG, PNG (Max 10MB)</p>
                                                {ssmFile && <p className="text-[10px] text-indigo-600 font-black mt-3 uppercase tracking-widest">Ready: {ssmFile.name}</p>}
                                            </div>
                                            <input 
                                                type="file" 
                                                className="block w-full max-w-xs text-xs text-zinc-500 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-zinc-900 file:text-white hover:file:bg-black transition-all cursor-pointer" 
                                                onChange={(e) => setSsmFile(e.target.files?.[0] || null)}
                                                accept=".pdf,.png,.jpg,.jpeg" 
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-zinc-900 uppercase">2. Logic Requirements</h2>
                                        <p className="text-zinc-500 font-medium text-sm">Select the operational modules for the platform.</p>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-1 gap-4">
                                        {[
                                            { title: "Commercial", items: ["Shopping Cart & Checkout", "Payment Gateway Sync", "Promo Code System", "Order Notifications"] },
                                            { title: "Service & Bookings", items: ["Appointment Scheduler", "Service Catalog", "Location Mapping", "Staff Directory"] },
                                            { title: "Engagement", items: ["Blog / News Engine", "FAQ Hub", "Floating Chat Support", "Lead Generation Forms"] }
                                        ].map((cat, idx) => (
                                            <div key={idx} className="bg-zinc-50 p-6 rounded-2xl border-2 border-zinc-100">
                                                <h3 className="font-black uppercase tracking-widest text-[9px] text-zinc-400 mb-4 font-mono">{cat.title}</h3>
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    {cat.items.map(item => (
                                                        <label key={item} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer group ${ (editData.requirements?.features || []).includes(item) ? 'bg-white border-zinc-900 text-zinc-900 shadow-sm' : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-100'}`}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={(editData.requirements?.features || []).includes(item)}
                                                                onChange={() => {
                                                                    const current = editData.requirements?.features || [];
                                                                    const next = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
                                                                    setEditData({ ...editData, requirements: { ...editData.requirements, features: next } });
                                                                }}
                                                                className="w-4 h-4 rounded-md border-zinc-300 text-zinc-900 focus:ring-0"
                                                            />
                                                            <span className="text-[11px] font-bold uppercase tracking-tight">{item}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 underline decoration-indigo-500/20">Additional Custom Directives</label>
                                        <textarea 
                                            className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-6 py-4 text-zinc-700 font-bold focus:outline-none focus:border-zinc-900 focus:bg-white transition-all min-h-[140px] text-sm"
                                            value={editData.requirements?.custom_needs || ""}
                                            onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, custom_needs: e.target.value } })}
                                            placeholder="Specify any unique technical overrides required..."
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-zinc-900 uppercase">3. Structural Identity</h2>
                                        <p className="text-zinc-500 font-medium text-sm">Define the brand assets and site architecture.</p>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        <div className="p-8 bg-zinc-50 border-2 border-zinc-100 rounded-3xl space-y-6">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">Proposed Navigation Tree</h3>
                                            <div className="space-y-2">
                                                {(editData.requirements?.sitemap || []).map((page, idx) => (
                                                    <div key={idx} className="flex gap-2 group">
                                                        <input 
                                                            type="text" 
                                                            value={page}
                                                            onChange={(e) => {
                                                                 const newSitemap = [...(editData.requirements?.sitemap || [])];
                                                                 newSitemap[idx] = e.target.value;
                                                                 setEditData({ ...editData, requirements: { ...editData.requirements, sitemap: newSitemap } });
                                                            }}
                                                            className="flex-1 bg-white border-2 border-zinc-200 rounded-xl px-4 py-3 text-xs font-black text-zinc-700 focus:border-zinc-900 outline-none"
                                                        />
                                                        <button 
                                                            onClick={() => {
                                                                const newSitemap = (editData.requirements?.sitemap || []).filter((_, i) => i !== idx);
                                                                setEditData({ ...editData, requirements: { ...editData.requirements, sitemap: newSitemap } });
                                                            }}
                                                            className="p-3 text-zinc-300 hover:text-red-500 transition-all"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => {
                                                        const current = editData.requirements?.sitemap || [];
                                                        setEditData({ ...editData, requirements: { ...editData.requirements, sitemap: [...current, "New Sub-Module"] } });
                                                    }}
                                                    className="w-full py-4 mt-2 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:border-zinc-400 hover:text-zinc-600 transition-all"
                                                >
                                                    + Add Module
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="p-8 bg-zinc-50 border-2 border-zinc-100 rounded-3xl space-y-4">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono underline">Visual Benchmark</h3>
                                                <input 
                                                    type="url" 
                                                    value={editData.requirements?.competitor_ref || ""}
                                                    onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, competitor_ref: e.target.value } })}
                                                    className="w-full bg-white border-2 border-zinc-100 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 focus:border-zinc-900 outline-none"
                                                    placeholder="https://example.com"
                                                />
                                            </div>

                                            <div className="p-8 bg-zinc-50 border-2 border-zinc-100 rounded-3xl">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono underline mb-6">Logo Asset</h3>
                                                <div className="bg-white p-4 rounded-2xl border-2 border-zinc-100 shadow-sm flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 bg-zinc-50 border-2 border-zinc-100 rounded-xl flex items-center justify-center overflow-hidden">
                                                        {logoPreview || editData.requirements?.brand_assets?.logo_url ? (
                                                            <img 
                                                                src={logoPreview || editData.requirements?.brand_assets?.logo_url || ''} 
                                                                alt="Logo" 
                                                                className="w-full h-full object-contain p-2" 
                                                            />
                                                        ) : (
                                                            <Camera className="w-6 h-6 text-zinc-200" />
                                                        )}
                                                    </div>
                                                    <label className="w-full px-4 py-3 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-black cursor-pointer text-center shadow-lg">
                                                        Update Logo
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0] || null;
                                                                setLogoFile(file);
                                                                if (file) setLogoPreview(URL.createObjectURL(file));
                                                            }}
                                                            accept=".png,.jpg,.jpeg" 
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-zinc-900 uppercase">4. Operations Sync</h2>
                                        <p className="text-zinc-500 font-medium text-sm">Official contact data and social synchronization.</p>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="p-8 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] space-y-4">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Primary Identifier (WA)</label>
                                            <input 
                                                type="text" 
                                                value={project.whatsapp_number || ""}
                                                onChange={(e) => setProject({ ...project, whatsapp_number: e.target.value })}
                                                className="w-full bg-white border-2 border-zinc-100 rounded-xl px-5 py-4 text-zinc-900 font-black text-lg focus:border-zinc-900 outline-none"
                                                placeholder="60123456789"
                                            />
                                        </div>

                                        <div className="p-8 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Communication Nodes</h3>
                                            <input 
                                                type="email" 
                                                placeholder="Business Email"
                                                value={editData.requirements?.business_email || ""}
                                                onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, business_email: e.target.value } })}
                                                className="w-full bg-white border-2 border-zinc-100 rounded-xl px-4 py-3 text-xs font-bold focus:border-zinc-900 outline-none"
                                            />
                                            <textarea 
                                                placeholder="Business Address"
                                                value={editData.requirements?.business_address || ""}
                                                onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, business_address: e.target.value } })}
                                                className="w-full bg-white border-2 border-zinc-100 rounded-xl px-4 py-3 text-xs font-bold min-h-[80px] focus:border-zinc-900 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-8 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">Social Hooks</h3>
                                            <input type="text" placeholder="Facebook Link" value={editData.requirements?.social_media?.facebook || ""} onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, social_media: { ...editData.requirements?.social_media, facebook: e.target.value } } })} className="w-full bg-white border-2 border-zinc-100 rounded-xl px-4 py-3 text-[10px] font-bold focus:border-zinc-900 outline-none" />
                                            <input type="text" placeholder="Instagram Link" value={editData.requirements?.social_media?.instagram || ""} onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, social_media: { ...editData.requirements?.social_media, instagram: e.target.value } } })} className="w-full bg-white border-2 border-zinc-100 rounded-xl px-4 py-3 text-[10px] font-bold focus:border-zinc-900 outline-none" />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">Operations</h3>
                                            <input 
                                                type="text" 
                                                placeholder="Operation Hours"
                                                value={editData.requirements?.operation_hours || ""}
                                                onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, operation_hours: e.target.value } })}
                                                className="w-full bg-white border-2 border-zinc-100 rounded-xl px-4 py-4 text-xs font-bold focus:border-zinc-900 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-zinc-900 uppercase">5. Domain Strategy</h2>
                                        <p className="text-zinc-500 font-medium text-sm">Coordinate your platform's online identifier.</p>
                                    </div>
                                    
                                    <div className="space-y-6 bg-zinc-50 p-8 rounded-[2rem] border-2 border-zinc-100">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-900 mb-2 font-mono underline decoration-indigo-500/40">Primary Identifier Choice</label>
                                            <input 
                                                type="text" 
                                                value={editData.requirements?.domain_requested || ""}
                                                onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, domain_requested: e.target.value } })}
                                                className="w-full bg-white border-2 border-zinc-200 rounded-2xl px-6 py-5 text-zinc-900 font-black text-xl shadow-sm focus:border-zinc-900 outline-none"
                                                placeholder="brandname.com"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[9px] font-black uppercase text-zinc-400 mb-2">Secondary Proto-Choice</label>
                                                <input type="text" value={editData.requirements?.domain_2 || ""} onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, domain_2: e.target.value } })} className="w-full bg-white border-2 border-zinc-100 rounded-xl px-4 py-3 text-xs font-bold focus:border-zinc-900 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-black uppercase text-zinc-400 mb-2">Tertiary Proto-Choice</label>
                                                <input type="text" value={editData.requirements?.domain_3 || ""} onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, domain_3: e.target.value } })} className="w-full bg-white border-2 border-zinc-100 rounded-xl px-4 py-3 text-xs font-bold focus:border-zinc-900 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 6 && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-zinc-900 uppercase">6. Global Objective</h2>
                                        <p className="text-zinc-500 font-medium text-sm">The core strategic vision driving this project.</p>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="p-8 bg-zinc-50 border-2 border-zinc-100 rounded-3xl">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-900 mb-4 font-mono underline">Platform Identity Title</label>
                                            <input 
                                                type="text" 
                                                value={editData.title || ""}
                                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                                className="w-full bg-white border-2 border-zinc-100 rounded-2xl px-6 py-5 text-zinc-900 font-black text-xl shadow-sm focus:border-zinc-900 outline-none"
                                            />
                                        </div>
                                        
                                        <div className="p-8 bg-zinc-50 border-2 border-zinc-100 rounded-[2.5rem]">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-900 mb-4 font-mono underline">Strategic Vision (Blueprint Summary)</label>
                                            <textarea 
                                                className="w-full bg-white border-2 border-zinc-100 rounded-[2rem] px-8 py-8 text-zinc-700 font-bold focus:outline-none focus:border-zinc-900 min-h-[300px] text-lg leading-relaxed shadow-sm custom-scrollbar"
                                                value={editData.requirements?.project_vision || ""}
                                                onChange={(e) => setEditData({ ...editData, requirements: { ...editData.requirements, project_vision: e.target.value } })}
                                                placeholder="Define the ultimate objective..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal Footer Controls */}
                    <div className="p-8 md:p-10 border-t-2 border-zinc-50 bg-white flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-4">
                            {step > 1 && (
                                <button 
                                    onClick={prevStep}
                                    className="px-8 py-4 bg-zinc-50 border-2 border-zinc-100 text-zinc-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-100 transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Previous
                                </button>
                            )}
                        </div>

                        <div className="flex gap-4 flex-1 md:flex-none">
                            {step < 6 ? (
                                <button 
                                    onClick={nextStep}
                                    className="flex-1 md:flex-none px-12 py-5 bg-zinc-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                                >
                                    Proceed <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button 
                                    disabled={isSaving}
                                    onClick={handleUpdate}
                                    className="flex-1 md:flex-none px-12 py-5 bg-zinc-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-black transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {isSaving ? "Synchronizing..." : "Synchronize Blueprint"}
                                    <Rocket className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                 </div>
              </div>
            )}
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
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Viewing Global Repository Asset</p>
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
        </div>
    );
}
