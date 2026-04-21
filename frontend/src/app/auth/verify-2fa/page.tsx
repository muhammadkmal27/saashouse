"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ArrowRight, ShieldCheck, Mail, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Verify2FAPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Invalid verification code.");
      }
    } catch (err) {
      setError("Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to resend code.");
      }
    } catch (err) {
      setError("Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-md animate-fade-in px-4">
      <div className="flex flex-col gap-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extra-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Double Protection.
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
          We have sent a 6-digit code to your registered email. Please enter the code below to verify your identity.
        </p>
      </div>

      {resendSuccess && (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" /> A new code has been sent to your email.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Secure OTP Code
          </label>
          <div className="relative group">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-4 pl-12 pr-4 text-center text-2xl font-black tracking-[0.5em] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              suppressHydrationWarning
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold mt-1 px-1">✕ {error}</p>}
        </div>

        <button
          disabled={loading || code.length < 6}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          suppressHydrationWarning
        >
          {loading ? "Verifying..." : (
            <>
              Verify Now <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

      </form>

      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-400 px-1 border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <button
          onClick={handleResend}
          disabled={resending}
          className="hover:text-emerald-500 transition-colors flex items-center gap-2 disabled:opacity-50"
          suppressHydrationWarning
        >
          {resending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
          ) : (
            <><Mail className="w-4 h-4" /> Resend Code</>
          )}
        </button>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include",
            });
            router.push("/auth/login");
          }}
          className="hover:text-emerald-500 transition-colors"
          suppressHydrationWarning
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
