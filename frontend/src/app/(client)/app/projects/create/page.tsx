"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, UploadCloud, CheckCircle2, Shield, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCookie, deleteCookie } from "@/utils/cookies";
import { toast } from "sonner";

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

export default function CreateProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPlan = searchParams.get("plan");

  const [step, setStep] = useState(urlPlan ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ssmFile, setSsmFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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

  const submitForm = async () => {
    setIsSubmitting(true);
    
    try {
        let finalRequirements = JSON.parse(JSON.stringify(formData));
        
        if (ssmFile && !formData.payment_setup.has_toyyibpay) {
            const ssmUrl = await handleFileUpload(ssmFile);
            if (ssmUrl) {
                finalRequirements.payment_setup.ssm_url = ssmUrl;
            }
        }

        if (logoFile) {
            const logoUrl = await handleFileUpload(logoFile);
            if (logoUrl) {
                finalRequirements.brand_assets.logo_url = logoUrl;
            }
        }

        const whatsapp = finalRequirements.whatsapp_number;
        delete finalRequirements.whatsapp_number;
        
        const plan = formData.selected_plan;
        // Kita hantar selected_plan di peringkat atas, bukan dalam requirements bundle
        
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Project Submitted!</h1>
        <p className="text-zinc-400 text-lg max-w-xl">
          Our programmer is currently reviewing your requirements. No setup fees or payment required today. We will contact you via WhatsApp shortly to confirm the details before we start coding.
        </p>
        <Link href="/app/dashboard" className="px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 font-bold text-white transition-all">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Project Onboarding</h1>
        <p className="text-zinc-500">Provide your vision and we will build it. 0 upfront cost.</p>
        
        {/* Progress Bar (0-6) */}
        <div className="flex gap-2 mt-8">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
          ))}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 p-10 rounded-[2.5rem] shadow-2xl shadow-zinc-200/50 overflow-hidden relative">
        <div className="relative z-10 text-zinc-900">
        {step === 0 && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight italic uppercase">0. Select Your Plan</h2>
            <p className="text-zinc-600 font-medium leading-relaxed">Please select a package for your new project. You will only be billed once your staging site is ready.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Standard", price: "165" },
                { name: "Growth", price: "190" },
                { name: "Enterprise", price: "260" },
                { name: "Platinum", price: "400" }
              ].map((plan) => (
                <button
                  key={plan.name}
                  onClick={() => setFormData(p => ({ ...p, selected_plan: plan.name }))}
                  className={`p-8 rounded-3xl border text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${formData.selected_plan === plan.name ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-zinc-100 bg-zinc-50 hover:border-zinc-300 hover:bg-white text-zinc-900'}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className={`font-black text-xl uppercase tracking-widest ${formData.selected_plan === plan.name ? 'text-emerald-600' : 'text-zinc-900'}`}>{plan.name}</span>
                    {formData.selected_plan === plan.name && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-zinc-400 text-xs font-bold font-mono">RM</span>
                    <span className="text-4xl font-black text-zinc-900">{plan.price}</span>
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-tighter">/ Month</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4">
                <Link href="/pricing" target="_blank" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-all font-black uppercase tracking-widest text-[10px] underline decoration-indigo-200 underline-offset-4">
                  <Search className="w-3.5 h-3.5" /> View Full Plan Details & Features
                </Link>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-black text-zinc-900 uppercase italic">1. Payment Integration (Optional)</h2>
            <p className="text-zinc-600 font-medium">If you want to sell online, you need a payment gateway. Do you already have a ToyyibPay account?</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, has_toyyibpay: true } }))}
                className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs border transition-all ${formData.payment_setup.has_toyyibpay ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-500/10' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'}`}
              >
                Yes, I have ToyyibPay
              </button>
              <button 
                onClick={() => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, has_toyyibpay: false } }))}
                className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs border transition-all ${!formData.payment_setup.has_toyyibpay ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-500/10' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'}`}
              >
                No, help me register
              </button>
            </div>

            {formData.payment_setup.has_toyyibpay ? (
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Secret Key</label>
                  <input 
                    type="password"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                    placeholder="Enter ToyyibPay Secret Key"
                    value={formData.payment_setup.secret_key || ""}
                    onChange={(e) => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, secret_key: e.target.value } }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Category Code</label>
                  <input 
                    type="text"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                    placeholder="Enter Category Code"
                    value={formData.payment_setup.category_code || ""}
                    onChange={(e) => setFormData(p => ({ ...p, payment_setup: { ...p.payment_setup, category_code: e.target.value } }))}
                  />
                </div>
              </div>
            ) : (
              <div className="pt-4 p-8 border border-dashed border-zinc-300 rounded-2xl bg-zinc-50/50 flex flex-col items-center justify-center gap-4">
                 <UploadCloud className="w-10 h-10 text-zinc-300" />
                 <div className="text-center">
                    <p className="font-black text-zinc-900 uppercase tracking-widest text-sm mb-1">Upload SSM Document</p>
                    <p className="text-[10px] text-zinc-400 font-bold">ONLY .PDF, .JPG, .PNG ALLOWED (MAX 10MB)</p>
                 </div>
                 <input type="file" className="block w-full max-w-xs text-xs text-zinc-500 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-zinc-900 file:text-white hover:file:bg-black transition-all" 
                 onChange={(e) => setSsmFile(e.target.files?.[0] || null)}
                 accept=".pdf,.png,.jpg,.jpeg" />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-black text-zinc-900 uppercase italic">2. Feature Specification</h2>
            <p className="text-zinc-600 font-medium">Select the core functionalities for your site. All systems are included in your tier.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
               {[
                 { title: "Commercial", items: ["Shopping Cart & Checkout", "Payment Gateway Sync", "Promo Code System", "Order Notifications"] },
                 { title: "Service & Bookings", items: ["Appointment Scheduler", "Service Catalog", "Location Mapping", "Staff Directory"] },
                 { title: "Brand Identity", items: ["Interactive Gallery", "Customer Testimonials", "Company Timeline", "Partner Showcase"] },
                 { title: "User Engagement", items: ["Blog / News Engine", "FAQ Hub", "Floating Chat Support", "Lead Generation Forms"] }
               ].map((cat, idx) => (
                 <div key={idx} className="bg-zinc-50 p-8 rounded-3xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-all">
                    <h3 className="font-black italic uppercase tracking-widest text-xs text-emerald-600 mb-6">{cat.title}</h3>
                    <div className="space-y-4">
                      {cat.items.map(item => (
                        <label key={item} className="flex items-center gap-4 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={formData.features.includes(item)}
                            onChange={() => toggleFeature(item)}
                            className="w-5 h-5 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500/20 bg-white"
                          />
                          <span className="text-sm font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors uppercase tracking-tight">{item}</span>
                        </label>
                      ))}
                    </div>
                 </div>
               ))}
            </div>

            <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm">
                <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-6 font-mono">Custom Requirements</h3>
                <div className="space-y-3">
                    {formData.custom_features.map((feature, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input 
                                type="text" 
                                value={feature}
                                onChange={(e) => handleCustomFeatureChange(idx, e.target.value)}
                                className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 focus:outline-none focus:border-emerald-500"
                                placeholder="e.g. Member Area, Multi-vendor setup..."
                            />
                        </div>
                    ))}
                    <button 
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, custom_features: [...p.custom_features, ""] }))}
                        className="text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:underline pt-2 flex items-center gap-2"
                    >
                        <span className="text-lg">+</span> Add Extra Feature
                    </button>
                    {formData.custom_features.length === 0 && (
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">No extra features added yet.</p>
                    )}
                </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Additional Project Notes</label>
              <textarea 
                className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-zinc-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all min-h-[140px]"
                placeholder="Share any other specific technical requirements or workflows we should know about..."
                value={formData.custom_needs}
                onChange={(e) => setFormData(p => ({ ...p, custom_needs: e.target.value }))}
              />
            </div>
          </div>
        )}

        {step === 3 && (
           <div className="space-y-8 animate-fade-in">
             <h2 className="text-2xl font-black text-zinc-900 uppercase italic">3. Brand & Visuals</h2>
             <p className="text-zinc-600 font-medium leading-relaxed">Let's define your website's look and feel. Provide your brand assets and structural preferences.</p>
             
             <div className="grid md:grid-cols-2 gap-8">
               <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm">
                 <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-6 font-mono">Proposed Sitemap</h3>
                 <div className="space-y-3">
                   {formData.sitemap.map((page, idx) => (
                     <div key={idx} className="flex gap-2 group">
                       <input 
                         type="text" 
                         value={page}
                         onChange={(e) => handleSitemapChange(idx, e.target.value)}
                         className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
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
                     className="text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:underline pt-2 flex items-center gap-2"
                   >
                     <span className="text-lg">+</span> Add Page
                   </button>
                 </div>
               </div>

               <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm space-y-8">
                 <div className="pb-6 border-b border-zinc-200/50">
                    <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-4 font-mono">Competitor Reference</h3>
                    <p className="text-[10px] text-zinc-400 font-bold mb-3 uppercase tracking-widest leading-tight">Link to a website style you admire</p>
                    <input 
                        type="url" 
                        value={formData.competitor_ref}
                        onChange={(e) => setFormData(p => ({ ...p, competitor_ref: e.target.value }))}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-zinc-700 focus:outline-none focus:border-emerald-500 shadow-sm"
                        placeholder="https://example.com"
                    />
                 </div>
                 
                 <div className="space-y-8">
                    <div>
                        <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-4 font-mono">Theme Color</h3>
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
                        <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-4 font-mono">Brand Logo</h3>
                        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                            <div className="w-20 h-20 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <UploadCloud className="w-8 h-8 text-zinc-200" />
                                )}
                            </div>
                            <div className="space-y-3 flex-1 w-full">
                                <label 
                                    htmlFor="logo-upload"
                                    className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black cursor-pointer transition-all shadow-md active:scale-95"
                                >
                                    <UploadCloud className="w-4 h-4" />
                                    Upload Logo
                                </label>
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
                                <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest text-center sm:text-left">Max size: 5MB</p>
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
              <h2 className="text-2xl font-black text-zinc-900 uppercase italic">4. Business Identity</h2>
              <p className="text-zinc-600 font-medium leading-relaxed">Provide your official business details for the footer, contact page, and social links.</p>
              
              <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-[2.5rem] shadow-sm">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">WhatsApp Number (Mandatory)</label>
                <div className="relative group max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <span className="text-zinc-900 font-black">+</span>
                  </div>
                  <input 
                    type="text"
                    required
                    pattern="^60[1-9]\d{7,9}$"
                    className="w-full bg-white border border-zinc-200 rounded-2xl pl-10 pr-6 py-4 text-zinc-900 font-black focus:outline-none focus:border-emerald-500 transition-all font-mono text-lg shadow-inner"
                    placeholder="60123456789"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData(p => ({ ...p, whatsapp_number: e.target.value }))}
                  />
                </div>
                <p className="text-[10px] font-bold text-zinc-400 mt-3 uppercase tracking-widest">Format: 60 followed by your number (No + sign).</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-2 font-mono">Direct Contact</h3>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Official Business Email</label>
                        <input 
                            type="email"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm"
                            placeholder="hello@yourbusiness.com"
                            value={formData.business_email}
                            onChange={(e) => setFormData(p => ({ ...p, business_email: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Physical Business Address</label>
                        <textarea 
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 min-h-[90px] shadow-sm"
                            placeholder="Complete address for Footer & Google Maps"
                            value={formData.business_address}
                            onChange={(e) => setFormData(p => ({ ...p, business_address: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black italic uppercase tracking-widest text-zinc-900 mb-2 font-mono">Socials & Operations</h3>
                    <div className="space-y-2">
                        <input 
                            type="text"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm"
                            placeholder="Facebook Page Link"
                            value={formData.social_media.facebook}
                            onChange={(e) => setFormData(p => ({ ...p, social_media: { ...p.social_media, facebook: e.target.value } }))}
                        />
                        <input 
                            type="text"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm"
                            placeholder="Instagram Profile Link"
                            value={formData.social_media.instagram}
                            onChange={(e) => setFormData(p => ({ ...p, social_media: { ...p.social_media, instagram: e.target.value } }))}
                        />
                        <input 
                            type="text"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm"
                            placeholder="TikTok Profile Link"
                            value={formData.social_media.tiktok}
                            onChange={(e) => setFormData(p => ({ ...p, social_media: { ...p.social_media, tiktok: e.target.value } }))}
                        />
                    </div>
                    <div className="pt-2">
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">Operation Hours</label>
                        <input 
                            type="text"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm"
                            placeholder="e.g. Mon-Fri: 9AM - 6PM, Sat: 9AM - 1PM"
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
             <h2 className="text-2xl font-black text-zinc-900 uppercase italic">5. Domain Request</h2>
             <p className="text-zinc-600 font-medium leading-relaxed">Provide up to 3 choices for your website domain in order of preference. We will verify and register the best option.</p>
             
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">Choice 1 (Primary)</label>
                  <input 
                    type="text"
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-zinc-900 font-black focus:outline-none focus:border-emerald-500 shadow-sm"
                    placeholder="e.g., brandname.com"
                    value={formData.domain_requested}
                    onChange={(e) => setFormData(p => ({ ...p, domain_requested: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Choice 2</label>
                  <input 
                    type="text"
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-zinc-900 font-black focus:outline-none focus:border-emerald-500 shadow-sm"
                    placeholder="e.g., brandname.com.my"
                    value={formData.domain_2}
                    onChange={(e) => setFormData(p => ({ ...p, domain_2: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Choice 3</label>
                  <input 
                    type="text"
                    className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-zinc-900 font-black focus:outline-none focus:border-emerald-500 shadow-sm"
                    placeholder="e.g., shopbrandname.my"
                    value={formData.domain_3}
                    onChange={(e) => setFormData(p => ({ ...p, domain_3: e.target.value }))}
                  />
                </div>
             </div>

             <div className="mt-8 p-8 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-6 shadow-sm">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-emerald-100">
                  <Shield className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest italic">Secure Staging Protocol</h4>
                  <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                    Once submitted, our team explores these domains while building your Staging environment. <strong className="text-zinc-900">No payment is required today.</strong> Subscription officially starts only after your final approval.
                  </p>
                </div>
              </div>
            </div>
         )}

         {step === 6 && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 uppercase italic">6. Project Vision</h2>
                </div>

                <div className="space-y-6">
                    <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-3xl shadow-sm">
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-900 mb-4 font-mono">Website Title / Project Name</label>
                        <input 
                            type="text"
                            required
                            className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 text-zinc-900 font-black focus:outline-none focus:border-indigo-500 text-lg shadow-inner"
                            placeholder="e.g. Acme Corporation Business Portal"
                            value={formData.project_title}
                            onChange={(e) => setFormData(p => ({ ...p, project_title: e.target.value }))}
                        />
                    </div>
                    
                    <div className="p-8 bg-zinc-50 border border-zinc-200/60 rounded-[2.5rem] shadow-sm">
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-900 mb-4 font-mono">The Big Idea (Describe Your Vision)</label>
                        <textarea 
                            className="w-full bg-white border border-zinc-200 rounded-2xl px-8 py-6 text-zinc-900 font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all min-h-[300px] text-lg leading-relaxed shadow-inner"
                            placeholder="Tell us everything. What is your business about? Who is your target audience? What specific vibe or unique experience do you want users to have?"
                            value={formData.project_vision}
                            onChange={(e) => setFormData(p => ({ ...p, project_vision: e.target.value }))}
                        />
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                            <CheckCircle2 className="w-4 h-4" /> This vision will be prioritized in our development roadmap.
                        </div>
                    </div>
                </div>
            </div>
         )}

         <div className="mt-12 flex items-center justify-between pt-8 border-t border-zinc-100">
          {step === 0 ? (
              <button 
                type="button"
                onClick={() => {
                  deleteCookie("next-plan");
                  window.location.href = '/app/dashboard';
                }}
                className="flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-[11px] text-red-600 hover:text-red-800 transition-all group border border-red-100 rounded-xl bg-red-50/50 hover:bg-red-50"
              >
                <span>←</span> Cancel & Return to Dashboard
              </button>
          ) : (
            <button 
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-[11px] text-zinc-400 hover:text-zinc-900 transition-all font-mono"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
          )}
          
          {step < 6 ? (
            <button 
              onClick={nextStep}
              disabled={step === 0 && !formData.selected_plan}
              className={`flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-xl font-black hover:bg-black transition-colors ${step === 0 && !formData.selected_plan ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={submitForm}
              disabled={isSubmitting || !formData.whatsapp_number.match(/^60[1-9]\d{7,9}$/) || !formData.project_title}
              className="flex items-center gap-2 px-10 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-50 hover:scale-105 shadow-xl shadow-emerald-500/20"
            >
              {isSubmitting ? "Syncing Logic..." : "Deploy Requirements"}
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
