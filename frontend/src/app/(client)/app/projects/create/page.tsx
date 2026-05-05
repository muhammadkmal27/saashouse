"use client";

import { Suspense, useState } from "react";
import { ArrowRight, ArrowLeft, UploadCloud, CheckCircle2, Shield, Search, Loader2, Paperclip, Zap, LayoutGrid, X } from "lucide-react";
import Link from "next/link";
import { T } from "@/components/Translate";
import { useRouter, useSearchParams } from "next/navigation";
import { getCookie, deleteCookie } from "@/utils/cookies";
import { toast } from "sonner";

import { fetchPrices, DEFAULT_PRICES } from "@/utils/pricing";
import { useEffect } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

// Form State Types
interface OnboardingData {
  selected_plan: string;
  payment_setup: {
    has_toyyibpay: boolean;
    secret_key?: string;
    category_code?: string;
  };
  features: string[];
  custom_needs: string;
  whatsapp_number: string;
  sitemap: string[];
  brand_assets: {
    theme_color: string;
  };
  domain_requested: string;
  domain_2: string;
  domain_3: string;
  custom_features: string[];
  competitor_ref: string;
  project_title: string;
  social_media: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
  business_email: string;
  business_address: string;
  operation_hours: string;
  project_vision: string;
}

function DomainChecker({ value, onChange, label, lang }: { value: string, onChange: (val: string) => void, label: string, lang: string }) {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "unavailable" | "error">("idle");

  const checkDomain = async (domain: string) => {
    if (!domain || domain.length < 3) return;
    setStatus("checking");
    try {
      const res = await fetch(`/api/tools/domain-check?domain=${encodeURIComponent(domain)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Check failed");
      const data = await res.json();
      if (data.status === "available") {
        setStatus("available");
      } else {
        setStatus("unavailable");
      }
    } catch (e) {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">{label}</label>
      <div className="relative group">
        <input 
          type="text"
          className={`w-full bg-white border rounded-2xl px-6 py-4 text-zinc-900 font-black focus:outline-none shadow-sm transition-all ${
            status === "available" ? "border-violet-500 ring-4 ring-violet-500/5" : 
            status === "unavailable" ? "border-red-500 ring-4 ring-red-500/5" : 
            "border-zinc-200 focus:border-violet-500"
          }`}
          placeholder={lang === "BM" ? "cth., namajenama.com atau namajenama.my" : "e.g., brandname.com or brandname.my"}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setStatus("idle");
          }}
          onBlur={() => checkDomain(value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              checkDomain(value);
            }
          }}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {status === "checking" && <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />}
          {status === "available" && <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-2 py-1 rounded-md border border-violet-100"><T en="Available" bm="Boleh Diguna" /></span>}
          {status === "unavailable" && <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100"><T en="Unavailable" bm="Tidak Tersedia" /></span>}
          {status === "idle" && value.length > 3 && (
             <button 
               type="button"
               onClick={() => checkDomain(value)}
               className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-violet-600 transition-colors"
             >
               <T en="Check" bm="Semak" />
             </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateProjectForm({ lang }: { lang: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPlan = searchParams.get("plan");

  const [step, setStep] = useState(0); // Always start at step 0 (Select Your Plan) as requested
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ssmFile, setSsmFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, string>>(DEFAULT_PRICES);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetchPrices().then(setDynamicPrices);
    fetch("/api/status")
      .then(r => r.json())
      .then(setStatus)
      .catch(console.error);
  }, []);

  const otpMode = status?.otp_mode_active;
  const otpDeposit = status?.otp_deposit_price || "200";
  const otpFinal = status?.otp_final_price || "500";
  const otpTotal = Number(otpDeposit) + Number(otpFinal);

  const [formData, setFormData] = useState<OnboardingData>({
    selected_plan: urlPlan || "",
    payment_setup: { has_toyyibpay: false },
    features: [],
    custom_needs: "",
    whatsapp_number: "",
    sitemap: ["Home", "About Us", "Contact"],
    brand_assets: { theme_color: "#10B981" },
    domain_requested: "",
    domain_2: "",
    domain_3: "",
    custom_features: [],
    competitor_ref: "",
    project_title: "",
    social_media: { facebook: "", instagram: "", tiktok: "" },
    business_email: "",
    business_address: "",
    operation_hours: "",
    project_vision: "",
  });

  const nextStep = () => setStep((p) => Math.min(p + 1, 6)); // Increased to 6 steps (Total 7)
  const prevStep = () => setStep((p) => Math.max(p - 1, 0));

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleSitemapChange = (index: number, value: string) => {
    const newSitemap = [...formData.sitemap];
    newSitemap[index] = value;
    setFormData({ ...formData, sitemap: newSitemap });
  };

  const handleCustomFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.custom_features];
    newFeatures[index] = value;
    setFormData({ ...formData, custom_features: newFeatures });
  };

  const handleFileUpload = async (file: File) => {
    // Client-side validation for better UX
    if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 10MB capacity.`);
        throw new Error("File too large");
    }

    const data = new FormData();
    data.append("file", file);
    const csrfToken = getCookie("csrf_token") || "";

    try {
        const res = await fetch("/api/assets/upload", {
            method: "POST",
            body: data,
            headers: {
                "X-CSRF-Token": csrfToken,
            },
            credentials: "include",
        });
        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Upload failed: ${res.status} - ${errBody}`);
        }
        const result = await res.json();
        if (!result.success || !result.files || result.files.length === 0) {
            throw new Error("Server responded successfully but no file URL was returned.");
        }
        return result.files[0]; 
    } catch (e: any) {
        console.error("Critical Upload Error:", e.message);
        toast.error(`Upload failed: ${e.message}`);
        throw e; 
    }
  };

  const [loadingText, setLoadingText] = useState("");

  const submitForm = async () => {
    // 1. Validation for mandatory fields
    const missingFields = [];
    if (!formData.selected_plan) missingFields.push("Project Plan");
    if (!formData.project_title) missingFields.push("Project Title");
    if (formData.whatsapp_number.length < 7) missingFields.push("WhatsApp Number (Min 7 digits)");
    if (!formData.domain_requested) missingFields.push("Primary Domain Choice");
    if (!formData.project_vision) missingFields.push("Project Vision (The Big Idea)");

    if (missingFields.length > 0) {
        toast.error(`Please complete: ${missingFields.join(", ")}`, {
            description: "This information is required to initialize your project build.",
            duration: 5000,
        });
        return;
    }

    setIsSubmitting(true);
    setLoadingText(lang === "BM" ? "Mengesahkan Data..." : "Validating Data...");
    const csrfToken = getCookie("csrf_token") || "";
    
    try {
        let finalRequirements = JSON.parse(JSON.stringify(formData));
        
        if (ssmFile && !formData.payment_setup.has_toyyibpay) {
            setLoadingText(lang === "BM" ? "Memuat naik Dokumen SSM..." : "Uploading SSM Document...");
            const ssmUrl = await handleFileUpload(ssmFile);
            finalRequirements.payment_setup.ssm_url = ssmUrl;
        }

        if (logoFile) {
            setLoadingText(lang === "BM" ? "Memuat naik Logo..." : "Uploading Brand Logo...");
            const logoUrl = await handleFileUpload(logoFile);
            finalRequirements.brand_assets.logo_url = logoUrl;
        }

        setLoadingText(lang === "BM" ? "Menyegerakkan Seni Bina..." : "Syncing Architecture...");
        const whatsapp = `60${finalRequirements.whatsapp_number.replace(/^60/, "").replace(/^0/, "")}`;
        
        // Backend strictly requires 10-15 chars for whatsapp_number
        if (whatsapp.length < 10) {
            toast.error(lang === "BM" ? "Nombor WhatsApp tidak sah (minima 10 angka termasuk 60)" : "Invalid WhatsApp number (min 10 digits including 60)");
            setIsSubmitting(false);
            return;
        }
        
        delete finalRequirements.whatsapp_number;
        
        const plan = formData.selected_plan;
        
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify({
            title: formData.project_title || `Project: ${formData.domain_requested || 'Untitled'}`,
            description: "",
            whatsapp_number: whatsapp,
            selected_plan: plan,
            requirements: {
                ...finalRequirements,
                total_features: [...formData.features, ...formData.custom_features]
            }
          }),
      });

      if (res.ok) {
        deleteCookie("next-plan");
        setIsSuccess(true);
        toast.success("Strategic requirements synchronized!");
      } else {
        const errorText = await res.text();
        console.error("Submission failed:", res.status, errorText);
        toast.error(`Architecture Sync Failed: ${errorText.substring(0, 50)}`);
      }
    } catch (e: any) {
      console.error("Fetch error:", e);
      toast.error(`System Protocol Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
      setLoadingText("");
    }
  };

  if (isSuccess) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[80vh] overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-purple-50/40 to-violet-50/60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-lg px-4">
          {/* Circular icon with ripple */}
          <div className="relative">
            <div className="absolute inset-0 scale-125 bg-violet-200/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 scale-110 bg-purple-200/20 rounded-full" />
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/30 relative">
              <svg className="w-9 h-9 lg:w-11 lg:h-11 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              <span className="text-zinc-900"><T en="Project" bm="Projek" /></span>{" "}
              <span className="text-violet-500"><T en="Successfully" bm="Berjaya" /></span>
              <br />
              <span className="text-zinc-900"><T en="Submitted" bm="Dihantar" /></span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-zinc-500 text-[13px] lg:text-sm leading-relaxed max-w-sm px-4 lg:px-0">
            <T
              en="Our development team is currently reviewing your project requirements in detail."
              bm="Pasukan pembangunan kami sedang menyemak keperluan projek anda secara terperinci."
            />
          </p>

          {/* Important Instruction card */}
          <div className="w-full bg-amber-50/80 backdrop-blur-sm border border-amber-200/80 p-4 lg:p-5 rounded-2xl text-left shadow-sm">
            <div className="flex items-center gap-2 mb-2 lg:mb-3">
              <Shield className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-500 shrink-0" />
              <p className="font-black uppercase tracking-[0.15em] text-[9px] lg:text-[10px] text-amber-700">
                <T en="Important Instruction" bm="Arahan Penting" />
              </p>
            </div>
            <p className="text-[13px] lg:text-sm text-zinc-700 leading-relaxed">
              <T
                en={<>A developer will contact you via <span className="text-violet-600 font-semibold">WhatsApp</span> once the review is complete. Please <span className="underline decoration-2 underline-offset-2 font-semibold text-zinc-900">do not make any payments</span> until you have been officially contacted by our developer via WhatsApp.</>}
                bm={<>Pembangun akan menghubungi anda melalui <span className="text-violet-600 font-semibold">WhatsApp</span> sebaik sahaja semakan selesai. Sila <span className="underline decoration-2 underline-offset-2 font-semibold text-zinc-900">jangan buat sebarang pembayaran</span> sehingga anda dihubungi secara rasmi oleh pembangun kami melalui WhatsApp.</>}
              />
            </p>
          </div>

          {/* CTA Button */}
          <Link
            href="/app/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl font-bold text-white text-[13px] lg:text-sm transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <T en="Return to Dashboard" bm="Kembali ke Laman Utama" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFDFF]">
      
      {/* ─── MOBILE VIEW (lg:hidden) ─── */}
      <div className="lg:hidden -mx-4 -mt-8">
        {/* Mobile Header Banner */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-900 px-5 pt-12 pb-16 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10 blur-2xl opacity-60" />
            <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-black/5 rounded-full blur-xl" />
            
            <div className="relative z-10">
                <Link 
                    href="/app/dashboard"
                    className="flex items-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-widest mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> <T en="Cancel" bm="Batal" />
                </Link>
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white leading-tight">
                            <T en="Project Onboarding" bm="Kemasukan Projek" />
                        </h1>
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                            {otpMode ? <T en="One-Time Package" bm="Pakej Sekali" /> : <T en="Strategic Build" bm="Pembangunan Strategik" />}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-white font-black text-lg">
                        {step + 1}<span className="text-[10px] opacity-50 ml-0.5">/7</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Progress Bar Container */}
        <div className="px-5 -mt-4 relative z-30">
            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-white shadow-lg flex gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-violet-600' : 'bg-slate-100'}`} />
                ))}
            </div>
        </div>

        <div className="px-5 pb-24 mt-6">
            {/* MOBILE STEP CONTENT (Logic based on step) */}
            <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
                <div className="mb-6">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center text-xs">{step + 1}</span>
                        {step === 0 && <T en="Select Your Plan" bm="Pilih Pakej" />}
                        {step === 1 && <T en="Payment Setup" bm="Sistem Bayaran" />}
                        {step === 2 && <T en="Feature Options" bm="Pilihan Fungsi" />}
                        {step === 3 && <T en="Brand & Visuals" bm="Jenama & Visual" />}
                        {step === 4 && <T en="Identity" bm="Identiti" />}
                        {step === 5 && <T en="Domain Request" bm="Pilihan Domain" />}
                        {step === 6 && <T en="Final Vision" bm="Visi Akhir" />}
                    </h2>
                </div>

                <div className="animate-fade-in">
                    {/* Rendered below */}
                    {step === 0 && (
                        <div className="space-y-3">
                            {status === null ? (
                                <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto" /></div>
                            ) : otpMode ? (
                                <button
                                    onClick={() => setFormData(p => ({ ...p, selected_plan: "One-Time Purchase" }))}
                                    className={`w-full p-5 rounded-2xl border text-left transition-all ${formData.selected_plan === "One-Time Purchase" ? 'border-violet-500 bg-violet-50' : 'border-slate-100 bg-slate-50'}`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-black text-sm uppercase tracking-widest text-slate-900"><T en="One-Time Purchase" bm="Pembelian Sekali" /></span>
                                        {formData.selected_plan === "One-Time Purchase" && <CheckCircle2 className="w-5 h-5 text-violet-600" />}
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-slate-400 text-[10px] font-bold">RM</span>
                                        <span className="text-2xl font-black text-slate-900">{otpTotal}</span>
                                    </div>
                                </button>
                            ) : (
                                [
                                    { name: "Standard", price: dynamicPrices.Standard || "165" },
                                    { name: "Growth", price: dynamicPrices.Growth || "240" },
                                    { name: "Enterprise", price: dynamicPrices.Enterprise || "410" },
                                    { name: "Platinum", price: dynamicPrices.Platinum || "750" }
                                ].map((plan) => (
                                    <button
                                        key={plan.name}
                                        onClick={() => setFormData(p => ({ ...p, selected_plan: plan.name }))}
                                        className={`w-full p-5 rounded-2xl border text-left transition-all ${formData.selected_plan === plan.name ? 'border-violet-500 bg-violet-50' : 'border-slate-100 bg-slate-50'}`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-black text-sm uppercase tracking-widest text-slate-900">{plan.name}</span>
                                            {formData.selected_plan === plan.name && <CheckCircle2 className="w-5 h-5 text-violet-600" />}
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-slate-400 text-[10px] font-bold">RM</span>
                                            <span className="text-2xl font-black text-slate-900">{plan.price}</span>
                                            <span className="text-slate-500 text-[8px] font-black uppercase tracking-tighter">/ <T en="mth" bm="bln" /></span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                    {/* Mobile Steps 1-6 */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, has_toyyibpay: true } }))}
                                    className={`p-3 rounded-xl font-black uppercase tracking-widest text-[9px] border transition-all text-center ${formData.payment_setup.has_toyyibpay ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                >
                                    <T en="I have ToyyibPay" bm="Ada ToyyibPay" />
                                </button>
                                <button 
                                    onClick={() => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, has_toyyibpay: false } }))}
                                    className={`p-3 rounded-xl font-black uppercase tracking-widest text-[9px] border transition-all text-center ${!formData.payment_setup.has_toyyibpay ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                >
                                    <T en="New Registration" bm="Pendaftaran Baru" />
                                </button>
                            </div>

                            {formData.payment_setup.has_toyyibpay ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block"><T en="Secret Key" bm="Kunci Rahsia" /></label>
                                        <input 
                                            type="password"
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-violet-300"
                                            value={formData.payment_setup.secret_key || ""}
                                            onChange={(e) => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, secret_key: e.target.value } }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block"><T en="Category Code" bm="Kod Kategori" /></label>
                                        <input 
                                            type="text"
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-violet-300"
                                            value={formData.payment_setup.category_code || ""}
                                            onChange={(e) => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, category_code: e.target.value } }))}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center gap-3">
                                    <UploadCloud className="w-8 h-8 text-slate-300" />
                                    <div className="text-center">
                                        <p className="font-black text-slate-900 uppercase tracking-widest text-[10px] mb-1"><T en="Upload SSM" bm="Muat Naik SSM" /></p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase"><T en=".PDF, .JPG, .PNG ALLOWED" bm=".PDF, .JPG, .PNG SAHAJA" /></p>
                                    </div>
                                    <label className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer">
                                        <T en="CHOOSE FILE" bm="PILIH FAIL" />
                                        <input type="file" className="hidden" onChange={(e) => setSsmFile(e.target.files?.[0] || null)} />
                                    </label>
                                    {ssmFile && <p className="text-[8px] font-bold text-violet-600 truncate max-w-full">{ssmFile.name}</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { label: <T en="Shop & Checkout" bm="Kedai & Bayaran" />, key: "Shopping Cart & Checkout" },
                                    { label: <T en="FPX & Card Pay" bm="Bayar FPX & Kad" />, key: "Payment Gateway Sync" },
                                    { label: <T en="Booking System" bm="Sistem Tempahan" />, key: "Appointment Scheduler" },
                                    { label: <T en="Staff Directory" bm="Senarai Staf" />, key: "Staff Directory" },
                                    { label: <T en="Photo Gallery" bm="Galeri Gambar" />, key: "Interactive Gallery" },
                                    { label: <T en="Testimonials" bm="Testimoni" />, key: "Customer Testimonials" },
                                    { label: <T en="Live Chat Support" bm="Sembang Langsung" />, key: "Floating Chat Support" },
                                    { label: <T en="Contact Forms" bm="Borang Hubungi" />, key: "Lead Generation Forms" }
                                ].map((item) => (
                                    <label key={item.key} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${formData.features.includes(item.key) ? 'border-violet-500 bg-violet-50 shadow-sm' : 'border-slate-50 bg-slate-50/50'}`}>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${formData.features.includes(item.key) ? 'text-violet-600' : 'text-slate-500'}`}>{item.label}</span>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.features.includes(item.key)}
                                            onChange={() => toggleFeature(item.key)}
                                            className="w-5 h-5 rounded border-slate-200 text-violet-600 focus:ring-violet-500/10"
                                        />
                                    </label>
                                ))}
                            </div>

                            {/* Mobile Custom Requirements */}
                            <div className="mt-8 pt-8 border-t border-slate-50 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"><T en="Custom Requirements" bm="Keperluan Tersuai" /></h3>
                                    <div className="space-y-3">
                                        {formData.custom_features.map((feature, idx) => (
                                            <div key={idx} className="flex gap-2 animate-in slide-in-from-right-2 duration-200">
                                                <input 
                                                    type="text" 
                                                    value={feature}
                                                    onChange={(e) => handleCustomFeatureChange(idx, e.target.value)}
                                                    className="flex-1 h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-violet-500 transition-all"
                                                    placeholder={lang === "BM" ? "cth. Kawasan Ahli..." : "e.g. Member Area..."}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, custom_features: p.custom_features.filter((_, i) => i !== idx) }))}
                                                    className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, custom_features: [...p.custom_features, ""] }))}
                                            className="w-full h-12 border-2 border-dashed border-slate-100 rounded-xl text-violet-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:bg-violet-50 transition-all"
                                        >
                                            <span className="text-lg">+</span> <T en="Add Extra Feature" bm="Tambah fungsi Tambahan" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"><T en="Additional Project Notes" bm="Nota Tambahan Projek" /></h3>
                                    <textarea 
                                        className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 text-xs outline-none focus:border-violet-500 min-h-[120px] transition-all"
                                        placeholder={lang === "BM" ? "Terangkan sebarang keperluan unik atau arahan teknikal tambahan..." : "Describe any unique requirements or extra technical instructions..."}
                                        value={formData.custom_needs}
                                        onChange={(e) => setFormData(p => ({ ...p, custom_needs: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"><T en="Proposed Sitemap" bm="Peta Laman Cadangan" /></h3>
                                <div className="space-y-2">
                                    {formData.sitemap.map((page, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={page}
                                                onChange={(e) => handleSitemapChange(idx, e.target.value)}
                                                className="flex-1 h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                            />
                                            <button onClick={() => setFormData(p => ({ ...p, sitemap: p.sitemap.filter((_, i) => i !== idx) }))} className="p-3 text-slate-300">✕</button>
                                        </div>
                                    ))}
                                    <button onClick={() => setFormData(p => ({ ...p, sitemap: [...p.sitemap, ""] }))} className="text-violet-600 text-[10px] font-black uppercase tracking-widest">+ <T en="Add Page" bm="Tambah Halaman" /></button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 space-y-4">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2"><T en="Theme Color" bm="Warna Tema" /></h3>
                                    <div className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <input type="color" value={formData.brand_assets.theme_color} onChange={(e) => setFormData(p => ({...p, brand_assets: { theme_color: e.target.value }}))} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent" />
                                        <span className="text-slate-600 font-mono text-[10px] font-black">{formData.brand_assets.theme_color.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2"><T en="Brand Logo" bm="Logo Jenama" /></h3>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain p-1" /> : <UploadCloud className="w-5 h-5 text-slate-200" />}
                                        </div>
                                        <label className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest text-center cursor-pointer">
                                            <T en="UPLOAD" bm="MUAT NAIK" />
                                            <input type="file" className="hidden" onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setLogoFile(file);
                                                if (file) setLogoPreview(URL.createObjectURL(file));
                                            }} />
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50 space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"><T en="Competitor Reference" bm="Rujukan Pesaing" /></h3>
                                    <div className="space-y-3">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-tight px-1"><T en="Link to a website style you admire" bm="Pautan ke gaya laman web yang anda kagumi" /></p>
                                        <input 
                                            type="url" 
                                            value={formData.competitor_ref}
                                            onChange={(e) => setFormData(p => ({ ...p, competitor_ref: e.target.value }))}
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"><T en="WhatsApp Number" bm="Nombor WhatsApp" /></label>
                                <div className="flex items-center h-16 bg-slate-50 border border-slate-100 rounded-2xl px-5 group focus-within:border-violet-500 transition-all">
                                    <span className="text-slate-900 font-black text-lg mr-2">+60</span>
                                    <input 
                                        type="text"
                                        required
                                        className="flex-1 bg-transparent text-slate-900 font-black text-lg outline-none tracking-tighter placeholder:text-slate-200"
                                        placeholder="123456789"
                                        value={formData.whatsapp_number}
                                        onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, "");
                                            if (val.startsWith("60")) val = val.substring(2);
                                            if (val.startsWith("0")) val = val.substring(1);
                                            setFormData(p => ({ ...p, whatsapp_number: val }));
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block"><T en="Business Email" bm="E-mel Bisnes" /></label>
                                    <input 
                                        type="email"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                        placeholder="hello@project.com"
                                        value={formData.business_email}
                                        onChange={(e) => setFormData(p => ({ ...p, business_email: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block"><T en="Address" bm="Alamat" /></label>
                                    <textarea 
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                        rows={3}
                                        value={formData.business_address}
                                        onChange={(e) => setFormData(p => ({ ...p, business_address: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"><T en="Socials & Operations" bm="Sosial & Operasi" /></h3>
                                <div className="space-y-3">
                                    <input 
                                        type="text"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                        placeholder={lang === "BM" ? "Pautan Facebook" : "Facebook Link"}
                                        value={formData.social_media.facebook}
                                        onChange={(e) => setFormData(p => ({ ...p, social_media: { ...p.social_media, facebook: e.target.value } }))}
                                    />
                                    <input 
                                        type="text"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                        placeholder={lang === "BM" ? "Pautan Instagram" : "Instagram Link"}
                                        value={formData.social_media.instagram}
                                        onChange={(e) => setFormData(p => ({ ...p, social_media: { ...p.social_media, instagram: e.target.value } }))}
                                    />
                                    <input 
                                        type="text"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                        placeholder={lang === "BM" ? "Pautan TikTok" : "TikTok Link"}
                                        value={formData.social_media.tiktok}
                                        onChange={(e) => setFormData(p => ({ ...p, social_media: { ...p.social_media, tiktok: e.target.value } }))}
                                    />
                                    <div className="pt-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block"><T en="Operation Hours" bm="Waktu Operasi" /></label>
                                        <input 
                                            type="text"
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                            placeholder={lang === "BM" ? "cth. Isnin-Jumaat: 9AM - 6PM" : "e.g. Mon-Fri: 9AM - 6PM"}
                                            value={formData.operation_hours}
                                            onChange={(e) => setFormData(p => ({ ...p, operation_hours: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-6">
                            <DomainChecker 
                                label={lang === "EN" ? "Primary Choice (.com / .my)" : "Pilihan Utama (.com / .my)"}
                                value={formData.domain_requested}
                                onChange={(val) => setFormData(p => ({ ...p, domain_requested: val }))}
                                lang={lang}
                            />
                            <DomainChecker 
                                label={lang === "EN" ? "Alternative Choice 1" : "Pilihan Alternatif 1"}
                                value={formData.domain_2}
                                onChange={(val) => setFormData(p => ({ ...p, domain_2: val }))}
                                lang={lang}
                            />
                            <DomainChecker 
                                label={lang === "EN" ? "Alternative Choice 2" : "Pilihan Alternatif 2"}
                                value={formData.domain_3}
                                onChange={(val) => setFormData(p => ({ ...p, domain_3: val }))}
                                lang={lang}
                            />
                        </div>
                    )}

                    {step === 6 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"><T en="Project Title" bm="Nama Projek" /></label>
                                <input 
                                    type="text"
                                    className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 text-sm outline-none"
                                    placeholder={lang === "EN" ? "Your Project Name" : "Nama Projek Anda"}
                                    value={formData.project_title}
                                    onChange={(e) => setFormData(p => ({ ...p, project_title: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1"><T en="Project Vision" bm="Visi Projek" /></label>
                                <textarea 
                                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 text-xs outline-none"
                                    rows={6}
                                    placeholder={lang === "EN" ? "Describe your big idea..." : "Terangkan idea besar anda..."}
                                    value={formData.project_vision}
                                    onChange={(e) => setFormData(p => ({ ...p, project_vision: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="mt-8 flex gap-3">
                        {step > 0 && (
                            <button 
                                onClick={prevStep} 
                                className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 active:scale-95 transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <button 
                            onClick={step === 6 ? submitForm : nextStep} 
                            disabled={isSubmitting}
                            className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 ${step === 6 ? 'bg-emerald-500 text-white shadow-emerald-100 border border-emerald-400' : 'bg-violet-600 text-white shadow-violet-200 border border-violet-500'}`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-[10px] font-bold">{loadingText || (lang === "BM" ? "Menghantar..." : "Sending...")}</span>
                                </div>
                            ) : (
                                <>
                                    {step === 6 ? <><CheckCircle2 className="w-5 h-5" /> <T en="Finalize Build" bm="Hantar Projek" /></> : <><T en="Next Step" bm="Seterusnya" /> <ArrowRight className="w-5 h-5" /></>}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* ─── DESKTOP VIEW (hidden lg:block) ─── */}
      <div className="hidden lg:block max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2"><T en="Project Onboarding" bm="Kemasukan Projek" /></h1>
        {otpMode 
            ? <p className="text-zinc-500 font-medium"><T en="Complete one-time purchase package. Submit your vision to start." bm="Lengkapkan pakej pembelian sekali. Hantar visi anda untuk bermula." /></p>
            : <p className="text-zinc-500 font-medium"><T en="Share your vision and we'll build it." bm="Berikan visi anda dan kami akan membinanya." /></p>
        }
        
        {/* Progress Bar (0-6) */}
        <div className="flex gap-2 mt-8 mb-12">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-violet-500' : 'bg-zinc-200'}`} />
          ))}
        </div>

        <div className="bg-white border border-zinc-200 p-10 rounded-[2.5rem] shadow-2xl shadow-zinc-200/50 overflow-hidden relative">
          <div className="relative z-10 text-zinc-900">
            {step === 0 && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">1. <T en="Select Your Plan" bm="Pilih Pakej Anda" /></h2>
            <p className="text-zinc-600 font-medium leading-relaxed"><T en="Please select your plan. The monthly subscription includes premium hosting, security, and bug fixes." bm="Sila pilih pakej anda. Langganan bulanan merangkumi hosting premium, sekuriti, dan pembetulan bug." /></p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {status === null ? (
                <div className="col-span-full py-20 text-center">
                  <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400"><T en="Loading protocol configuration..." bm="Memuatkan konfigurasi protokol..." /></p>
                </div>
              ) : otpMode ? (
                <button
                  key="otp-package"
                  onClick={() => setFormData(p => ({ ...p, selected_plan: "One-Time Purchase" }))}
                  className={`p-8 rounded-3xl border text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${formData.selected_plan === "One-Time Purchase" ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500/50 shadow-lg shadow-violet-500/10' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-300 hover:bg-white text-zinc-900'}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className={`font-black text-xl uppercase tracking-widest ${formData.selected_plan === "One-Time Purchase" ? 'text-violet-600' : 'text-zinc-900'}`}><T en="One-Time Purchase" bm="Pembelian Sekali" /></span>
                    {formData.selected_plan === "One-Time Purchase" && <CheckCircle2 className="w-6 h-6 text-violet-500" />}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-zinc-400 text-xs font-bold font-mono">RM</span>
                    <span className="text-4xl font-black text-zinc-900">{otpTotal}</span>
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Deposit: RM{otpDeposit} | Final: RM{otpFinal}</p>
                </button>
              ) : (
                [
                  { name: "Standard", price: dynamicPrices.Standard || "165" },
                  { name: "Growth", price: dynamicPrices.Growth || "240" },
                  { name: "Enterprise", price: dynamicPrices.Enterprise || "410" },
                  { name: "Platinum", price: dynamicPrices.Platinum || "750" }
                ].map((plan) => (
                  <button
                    key={plan.name}
                    onClick={() => setFormData(p => ({ ...p, selected_plan: plan.name }))}
                    className={`p-8 rounded-3xl border text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${formData.selected_plan === plan.name ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500/50 shadow-lg shadow-violet-500/10' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-300 hover:bg-white text-zinc-900'}`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className={`font-black text-xl uppercase tracking-widest ${formData.selected_plan === plan.name ? 'text-violet-600' : 'text-zinc-900'}`}>{plan.name}</span>
                      {formData.selected_plan === plan.name && <CheckCircle2 className="w-6 h-6 text-violet-500" />}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-zinc-400 text-xs font-bold font-mono">RM</span>
                      <span className="text-4xl font-black text-zinc-900">{plan.price}</span>
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-tighter"><T en="/ Month" bm="/ Bulan" /></span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Link moved to footer */}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-zinc-900">2. <T en="Online Payment Integration for your website (Optional)" bm="Integrasi Pembayaran Online dalam website anda (Pilihan)" /></h2>
            <p className="text-zinc-600 font-medium"><T en="If you want to sell online, you need a payment gateway. Do you already have a ToyyibPay account?" bm="Jika anda ingin menjual dalam talian, anda memerlukan sistem pembayaran. Adakah anda sudah mempunyai akaun ToyyibPay?" /></p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, has_toyyibpay: true } }))}
                className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs border transition-all ${formData.payment_setup.has_toyyibpay ? 'bg-violet-50 border-violet-500 text-violet-600 shadow-lg shadow-violet-500/10' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'}`}
              >
                <T en="Yes, I have ToyyibPay" bm="Ya, saya mempunyai ToyyibPay" />
              </button>
              <button 
                onClick={() => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, has_toyyibpay: false } }))}
                className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs border transition-all ${!formData.payment_setup.has_toyyibpay ? 'bg-violet-50 border-violet-500 text-violet-600 shadow-lg shadow-violet-500/10' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'}`}
              >
                <T en="No, help me register" bm="Tidak, bantu saya mendaftar" />
              </button>
            </div>

            {formData.payment_setup.has_toyyibpay ? (
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2"><T en="Secret Key" bm="Kunci Rahsia" /></label>
                  <input 
                    type="password"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all"
                    placeholder={lang === "BM" ? "Masukkan Kunci Rahsia ToyyibPay" : "Enter ToyyibPay Secret Key"}
                    value={formData.payment_setup.secret_key || ""}
                    onChange={(e) => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, secret_key: e.target.value } }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2"><T en="Category Code" bm="Kod Kategori" /></label>
                  <input 
                    type="text"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all"
                    placeholder={lang === "BM" ? "Masukkan Kod Kategori" : "Enter Category Code"}
                    value={formData.payment_setup.category_code || ""}
                    onChange={(e) => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, category_code: e.target.value } }))}
                  />
                </div>
              </div>
            ) : (
              <div className="pt-4 p-8 border border-dashed border-zinc-300 rounded-2xl bg-zinc-50/50 flex flex-col items-center justify-center gap-4">
                 <UploadCloud className="w-10 h-10 text-zinc-300" />
                 <div className="text-center">
                    <p className="font-black text-zinc-900 uppercase tracking-widest text-sm mb-1"><T en="Upload SSM Document" bm="Muat Naik Dokumen SSM" /></p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest"><T en="ONLY .PDF, .JPG, .PNG ALLOWED (MAX 10MB)" bm="HANYA .PDF, .JPG, .PNG DIBENARKAN (MAKS 10MB)" /></p>
                 </div>
                 <div className="flex flex-col items-center gap-3">
                   <label className="px-8 py-3 bg-zinc-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all cursor-pointer shadow-lg active:scale-95">
                     <T en="CHOOSE FILE" bm="PILIH FAIL" />
                     <input 
                       type="file" 
                       className="hidden" 
                       onChange={(e) => setSsmFile(e.target.files?.[0] || null)}
                       accept=".pdf,.png,.jpg,.jpeg" 
                     />
                   </label>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                     {ssmFile ? ssmFile.name : (lang === "BM" ? "Tiada fail dipilih" : "No file chosen")}
                   </p>
                 </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-zinc-900">3. <T en="System Feature Options" bm="Pilihan Fungsi Sistem" /></h2>
            <p className="text-zinc-600 font-medium"><T en="Choose the functions you want to activate. All these systems can be used immediately according to your project needs." bm="Pilih fungsi yang ingin anda aktifkan. Semua sistem ini boleh digunakan terus mengikut keperluan projek anda." /></p>
            
            <div className="grid md:grid-cols-2 gap-6">
               {[
                 { title: "Commercial", items: ["Shopping Cart & Checkout", "Payment Gateway Sync", "Promo Code System", "Order Notifications"] },
                 { title: "Service & Bookings", items: ["Appointment Scheduler", "Service Catalog", "Location Mapping", "Staff Directory"] },
                 { title: "Brand Identity", items: ["Interactive Gallery", "Customer Testimonials", "Company Timeline", "Partner Showcase"] },
                 { title: "User Engagement", items: ["Blog / News Engine", "FAQ Hub", "Floating Chat Support", "Lead Generation Forms"] }
               ].map((cat, idx) => (
                 <div key={idx} className="bg-zinc-50 p-8 rounded-3xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-all">
                    <h3 className="font-black italic uppercase tracking-widest text-xs text-violet-600 mb-6">
                      {cat.title === "Commercial" ? <T en="Commercial" bm="Komersial" /> : 
                       cat.title === "Service & Bookings" ? <T en="Service & Bookings" bm="Perkhidmatan & Tempahan" /> : 
                       cat.title === "Brand Identity" ? <T en="Brand Identity" bm="Identiti Jenama" /> : 
                       cat.title === "User Engagement" ? <T en="User Engagement" bm="Penglibatan Pengguna" /> : cat.title}
                    </h3>
                    <div className="space-y-4">
                      {cat.items.map(item => (
                        <label key={item} className="flex items-center gap-4 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={formData.features.includes(item)}
                            onChange={() => toggleFeature(item)}
                            className="w-5 h-5 rounded border-zinc-300 text-violet-500 focus:ring-violet-500/20 bg-white"
                          />
                          <span className="text-sm font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors uppercase tracking-tight">
                            {item === "Shopping Cart & Checkout" ? <T en="Shopping Cart & Checkout" bm="Sistem Kedai Online" /> :
                             item === "Payment Gateway Sync" ? <T en="Payment Gateway Sync" bm="Pembayaran Online (FPX/Kad)" /> :
                             item === "Promo Code System" ? <T en="Promo Code System" bm="Sistem Kod Diskaun" /> :
                             item === "Order Notifications" ? <T en="Order Notifications" bm="Notifikasi Pesanan" /> :
                             item === "Appointment Scheduler" ? <T en="Appointment Scheduler" bm="Sistem Temujanji" /> :
                             item === "Service Catalog" ? <T en="Service Catalog" bm="Senarai Perkhidmatan" /> :
                             item === "Location Mapping" ? <T en="Location Mapping" bm="Lokasi Kedai (Google Maps)" /> :
                             item === "Staff Directory" ? <T en="Staff Directory" bm="Senarai Kakitangan" /> :
                             item === "Interactive Gallery" ? <T en="Interactive Gallery" bm="Galeri Gambar" /> :
                             item === "Customer Testimonials" ? <T en="Customer Testimonials" bm="Testimoni Pelanggan" /> :
                             item === "Company Timeline" ? <T en="Company Timeline" bm="Sejarah Syarikat" /> :
                             item === "Partner Showcase" ? <T en="Partner Showcase" bm="Senarai Rakan Kongsi" /> :
                             item === "Blog / News Engine" ? <T en="Blog / News Engine" bm="Sistem Blog / Berita" /> :
                             item === "FAQ Hub" ? <T en="FAQ Hub" bm="Soalan Lazim (FAQ)" /> :
                             item === "Floating Chat Support" ? <T en="Floating Chat Support" bm="Sembang Langsung (Live Chat)" /> :
                             item === "Lead Generation Forms" ? <T en="Lead Generation Forms" bm="Borang Hubungi / Lead" /> : item}
                          </span>
                        </label>
                      ))}
                    </div>
                 </div>
               ))}
            </div>

            <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm">
                <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-6 font-mono"><T en="Custom Requirements" bm="Keperluan Tersuai" /></h3>
                <div className="space-y-3">
                    {formData.custom_features.map((feature, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input 
                                type="text" 
                                value={feature}
                                onChange={(e) => handleCustomFeatureChange(idx, e.target.value)}
                                className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 focus:outline-none focus:border-violet-500"
                                placeholder={lang === "BM" ? "cth. Kawasan Ahli, Penyediaan berbilang vendor..." : "e.g. Member Area, Multi-vendor setup..."}
                            />
                        </div>
                    ))}
                    <button 
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, custom_features: [...p.custom_features, ""] }))}
                        className="text-violet-600 text-[10px] font-black uppercase tracking-widest hover:underline pt-2 flex items-center gap-2"
                    >
                        <span className="text-lg">+</span> <T en="Add Extra Feature" bm="Tambah fungsi Tambahan" />
                    </button>
                    {formData.custom_features.length === 0 && (
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest"><T en="No extra features added yet." bm="Tiada fungsi sistem tambahan ditambah lagi." /></p>
                    )}
                </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3"><T en="Additional Project Notes" bm="Nota Projek Tambahan" /></label>
              <textarea 
                className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-zinc-900 font-medium focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all min-h-[140px]"
                placeholder={lang === "BM" ? "Kongsi sebarang keperluan teknikal atau aliran kerja khusus lain yang perlu kami ketahui..." : "Share any other specific technical requirements or workflows we should know about..."}
                value={formData.custom_needs}
                onChange={(e) => setFormData(p => ({ ...p, custom_needs: e.target.value }))}
              />
            </div>
          </div>
        )}

        {step === 3 && (
           <div className="space-y-8 animate-fade-in">
             <h2 className="text-2xl font-bold text-zinc-900">4. <T en="Brand & Visuals" bm="Jenama & Visual" /></h2>
             <p className="text-zinc-600 font-medium leading-relaxed"><T en="Let's define your website design. Provide details about your logo, color preferences, and the page structure (sitemap) you want." bm="Jom tentukan reka bentuk laman web anda. Berikan maklumat tentang logo, pilihan warna, dan susunan halaman (sitemap) yang anda inginkan." /></p>
             
             <div className="grid md:grid-cols-2 gap-8">
               <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm">
                 <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-6 font-mono"><T en="Proposed Sitemap" bm="Peta Laman Cadangan" /></h3>
                 <div className="space-y-3">
                   {formData.sitemap.map((page, idx) => (
                     <div key={idx} className="flex gap-2 group">
                       <input 
                         type="text" 
                         value={page}
                         onChange={(e) => handleSitemapChange(idx, e.target.value)}
                         className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 focus:outline-none focus:border-violet-500 transition-all shadow-sm"
                       />
                       <button 
                         onClick={() => setFormData(p => ({ ...p, sitemap: p.sitemap.filter((_, i) => i !== idx) }))}
                         className="opacity-0 group-hover:opacity-100 p-2 text-zinc-300 hover:text-red-500 transition-all"
                       >
                         ✕
                       </button>
                     </div>
                   ))}
                   <button 
                     onClick={() => setFormData(p => ({ ...p, sitemap: [...p.sitemap, "New Page"] }))}
                     className="text-violet-600 text-[10px] font-black uppercase tracking-widest hover:underline pt-2 flex items-center gap-2"
                   >
                     <span className="text-lg">+</span> <T en="Add Page" bm="Tambah Halaman" />
                   </button>
                 </div>
               </div>

               <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm space-y-8">
                 <div className="pb-6 border-b border-zinc-200/50">
                    <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-4 font-mono"><T en="Competitor Reference" bm="Rujukan Pesaing" /></h3>
                    <p className="text-[10px] text-zinc-400 font-bold mb-3 uppercase tracking-widest leading-tight"><T en="Link to a website style you admire" bm="Pautan ke gaya laman web yang anda kagumi" /></p>
                    <input 
                        type="url" 
                        value={formData.competitor_ref}
                        onChange={(e) => setFormData(p => ({ ...p, competitor_ref: e.target.value }))}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-700 focus:outline-none focus:border-violet-500 shadow-sm"
                        placeholder={lang === "BM" ? "https://contoh-pesaing.com" : "https://example.com"}
                    />
                 </div>
                 
                 <div className="space-y-8">
                    <div>
                        <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-4 font-mono"><T en="Theme Color" bm="Warna Tema" /></h3>
                        <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                            <input 
                                type="color" 
                                value={formData.brand_assets.theme_color}
                                onChange={(e) => setFormData(p => ({...p, brand_assets: { theme_color: e.target.value }}))}
                                className="w-10 h-10 rounded-xl cursor-pointer border-2 border-zinc-50 shadow-sm bg-transparent"
                            />
                            <span className="text-zinc-600 font-mono text-[11px] font-black">{formData.brand_assets.theme_color.toUpperCase()}</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-4 font-mono"><T en="Brand Logo" bm="Logo Jenama" /></h3>
                        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                            <div className="w-20 h-20 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <UploadCloud className="w-8 h-8 text-zinc-200" />
                                )}
                            </div>
                            <div className="space-y-4 flex-1 w-full">
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <label 
                                        htmlFor="logo-upload"
                                        className="px-6 py-3 bg-zinc-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all cursor-pointer shadow-lg active:scale-95"
                                    >
                                        <T en="CHOOSE FILE" bm="PILIH FAIL" />
                                        <input 
                                            id="logo-upload"
                                            type="file" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setLogoFile(file);
                                                if (file) {
                                                    setLogoPreview(URL.createObjectURL(file));
                                                } else {
                                                    setLogoPreview(null);
                                                }
                                            }}
                                            accept=".png,.jpg,.jpeg" 
                                        />
                                    </label>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                                        {logoFile ? logoFile.name : (lang === "BM" ? "Tiada fail dipilih" : "No file chosen")}
                                    </p>
                                </div>
                                <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest text-center sm:text-left"><T en="Max size: 5MB" bm="Saiz maks: 5MB" /></p>
                            </div>
                        </div>
                    </div>
                 </div>
               </div>
             </div>
           </div>
        )}

        {step === 4 && (
           <div className="space-y-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-zinc-900">5. <T en="Business Identity" bm="Identiti Perniagaan" /></h2>
              <p className="text-zinc-600 font-medium leading-relaxed"><T en="Provide your official business details for the footer, contact page, and social links." bm="Berikan butiran perniagaan rasmi anda untuk footer, halaman kenalan dan pautan sosial." /></p>
              
              <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-[2.5rem] shadow-sm">
              <div className="max-w-md">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3"><T en="WhatsApp Number (Mandatory)" bm="Nombor WhatsApp (Wajib)" /></label>
                <div className="flex items-center h-16 bg-white border border-zinc-200 rounded-2xl px-6 group focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/5 transition-all shadow-sm">
                  <span className="text-zinc-900 font-black text-xl tracking-tighter mr-3">+60</span>
                  <input 
                    type="text"
                    required
                    className="flex-1 bg-transparent text-zinc-900 font-black text-xl outline-none tracking-tighter placeholder:text-zinc-300"
                    placeholder="123456789"
                    value={formData.whatsapp_number}
                    onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, ""); // Hanya nombor
                        if (val.startsWith("60")) val = val.substring(2); // Buang 60 jika user paste
                        if (val.startsWith("0")) val = val.substring(1);  // Buang 0 di depan
                        setFormData(p => ({ ...p, whatsapp_number: val }));
                    }}
                  />
                </div>
                <p className="text-[10px] font-bold text-zinc-400 mt-3 uppercase tracking-widest"><T en="Just enter your number (e.g. 123456789). We've handled the +60 for you." bm="Hanya masukkan nombor anda (cth. 123456789). Kami telah mengendalikan +60 untuk anda." /></p>
              </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-2 font-mono"><T en="Direct Contact" bm="Hubungan Langsung" /></h3>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1"><T en="Official Business Email" bm="E-mel Rasmi Perniagaan" /></label>
                        <input 
                            type="email"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm"
                            placeholder={lang === "BM" ? "hello@bisnesanda.com" : "hello@yourbusiness.com"}
                            value={formData.business_email}
                            onChange={(e) => setFormData(p => ({ ...p, business_email: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1"><T en="Physical Business Address" bm="Alamat Perniagaan Fizikal" /></label>
                        <textarea 
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 min-h-[90px] shadow-sm"
                            placeholder={lang === "BM" ? "Alamat lengkap untuk Footer & Google Maps" : "Complete address for Footer & Google Maps"}
                            value={formData.business_address}
                            onChange={(e) => setFormData(p => ({ ...p, business_address: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-2 font-mono"><T en="Socials & Operations" bm="Sosial & Operasi" /></h3>
                    <div className="space-y-2">
                        <input 
                            type="text"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm"
                            placeholder={lang === "BM" ? "Pautan Halaman Facebook" : "Facebook Page Link"}
                            value={formData.social_media.facebook}
                            onChange={(e) => setFormData(p => ({ ...p, social_media: { ...p.social_media, facebook: e.target.value } }))}
                        />
                        <input 
                            type="text"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm"
                            placeholder={lang === "BM" ? "Pautan Profil Instagram" : "Instagram Profile Link"}
                            value={formData.social_media.instagram}
                            onChange={(e) => setFormData(p => ({ ...p, social_media: { ...p.social_media, instagram: e.target.value } }))}
                        />
                        <input 
                            type="text"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm"
                            placeholder={lang === "BM" ? "Pautan Profil TikTok" : "TikTok Profile Link"}
                            value={formData.social_media.tiktok}
                            onChange={(e) => setFormData(p => ({ ...p, social_media: { ...p.social_media, tiktok: e.target.value } }))}
                        />
                    </div>
                    <div className="pt-2">
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1"><T en="Operation Hours" bm="Waktu Operasi" /></label>
                        <input 
                            type="text"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm"
                            placeholder={lang === "BM" ? "cth. Isnin-Jumaat: 9AM - 6PM" : "e.g. Mon-Fri: 9AM - 6PM, Sat: 9AM - 1PM"}
                            value={formData.operation_hours}
                            onChange={(e) => setFormData(p => ({ ...p, operation_hours: e.target.value }))}
                        />
                    </div>
                </div>
              </div>
           </div>
        )}

        {step === 5 && (
           <div className="space-y-8 animate-fade-in">
             <h2 className="text-2xl font-bold text-zinc-900">6. <T en="Domain Request" bm="Permintaan Domain" /></h2>
             <p className="text-zinc-600 font-medium leading-relaxed"><T en="Provide up to 3 choices for your website domain in order of preference. We will verify and register the best option." bm="Berikan sehingga 3 pilihan untuk domain laman web anda mengikut urutan pilihan. Kami akan mengesahkan dan mendaftarkan pilihan terbaik." /></p>
             
              <div className="space-y-6">
                <DomainChecker 
                  lang={lang}
                  label={lang === "BM" ? "Pilihan 1 (Utama)" : "Choice 1 (Primary)"} 
                  value={formData.domain_requested} 
                  onChange={(val) => setFormData(p => ({ ...p, domain_requested: val }))} 
                />
                <DomainChecker 
                  lang={lang}
                  label={lang === "BM" ? "Pilihan 2" : "Choice 2"} 
                  value={formData.domain_2} 
                  onChange={(val) => setFormData(p => ({ ...p, domain_2: val }))} 
                />
                <DomainChecker 
                  lang={lang}
                  label={lang === "BM" ? "Pilihan 3" : "Choice 3"} 
                  value={formData.domain_3} 
                  onChange={(val) => setFormData(p => ({ ...p, domain_3: val }))} 
                />
             </div>

             <div className="mt-8 p-8 bg-violet-50 border border-violet-100 rounded-3xl flex items-start gap-6 shadow-sm">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-violet-100">
                  <Shield className="w-8 h-8 text-violet-500" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-violet-700 uppercase tracking-widest italic"><T en="Secure Staging Protocol" bm="Protokol Pementasan Selamat" /></h4>
                  <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                    <T en={<>Once submitted, our team explores these domains while building your Staging environment. <strong className="text-zinc-900">No payment is required today.</strong> Subscription officially starts only after your final approval.</>} 
                       bm={<>Setelah dihantar, pasukan kami melayari domain ini semasa membina persekitaran Pementasan anda. <strong className="text-zinc-900">Tiada bayaran diperlukan hari ini.</strong> Langganan bermula secara rasmi hanya selepas kelulusan akhir anda.</>} />
                  </p>
                </div>
              </div>
            </div>
         )}

         {step === 6 && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-violet-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900">7. <T en="Project Vision" bm="Visi Projek" /></h2>
                </div>

                <div className="space-y-6">
                    <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm">
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-900 mb-4 font-mono"><T en="Website Title / Project Name" bm="Tajuk Laman Web / Nama Projek" /></label>
                        <input 
                            type="text"
                            required
                            className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-zinc-900 font-black focus:outline-none focus:border-violet-500 text-lg shadow-inner"
                            placeholder={lang === "BM" ? "cth. Portal Perniagaan Acme Corporation" : "e.g. Acme Corporation Business Portal"}
                            value={formData.project_title}
                            onChange={(e) => setFormData(p => ({ ...p, project_title: e.target.value }))}
                        />
                    </div>
                    
                    <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-[2.5rem] shadow-sm">
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-900 mb-4 font-mono"><T en="The Big Idea (Describe Your Vision)" bm="Idea Besar (Terangkan Visi Anda)" /></label>
                        <textarea 
                            className="w-full bg-white border border-zinc-200 rounded-2xl px-8 py-6 text-zinc-900 font-bold focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all min-h-[300px] text-lg leading-relaxed shadow-inner"
                            placeholder={lang === "BM" ? "Ceritakan segalanya kepada kami. Apakah perniagaan anda? Siapakah khalayak sasaran anda? Apakah getaran khusus atau pengalaman unik yang anda inginkan untuk pengguna?" : "Tell us everything. What is your business about? Who is your target audience? What specific vibe or unique experience do you want users to have?"}
                            value={formData.project_vision}
                            onChange={(e) => setFormData(p => ({ ...p, project_vision: e.target.value }))}
                        />
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-400">
                            <CheckCircle2 className="w-4 h-4" /> <T en="This vision will be prioritized in our development roadmap." bm="Visi ini akan diutamakan dalam pelan hala tuju pembangunan kami." />
                        </div>
                    </div>
                </div>
            </div>
         )}

         <div className="mt-12 flex items-end justify-between pt-8 border-t border-zinc-100">
          <div className="flex flex-col items-start gap-3">
            {step === 0 && (
                <Link href="/pricing" target="_blank" className="flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-[11px] text-violet-600 hover:text-violet-800 transition-all group border border-violet-100 rounded-xl bg-violet-50/50 hover:bg-violet-50">
                  <Search className="w-3.5 h-3.5" /> <T en="View Full Plan Details & Features" bm="Lihat Butiran Pakej & Fungsi Sistem Penuh" />
                </Link>
            )}
            {step === 0 ? (
                <button 
                  type="button"
                  onClick={() => {
                    deleteCookie("next-plan");
                    window.location.href = '/app/dashboard';
                  }}
                  className="flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-[11px] text-red-600 hover:text-red-800 transition-all group border border-red-100 rounded-xl bg-red-50/50 hover:bg-red-50"
                >
                  <span>←</span> <T en="Cancel & Return to Dashboard" bm="Batal & Kembali ke Laman Utama" />
                </button>
            ) : (
              <button 
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-[11px] text-zinc-400 hover:text-zinc-900 transition-all font-mono"
              >
                <ArrowLeft className="w-5 h-5" /> <T en="Back" bm="Kembali" />
              </button>
            )}
          </div>
          
          {step < 6 ? (
            <button 
              onClick={nextStep}
              disabled={step === 0 && !formData.selected_plan}
              className={`flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-xl font-black hover:bg-black transition-colors ${step === 0 && !formData.selected_plan ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <T en="Continue" bm="Teruskan" /> <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={submitForm}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-10 py-4 bg-violet-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-violet-500 transition-all disabled:opacity-50 hover:scale-105 shadow-xl shadow-violet-500/20"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">{loadingText || (lang === "BM" ? "Menghantar..." : "Sending...")}</span>
                </div>
              ) : <T en="Deploy Requirements" bm="Hantar Keperluan" />}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
    </div>
  );
}

export default function CreateProjectPage() {
  const { lang } = useLanguage();
  return (
    <Suspense fallback={<div className="p-20 text-center font-bold text-zinc-500 animate-pulse italic">Loading Project Onboarding...</div>}>
      <CreateProjectForm lang={lang} />
    </Suspense>
  );
}
