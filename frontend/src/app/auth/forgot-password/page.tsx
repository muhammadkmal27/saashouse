"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { T } from "@/components/Translate";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
        toast.success("Reset link sent!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to request reset.");
      }
    } catch (err) {
      toast.error("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2"><T en="Check your email" bm="Sila semak e-mel anda" /></h1>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-8">
          <T en={<>We have sent a password reset link to <span className="font-bold text-slate-900 dark:text-white">{email}</span>.</>} 
             bm={<>Kami telah menghantar pautan set semula kata laluan ke <span className="font-bold text-slate-900 dark:text-white">{email}</span>.</>} />
        </p>
        <a 
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-full text-sm font-black uppercase tracking-widest bg-slate-900 text-white dark:bg-white dark:text-slate-900 h-12 px-8 transition-all hover:opacity-90"
        >
          <T en="Back to login" bm="Kembali ke log masuk" />
        </a>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2"><T en="Forgot password?" bm="Lupa kata laluan?" /></h1>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
          <T en="Enter your email address and we'll send you a link to reset your password." bm="Masukkan alamat e-mel anda dan kami akan menghantar pautan untuk menetapkan semula kata laluan anda." />
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            <T en="Email Address" bm="Alamat E-mel" />
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              placeholder="name@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white/50 pl-12 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:ring-violet-400"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex items-center justify-center rounded-full text-sm font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-90 h-14 w-full transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(139,92,246,0.3)] group"
        >
          {loading ? <T en="Sending..." bm="Menghantar..." /> : (
            <span className="flex items-center gap-2">
              <T en="Send Reset Link" bm="Hantar Pautan Set Semula" />
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-slate-500 mt-8">
        <T en="Suddenly remembered?" bm="Tiba-tiba teringat?" />{" "}
        <a href="/auth/login" className="font-semibold text-violet-500 hover:text-violet-400">
          <T en="Back to login" bm="Kembali ke log masuk" />
        </a>
      </div>
    </div>
  );
}
