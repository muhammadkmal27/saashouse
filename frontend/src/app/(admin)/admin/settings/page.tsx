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

type SettingMap = Record<string, any>;

const TABS = [
  { id: "general",     label: "General",     icon: Settings },
  { id: "pricing",     label: "Pricing",     icon: Server },
  { id: "otp",         label: "OTP Mode",    icon: Zap },
  { id: "agreement",   label: "Agreement",   icon: FileText },
  { id: "maintenance", label: "Maintenance",  icon: Wrench },
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
      toast.success(`${label} saved successfully.`);
    } catch (err: any) {
      toast.error(err.message ?? "Save failed.");
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
          System Settings
        </h1>
        <p className="text-sm text-zinc-400 font-medium mt-1">
          Manage system-wide configuration. Changes take effect immediately.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-zinc-100 rounded-2xl p-1.5 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab: General ─── */}
      {activeTab === "general" && (
        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-100/60 p-10 space-y-8">
          <div>
            <h2 className="text-lg font-black text-zinc-900 mb-1 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              Admin Notification Email
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              All system notifications (new tickets, client replies) will be sent to this address.
            </p>

            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
              Admin Email Address
            </label>
            <div className="flex gap-3">
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                className="flex-1 px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium text-zinc-900 outline-none focus:ring-2 ring-indigo-300 transition-all"
              />
              <button
                onClick={() => handleSave("admin_email", adminEmail, "Admin Email")}
                disabled={saving === "admin_email"}
                className="flex items-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {saving === "admin_email" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-100 space-y-8">
            <h2 className="text-lg font-black text-zinc-900 mb-1 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-violet-500" />
              Service Agreement Branding
            </h2>
            
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                Service Provider Name
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="SaaS House Development"
                  maxLength={255}
                  className="flex-1 px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium text-zinc-900 outline-none focus:ring-2 ring-violet-300 transition-all"
                />
                <button
                  onClick={() => handleSave("service_provider_name", providerName, "Provider Name")}
                  disabled={saving === "service_provider_name"}
                  className="flex items-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {saving === "service_provider_name" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black uppercase tracking-widest text-zinc-500">
                Official Provider Signature
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Draw Signature</span>
                      <button onClick={clearCanvas} className="text-[9px] font-bold text-red-500 uppercase hover:underline">Clear</button>
                   </div>
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
                    className="w-full h-[150px] bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl cursor-crosshair touch-none shadow-inner"
                   />
                   <button 
                    onClick={saveProviderSignature}
                    disabled={saving === "service_provider_signature"}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2"
                   >
                     {saving === "service_provider_signature" ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenTool className="w-3 h-3" />}
                     Save Official Signature
                   </button>
                </div>
                
                <div className="space-y-3">
                   <span className="text-[10px] font-bold text-zinc-400 uppercase px-1">Current Saved Signature</span>
                   <div className="w-full h-[150px] bg-white border border-zinc-100 rounded-2xl flex items-center justify-center p-4">
                     {providerSignature ? (
                        <img src={providerSignature} alt="Current Provider Signature" className="max-h-full" />
                     ) : (
                        <p className="text-[10px] text-zinc-300 italic font-medium">No signature saved yet.</p>
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
        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-100/60 p-10 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-black text-zinc-900 mb-1 flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-500" />
                  Package Pricing
                </h2>
                <p className="text-sm text-zinc-400">
                  Update the monthly subscription prices for each tier.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(packagePrices).map(([name, price]) => (
                <div key={name} className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500">
                    {name} Tier (RM / Month)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPackagePrices(p => ({ ...p, [name]: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-black text-zinc-900 outline-none focus:ring-2 ring-emerald-300 transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="pt-8 flex justify-end">
              <button
                onClick={() => handleSave("package_prices", packagePrices, "Package Prices")}
                disabled={saving === "package_prices"}
                className="flex items-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-zinc-900/10"
              >
                {saving === "package_prices" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save All Prices
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─── Tab: OTP Mode ─── */}
      {activeTab === "otp" && (
        <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-100/60 p-10 space-y-10">
          <div className="flex items-start justify-between gap-6 pb-8 border-b border-zinc-50">
            <div>
              <h2 className="text-lg font-black text-zinc-900 mb-1 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                One Time Purchase Mode
              </h2>
              <p className="text-sm text-zinc-400 max-w-lg">
                If enabled, all recurring subscription packages will be hidden on the public site. 
                Clients will only see the One Time Purchase package at the price set below.
              </p>
            </div>
            <button
              role="switch"
              onClick={() => {
                const newVal = !otpMode;
                setOtpMode(newVal);
                handleSave("otp_mode_active", newVal, "OTP Mode");
              }}
              className={`relative flex-shrink-0 w-16 h-9 rounded-full transition-colors duration-300 focus:outline-none ${
                otpMode ? "bg-indigo-500" : "bg-zinc-200"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  otpMode ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-zinc-500">
                Deposit Price (RM)
              </label>
              <input
                type="number"
                value={otpDeposit}
                onChange={(e) => setOtpDeposit(e.target.value)}
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-black text-zinc-900 outline-none focus:ring-2 ring-indigo-300 transition-all"
              />
              <button
                onClick={() => handleSave("otp_deposit_price", otpDeposit, "Deposit Price")}
                disabled={saving === "otp_deposit_price"}
                className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline flex items-center gap-1"
              >
                {saving === "otp_deposit_price" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Update Deposit
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-zinc-500">
                Final Payment (RM)
              </label>
              <input
                type="number"
                value={otpFinal}
                onChange={(e) => setOtpFinal(e.target.value)}
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-black text-zinc-900 outline-none focus:ring-2 ring-indigo-300 transition-all"
              />
              <button
                onClick={() => handleSave("otp_final_price", otpFinal, "Final Payment")}
                disabled={saving === "otp_final_price"}
                className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline flex items-center gap-1"
              >
                {saving === "otp_final_price" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Update Final
              </button>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
             <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-zinc-500">Total Project Value:</span>
                <span className="text-xl font-black text-zinc-900">RM {Number(otpDeposit) + Number(otpFinal)}</span>
             </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Agreement ─── */}
      {activeTab === "agreement" && (
        <AgreementSettings 
          otpTemplate={otpTemplate}
          saasTemplate={saasTemplate}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* ─── Tab: Maintenance ─── */}
      {activeTab === "maintenance" && (
        <div className="space-y-6">
          <div className={`bg-white rounded-[2.5rem] border shadow-xl p-10 space-y-6 transition-all ${
            maintenance ? "border-amber-200 shadow-amber-100" : "border-zinc-100 shadow-zinc-100/60"
          }`}>
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-lg font-black text-zinc-900 mb-1 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-500" />
                  Maintenance Mode
                </h2>
                <p className="text-sm text-zinc-400 max-w-lg">
                  When enabled, the public-facing pages of the site will display a maintenance notice.
                  Clients will <strong>not</strong> be able to log in or interact with the system.
                  Admin access is unaffected.
                </p>
              </div>

              {/* Toggle */}
              <button
                role="switch"
                aria-checked={maintenance}
                onClick={() => setMaintenance(v => !v)}
                className={`relative flex-shrink-0 w-16 h-9 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  maintenance
                    ? "bg-amber-500 focus:ring-amber-400"
                    : "bg-zinc-200 focus:ring-zinc-400"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    maintenance ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {maintenance && (
              <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm font-medium text-amber-800">
                  <strong>Warning:</strong> Maintenance mode is currently <strong>ON</strong>. 
                  Clients cannot access the platform until you turn this off.
                </p>
              </div>
            )}

            {!maintenance && (
              <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-medium text-emerald-800">
                  Platform is <strong>online</strong>. All public pages are accessible.
                </p>
              </div>
            )}

            {/* Security Info */}
            <div className="flex items-start gap-3 px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
              <ShieldAlert className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-500 font-medium">
                <strong>Note:</strong> Maintenance mode currently stores a flag in the database.
                Your frontend public pages can read this flag via{" "}
                <code className="bg-zinc-100 px-1 py-0.5 rounded text-xs">/api/admin/settings</code>{" "}
                to display a maintenance notice (implementation requires middleware on the public layout).
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleSave("maintenance_mode", maintenance, "Maintenance Mode")}
                disabled={saving === "maintenance_mode"}
                className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
                  maintenance
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-zinc-900 hover:bg-black text-white"
                }`}
              >
                {saving === "maintenance_mode" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {maintenance ? "Enable Maintenance Mode" : "Save (Platform Online)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
