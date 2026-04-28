"use client";
import { T } from "@/components/Translate";

import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl shadow-slate-200 border border-slate-100 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <AlertTriangle className="w-12 h-12" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight"><T en="Payment Cancelled" bm="Pembayaran Dibatalkan" /></h1>
        <p className="text-slate-500 font-medium mb-12 leading-relaxed">
            <T en="It seems the payment process has been stopped. Don't worry, no charges have been made to your card." bm="Proses pembayaran telah dihentikan. Jangan risau, tiada caj dikenakan pada kad anda." />
        </p>

        <div className="space-y-4">
            <button 
                onClick={() => router.push("/app/billing")}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
            >
                <RefreshCcw className="w-5 h-5" />
                <T en="Try Again" bm="Cuba Lagi" />
            </button>
            <button 
                onClick={() => router.push("/app/dashboard")}
                className="w-full py-5 bg-white text-slate-400 rounded-3xl font-bold uppercase tracking-widest hover:text-slate-900 transition-all flex items-center justify-center gap-3"
            >
                <Home className="w-5 h-5" />
                <T en="Back to Dashboard" bm="Kembali ke Papan Pemuka" />
            </button>
        </div>
      </div>
    </div>
  );
}
