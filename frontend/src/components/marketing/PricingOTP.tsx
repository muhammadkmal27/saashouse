"use client";

import { CheckCircle2, BarChart3, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { T } from "@/components/Translate";

interface PricingOTPProps {
  otpDeposit: string;
  otpFinal: string;
  totalPrice: number;
}

export default function PricingOTP({ otpDeposit, otpFinal, totalPrice }: PricingOTPProps) {
  const comparisonFeatures = [
    { feature: "Unlimited Revisions" },
    { feature: "Custom Feature Development" },
    { feature: "Guaranteed Zero Downtime" },
    { feature: "Advanced Security Audits" },
    { feature: "Bug Fix Support" },
    { feature: "SSL Certificate" },
  ];

  return (
    <>
      <div className="animate-in fade-in zoom-in duration-1000">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#09090b] border border-zinc-800 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
            {/* Subtle Accent Light */}
            <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-50"></div>
            
            <div className="flex flex-col lg:flex-row">
              {/* Left Section: Value Proposition */}
              <div className="flex-1 p-10 md:p-16 border-b lg:border-b-0 lg:border-r border-zinc-800">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
                     <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                     <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]"><T en="Full Ownership Package" bm="Pakej Milik Penuh" /></span>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight"><T en="The Complete Build" bm="Pembangunan Lengkap" /></h2>
                    <p className="text-zinc-500 leading-relaxed max-w-sm">
                      <T en="A professional-grade platform engineered for performance, security, and scale. No monthly fees, just pure ownership." bm="Platform gred profesional yang dibina untuk prestasi, keselamatan, dan skala. Tiada yuran bulanan, hanya hak milik mutlak." />
                    </p>
                  </div>

                  <div className="pt-8 grid grid-cols-2 gap-8 border-t border-zinc-800/50">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2"><T en="Build Time" bm="Masa Siap" /></p>
                      <p className="text-xl font-bold text-white">1 <T en="Month" bm="Bulan" /></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2"><T en="Support" bm="Sokongan" /></p>
                      <p className="text-xl font-bold text-white">3 <T en="Months" bm="Bulan" /></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: Pricing & Action */}
              <div className="w-full lg:w-[400px] bg-zinc-900/30 p-10 md:p-16 flex flex-col justify-center bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent)]">
                <div className="text-center lg:text-left space-y-10">
                  <div className="space-y-2">
                     <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]"><T en="Investment" bm="Pelaburan" /></p>
                     <div className="flex items-baseline justify-center lg:justify-start gap-2">
                       <span className="text-2xl font-bold text-zinc-700">RM</span>
                       <span className="text-6xl font-black text-white tracking-tighter">{totalPrice}</span>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-zinc-800/50">
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider"><T en="Deposit" bm="Deposit" /></span>
                      <span className="text-lg font-bold text-emerald-400">RM {otpDeposit}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-zinc-800/50">
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider"><T en="Final" bm="Baki" /></span>
                      <span className="text-lg font-bold text-white">RM {otpFinal}</span>
                    </div>
                  </div>

                  <Link 
                    href="/auth/register"
                    className="group block w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all text-center relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <T en="START PROJECT" bm="MULA PROJEK" /> <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                  
                  <p className="text-[10px] text-center text-zinc-600 font-medium tracking-wide">
                    <T en="Secure checkout via ToyyibPay" bm="Bayaran selamat melalui ToyyibPay" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table (Simplified for OTP) */}
      <section className="mt-32 max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-violet-300 tracking-wide"><T en="Detailed Breakdown" bm="Pecahan Terperinci" /></span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white"><T en="Compare All Features" bm="Bandingkan Semua Ciri" /></h2>
          <p className="text-zinc-500 max-w-xl mx-auto"><T en="See exactly what you get with each plan. No guesswork." bm="Lihat apa yang anda dapat dengan pelan ini secara telus." /></p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#0e0e11] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-5 px-6 text-xs font-black uppercase tracking-widest text-zinc-500"><T en="Feature" bm="Ciri-ciri" /></th>
                  <th className="text-center py-5 px-4 text-xs font-black uppercase tracking-widest text-cyan-400"><T en="One-Time Package" bm="Pakej Pembelian Penuh" /></th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, idx) => (
                  <tr key={idx} className="border-b border-zinc-800/50 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-zinc-300">
                      {row.feature === "Unlimited Revisions" ? <T en="Unlimited Revisions" bm="Semakan Tanpa Had" /> : 
                       row.feature === "Custom Feature Development" ? <T en="Custom Feature Development" bm="Pembangunan Ciri Tersuai" /> : 
                       row.feature === "Guaranteed Zero Downtime" ? <T en="Guaranteed Zero Downtime" bm="Jaminan Sifar Masa Henti" /> : 
                       row.feature === "Advanced Security Audits" ? <T en="Advanced Security Audits" bm="Audit Keselamatan Lanjutan" /> : 
                       row.feature === "Bug Fix Support" ? <T en="Bug Fix Support" bm="Sokongan Pembaikan Pepijat" /> : 
                       row.feature === "SSL Certificate" ? <T en="SSL Certificate" bm="Sijil SSL" /> : row.feature}
                    </td>
                    <td className="py-4 px-4 text-center">
                       <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
