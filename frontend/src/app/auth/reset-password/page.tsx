"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { T } from "@/components/Translate";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      router.push("/auth/login");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (res.ok) {
        setSuccess(true);
        toast.success("Password reset successfully!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to reset password.");
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
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2"><T en="Password reset" bm="Kata laluan telah ditetapkan semula" /></h1>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-8">
          <T en="Your password has been successfully updated. You can now log in with your new credentials." bm="Kata laluan anda telah berjaya dikemas kini. Anda kini boleh log masuk dengan maklumat baru anda." />
        </p>
        <a 
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-full text-sm font-black uppercase tracking-widest bg-slate-900 text-white dark:bg-white dark:text-slate-900 h-12 px-8 transition-all hover:opacity-90"
        >
          <T en="Sign in now" bm="Log masuk sekarang" />
        </a>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2"><T en="Set new password" bm="Tetapkan kata laluan baru" /></h1>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
          <T en="Create a strong, unique password to secure your account." bm="Bina kata laluan yang kuat dan unik untuk melindungi akaun anda." />
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            <T en="New Password" bm="Kata Laluan Baru" />
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white/50 pl-12 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:ring-violet-400"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            <T en="Confirm New Password" bm="Sahkan Kata Laluan Baru" />
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="confirmPassword"
              placeholder="••••••••"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white/50 pl-12 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:ring-violet-400"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !token}
          className="mt-6 inline-flex items-center justify-center rounded-full text-sm font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-cyan-400 text-white hover:opacity-90 h-14 w-full transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(139,92,246,0.3)] group"
        >
          {loading ? <T en="Updating..." bm="Mengemaskini..." /> : (
            <span className="flex items-center gap-2">
              <T en="Update Password" bm="Kemaskini Kata Laluan" />
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
