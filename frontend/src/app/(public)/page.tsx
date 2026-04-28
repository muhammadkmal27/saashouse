"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Globe, Server, Star, Code, Command, Gauge, Users, Layers, Loader2 } from "lucide-react";
import { T } from "@/components/Translate";

import HomeSubscription from "@/components/marketing/HomeSubscription";
import HomeOTP from "@/components/marketing/HomeOTP";

export default function LandingPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/status")
      .then(r => r.json())
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const otpMode = status?.otp_mode_active;
  const totalPrice = Number(status?.otp_deposit_price || 0) + Number(status?.otp_final_price || 0);

  if (loading) {
    return <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-zinc-800" />
    </div>;
  }

  return (
    <div className="pb-24 bg-[#09090b]">
      {otpMode ? (
        <HomeOTP totalPrice={totalPrice || 700} />
      ) : (
        <HomeSubscription />
      )}

      {/* Pro Website Banner (Restored from old design) */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden border border-zinc-800 aspect-[21/9] relative flex items-center justify-center p-12 bg-gradient-to-br from-zinc-900 to-black group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&q=80&w=2000')] opacity-20 group-hover:opacity-30 transition-opacity object-cover bg-center"></div>
          <div className="relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-widest">
              <Globe className="w-4 h-4" /> <T en="Global Reach, Malaysia’s Best" bm="Jangkauan Global, Terbaik di Malaysia" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
              <T en={<>PRO WEBSITE<br/>DEVELOPMENT</>} bm={<>PEMBANGUNAN WEB<br/>PROFESIONAL</>} />
            </h2>
          </div>
        </div>
      </section>

      {/* Shared Showcase Section (Visible in both modes) */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              <T en={<>Showcase <span className="text-cyan-400">Spotlight</span></>} bm={<>Fokus <span className="text-cyan-400">Portfolio</span></>} />
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm font-medium">
              <T en="Find out how bad we are in creating beautiful solutions." bm="Ketahui kepakaran kami dalam membina penyelesaian yang indah."/>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            {[
              { 
                title: "Chaos Hou Portfolio", 
                type: "Premium Brand", 
                img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800",
                link: "https://chaoshou.online"
              },
              { 
                title: "Fintech Core OS", 
                type: "SaaS Application", 
                img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
                link: "/showcase"
              }
            ].map((proj, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-[2rem] border border-zinc-800 aspect-video bg-zinc-900 shadow-2xl shadow-black/50">
                <img src={proj.img} alt={proj.title} className="w-full h-full object-cover opacity-50 group-hover:scale-105 group-hover:opacity-30 transition-all duration-700" />
                <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-transparent">
                  <div className="flex items-center gap-3 mb-3">
                     <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30">{proj.type}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{proj.title}</h3>
                  <Link href={proj.link} className="inline-flex items-center gap-2 text-zinc-400 font-semibold text-sm group-hover:text-cyan-400 transition-colors w-fit">
                    <T en="View Project" bm="Lihat Projek" /> <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shared Features Grid */}
      <section className="px-6 py-24 border-t border-zinc-900 bg-[#09090b]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              <T en={<>The SaaS House <span className="text-indigo-400">Model</span></>} bm={<><span className="text-indigo-400">Model</span> SaaS House</>} />
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-sm font-medium">
              <T en="Everything you need to scale effortlessly." bm="Semua yang anda perlukan untuk berkembang tanpa halangan." />
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: <T en="Professional Build" bm="Binaan Profesional" />,
                desc: <T en="High-quality engineering using the latest technologies like Next.js and Rust." bm="Kejuruteraan berkualiti tinggi menggunakan teknologi terkini seperti Next.js dan Rust." />
              },
              {
                icon: Shield,
                title: <T en="Security First" bm="Utamakan Keselamatan" />,
                desc: <T en="Automated backups, SSL certificates, and hardened infrastructure in every project." bm="Sandaran automatik, sijil SSL, dan infrastruktur kebal di setiap projek." />
              },
              {
                icon: Globe,
                title: <T en="ASEAN Optimized" bm="Dioptimum Untuk ASEAN" />,
                desc: <T en="Optimized for speed in Malaysia and across the ASEAN region with local CDN nodes." bm="Dioptimumkan untuk kelajuan di Malaysia dan rantau ASEAN dengan nod CDN tempatan." />
              },
              {
                icon: Command,
                title: <T en="Modern Stack" bm="Timbunan Moden" />,
                desc: <T en="Blazing fast loading performance with enterprise-grade server architecture." bm="Prestasi masa muat yang pantas dengan seni bina pelayan bertaraf perusahaan." />
              },
              {
                icon: Users,
                title: <T en="Human Support" bm="Sokongan Manusia" />,
                desc: <T en="No bots. Talk directly to the engineers building your platform." bm="Tiada robot. Bercakap terus dengan jurutera yang membina platform anda." />
              },
              {
                icon: Layers,
                title: <T en="Future Proof" bm="Kalis Masa Depan" />,
                desc: <T en="Scalable systems designed to handle from 1 to 1 million users naturally." bm="Sistem fleksibel direka untuk menyokong daripada 1 sehingga 1 juta pengguna." />
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="p-8 rounded-3xl bg-[#0e0e11] border border-zinc-800/80 hover:bg-zinc-900 hover:border-indigo-500/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold mb-3 text-zinc-100">{item.title}</h3>
                <p className="text-zinc-500 leading-relaxed text-sm font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic CTA Section at the bottom */}
      <section className="px-6 py-24 pb-0">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-[#0e0e11] border border-zinc-800 p-16 md:p-24 text-center space-y-10 relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 blur-[100px] rounded-full group-hover:opacity-75 transition-opacity opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            {otpMode ? (
              <>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1]">
                  <T en={<>Invest in Quality.<br/><span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">Own Your Future.</span></>} bm={<>Labur Untuk Kualiti.<br/><span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">Miliki Masa Depan Anda.</span></>} />
                </h2>
                <p className="text-zinc-400 leading-relaxed text-sm md:text-base font-medium max-w-xl mx-auto">
                  <T en="Skip the monthly fees. Pay once and get a professional, high-performance platform that you truly own." bm="Lupakan yuran bulanan. Bayar sekali dan dapatkan platform profesional berprestasi tinggi yang menjadi milik anda sepenuhnya."/>
                </p>
                <div className="pt-6">
                  <Link 
                    href="/auth/register" 
                    className="inline-flex px-10 py-5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest gap-2 items-center"
                  >
                    <T en="CREATE PROJECT" bm="BINA PROJEK"/> <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1]">
                  <T en={<>Don't Buy.<br/><span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">Rent The Best.</span></>} bm={<>Jangan Beli.<br/><span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">Sewa Yang Terbaik.</span></>}/>
                </h2>
                <p className="text-zinc-400 leading-relaxed text-sm md:text-base font-medium max-w-xl mx-auto">
                  <T en="Join smart businesses saving thousands in capital expenditure by jumping to the SaaS House subscription model today." bm="Sertai perniagaan bijak yang menjimatkan ribuan perbelanjaan modal dengan melanggan model langganan SaaS House hari ini."/>
                </p>
                <div className="pt-6">
                  <Link 
                    href="/auth/register" 
                    className="inline-flex px-10 py-5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest gap-2 items-center"
                  >
                    <T en="START NOW" bm="MULA SEKARANG"/> <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
