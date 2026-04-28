"use client";

import { ArrowRight, Zap, Shield, Globe, Star, Code, Gauge, Users, Layers } from "lucide-react";
import Link from "next/link";
import { T } from "@/components/Translate";

interface HomeOTPProps {
  totalPrice: number;
}

export default function HomeOTP({ totalPrice }: HomeOTPProps) {
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
             <T en="Premium Engineering" bm="Kejuruteraan Premium" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] text-white">
            <T en={<>Build a website<br/>for as low as <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">RM{totalPrice}</span></>} bm={<>Bina laman web<br/>serendah <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">RM{totalPrice}</span></>} />
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto font-medium">
            <T en="Professional high-performance platforms built for your business. Quality engineering with transparent, one-time pricing and full code ownership." bm="Platform profesional berprestasi tinggi yang dibina untuk perniagaan anda. Kejuruteraan berkualiti dengan harga telus, bayaran sekali dan pemilikan kod penuh." />
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/auth/register" 
              className="w-full sm:w-auto px-10 py-5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-90 text-white font-bold text-sm shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              <T en="Get Started Now" bm="Mula Sekarang"/> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/pricing"
              className="w-full sm:w-auto px-10 py-5 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm transition-all flex items-center justify-center"
            >
              <T en="View Packages" bm="Lihat Pakej"/>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Row for OTP */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-zinc-800/0 md:divide-zinc-800 border-y border-zinc-800/50 py-16">
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white">100%</h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold"><T en="Ownership" bm="Pemilikan"/></p>
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white"><T en="Fast" bm="Pantas"/></h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold"><T en="Delivery" bm="Penghantaran"/></p>
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white"><T en="Secure" bm="Selamat"/></h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold"><T en="Encrypted" bm="Disulitkan"/></p>
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white">24/7</h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold"><T en="Monitoring" bm="Pemantauan"/></p>
           </div>
        </div>
      </section>


    </div>
  );
}
