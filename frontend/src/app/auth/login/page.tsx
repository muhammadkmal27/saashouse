"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { getCookie } from "@/utils/cookies";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function LoginPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.message === "2FA_REQUIRED") {
            router.push("/auth/verify-2fa");
            return;
        }

        // Omega-Onboarding: Check for pending plan selection
        const pendingPlan = getCookie("next-plan");
        if (pendingPlan) {
            router.push(`/app/projects/create?plan=${pendingPlan}`);
        } else {
            router.push("/app/dashboard");
        }
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message === "Failed to fetch" 
        ? "Cannot connect to server. Please check your network or try again later." 
        : `Connection Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2"><T en="Welcome back" bm="Selamat kembali" /></h1>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
          <T en="Sign in to access your enterprise dashboard" bm="Log masuk untuk mengakses papan pemuka perusahaan anda" />
        </p>
      </div>

      {error && (
        <div className="mt-6 p-3 text-sm text-red-500 bg-red-50 border border-red-100 dark:border-red-900/50 dark:bg-red-900/20 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            <T en="Email" bm="E-mel" />
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              placeholder={lang === "EN" ? "name@example.com" : "nama@contoh.com"}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white/50 pl-12 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:ring-violet-400"
              required
              suppressHydrationWarning
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-zinc-300">
              <T en="Password" bm="Kata Laluan" />
            </label>
            <a href="/auth/forgot-password" className="text-sm font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400">
              <T en="Forgot password?" bm="Lupa kata laluan?" />
            </a>
          </div>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white/50 pl-12 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:ring-violet-400"
              required
              suppressHydrationWarning
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex items-center justify-center rounded-full text-sm font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-90 h-14 w-full transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(139,92,246,0.3)] group"
          suppressHydrationWarning
        >
          {loading ? <T en="Signing In..." bm="Log Masuk..." /> : (
            <span className="flex items-center gap-2">
              <T en="Sign In" bm="Log Masuk" />
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="flex items-center mb-8">
          <div className="flex-1 border-t border-slate-200 dark:border-zinc-800"></div>
          <p className="mx-4 text-xs font-bold text-slate-400 tracking-widest uppercase">OR</p>
          <div className="flex-1 border-t border-slate-200 dark:border-zinc-800"></div>
        </div>

        <button 
          onClick={() => window.location.href = "/api/auth/google/login"}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-900 font-bold text-sm text-slate-700 dark:text-zinc-300 shadow-sm"
          suppressHydrationWarning
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.73 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.78 15.72 17.56V20.31H19.28C21.36 18.39 22.56 15.58 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.28 20.31L15.72 17.56C14.73 18.23 13.48 18.63 12 18.63C9.14 18.63 6.72 16.71 5.84 14.13H2.17V16.98C3.98 20.58 7.7 23 12 23Z" fill="#34A853"/>
            <path d="M5.84 14.13C5.61 13.46 5.49 12.74 5.49 12C5.49 11.26 5.61 10.54 5.84 9.87V7.02H2.17C1.43 8.5 1 10.19 1 12C1 13.81 1.43 15.5 2.17 16.98L5.84 14.13Z" fill="#FBBC05"/>
            <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.36 3.86C17.46 2.08 14.97 1 12 1C7.7 1 3.98 3.42 2.17 7.02L5.84 9.87C6.72 7.29 9.14 5.38 12 5.38Z" fill="#EA4335"/>
          </svg>
          <T en="Continue with Google" bm="Teruskan dengan Google" />
        </button>
      </div>

      <div className="text-center text-sm text-slate-500 mt-8">
        <T en="Don't have an account?" bm="Belum mempunyai akaun?" />{" "}
        <a href="/auth/register" className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-400 hover:opacity-80">
          <T en="Sign up for free" bm="Daftar secara percuma" />
        </a>
      </div>
    </div>
  );
}
