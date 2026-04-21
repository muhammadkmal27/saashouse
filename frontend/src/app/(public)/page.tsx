import Link from "next/link";
import { ArrowRight, Zap, Shield, Globe, Server, Star, Code, Command, Gauge, Users, Layers } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="pb-24 bg-[#09090b]">
      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-20 text-center overflow-hidden">
        {/* Dark Blue/Purple Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/10 blur-[130px] rounded-full"></div>
          <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-purple-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-4xl mx-auto space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-widest cursor-default">
             <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"></div>
             Empowering New Brands
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] text-white">
            Build your dream<br/>
            platform with <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">zero<br/>cost</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto font-medium">
            Stop paying massive developer retainers. We build, host, and maintain your platform — you pay only a flat monthly subscription.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/auth/register" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-90 text-white font-bold text-sm shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              Start Your Free Trial <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm transition-all flex items-center justify-center"
            >
              Get A Demo
            </Link>
          </div>
          
          <div className="pt-8 flex flex-col items-center justify-center gap-2">
            <div className="flex gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
            <p className="text-xs text-zinc-500 font-medium tracking-wide">Trusted by 50+ reviews on Trustpilot</p>
          </div>
        </div>
      </section>

      {/* Terminal & Stats Section */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative rounded-2xl bg-[#0e0e11] border border-zinc-800 shadow-2xl overflow-hidden font-mono text-xs md:text-sm text-left">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-[#18181b]">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-zinc-500 text-xs">setup.js</span>
            </div>
            {/* Terminal Body */}
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

        {/* Stats Row */}
        <div className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-zinc-800/0 md:divide-zinc-800">
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white">50+</h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Projects</p>
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white">99.9%</h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Uptime</p>
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white">RM0</h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Upfront</p>
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-4xl font-black text-white">24/7</h4>
             <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Support</p>
           </div>
        </div>
      </section>

      {/* Showcase Banner Feature Placeholder */}
      <section className="px-6 pb-24">
         <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden border border-zinc-800 aspect-[21/9] relative flex items-center justify-center p-12 bg-gradient-to-br from-zinc-900 to-black group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&q=80&w=2000')] opacity-20 group-hover:opacity-30 transition-opacity object-cover bg-center"></div>
            <div className="relative z-10 text-center space-y-4">
               <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-widest">
                  <Globe className="w-4 h-4" /> Global Reach, Malaysia’s Best
               </div>
               <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">PRO WEBSITE<br/>DEVELOPMENT</h2>
            </div>
         </div>
      </section>

      {/* Featured Showcase Section */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Showcase <span className="text-cyan-400">Spotlight</span>
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm font-medium">Find out how bad we are in creating beautiful solutions.</p>
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
                    View Project <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24 border-t border-zinc-900 bg-[#09090b]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              The SaaS House <span className="text-indigo-400">Model</span>
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-sm font-medium">
              Everything you need to scale effortlessly, without the massive upfront cost.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Zero Upfront Cost",
                desc: "No massive developer fees or consultation charges to begin building your platform."
              },
              {
                icon: Shield,
                title: "Affordable Rental",
                desc: "Servers, domain, SSL, and maintenance—all factored in one low monthly subscription."
              },
              {
                icon: Globe,
                title: "24/7 Support",
                desc: "Real-time support channels outshining standard email tickets. We fix bugs instantly."
              },
              {
                icon: Command,
                title: "Modern and Fast",
                desc: "Next.js, Tailwind CSS, & Edge deployments for blazing fast loading performance."
              },
              {
                icon: Users,
                title: "Dedicated Manager",
                desc: "You get a dedicated manager handling requests, changes, and tech stacks directly."
              },
              {
                icon: Layers,
                title: "Scale On Demand",
                desc: "Hit a million users? No worries. Our scalable infrastructure handles scaling naturally."
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

      {/* CTA Section */}
      <section className="px-6 py-24 pb-0">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-[#0e0e11] border border-zinc-800 p-16 md:p-24 text-center space-y-10 relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 blur-[100px] rounded-full group-hover:opacity-75 transition-opacity opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1]">
              Don't Buy.<br/>
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 text-transparent bg-clip-text">Rent The Best.</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed text-sm md:text-base font-medium max-w-xl mx-auto">
              Join smart businesses saving thousands in capital expenditure by jumping to the SaaS House subscription model today.
            </p>
            <div className="pt-6">
              <Link 
                href="/auth/register" 
                className="inline-flex px-10 py-5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest gap-2 items-center"
              >
                START NOW <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
