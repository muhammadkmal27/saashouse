"use client";

import { CheckCircle2, Zap, Shield, X, ArrowRight, Server, Globe, Lock, BarChart3, Clock, Headphones, Sparkles } from "lucide-react";
import Link from "next/link";
import { T } from "@/components/Translate";
import { setCookie } from "@/utils/cookies";

interface PricingSubscriptionProps {
  dynamicPrices: Record<string, string>;
}

export default function PricingSubscription({ dynamicPrices }: PricingSubscriptionProps) {
  const handleSelectPlan = (planName: string) => {
    setCookie("next-plan", planName);
  };

  const plans = [
    {
      name: "Standard",
      price: dynamicPrices.Standard || "165",
      traffic: "600 - 1,200+",
      features: [
        "Unlimited Revisions",
        "Custom Feature Development",
        "Guaranteed Zero Downtime",
        "Advanced Security Audits",
        "Bug Fix Support"
      ],
      popular: false
    },
    {
      name: "Growth",
      price: dynamicPrices.Growth || "240",
      traffic: "1,500 - 4,000+",
      features: [
        "Unlimited Revisions",
        "Custom Feature Development",
        "Guaranteed Zero Downtime",
        "Advanced Security Audits",
        "Bug Fix Support"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: dynamicPrices.Enterprise || "410",
      traffic: "5,000 - 12,000+",
      features: [
        "Unlimited Revisions",
        "Custom Feature Development",
        "Guaranteed Zero Downtime",
        "Advanced Security Audits",
        "Bug Fix Support"
      ],
      popular: false
    },
    {
      name: "Platinum",
      price: dynamicPrices.Platinum || "750",
      traffic: "18,000 - 45,000+",
      features: [
        "Unlimited Revisions",
        "Custom Feature Development",
        "Guaranteed Zero Downtime",
        "Advanced Security Audits",
        "Bug Fix Support"
      ],
      popular: false
    }
  ];

  const comparisonFeatures = [
    { feature: "Unlimited Revisions", standard: true, growth: true, enterprise: true, platinum: true },
    { feature: "Custom Feature Development", standard: true, growth: true, enterprise: true, platinum: true },
    { feature: "Guaranteed Zero Downtime", standard: true, growth: true, enterprise: true, platinum: true },
    { feature: "Advanced Security Audits", standard: true, growth: true, enterprise: true, platinum: true },
    { feature: "Bug Fix Support", standard: true, growth: true, enterprise: true, platinum: true },
    { feature: "SSL Certificate", standard: true, growth: true, enterprise: true, platinum: true },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan, idx) => (
          <div 
            key={idx}
            className={`relative flex flex-col p-10 rounded-[3rem] bg-[#0e0e11] border transition-all duration-500 ${plan.popular ? 'border-cyan-400 shadow-[0_30px_60px_-15px_rgba(6,182,212,0.3)]' : 'border-zinc-800 hover:border-zinc-700'}`}
          >
            {plan.popular && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] font-black rounded-full flex items-center gap-2 uppercase tracking-[0.2em] shadow-xl">
                <Zap className="w-3 h-3 fill-white" />
                <T en="Most Popular" bm="Paling Popular" />
              </div>
            )}

            <div className="mb-10">
              <h3 className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mb-4">{plan.name}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-zinc-600">RM</span>
                <span className="text-5xl font-black text-white tracking-tighter">{plan.price}</span>
                <span className="text-zinc-600 text-xs font-bold uppercase"><T en="/ Mo" bm="/ Bln" /></span>
              </div>
            </div>

            <div className="mb-10 p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 text-center">
                <T en="EST. DAILY USERS" bm="ANGGARAN PENGGUNA HARIAN" />
              </p>
              <p className="text-2xl font-black text-cyan-400 italic tracking-tight text-center">{plan.traffic}</p>
            </div>

            <ul className="space-y-4 flex-1 mb-10">
              {plan.features.map((feature, fidx) => (
                <li key={fidx} className="flex items-start gap-3 text-sm text-zinc-400 font-medium leading-tight">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  {feature === "Unlimited Revisions" ? <T en="Unlimited Revisions" bm="Semakan Tanpa Had" /> : 
                   feature === "Custom Feature Development" ? <T en="Custom Feature Development" bm="Pembangunan Ciri Tersuai" /> : 
                   feature === "Guaranteed Zero Downtime" ? <T en="Guaranteed Zero Downtime" bm="Jaminan Sifar Masa Henti" /> : 
                   feature === "Advanced Security Audits" ? <T en="Advanced Security Audits" bm="Audit Keselamatan Lanjutan" /> : 
                   feature === "Bug Fix Support" ? <T en="Bug Fix Support" bm="Sokongan Pembaikan Pepijat" /> : feature}
                </li>
              ))}
            </ul>

            <Link 
              href="/auth/register"
              onClick={() => handleSelectPlan(plan.name)}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all text-center ${plan.popular ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-90 text-white shadow-lg shadow-purple-500/20' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
            >
              <T en="SELECT" bm="PILIH" /> {plan.name}
            </Link>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <section className="mt-32">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-violet-300 tracking-wide"><T en="Detailed Breakdown" bm="Pecahan Terperinci" /></span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white"><T en="Compare All Features" bm="Bandingkan Semua Ciri" /></h2>
            <p className="text-zinc-500 max-w-xl mx-auto"><T en="See exactly what you get with each plan. No guesswork." bm="Lihat apa yang anda dapat dengan setiap pelan secara telus." /></p>
          </div>

        <div className="rounded-3xl border border-zinc-800 bg-[#0e0e11] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-5 px-6 text-xs font-black uppercase tracking-widest text-zinc-500"><T en="Feature" bm="Ciri-ciri" /></th>
                  <th className="text-center py-5 px-4 text-xs font-black uppercase tracking-widest text-zinc-500">Standard</th>
                  <th className="text-center py-5 px-4 text-xs font-black uppercase tracking-widest text-cyan-400">Growth</th>
                  <th className="text-center py-5 px-4 text-xs font-black uppercase tracking-widest text-zinc-500">Enterprise</th>
                  <th className="text-center py-5 px-4 text-xs font-black uppercase tracking-widest text-zinc-500">Platinum</th>
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
                    {(["standard", "growth", "enterprise", "platinum"] as const).map((plan) => (
                      <td key={plan} className="py-4 px-4 text-center">
                        {row[plan] === true ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : row[plan] === false ? (
                          <X className="w-5 h-5 text-zinc-700 mx-auto" />
                        ) : (
                          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{String(row[plan])}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
