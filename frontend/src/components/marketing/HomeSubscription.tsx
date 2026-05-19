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
          <Link 
            href="/pricing" 
            className="group inline-flex items-center gap-2 md:gap-3 text-[11px] sm:text-xs md:text-sm text-zinc-300 hover:text-white transition-all duration-300 px-3 py-1.5 rounded-full bg-zinc-900/30 border border-zinc-800/60 max-w-full"
          >
            <span className="font-extrabold text-zinc-100 shrink-0 whitespace-nowrap">
              <T en="What's new" bm="Yang baru" />
            </span>
            <span className="w-px h-3.5 bg-zinc-700/60 shrink-0" />
            <span className="flex items-center gap-1 font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors min-w-0">
              <span className="truncate sm:not-truncate">
                <T en="Build your dream website with RM550 deposit" bm="Bina Website Impian Anda dengan Deposit RM550" />
              </span>
              <span className="inline-block transition-transform group-hover:translate-x-1 shrink-0">→</span>
            </span>
          </Link>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] text-white">
            <T 
              en={<>Build your dream website<br/>for only <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">RM550</span></>} 
              bm={<>Bina Website impian anda<br/>serendah <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">RM550</span></>} 
            />
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto font-medium">
            <T en="Professional platform for a RM550 deposit. Flat monthly fee covers premium hosting and continuous bug-fix support. No hidden costs." bm="Miliki platform profesional dengan deposit RM550. Yuran bulanan tetap untuk hosting premium dan sokongan 'bug-fix' berterusan. Tanpa kos tersembunyi."/>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/pricing" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-90 text-white font-bold text-sm shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              <T en="See Plans" bm="Lihat Pakej"/> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm transition-all flex items-center justify-center"
            >
              <T en="Get in Touch" bm="Ada Soalan?"/>
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
             <h4 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase"><T en="Modern UI" bm="UI Moden"/></h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold"><T en="Design" bm="Reka Bentuk"/></p>
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white">99.9%</h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold"><T en="Uptime" bm="Masa Aktif"/></p>
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase"><T en="Secure" bm="Selamat"/></h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold"><T en="Architecture" bm="Seni Bina"/></p>
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
