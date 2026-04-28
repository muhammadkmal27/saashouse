"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function RegisterPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ full_name: fullName, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      // Omega-Onboarding: Check for pending plan selection
      import("@/utils/cookies").then(({ getCookie }) => {
        const pendingPlan = getCookie("next-plan");
        if (pendingPlan) {
            router.push(`/app/projects/create?plan=${pendingPlan}`);
        } else {
            router.push("/app/dashboard");
        }
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2"><T en="Create an account" bm="Daftar akaun" /></h1>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
          <T en="Enter your details below to set up your enterprise workspace" bm="Masukkan butiran anda di bawah untuk menyediakan ruang kerja perusahaan anda" />
        </p>
      </div>

      {error && (
        <div className="mt-6 p-3 text-sm text-red-500 bg-red-50 border border-red-100 dark:border-red-900/50 dark:bg-red-900/20 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            <T en="Full Name" bm="Nama Penuh" />
          </label>
          <input
            id="name"
            placeholder={lang === "EN" ? "John Doe" : "Ahmad Albab"}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white/50 pl-4 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:ring-violet-400"
            required
            suppressHydrationWarning
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            <T en="Email" bm="E-mel" />
          </label>
          <input
            id="email"
            placeholder={lang === "EN" ? "name@example.com" : "nama@contoh.com"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white/50 pl-4 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:ring-violet-400"
            required
            suppressHydrationWarning
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            <T en="Password" bm="Kata Laluan" />
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white/50 pl-4 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:ring-violet-400"
            required
            suppressHydrationWarning
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex items-center justify-center rounded-full text-sm font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-90 h-14 w-full transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(139,92,246,0.3)] group"
          suppressHydrationWarning
        >
          {loading ? <T en="Creating Account..." bm="Mendaftarkan Akaun..." /> : <T en="Create Account" bm="Daftar Akaun" />}
        </button>
      </form>

      <div className="text-center text-sm text-slate-500 mt-8">
        <T en="Already have an account?" bm="Sudah mempunyai akaun?" />{" "}
        <a href="/auth/login" className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-400 hover:opacity-80">
          <T en="Sign In" bm="Log Masuk" />
        </a>
      </div>
    </div>
  );
}
