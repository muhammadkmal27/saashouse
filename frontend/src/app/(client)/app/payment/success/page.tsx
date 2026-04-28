"use client";
import { T } from "@/components/Translate";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/app/dashboard");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <CheckCircle className="w-12 h-12" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight"><T en="Payment Received!" bm="Pembayaran Diterima!" /></h1>
        <p className="text-slate-500 font-medium mb-12 leading-relaxed">
            <T en="Thank you! Your subscription has been successfully activated. Your systems are now being automated." bm="Terima kasih! Langganan anda telah diaktifkan dengan jaya. Sistem anda kini sedang dioptimumkan." />
        </p>

        <div className="space-y-4">
            <button 
                onClick={() => router.push("/app/dashboard")}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 group"
            >
                <T en="Enter Dashboard" bm="Papan Pemuka" />
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tighter">
                <Loader2 className="w-3 h-3 animate-spin" />
                <T en={<>Auto-redirecting in {countdown}s...</>} bm={<>Redirect automatik dalam {countdown}s...</>} />
            </div>
        </div>
      </div>
    </div>
  );
}
