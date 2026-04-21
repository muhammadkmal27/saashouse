"use client";

import { useState, useEffect } from "react";
import {
  Settings, Mail, Server, ShieldAlert, Wrench,
  Loader2, CheckCircle2, AlertTriangle, Save, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";

type SettingMap = Record<string, any>;

const TABS = [
  { id: "general",     label: "General",     icon: Settings },
  { id: "maintenance", label: "Maintenance",  icon: Wrench },
] as const;

type TabId = typeof TABS[number]["id"];

async function patchSetting(key: string, value: unknown) {
  const res = await fetch(`/api/admin/settings/${key}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
        </div>
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
