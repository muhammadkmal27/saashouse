"use client";

import { useState } from "react";
import { CheckCircle2, Zap, Shield, X, ChevronDown, Sparkles, ArrowRight, Clock, Headphones, Server, Globe, Lock, BarChart3 } from "lucide-react";
import Link from "next/link";
import { setCookie } from "@/utils/cookies";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors pr-8">{question}</span>
        <ChevronDown className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-400' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}>
        <p className="text-zinc-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const handleSelectPlan = (planName: string) => {
    setCookie("next-plan", planName);
  };

  const plans = [
    {
      name: "Standard",
      price: "165",
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
      price: "240",
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
      price: "410",
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
      price: "750",
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

  const faqs = [
    {
      question: "When will I be charged?",
      answer: "You will only be charged after you approve the staging site and manually trigger deployment from your dashboard. There are no upfront payments or hidden charges."
    },
    {
      question: "Can I change my plan later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time through your dashboard. Changes will take effect in the next billing cycle, and we will prorate the difference."
    },
    {
      question: "Is a domain included in all plans?",
      answer: "Yes! Every plan includes one free .com or .com.my domain. We fully manage DNS, renewals, and SSL configurations for you."
    },
    {
      question: "What happens if my website exceeds the traffic limit?",
      answer: "We will not shut down your site. Our team will contact you to discuss upgrade options. We always ensure your end users are not affected."
    },
    {
      question: "Do you support payment integrations?",
      answer: "Yes, we support ToyyibPay, Stripe, and other major payment gateways. All integrations are set up during the onboarding process at no extra cost."
    },
    {
      question: "How does technical support work?",
      answer: "The Standard plan includes email support. Growth includes priority support. Enterprise and Platinum include a dedicated account manager and 24/7 hotline access."
    }
  ];

  return (
    <div className="bg-[#09090b]">
      {/* ─── Original Pricing Section ─── */}
      <div className="px-6 py-24 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">Transparent SaaS Model</h1>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed">
              Fixed monthly fee including web apps, high-performance server, and domain. No hidden charges.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, idx) => (
              <div 
                key={idx}
                className={`relative flex flex-col p-10 rounded-[3rem] bg-[#0e0e11] border transition-all duration-500 ${plan.popular ? 'border-cyan-400 shadow-[0_30px_60px_-15px_rgba(6,182,212,0.3)]' : 'border-zinc-800 hover:border-zinc-700'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] font-black rounded-full flex items-center gap-2 uppercase tracking-[0.2em] shadow-xl">
                    <Zap className="w-3 h-3 fill-white" />
                    Most Popular
                  </div>
                )}

                <div className="mb-10">
                  <h3 className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mb-4">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-zinc-600">RM</span>
                    <span className="text-5xl font-black text-white tracking-tighter">{plan.price}</span>
                    <span className="text-zinc-600 text-xs font-bold uppercase">/ Mo</span>
                  </div>
                </div>

                <div className="mb-10 p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                    EST. DAILY USERS
                  </p>
                  <p className="text-2xl font-black text-cyan-400 italic tracking-tight">{plan.traffic}</p>
                </div>

                <ul className="space-y-4 flex-1 mb-10">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3 text-sm text-zinc-400 font-medium leading-tight">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link 
                  href="/auth/register"
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all text-center ${plan.popular ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-90 text-white shadow-lg shadow-purple-500/20' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                >
                  SELECT {plan.name}
                </Link>
              </div>
            ))}
          </div>
          
          <div className="mt-32 p-12 md:p-20 rounded-[4rem] bg-[#0e0e11] border border-zinc-800 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic mb-12 text-white">THE MANAGED GUARANTEE</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-5xl mx-auto relative z-10">
              {[
                 { title: "Zero Setup Fee", desc: "No hidden onboarding costs. Your subscription starts when you deploy." },
                 { title: "Managed DNS", desc: "We handle domain propagation, SSL handshakes, and DNS hardened security." },
                 { title: "Daily Backups", desc: "Redundant off-site backups with one-click restoration included in every tier." },
                 { title: "Hardened Core", desc: "All projects run on our proprietary enterprise Linux stack for maximum speed." }
              ].map((item, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mx-auto">
                     <Shield className="w-6 h-6" />
                  </div>
                  <h4 className="font-black uppercase tracking-widest text-sm text-white">{item.title}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── NEW: Feature Comparison Table ─── */}
      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-violet-300 tracking-wide">Detailed Breakdown</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">Compare All Features</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">See exactly what you get with each plan. No guesswork.</p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-[#0e0e11] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-5 px-6 text-xs font-black uppercase tracking-widest text-zinc-500">Feature</th>
                    <th className="text-center py-5 px-4 text-xs font-black uppercase tracking-widest text-zinc-500">Standard</th>
                    <th className="text-center py-5 px-4 text-xs font-black uppercase tracking-widest text-cyan-400">Growth</th>
                    <th className="text-center py-5 px-4 text-xs font-black uppercase tracking-widest text-zinc-500">Enterprise</th>
                    <th className="text-center py-5 px-4 text-xs font-black uppercase tracking-widest text-zinc-500">Platinum</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, idx) => (
                    <tr key={idx} className="border-b border-zinc-800/50 last:border-b-0 hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-zinc-300">{row.feature}</td>
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
        </div>
      </section>

      {/* ─── NEW: Why Choose Us ─── */}
      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">Why Teams Choose SaaS House</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">Beyond just hosting — we are your complete digital engineering partner.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Server, title: "Enterprise Infrastructure", desc: "Every project runs on enterprise-grade servers with NVMe storage, ensuring blazing-fast load times under any traffic conditions.", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
              { icon: Lock, title: "Security-First Architecture", desc: "From hardened Nginx configs to automated vulnerability scanning, your application is protected at every layer of the stack.", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
              { icon: Globe, title: "Malaysian-Optimized CDN", desc: "Our edge network is specifically optimized for ASEAN traffic, with local nodes ensuring your Malaysian users get the fastest experience.", color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
              { icon: Clock, title: "Development in Days, Not Months", desc: "Our streamlined onboarding process delivers production-ready websites in as little as 5-7 working days from project submission.", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
              { icon: Headphones, title: "Human Support, Not Bots", desc: "Real engineers handle your support requests. No ticket queues, no chatbots — just real humans who understand your project.", color: "text-pink-400 bg-pink-400/10 border-pink-400/20" },
              { icon: Sparkles, title: "Continuous Improvement", desc: "We don't just build and forget. Your website receives continuous updates, performance tuning, and feature enhancements.", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
            ].map((item, idx) => (
              <div key={idx} className="group p-8 rounded-3xl bg-[#0e0e11] border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 ${item.color}`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">{item.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEW: FAQ Section ─── */}
      <section className="px-6 pb-32">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-bold text-emerald-300 tracking-wide">Got Questions?</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-zinc-500">Everything you need to know about our pricing and services.</p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-[#0e0e11] p-8 md:p-10">
            {faqs.map((faq, idx) => (
              <FaqItem key={idx} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEW: Final CTA ─── */}
      <section className="px-6 pb-40">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative space-y-8">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
              Ready to Build Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">Digital Empire?</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Join hundreds of businesses already powered by SaaS House. Start with zero upfront cost.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/app/projects/create"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-violet-600/20 text-lg"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-10 py-5 bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest rounded-2xl hover:bg-white/5 transition-all text-lg"
              >
                Talk to Sales
              </Link>
            </div>
            <p className="text-zinc-600 text-sm">No credit card required · Cancel anytime · 7-day staging preview</p>
          </div>
        </div>
      </section>
    </div>
  );
}
