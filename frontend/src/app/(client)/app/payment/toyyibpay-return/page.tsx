"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, ArrowRight, Loader2, AlertTriangle, Clock } from "lucide-react";

function ToyyibpayReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [countdown, setCountdown] = useState(6);
    
    const status = searchParams.get("status_id"); // 1=Success, 2=Pending, 3=Fail
    const billcode = searchParams.get("billcode");
    const msg = searchParams.get("msg");

    const isSuccess = status === "1";
    const isPending = status === "2";
    const isFailed = status === "3";

    useEffect(() => {
        console.log("TOYYIBPAY_RETURN: Checking status...", { isSuccess, billcode, order_id: searchParams.get("order_id") });
        if (isSuccess && billcode && searchParams.get("order_id")) {
            // Ping backend to verify and update status
            fetch(`/api/billing/toyyibpay/verify?billcode=${billcode}&order_id=${searchParams.get("order_id")}`, {
                method: "GET",
            })
            .then(async r => {
                if (!r.ok) {
                    const txt = await r.text();
                    console.error("Verification failed:", txt);
                }
            })
            .catch(console.error);
        }

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
                {isSuccess ? (
                    <>
                        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <CheckCircle className="w-12 h-12" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Payment Successful!</h1>
                        <p className="text-slate-500 font-medium mb-12 leading-relaxed">
                            Thank you! Your project payment has been received and your strategic blueprint is now active.
                        </p>
                    </>
                ) : isPending ? (
                    <>
                        <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Clock className="w-12 h-12" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Payment Pending</h1>
                        <p className="text-slate-500 font-medium mb-12 leading-relaxed">
                            Your payment is being processed by ToyyibPay. Please check back in a few minutes.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <XCircle className="w-12 h-12" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Payment Failed</h1>
                        <p className="text-slate-500 font-medium mb-12 leading-relaxed">
                            {msg || "Unfortunately, your transaction could not be completed. Please try again or contact support."}
                        </p>
                    </>
                )
                }

                <div className="space-y-4">
                    <button 
                        onClick={() => router.push("/app/dashboard")}
                        className={`w-full py-5 text-white rounded-3xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl group ${isSuccess ? 'bg-slate-900 hover:bg-emerald-500 shadow-slate-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
                    >
                        {isSuccess ? "Enter Dashboard" : "Back to Dashboard"}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tighter">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Auto-redirecting in {countdown}s...
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ToyyibpayReturnPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-violet-600" /></div>}>
            <ToyyibpayReturnContent />
        </Suspense>
    );
}
