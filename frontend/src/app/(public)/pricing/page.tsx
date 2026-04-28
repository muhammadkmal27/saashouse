"use client";

import { useState, useEffect } from "react";
import { T } from "@/components/Translate";
import { CheckCircle2, Zap, Shield, X, ChevronDown, Sparkles, ArrowRight, Clock, Headphones, Server, Globe, Lock, BarChart3, Loader2 } from "lucide-react";
import Link from "next/link";
import { setCookie } from "@/utils/cookies";
import { fetchPrices, DEFAULT_PRICES } from "@/utils/pricing";

import PricingSubscription from "@/components/marketing/PricingSubscription";
import PricingOTP from "@/components/marketing/PricingOTP";

function FaqItem({ question, answer }: { question: React.ReactNode; answer: React.ReactNode }) {
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
        <div className="text-zinc-400 leading-relaxed">{answer}</div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, string>>(DEFAULT_PRICES);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchPrices().then(setDynamicPrices),
      fetch("/api/status")
        .then(r => r.json())
        .then(setStatus)
    ]).finally(() => setLoading(false));
  }, []);

  const otpMode = status?.otp_mode_active;
  const otpDeposit = status?.otp_deposit_price || "200";
  const otpFinal = status?.otp_final_price || "500";
  const totalPrice = Number(otpDeposit) + Number(otpFinal);

  const faqs = otpMode ? [
    {
      question: <T en="How does the RM700 One-Time Purchase work?" bm="Bagaimanakah Pembelian Penuh RM700 berfungsi?" />,
      answer: <T en={`It's a two-stage payment model. You pay RM${otpDeposit} as a deposit to start the development. The remaining RM${otpFinal} is only paid once the project is completed and you're ready to go live.`} bm={`Ia adalah model bayaran dua peringkat. Anda bayar RM${otpDeposit} sebagai deposit. Baki RM${otpFinal} hanya dibayar setelah projek siap.`} />
    },
    {
      question: <T en="Do I own the source code?" bm="Adakah saya memiliki kod sumber?" />,
      answer: <T en="Yes! Unlike the subscription model, the One-Time Purchase gives you full ownership of the source code once the final payment is settled." bm="Ya! Berbeza dengan langganan, Pembelian Penuh memberikan hak milik kod sumber sepenuhnya kepada anda." />
    },
    {
      question: <T en="Is the domain included for free?" bm="Adakah domain disertakan percuma?" />,
      answer: <T en="Yes, we include one .com or .com.my domain for the first year. Subsequent renewals will be billed at standard market rates." bm="Ya, kami sertakan satu domain .com atau .com.my untuk tahun pertama." />
    },
    {
      question: <T en="What kind of support is included?" bm="Apakah jenis sokongan yang disertakan?" />,
      answer: <T en="We provide 3 months of free bug-fix support and technical maintenance after your site goes live to ensure a smooth transition." bm="Kami menyediakan 3 bulan sokongan pembetulan pepijat dan penyelenggaraan teknikal percuma." />
    }
  ] : [
    {
      question: <T en="When will I be charged?" bm="Bilakah saya akan dicaj?" />,
      answer: <T en="You will only be charged after you approve the staging site and manually trigger deployment from your dashboard. There are no upfront payments or hidden charges." bm="Anda hanya akan dicaj selepas anda meluluskan tapak pementasan dan melancarkannya dari papan pemuka anda." />
    },
    {
      question: <T en="Can I change my plan later?" bm="Bolehkah saya menukar pelan kemudian?" />,
      answer: <T en="Yes, you can upgrade or downgrade your plan at any time through your dashboard. Changes will take effect in the next billing cycle, and we will prorate the difference." bm="Ya, anda boleh menaik taraf atau menurunkan taraf pelan anda bila-bila masa." />
    },
    {
      question: <T en="Is a domain included in all plans?" bm="Adakah domain disertakan dalam semua pelan?" />,
      answer: <T en="Yes! Every plan includes one free .com or .com.my domain. We fully manage DNS, renewals, and SSL configurations for you." bm="Ya! Setiap pelan disertakan satu domain .com atau .com.my percuma." />
    },
    {
      question: <T en="What happens if my website exceeds the traffic limit?" bm="Apa yang berlaku jika laman web melebihi had trafik?" />,
      answer: <T en="We will not shut down your site. Our team will contact you to discuss upgrade options. We always ensure your end users are not affected." bm="Kami tidak akan menutup laman web anda. Pasukan kami akan menghubungi anda untuk berbincang." />
    },
    {
      question: <T en="Do you support payment integrations?" bm="Adakah anda menyokong integrasi pembayaran?" />,
      answer: <T en="Yes, we support ToyyibPay, Stripe, and other major payment gateways. All integrations are set up during the onboarding process at no extra cost." bm="Ya, kami menyokong ToyyibPay, Stripe, dan gerbang pembayaran utama lain." />
    },
    {
      question: <T en="How does technical support work?" bm="Bagaimanakah sokongan teknikal berfungsi?" />,
      answer: <T en="The Standard plan includes email support. Growth includes priority support. Enterprise and Platinum include a dedicated account manager and 24/7 hotline access." bm="Pelan Standard termasuk sokongan e-mel. Growth termasuk sokongan utama." />
    }
  ];

  if (loading) {
    return <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-zinc-800" />
    </div>;
  }

  return (
    <div className="bg-[#09090b]">
      {/* ─── Original Pricing Section ─── */}
      <div className="px-6 py-24 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">
              {otpMode ? <T en="One-Time Purchase Package" bm="Pakej Pembelian Penuh" /> : <T en="Transparent SaaS Model" bm="Model SaaS Telus" />}
            </h1>
            <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed">
              {otpMode 
                ? <T en={`Build your complete platform for RM${totalPrice}. Pay a deposit to start and the final amount upon completion.`} bm={`Bina platform lengkap anda dengan RM${totalPrice}. Bayar deposit untuk mula dan baki selepas siap.`} />
                : <T en="Fixed monthly fee including web apps, high-performance server, and domain. No hidden charges." bm="Yuran bulanan tetap termasuk aplikasi web, pelayan berprestasi tinggi, dan domain. Tiada caj tersembunyi." />
              }
            </p>
          </div>

          {otpMode ? (
            <PricingOTP otpDeposit={otpDeposit} otpFinal={otpFinal} totalPrice={totalPrice} />
          ) : (
            <PricingSubscription dynamicPrices={dynamicPrices} />
          )}
          
          <div className="mt-32 p-12 md:p-20 rounded-[4rem] bg-[#0e0e11] border border-zinc-800 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic mb-12 text-white"><T en="THE MANAGED GUARANTEE" bm="JAMINAN PENGURUSAN" /></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-5xl mx-auto relative z-10">
              {[
                 { title: <T en="Zero Setup Fee" bm="Yuran Sifar" />, desc: <T en="No hidden onboarding costs. Your subscription starts when you deploy." bm="Tiada kos tersembunyi. Langganan anda bermula apabila anda melancarkan projek." /> },
                 { title: <T en="Managed DNS" bm="DNS Terurus" />, desc: <T en="We handle domain propagation, SSL handshakes, and DNS hardened security." bm="Kami menguruskan pembiakan domain, SSL, dan keselamatan DNS yang kebal." /> },
                 { title: <T en="Daily Backups" bm="Sandaran Harian" />, desc: <T en="Redundant off-site backups with one-click restoration included in every tier." bm="Sandaran luar tapak dengan pemulihan satu-klik disertakan untuk setiap peringkat." /> },
                 { title: <T en="Hardened Core" bm="Teras Kebal" />, desc: <T en="All projects run on our proprietary enterprise Linux stack for maximum speed." bm="Semua projek berjalan pada sistem Linux perusahaan kami untuk kepantasan maksimum." /> }
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

      {/* ─── NEW: Why Choose Us ─── */}
      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white"><T en="Why Teams Choose SaaS House" bm="Mengapa Pasukan Memilih SaaS House" /></h2>
            <p className="text-zinc-500 max-w-xl mx-auto"><T en="Beyond just hosting — we are your complete digital engineering partner." bm="Bukan sekadar pengehosan — kami adalah rakan kejuruteraan digital lengkap anda." /></p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Server, title: <T en="Enterprise Infrastructure" bm="Infrastruktur Perusahaan" />, desc: <T en="Every project runs on enterprise-grade servers with NVMe storage, ensuring blazing-fast load times under any traffic conditions." bm="Setiap projek berjalan pada pelayan gred perusahaan dengan storan NVMe, menjamin masa muat yang sangat pantas." />, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
              { icon: Lock, title: <T en="Security-First Architecture" bm="Seni Bina Utamakan Keselamatan" />, desc: <T en="From hardened Nginx configs to automated vulnerability scanning, your application is protected at every layer of the stack." bm="Dari konfigurasi Nginx yang kebal ke imbasan kerentanan automatik, aplikasi anda dilindungi di setiap lapisan." />, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
              { icon: Globe, title: <T en="Malaysian-Optimized CDN" bm="CDN Dioptimumkan Malaysia" />, desc: <T en="Our edge network is specifically optimized for ASEAN traffic, with local nodes ensuring your Malaysian users get the fastest experience." bm="Rangkaian kami dioptimumkan khas untuk trafik ASEAN, dengan nod tempatan menjamin pengalaman terpantas di Malaysia." />, color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
              { icon: Clock, title: <T en="Development in Days, Not Months" bm="Pembangunan Dalam Hari, Bukan Bulan" />, desc: <T en="Our streamlined onboarding process delivers production-ready websites in as little as 5-7 working days from project submission." bm="Proses kami memberikan laman web sedia-produksi sepantas 5-7 hari bekerja selepas penyerahan projek." />, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
              { icon: Headphones, title: <T en="Human Support, Not Bots" bm="Sokongan Manusia, Bukan Bot" />, desc: <T en="Real engineers handle your support requests. No ticket queues, no chatbots — just real humans who understand your project." bm="Jurutera sebenar menguruskan permintaan sokongan anda. Tiada barisan tiket atau chatbot — hanya manusia yang faham projek anda." />, color: "text-pink-400 bg-pink-400/10 border-pink-400/20" },
              { icon: Sparkles, title: <T en="Continuous Improvement" bm="Penambahbaikan Berterusan" />, desc: <T en="We don't just build and forget. Your website receives continuous updates, performance tuning, and feature enhancements." bm="Kami tidak sekadar membina dan lupa. Laman web anda menerima kemas kini berterusan dan talaan prestasi." />, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
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
              <span className="text-xs font-bold text-emerald-300 tracking-wide"><T en="Got Questions?" bm="Ada Soalan?" /></span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white"><T en="Frequently Asked Questions" bm="Soalan Lazim" /></h2>
            <p className="text-zinc-500"><T en="Everything you need to know about our pricing and services." bm="Semua yang anda perlu tahu tentang pengebilan dan perkhidmatan kami." /></p>
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
              <T 
                en={<>Ready to Build Your<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">Digital Empire?</span></>} 
                bm={<>Sedia Membina<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">Empayar Digital Anda?</span></>} 
              />
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              <T en="Join hundreds of businesses already powered by SaaS House." bm="Sertai ratusan perniagaan yang telah dikuasakan oleh SaaS House." /> {otpMode ? <T en="Build your dream platform today." bm="Bina platform impian anda hari ini." /> : <T en="Start with zero upfront cost." bm="Bermula dengan sifar kos pendahuluan." />}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/app/projects/create"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-violet-600/20 text-lg"
              >
                <T en="Get Started Free" bm="Mula Secara Percuma" /> <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-10 py-5 bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest rounded-2xl hover:bg-white/5 transition-all text-lg"
              >
                <T en="Talk to Sales" bm="Hubungi Jualan" />
              </Link>
            </div>
            <p className="text-zinc-600 text-sm"><T en="No credit card required · Cancel anytime · 7-day staging preview" bm="Tiada kad kredit diperlukan · Boleh batal bila-bila masa · Pratonton 7 hari" /></p>
          </div>
        </div>
      </section>
    </div>
  );
}
