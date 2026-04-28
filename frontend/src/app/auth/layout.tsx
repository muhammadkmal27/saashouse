import { Sparkles } from "lucide-react";
import { T } from "@/components/Translate";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#09090b]">
      
      {/* Left Column (Light/Form) */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 bg-white dark:bg-[#09090b]">
        <div className="w-full max-w-md">
          {/* Logo Badge */}
          <div className="mb-10 flex justify-start">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-400 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              SaaS House
            </div>
          </div>
          
          {children}
        </div>
      </div>

      {/* Right Column (Video & Typography Showcase) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-center items-center p-16">
        
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover opacity-60 mix-blend-screen"
          >
            <source src="/background_login.mp4" type="video/mp4" />
          </video>
          {/* Violet Gradient Overlay on video */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#09090b]/80 via-transparent to-violet-900/40"></div>
        </div>

        {/* Right Side Content */}
        <div className="relative z-10 w-full max-w-lg mt-10">
            <h1 className="text-5xl xl:text-7xl font-black tracking-tighter leading-[0.85] italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-2xl">
              <T en={<>THE FASTEST<br/>WAY TO<br/><span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 text-transparent bg-clip-text">SCALE.</span></>} 
                 bm={<>CARA TERPANTAS<br/>UNTUK<br/><span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 text-transparent bg-clip-text">BERKEMBANG.</span></>} />
            </h1>
            
            <p className="mt-8 text-lg xl:text-xl text-zinc-300 font-medium leading-relaxed mix-blend-screen border-l-2 border-violet-500 pl-5">
              <T en="Join the platform that handles the infrastructure, so you can focus exclusively on dominating your market." bm="Sertai platform yang menguruskan infrastruktur, supaya anda boleh fokus sepenuhnya untuk mendominasi pasaran anda." />
            </p>
            
            <div className="mt-16 flex items-center justify-between border-t border-white/10 pt-8">
              {[
                { num: "99.9%", label: "Uptime" },
                { num: "<50ms", label: "Latency" },
                { num: "Zero", label: "DevOps" },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-3xl font-black text-white tracking-tighter">{stat.num}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">{stat.label}</p>
                </div>
              ))}
            </div>
        </div>

      </div>
    </div>
  );
}
