"use client";

import { ArrowRight, Zap, Shield, Globe, Server, Star, Code, Command, Gauge, Users, Layers } from "lucide-react";
import Link from "next/link";
import { T } from "@/components/Translate";

export default function HomeSubscription() {
  return (
    <div className="animate-in fade-in duration-700">
      <section className="relative px-6 pt-32 pb-20 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/10 blur-[130px] rounded-full"></div>
          <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-4xl mx-auto space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-widest cursor-default">
             <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"></div>
             <T en="Empowering New Brands" bm="Memperkasa Jenama Baru"/>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] text-white">
            <T en={<>Build your dream<br/>platform with <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">zero<br/>cost</span></>} bm={<>Bina platform impian anda<br/>dengan kos <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">sifar</span></>}/>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto font-medium">
            <T en="Stop paying massive developer retainers. We build, host, and maintain your platform — you pay only a flat monthly subscription." bm="Berhenti membayar kos pembangun yang mahal. Kami bina, hos, dan selenggara platform anda — anda hanya perlu bayar yuran langganan bulanan yang tetap."/>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/auth/register" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-90 text-white font-bold text-sm shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              <T en="Start Your Free Trial" bm="Mulakan Percubaan Percuma"/> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm transition-all flex items-center justify-center"
            >
              <T en="Get A Demo" bm="Dapatkan Demo"/>
            </Link>
          </div>
        </div>
      </section>

      {/* Terminal Section */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative rounded-2xl bg-[#0e0e11] border border-zinc-800 shadow-2xl overflow-hidden font-mono text-xs md:text-sm text-left">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-[#18181b]">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-zinc-500 text-xs">setup.js</span>
            </div>
            <div className="p-6 md:p-8 space-y-2 overflow-x-auto text-zinc-300">
              <p><span className="text-purple-400">~</span> <span className="text-cyan-400">npm</span> init project --saashouse</p>
              <br/>
              <p><span className="text-indigo-400">import</span> project <span className="text-indigo-400">from</span> <span className="text-emerald-300">'@saashouse/core'</span>;</p>
              <br/>
              <p><span className="text-indigo-400">const</span> server = {'{'}</p>
              <p className="pl-4">settings: <span className="text-emerald-300">'TailwindCSS'</span>,</p>
              <p className="pl-4">framework: <span className="text-emerald-300">'Next.js'</span>,</p>
              <p className="pl-4">database: <span className="text-emerald-300">'PostgreSQL'</span></p>
              <p>{'};'}</p>
              <br/>
              <p><span className="text-indigo-400">await</span> project.<span className="text-cyan-400">deploy</span>(server);</p>
              <p><span className="text-zinc-500">// 🚀 Your platform is fully operational in 24 hours.</span></p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-zinc-800/0 md:divide-zinc-800">
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white">50+</h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold"><T en="Projects" bm="Projek"/></p>
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white">99.9%</h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold"><T en="Uptime" bm="Masa Aktif"/></p>
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white">RM0</h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold"><T en="Upfront" bm="Pendahuluan"/></p>
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white">24/7</h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold"><T en="Support" bm="Dokongan"/></p>
           </div>
        </div>
      </section>


    </div>
  );
}
