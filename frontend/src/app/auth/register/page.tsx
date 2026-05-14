"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/components/Translate";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { translateError } from "@/utils/error-translator";
import { Turnstile } from "@marsidev/react-turnstile";

export default function RegisterPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ full_name: fullName, email, password, turnstile_token: turnstileToken }),
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
      setError(translateError(err.message, lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2"><T en="Create an account" bm="Daftar akaun" /></h1>
        <p className="text-sm font-medium text-slate-500">
          <T en="Enter your details below to set up your enterprise workspace" bm="Masukkan butiran anda di bawah untuk menyediakan ruang kerja perusahaan anda" />
        </p>
      </div>

      {error && (
        <div className="mt-6 p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-bold text-slate-700">
            <T en="Full Name" bm="Nama Penuh" />
          </label>
          <input
            id="name"
            placeholder={lang === "EN" ? "John Doe" : "Ahmad Albab"}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm"
            required
            suppressHydrationWarning
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-bold text-slate-700">
            <T en="Email" bm="E-mel" />
          </label>
          <input
            id="email"
            placeholder={lang === "EN" ? "name@example.com" : "nama@contoh.com"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm"
            required
            suppressHydrationWarning
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-bold text-slate-700">
            <T en="Password" bm="Kata Laluan" />
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-12 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm"
              required
              suppressHydrationWarning
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex justify-center my-4">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
            onSuccess={(token) => setTurnstileToken(token)}
            options={{
              theme: 'light',
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !turnstileToken}
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
