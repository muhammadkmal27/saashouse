"use client";

import { useState, useEffect } from "react";
import { UserPlus, Mail, ShieldCheck, Search, Trash2, Shield, MoreVertical } from "lucide-react";

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form State
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, full_name: fullName, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("New administrator successfully added to the system.");
        setEmail("");
        setFullName("");
        setPassword("");
      } else {
        setError(data.error || "Failed to create admin user.");
      }
    } catch (err) {
      setError("Network error: Could not reach backend.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Team Management</h1>
          <p className="text-slate-500 font-medium">Add and manage internal administrators for SaaS House.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Add Member Form */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <h2 className="font-black text-xl text-slate-900">Add Administrator</h2>
                </div>

                <form onSubmit={handleAddAdmin} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-bold border border-emerald-100">
                            {success}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Full Name</label>
                        <div className="relative">
                            <input 
                              type="text" 
                              required
                              value={fullName}
                              onChange={e => setFullName(e.target.value)}
                              placeholder="e.g. Ahmad Farhan"
                              className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="admin@saashouse.com"
                          className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Initial Password</label>
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <button 
                      type="submit" 
                      disabled={saving}
                      className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                    >
                        {saving ? "Provisioning..." : "Forge Account"}
                    </button>

                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight">
                        Account will be created with <span className="text-emerald-500">ADMIN</span> privileges.
                    </p>
                </form>
            </div>
        </div>

        {/* Right: Existing Admins List */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-black text-xl text-slate-900">Active Controllers</h3>
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                          type="text" 
                          placeholder="Search controllers..."
                          className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 w-64 focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="px-4 py-5 font-bold italic">Identity</th>
                                <th className="px-4 py-5 font-bold italic">Privileges</th>
                                <th className="px-4 py-5 font-bold italic text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {/* Static Row for Current User */}
                            <tr className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">SA</div>
                                        <div>
                                            <div className="font-bold text-slate-900">M. Ikhsan (You)</div>
                                            <div className="text-xs text-slate-400 font-medium italic">superadmin@saashouse.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-5">
                                    <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-wide">
                                        Super User
                                    </span>
                                </td>
                                <td className="px-4 py-5 text-right">
                                    <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                            {/* Placeholder for others */}
                            <tr className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-5">
                                    <div className="flex items-center gap-3 opacity-50">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black italic">JD</div>
                                        <div>
                                            <div className="font-bold text-slate-900">Jane Doe</div>
                                            <div className="text-xs text-slate-400 font-medium italic">jane@saashouse.com</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-5">
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wide">
                                        Administrator
                                    </span>
                                </td>
                                <td className="px-4 py-5 text-right">
                                    <button className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
