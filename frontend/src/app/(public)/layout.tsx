import Link from "next/link";
import { Sparkles } from "lucide-react";
import { T } from "@/components/Translate";
import LanguageToggle from "@/components/LanguageToggle";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 flex flex-col font-sans selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-[#09090b]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group relative">
            <div className="absolute inset-0 bg-blue-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.5)] relative z-10">
              <Sparkles className="w-5 h-5 fill-white" />
            </div>
            <span className="text-xl font-black tracking-tight ml-1">SaaS House</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors"><T en="Home" bm="Utama"/></Link>
            <Link href="/showcase" className="hover:text-white transition-colors"><T en="Showcase" bm="Portfolio"/></Link>
            <Link href="/pricing" className="hover:text-white transition-colors"><T en="Pricing" bm="Harga"/></Link>
            <Link href="/contact" className="hover:text-white transition-colors"><T en="Contact" bm="Hubungi"/></Link>
          </div>

          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link 
              href="/auth/login" 
              className="px-5 py-2.5 rounded-full hover:bg-zinc-900 transition-colors text-sm font-bold text-zinc-300 whitespace-nowrap"
            >
              <T en="Sign In" bm="Log Masuk"/>
            </Link>
            <Link 
              href="/auth/register" 
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-90 text-white transition-all text-sm font-bold shadow-lg shadow-purple-500/20 active:scale-95 whitespace-nowrap"
            >
              <T en="Get Started" bm="Bermula"/>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full bg-[#09090b]">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#09090b] px-6 pt-24 pb-0 relative overflow-hidden flex-shrink-0">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-6 gap-x-8 gap-y-16 relative z-10 mb-32">
          
          {/* Column 1: Info */}
          <div className="col-span-2 lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">SaaS House</span>
            </div>
            <p className="text-zinc-500 italic text-[13px] font-medium"><T en="Build first / Then scale." bm="Bina dahulu / Kemudian kembangkan." /></p>
            
            <div className="flex items-center gap-3 text-zinc-500 pt-2 pb-4">
               <a href="#" className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center hover:text-white hover:border-zinc-600 transition-all text-xs font-bold">X</a>
               <a href="#" className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center hover:text-white hover:border-zinc-600 transition-all text-xs font-bold">f</a>
               <a href="#" className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center hover:text-white hover:border-zinc-600 transition-all text-xs font-bold">▶</a>
               <a href="#" className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center hover:text-white hover:border-zinc-600 transition-all text-xs font-bold">✉</a>
               <a href="#" className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center hover:text-white hover:border-zinc-600 transition-all text-[10px] font-bold">in</a>
            </div>

            <div className="space-y-4 text-[11px] text-zinc-600 leading-relaxed max-w-[250px]">
              <p><T en="Premium web development services for businesses of all sizes." bm="Perkhidmatan pembangunan web premium untuk perniagaan semua saiz." /></p>
              <p><T en="All project assets and intellectual property remain your property upon completion." bm="Semua aset projek dan harta intelek kekal milik anda selepas siap." /></p>
              <p className="pt-4">© 2026 SaaS House. <T en="All rights reserved." bm="Hak cipta terpelihara." /></p>
            </div>
          </div>

          {/* Column 2: Services & Pages */}
          <div className="space-y-12">
            <div>
              <h4 className="font-black mb-5 text-zinc-600 text-[10px] uppercase tracking-widest"><T en="Services" bm="Perkhidmatan" /></h4>
              <ul className="space-y-3.5 text-[13px] font-medium text-cyan-500">
                <li><Link href="#" className="hover:text-cyan-400"><T en="Web Development" bm="Pembangunan Web" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="UI/UX Design" bm="Reka Bentuk UI/UX" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="E-Commerce" bm="E-Dagang" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="SaaS Platforms" bm="Platform SaaS" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Mobile Apps" bm="Aplikasi Mudah Alih" /></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-5 text-zinc-600 text-[10px] uppercase tracking-widest"><T en="Pages" bm="Halaman" /></h4>
              <ul className="space-y-3.5 text-[13px] font-medium text-cyan-500">
                <li><Link href="/" className="hover:text-cyan-400"><T en="Home" bm="Utama" /></Link></li>
                <li><Link href="/showcase" className="hover:text-cyan-400"><T en="Showcase" bm="Portfolio" /></Link></li>
                <li><Link href="/pricing" className="hover:text-cyan-400"><T en="Pricing" bm="Harga" /></Link></li>
                <li><Link href="/auth/register" className="hover:text-cyan-400"><T en="Start Project" bm="Mula Projek" /></Link></li>
                <li><Link href="/contact" className="hover:text-cyan-400"><T en="Contact" bm="Hubungi" /></Link></li>
              </ul>
            </div>
          </div>

          {/* Column 3: Client & Settings */}
          <div className="space-y-12">
            <div>
              <h4 className="font-black mb-5 text-zinc-600 text-[10px] uppercase tracking-widest"><T en="Client Portal" bm="Portal Pelanggan" /></h4>
              <ul className="space-y-3.5 text-[13px] font-medium text-cyan-500">
                <li><Link href="/app" className="hover:text-cyan-400"><T en="Dashboard" bm="Papan Pemuka" /></Link></li>
                <li><Link href="/app/projects" className="hover:text-cyan-400"><T en="Projects" bm="Projek" /></Link></li>
                <li><Link href="/app/tickets" className="hover:text-cyan-400"><T en="Requests" bm="Permintaan" /></Link></li>
                <li><Link href="/app/billing" className="hover:text-cyan-400"><T en="Billing" bm="Pengebilan" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Assets" bm="Aset" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Notifications" bm="Notifikasi" /></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-5 text-zinc-600 text-[10px] uppercase tracking-widest"><T en="Settings" bm="Tetapan" /></h4>
              <ul className="space-y-3.5 text-[13px] font-medium text-cyan-500">
                <li><Link href="/settings/profile" className="hover:text-cyan-400"><T en="Profile" bm="Profil" /></Link></li>
                <li><Link href="/settings/account" className="hover:text-cyan-400"><T en="Account" bm="Akaun" /></Link></li>
                <li><Link href="/settings/security" className="hover:text-cyan-400"><T en="Security" bm="Keselamatan" /></Link></li>
                <li><Link href="/settings/notifications" className="hover:text-cyan-400"><T en="Notifications" bm="Notifikasi" /></Link></li>
              </ul>
            </div>
          </div>

          {/* Column 4: Billing & Admin */}
          <div className="space-y-12">
            <div>
              <h4 className="font-black mb-5 text-zinc-600 text-[10px] uppercase tracking-widest"><T en="Billing" bm="Pengebilan" /></h4>
              <ul className="space-y-3.5 text-[13px] font-medium text-cyan-500">
                <li><Link href="/app/billing" className="hover:text-cyan-400"><T en="Subscription" bm="Langganan" /></Link></li>
                <li><Link href="/app/billing?tab=invoices" className="hover:text-cyan-400"><T en="Invoices" bm="Invois" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Payment Methods" bm="Kaedah Pembayaran" /></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-5 text-zinc-600 text-[10px] uppercase tracking-widest">Admin</h4>
              <ul className="space-y-3.5 text-[13px] font-medium text-cyan-500">
                <li><Link href="/admin" className="hover:text-cyan-400"><T en="Dashboard" bm="Papan Pemuka" /></Link></li>
                <li><Link href="/admin/projects" className="hover:text-cyan-400"><T en="Projects" bm="Projek" /></Link></li>
                <li><Link href="/admin/tickets" className="hover:text-cyan-400"><T en="Requests" bm="Permintaan" /></Link></li>
                <li><Link href="/admin/clients" className="hover:text-cyan-400"><T en="Clients" bm="Pelanggan" /></Link></li>
                <li><Link href="/admin/billing" className="hover:text-cyan-400"><T en="Billing" bm="Pengebilan" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Infrastructure" bm="Infrastruktur" /></Link></li>
                <li><Link href="/admin/settings" className="hover:text-cyan-400"><T en="Settings" bm="Tetapan" /></Link></li>
              </ul>
            </div>
          </div>

          {/* Column 5: Account & Support */}
          <div className="space-y-12">
            <div>
              <h4 className="font-black mb-5 text-zinc-600 text-[10px] uppercase tracking-widest"><T en="Account" bm="Akaun" /></h4>
              <ul className="space-y-3.5 text-[13px] font-medium text-cyan-500">
                <li><Link href="/auth/login" className="hover:text-cyan-400"><T en="Login" bm="Log Masuk" /></Link></li>
                <li><Link href="/auth/register" className="hover:text-cyan-400"><T en="Register" bm="Daftar" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Onboarding" bm="Kemasukan" /></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-5 text-zinc-600 text-[10px] uppercase tracking-widest"><T en="Support" bm="Sokongan" /></h4>
              <ul className="space-y-3.5 text-[13px] font-medium text-cyan-500">
                <li><Link href="#" className="hover:text-cyan-400"><T en="FAQ" bm="Soalan Lazim" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Help Center" bm="Pusat Bantuan" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Knowledge Base" bm="Pangkalan Pengetahuan" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Community" bm="Komuniti" /></Link></li>
              </ul>
            </div>
          </div>

          {/* Column 6: Policies */}
          <div className="space-y-12">
            <div>
              <h4 className="font-black mb-5 text-zinc-600 text-[10px] uppercase tracking-widest"><T en="Policies & Security" bm="Polisi & Keselamatan" /></h4>
              <ul className="space-y-3.5 text-[13px] font-medium text-cyan-500">
                <li><Link href="#" className="hover:text-cyan-400"><T en="Terms of Use" bm="Syarat Penggunaan" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Disclaimer" bm="Penafian" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Privacy Policy" bm="Dasar Privasi" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Cookies Policy" bm="Dasar Kuki" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Accessibility" bm="Kebolehcapaian" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Security Tips" bm="Tips Keselamatan" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Bug Bounty" bm="Ganjaran Pepijat" /></Link></li>
                <li><Link href="#" className="hover:text-cyan-400"><T en="Status Page" bm="Status Sistem" /></Link></li>
              </ul>
            </div>
          </div>
        </div>
        {/* Massive Backdrop Watermark Text (Gradient) */}
        <div className="w-full text-center select-none pointer-events-none flex items-center justify-center mt-16 overflow-hidden">
           <h1 className="text-[15vw] lg:text-[13vw] font-black leading-[0.8] tracking-tighter bg-gradient-to-r from-slate-800/80 via-zinc-800/80 to-purple-900/50 text-transparent bg-clip-text whitespace-nowrap pb-4 text-center">
             <T en={<>BUILD FIRST /<br/>THEN SCALE.</>} bm={<>BINA DAHULU /<br/>KEMUDIAN KEMBANGKAN.</>} />
           </h1>
        </div>
      </footer>
    </div>
  );
}
