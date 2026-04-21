"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Clock, Mail, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

const POLL_INTERVAL_MS = 8000; // Check every 8 seconds

export default function MaintenancePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(POLL_INTERVAL_MS / 1000);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let pollTimer: ReturnType<typeof setTimeout>;
    let countdownTimer: ReturnType<typeof setInterval>;

    const checkStatus = async () => {
      setChecking(true);
      try {
        const res = await fetch("/api/status-proxy", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.maintenance_mode === false) {
            setOnline(true);
            // Give user a moment to see the "back online" message before redirect
            setTimeout(() => router.replace("/"), 1500);
            return; // Stop polling
          }
        }
      } catch {
        // Backend unreachable — try again next interval
      } finally {
        setChecking(false);
        setCountdown(POLL_INTERVAL_MS / 1000);
      }
      // Schedule next check
      pollTimer = setTimeout(checkStatus, POLL_INTERVAL_MS);
    };

    // Countdown ticker
    countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Start first check after a short delay
    pollTimer = setTimeout(checkStatus, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(pollTimer);
      clearInterval(countdownTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            <Sparkles className="w-6 h-6 fill-white text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight">SaaS House</span>
        </div>

        {/* Main Icon — changes when back online */}
        <div className="flex justify-center">
          <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-xl transition-all duration-700 ${
            online
              ? "bg-emerald-500/15 border border-emerald-500/30 shadow-emerald-500/10"
              : "bg-amber-500/10 border border-amber-500/20 shadow-amber-500/5"
          }`}>
            {online
              ? <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-in zoom-in duration-500" />
              : <Wrench className="w-14 h-14 text-amber-400" />
            }
          </div>
        </div>

        {/* Heading — changes when back online */}
        {online ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-black uppercase tracking-widest text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Platform Back Online
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
              We&rsquo;re{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Back!
              </span>
            </h1>
            <p className="text-zinc-400 text-lg font-medium">
              Redirecting you to the homepage...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black uppercase tracking-widest text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Scheduled Maintenance
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
              We&rsquo;ll Be Back
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
                Shortly
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-lg mx-auto font-medium">
              Our team is currently performing scheduled maintenance to improve
              your experience. This page will automatically refresh when we&rsquo;re back.
            </p>
          </div>
        )}

        {/* Live Status Indicator */}
        {!online && (
          <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 w-fit mx-auto backdrop-blur-sm">
            {checking
              ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              : <div className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />
            }
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {checking
                ? "Checking status…"
                : `Next check in ${countdown}s`
              }
            </span>
          </div>
        )}

        {/* Info Cards */}
        {!online && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-3 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-black text-white text-sm uppercase tracking-widest">Auto-Refresh</h3>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                This page checks our system every 8 seconds. When maintenance ends,
                you&rsquo;ll be automatically redirected — no manual refresh needed.
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-3 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-black text-white text-sm uppercase tracking-widest">Need Urgent Help?</h3>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                For urgent matters, contact us directly at{" "}
                <a
                  href="mailto:support@saashouse.com"
                  className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
                >
                  support@saashouse.com
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Divider & Admin hint */}
        {!online && (
          <>
            <div className="border-t border-zinc-800" />
            <p className="text-zinc-600 text-xs font-medium">
              Are you an admin?{" "}
              <Link
                href="/auth/login"
                className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors font-bold"
              >
                Sign in here
              </Link>{" "}
              — admin access is always available during maintenance.
            </p>
          </>
        )}

        <p className="text-zinc-800 text-xs">
          © {new Date().getFullYear()} SaaS House. All rights reserved.
        </p>
      </div>
    </div>
  );
}
