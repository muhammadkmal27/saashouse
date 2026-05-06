"use client";

import { useState, useEffect, useRef } from "react";
import {
  Settings, Mail, Server, ShieldAlert, Wrench,
  Loader2, CheckCircle2, AlertTriangle, Save, Eye, EyeOff, Zap, PenTool, Trash2,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "@/utils/cookies";
import AgreementSettings from "@/components/admin/settings/AgreementSettings";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { translateError } from "@/utils/error-translator";

type SettingMap = Record<string, any>;

const TABS = [
  { id: "general",     label: { en: "General", bm: "Umum" },     icon: Settings },
  { id: "pricing",     label: { en: "Pricing", bm: "Harga" },     icon: Server },
  { id: "otp",         label: { en: "Payments & OTP", bm: "Pembayaran & OTP" }, icon: Zap },
  { id: "agreement",   label: { en: "Agreement", bm: "Perjanjian" },   icon: FileText },
  { id: "maintenance", label: { en: "Maintenance", bm: "Penyelenggaraan" },  icon: Wrench },
] as const;

type TabId = typeof TABS[number]["id"];

async function patchSetting(key: string, value: unknown) {
  const csrfToken = getCookie("csrf_token") || "";
  const res = await fetch(`/api/admin/settings/${key}`, {
    method: "PATCH",
    credentials: "include",
    headers: { 
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
    },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Failed to save setting.");
  }
  return res.json();
}

export default function AdminSettingsPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab]   = useState<TabId>("general");
  const [settings, setSettings]     = useState<SettingMap>({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState<string | null>(null);
  const [showPass, setShowPass]     = useState(false);

  // Form states
  const [adminEmail,    setAdminEmail]    = useState("");
  const [maintenance,   setMaintenance]   = useState(false);
  const [packagePrices, setPackagePrices] = useState<Record<string, string>>({
    Standard: "165",
    Growth: "240",
    Enterprise: "410",
    Platinum: "750",
  });
  const [otpMode, setOtpMode]       = useState(false);
  const [otpDeposit, setOtpDeposit] = useState("200");
  const [otpFinal, setOtpFinal]     = useState("500");
  const [saasDeposit, setSaasDeposit] = useState("250");
  const [providerName, setProviderName] = useState("SaaS House Development");
  const [providerSignature, setProviderSignature] = useState("");
  const [otpTemplate, setOtpTemplate] = useState<any[]>([]);
  const [saasTemplate, setSaasTemplate] = useState<any[]>([]);

  // Canvas Refs for Admin Signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then(r => r.json())
      .then((items: { key: string; value: any }[]) => {
        const map: SettingMap = {};
        for (const item of items) map[item.key] = item.value;
        setSettings(map);

        // Seed form states
        setAdminEmail(map["admin_email"] ?? "");
        setMaintenance(map["maintenance_mode"] === true || map["maintenance_mode"] === "true");
        if (map["package_prices"]) {
          setPackagePrices(map["package_prices"]);
        }
        setOtpMode(map["otp_mode_active"] === true || map["otp_mode_active"] === "true");
        setOtpDeposit(map["otp_deposit_price"] ?? "200");
        setOtpFinal(map["otp_final_price"] ?? "500");
        setSaasDeposit(map["saas_deposit_price"] ?? "250");
        setProviderName(map["service_provider_name"] ?? "SaaS House Development");
        setProviderSignature(map["service_provider_signature"] ?? "");
        setOtpTemplate(map["agreement_template_otp"] ?? []);
        setSaasTemplate(map["agreement_template_saas"] ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Drawing Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };
  const stopDrawing = () => {
    setIsDrawing(false);
    canvasRef.current?.getContext("2d")?.beginPath();
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        x = (e as React.MouseEvent).clientX - rect.left;
        y = (e as React.MouseEvent).clientY - rect.top;
    }

    // Scale coordinates to account for CSS scaling vs internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    x = x * scaleX;
    y = y * scaleY;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  };
  const saveProviderSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    await handleSave("service_provider_signature", dataUrl, "Provider Signature");
    setProviderSignature(dataUrl);
  };

  const handleSave = async (key: string, value: unknown, label: string) => {
    setSaving(key);
    try {
      await patchSetting(key, value);
      toast.success(lang === 'EN' ? `${label} saved successfully.` : `${label} berjaya disimpan.`);
    } catch (err: any) {
      toast.error(translateError(err.message ?? "Save failed.", lang));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      {/* Header */}
      <div className="border-b border-zinc-100 pb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 flex items-center gap-3">
          <Settings className="w-8 h-8 text-zinc-500" />
          <T en="System Settings" bm="Tetapan Sistem" />
        </h1>
        <p className="text-sm text-zinc-400 font-medium mt-1">
          <T en="Manage system-wide configuration. Changes take effect immediately." bm="Urus konfigurasi seluruh sistem. Perubahan berkuat kuasa serta-merta." />
        </p>
      </div>

      {/* Tab Bar (Fully Visible Grid on Mobile, Flex on Desktop) */}
      <div className="bg-zinc-100 rounded-2xl p-1.5 w-full md:w-fit">
        <div className="grid grid-cols-6 md:flex md:gap-1.5 w-full">
          {TABS.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-5 py-3 md:py-2.5 rounded-xl transition-all ${
                idx < 3 ? "col-span-2" : "col-span-3"
              } ${
                activeTab === tab.id
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <tab.icon className="w-4 h-4 md:w-4 md:h-4" />
              <span className="text-[9px] md:text-sm font-black uppercase tracking-tight md:tracking-widest whitespace-nowrap">
                {tab.id === "otp" ? (
                  <>
                    <span className="md:hidden"><T en="PAYMENTS" bm="PEMBAYARAN" /></span>
                    <span className="hidden md:inline"><T en="PAYMENTS & OTP" bm="PEMBAYARAN & OTP" /></span>
                  </>
                ) : (
                  <T en={tab.label.en} bm={tab.label.bm} />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab: General ─── */}
      {activeTab === "general" && (
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-100/60 p-6 md:p-10 space-y-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-zinc-900 mb-1 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-500" />
                <T en="Admin Notification Email" bm="E-mel Notifikasi Admin" />
              </h2>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                <T en="All system notifications will be sent to this address." bm="Semua notifikasi sistem akan dihantar ke alamat ini." />
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <T en="Admin Email Address" bm="Alamat E-mel Admin" />
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="you@example.com"
                  maxLength={255}
                  className="flex-1 px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium text-zinc-900 outline-none focus:ring-2 ring-indigo-300 transition-all"
                />
                <button
                  onClick={() => handleSave("admin_email", adminEmail, "Admin Email")}
                  disabled={saving === "admin_email"}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-zinc-900/10"
                >
                  {saving === "admin_email" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <T en="Save" bm="Simpan" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-zinc-100 space-y-10">
            <h2 className="text-lg font-black text-zinc-900 mb-1 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-violet-500" />
              <T en="Service Agreement Branding" bm="Penjenamaan Perjanjian Perkhidmatan" />
            </h2>
            
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <T en="Service Provider Name" bm="Nama Pembekal Perkhidmatan" />
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="SaaS House Development"
                  maxLength={255}
                  className="flex-1 px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium text-zinc-900 outline-none focus:ring-2 ring-violet-300 transition-all"
                />
                <button
                  onClick={() => handleSave("service_provider_name", providerName, "Provider Name")}
                  disabled={saving === "service_provider_name"}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-zinc-900/10"
                >
                  {saving === "service_provider_name" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <T en="Save" bm="Simpan" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <T en="Official Provider Signature" bm="Tandatangan Rasmi Pembekal" />
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight"><T en="Draw New Signature" bm="Lukis Tandatangan Baru" /></span>
                      <button onClick={clearCanvas} className="text-[10px] font-black text-red-500 uppercase hover:underline"><T en="Clear Canvas" bm="Kosongkan Kanvas" /></button>
                   </div>
                   {/* Canvas wrapper to ensure responsive behavior without breaking desktop logic */}
                   <div className="relative w-full overflow-hidden bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[1.5rem] shadow-inner">
                      <canvas 
                        ref={canvasRef}
                        width={400}
                        height={150}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[150px] cursor-crosshair touch-none"
                      />
                   </div>
                   <button 
                    onClick={saveProviderSignature}
                    disabled={saving === "service_provider_signature"}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                   >
                     {saving === "service_provider_signature" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                     <T en="Save Official Signature" bm="Simpan Tandatangan Rasmi" />
                   </button>
                </div>
                
                <div className="space-y-4">
                   <span className="text-[10px] font-bold text-zinc-400 uppercase px-1 tracking-tight"><T en="Current System Signature" bm="Tandatangan Sistem Semasa" /></span>
                   <div className="w-full h-[150px] md:h-[215px] bg-white border border-zinc-100 rounded-[1.5rem] flex items-center justify-center p-6 shadow-sm">
                     {providerSignature ? (
                        <img src={providerSignature} alt="Current Provider Signature" className="max-h-full transition-transform hover:scale-105" />
                     ) : (
                        <p className="text-[10px] text-zinc-300 italic font-medium uppercase tracking-widest"><T en="No signature data" bm="Tiada data tandatangan" /></p>
                     )}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Pricing ─── */}
      {activeTab === "pricing" && (
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-100/60 p-6 md:p-10 space-y-10">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-black text-zinc-900 mb-1 flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-500" />
                  <T en="Package Pricing" bm="Harga Pakej" />
                </h2>
                <p className="text-sm text-zinc-400 font-medium">
                  <T en="Update monthly subscription fees for each node." bm="Kemas kini yuran langganan bulanan untuk setiap nod." />
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {Object.entries(packagePrices).map(([name, price]) => (
                <div key={name} className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {name} (<T en="RM / Month" bm="RM / Bulan" />)
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-400">RM</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPackagePrices(p => ({ ...p, [name]: e.target.value }))}
                      className="w-full pl-12 pr-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-black text-zinc-900 outline-none focus:ring-2 ring-emerald-300 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-10 flex flex-col sm:flex-row justify-end">
              <button
                onClick={() => handleSave("package_prices", packagePrices, lang === 'EN' ? "Package Prices" : "Harga Pakej")}
                disabled={saving === "package_prices"}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-zinc-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-zinc-900/10 active:scale-95"
              >
                {saving === "package_prices" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <T en="Update All Nodes" bm="Kemas Kini Semua Nod" />
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─── Tab: OTP Mode ─── */}
      {activeTab === "otp" && (
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-100/60 p-6 md:p-10 space-y-10">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-8 border-b border-zinc-50">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                <T en="Payments & OTP Mode" bm="Pembayaran & Mod OTP" />
              </h2>
              <p className="text-sm text-zinc-400 max-w-lg font-medium">
                <T en="Manage deposit settings for both SaaS and One-Time Purchase modes. If OTP Mode is enabled, subscription packages will be hidden." bm="Urus tetapan deposit untuk kedua-dua mod SaaS dan Pembelian Sekali. Jika Mod OTP diaktifkan, pakej langganan akan disembunyikan." />
              </p>
            </div>
            <button
              role="switch"
              onClick={() => {
                const newVal = !otpMode;
                setOtpMode(newVal);
                handleSave("otp_mode_active", newVal, lang === 'EN' ? "OTP Mode" : "Mod OTP");
              }}
              className={`relative flex-shrink-0 w-16 h-9 rounded-full transition-all duration-300 focus:outline-none ${
                otpMode ? "bg-indigo-500 shadow-lg shadow-indigo-200" : "bg-zinc-200"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  otpMode ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <T en="Deposit Price (RM)" bm="Harga Deposit (RM)" />
              </label>
              <input
                type="number"
                value={otpDeposit}
                onChange={(e) => setOtpDeposit(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-black text-zinc-900 outline-none focus:ring-2 ring-indigo-300 transition-all"
              />
              <button
                onClick={() => handleSave("otp_deposit_price", otpDeposit, lang === 'EN' ? "Deposit Price" : "Harga Deposit")}
                disabled={saving === "otp_deposit_price"}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {saving === "otp_deposit_price" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <T en="Update Deposit" bm="Kemas Kini Deposit" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <T en="Final Payment (RM)" bm="Bayaran Akhir (RM)" />
              </label>
              <input
                type="number"
                value={otpFinal}
                onChange={(e) => setOtpFinal(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-black text-zinc-900 outline-none focus:ring-2 ring-indigo-300 transition-all"
              />
              <button
                onClick={() => handleSave("otp_final_price", otpFinal, lang === 'EN' ? "Final Payment" : "Bayaran Akhir")}
                disabled={saving === "otp_final_price"}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {saving === "otp_final_price" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <T en="Update Final" bm="Kemas Kini Bayaran Akhir" />
              </button>
            </div>
          </div>

          <div className="p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="text-center sm:text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">OTP Total Value</p>
                <span className="text-2xl font-black text-zinc-900">RM {Number(otpDeposit) + Number(otpFinal)}</span>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Zap className="w-6 h-6 text-indigo-500" />
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-10 border-t border-zinc-100">
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-500">
                <T en="SaaS Onboarding Deposit (RM)" bm="Deposit Onboarding SaaS (RM)" />
              </label>
              <p className="text-xs text-zinc-400 font-medium"><T en="One-time setup fee for SaaS clients before subscription starts." bm="Yuran persediaan sekali gus untuk klien SaaS sebelum langganan bermula." /></p>
              <input
                type="number"
                value={saasDeposit}
                onChange={(e) => setSaasDeposit(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-black text-zinc-900 outline-none focus:ring-2 ring-emerald-300 transition-all"
              />
              <button
                onClick={() => handleSave("saas_deposit_price", saasDeposit, lang === 'EN' ? "SaaS Deposit" : "Deposit SaaS")}
                disabled={saving === "saas_deposit_price"}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {saving === "saas_deposit_price" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <T en="Update SaaS Deposit" bm="Kemas Kini Deposit SaaS" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Agreement ─── */}
      {activeTab === "agreement" && (
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-100/60 p-6 md:p-10">
          <AgreementSettings 
            otpTemplate={otpTemplate}
            saasTemplate={saasTemplate}
            onSave={(key, value) => handleSave(key, value, lang === 'EN' ? "Agreement Template" : "Templat Perjanjian")}
            saving={saving}
          />
        </div>
      )}

      {/* ─── Tab: Maintenance ─── */}
      {activeTab === "maintenance" && (
        <div className="space-y-6">
          <div className={`bg-white rounded-[2rem] md:rounded-[2.5rem] border shadow-xl p-6 md:p-10 space-y-8 transition-all duration-500 ${
            maintenance ? "border-amber-200 shadow-amber-50" : "border-zinc-100 shadow-zinc-100/60"
          }`}>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-500" />
                  <T en="Maintenance Mode" bm="Mod Penyelenggaraan" />
                </h2>
                <p className="text-sm text-zinc-400 max-w-lg font-medium leading-relaxed">
                  <T en="When enabled, all public-facing nodes will display a maintenance notice. Partner access remains restricted during this state." bm="Apabila diaktifkan, semua nod awam akan memaparkan notis penyelenggaraan. Akses rakan kongsi kekal terhad semasa keadaan ini." />
                </p>
              </div>

              {/* Toggle */}
              <button
                role="switch"
                aria-checked={maintenance}
                onClick={() => setMaintenance(v => !v)}
                className={`relative flex-shrink-0 w-16 h-9 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  maintenance
                    ? "bg-amber-500 focus:ring-amber-400 shadow-lg shadow-amber-200"
                    : "bg-zinc-200 focus:ring-zinc-400"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-500 ease-in-out ${
                    maintenance ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="space-y-4">
              {maintenance ? (
                <div className="flex items-center gap-4 px-6 py-5 bg-amber-50 border border-amber-200 rounded-[1.5rem]">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <p className="text-sm font-black text-amber-900 uppercase tracking-tight">
                    <T en="System Status: Offline / Maintenance" bm="Status Sistem: Luar Talian / Penyelenggaraan" />
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4 px-6 py-5 bg-emerald-50 border border-emerald-200 rounded-[1.5rem]">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm font-black text-emerald-900 uppercase tracking-tight">
                    <T en="System Status: Operational / Live" bm="Status Sistem: Beroperasi / Aktif" />
                  </p>
                </div>
              )}

              <div className="flex items-start gap-4 px-6 py-5 bg-zinc-50 border border-zinc-200 rounded-[1.5rem]">
                <ShieldAlert className="w-6 h-6 text-zinc-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-tight leading-relaxed break-all">
                  <T en="Internal Flag: /api/admin/settings/maintenance_mode. Administrative access remains unrestricted." bm="Bendera Dalaman: /api/admin/settings/maintenance_mode. Akses pentadbiran kekal tidak terhad." />
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => handleSave("maintenance_mode", maintenance, lang === 'EN' ? "Maintenance Mode" : "Mod Penyelenggaraan")}
                disabled={saving === "maintenance_mode"}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95 shadow-xl ${
                  maintenance
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200"
                    : "bg-zinc-900 hover:bg-black text-white shadow-zinc-200"
                }`}
              >
                {saving === "maintenance_mode" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {maintenance ? <T en="Activate Maintenance" bm="Aktifkan Penyelenggaraan" /> : <T en="Go Live" bm="Aktifkan Sistem" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
