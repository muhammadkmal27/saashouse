"use client";

import { useState } from "react";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { MessageSquare, Phone, Mail, MapPin, Send, Clock, Zap, Shield, Users, ArrowRight, CheckCircle2, Globe, Headphones, Loader2 } from "lucide-react";
import Link from "next/link";
// import { API_BASE_URL } from "@/utils/api"; // Removed to fix build error

export default function ContactPage() {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    subject: "New Project Inquiry",
    message: ""
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg("");

    try {
      const res = await fetch(`/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Backend Error Response:", text);
        let errorData: any = {};
        try {
          errorData = JSON.parse(text);
        } catch (e) {}
        
        const errorMsg = errorData.error || errorData.message || `Server responded with ${res.status}`;
        throw new Error(errorMsg);
      }

      setStatus('success');
    } catch (err: any) {
      console.error("Contact Error:", err);
      setStatus('error');
      setErrorMsg(err.message || "Failed to send message");
    }
  };

  return (
    <div className="bg-[#09090b]">
      {/* ─── MOBILE VIEW (lg:hidden) ─── */}
      <div className="lg:hidden">
        {/* Mobile Hero */}
        <section className="px-6 pt-24 pb-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-indigo-500/10 blur-[120px] -z-10" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 text-[10px] font-black text-cyan-400 uppercase tracking-widest backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <T en="Support Center" bm="Pusat Sokongan" />
          </div>
          <h1 className="text-4xl font-black text-white leading-[1.1] tracking-tighter">
            <T en={<>Let's Build Your<br /><span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">Next Big Thing.</span></>} bm={<>Mari Bina<br /><span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">Projek Hebat Anda.</span></>} />
          </h1>
          <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
            <T en="Reach out to our engineering team and get a reply within 2 working hours." bm="Hubungi pasukan jurutera kami dan dapatkan maklum balas dalam masa 2 jam waktu bekerja." />
          </p>
        </section>

        {/* Mobile Contact Info - Detailed Cards */}
        <section className="px-6 py-6 space-y-4">
          {[
            { icon: Mail, label: <T en="Email Us" bm="E-mel Kami" />, value: "saashouse.mail@gmail.com", link: "mailto:saashouse.mail@gmail.com" },
            { icon: MessageSquare, label: "WhatsApp Business", value: "+60 11-35523788", link: "https://wa.me/601135523788" },
            { icon: MapPin, label: <T en="Our Location" bm="Lokasi Kami" />, value: "Kuala Lumpur, Malaysia", link: "#" },
          ].map((item, idx) => (
            <a key={idx} href={item.link} className="flex items-center gap-5 p-6 rounded-[2rem] bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 active:scale-[0.98] transition-all">
              <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shrink-0">
                <item.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{item.label}</p>
                <p className="text-sm font-bold text-zinc-200">{item.value}</p>
              </div>
            </a>
          ))}
        </section>

        {/* Mobile Form - Refined Card */}
        <section className="px-6 py-8">
          <div className="p-10 rounded-[3rem] bg-[#0e0e11] border border-zinc-800 relative shadow-2xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] -z-10" />
            
            <div className="mb-10 text-center">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight italic"><T en="Send a Message" bm="Hantar Mesej" /></h3>
              <div className="w-10 h-1 bg-gradient-to-r from-cyan-400 to-transparent mx-auto mt-2" />
            </div>
            
            {status === 'success' ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-white"><T en="Message Received!" bm="Mesej Diterima!" /></h4>
                  <p className="text-zinc-500 text-sm leading-relaxed"><T en="We'll be in touch with you shortly." bm="Kami akan menghubungi anda sebentar lagi." /></p>
                </div>
                <button onClick={() => setStatus('idle')} className="px-8 py-3 rounded-xl bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest"><T en="New Message" bm="Mesej Baru" /></button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2"><T en="Your Name" bm="Nama Anda" /></label>
                    <input required type="text" placeholder="Ali Abu" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full bg-[#09090b] text-white border border-zinc-800/50 rounded-2xl px-6 py-4 focus:border-cyan-400 outline-none text-sm transition-all shadow-inner placeholder:text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2"><T en="Email Address" bm="Alamat E-mel" /></label>
                    <input required type="email" placeholder="ali@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[#09090b] text-white border border-zinc-800/50 rounded-2xl px-6 py-4 focus:border-cyan-400 outline-none text-sm transition-all shadow-inner placeholder:text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2"><T en="Message" bm="Mesej" /></label>
                    <textarea required rows={5} placeholder="..." value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-[#09090b] text-white border border-zinc-800/50 rounded-2xl px-6 py-4 focus:border-cyan-400 outline-none text-sm transition-all resize-none shadow-inner" />
                  </div>
                </div>

                <button disabled={status === 'loading'} type="submit" className="w-full py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-violet-600/20">
                  {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><T en="Submit Message" bm="Hantar Mesej" /> <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Mobile Vertical Timeline - Premium Style */}
        <section className="px-6 py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[100px] -z-10" />
          
          <div className="mb-16 text-center">
             <h2 className="text-3xl font-black text-white tracking-tight uppercase italic"><T en="The Process" bm="Proses Kami" /></h2>
             <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full mt-3 mx-auto" />
          </div>
          
          <div className="space-y-12 relative">
            <div className="absolute left-7 top-0 bottom-0 w-[2px] bg-gradient-to-b from-cyan-400/50 via-violet-500/50 to-transparent" />
            {[
              { step: "01", title: <T en="Project Submission" bm="Penyerahan Projek" />, desc: <T en="Fill our brief form to start. We review and contact you within 2 hours." bm="Isi borang ringkas kami. Kami semak dan hubungi anda dalam masa 2 jam." />, icon: MessageSquare, glow: "shadow-cyan-500/20" },
              { step: "02", title: <T en="Feature Discovery" bm="Sesi Perbincangan" />, desc: <T en="Deep dive into your custom requirements and unique business features." bm="Bincang mendalam tentang keperluan khas dan fungsi unik perniagaan anda." />, icon: Phone, glow: "shadow-blue-500/20" },
              { step: "03", title: <T en="Build & Staging" bm="Binaan & Ujian" />, desc: <T en="Development phase (1-2 months) with a private link to track progress." bm="Fasa pembangunan (1-2 bulan) dengan pautan khas untuk pantau progres." />, icon: Globe, glow: "shadow-indigo-500/20" },
              { step: "04", title: <T en="Deployment" bm="Pelancaran" />, desc: <T en="Final security audit and live launch on enterprise-grade servers." bm="Audit keselamatan terakhir dan pelancaran di pelayan bertaraf korporat." />, icon: Zap, glow: "shadow-emerald-500/20" },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-8 relative z-10 group">
                <div className={`w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shrink-0 shadow-2xl ${item.glow} group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="pt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">{item.step}</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-800" />
                    <h4 className="text-base font-black text-white uppercase tracking-tight">{item.title}</h4>
                  </div>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mobile Trust Indicators - Grid Style */}
        <section className="px-6 py-12">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Clock, label: <T en="< 2 Hours" bm="< 2 Jam" />, sub: <T en="Response Time" bm="Masa Respons" /> },
              { icon: Headphones, label: <T en="Experts" bm="Pakar" />, sub: <T en="Direct Access" bm="Akses Terus" /> },
              { icon: Shield, label: "99.9%", sub: <T en="Uptime" bm="Masa Aktif" /> },
              { icon: Zap, label: <T en="Fast" bm="Laju" />, sub: "Next.js Core" },
            ].map((box, idx) => (
              <div key={idx} className="p-6 rounded-[2rem] bg-zinc-900/40 border border-zinc-800/50 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mx-auto mb-2">
                  <box.icon className="w-5 h-5" />
                </div>
                <div className="text-xl font-black text-white tracking-tight">{box.label}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{box.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mobile Support Hours - Final Design */}
        <section className="px-6 py-8 pb-12">
          <div className="p-10 rounded-[3rem] bg-gradient-to-b from-[#0e0e11] to-black border border-zinc-800 relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 text-center italic"><T en="Support Hours" bm="Waktu Operasi" /></h3>
            <div className="space-y-6">
              {[
                { label: <T en="Weekdays" bm="Hari Bekerja" />, value: <T en="9:00 AM - 6:00 PM" bm="9:00 PG - 6:00 PTG" />, status: true },
                { label: <T en="Public Holiday" bm="Cuti Umum" />, value: <T en="Closed" bm="Tutup" />, status: false },
              ].map((row, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{row.label}</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-200">{row.value}</span>
                    <div className={`w-2 h-2 rounded-full ${row.status ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-zinc-800'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile Final CTA - Matching Pricing Page Style */}
        <section className="px-6 pb-32 pt-10">
          <div className="text-center space-y-8 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-violet-600/5 blur-[80px] -z-10" />
            <h2 className="text-4xl font-black text-white leading-tight tracking-tighter">
              <T 
                en={<>Not sure which plan<br />fits your business?</>} 
                bm={<>Tidak pasti pakej mana<br />yang sesuai?</>} 
              />
            </h2>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
              <T en="Book a free 15-minute consultation call and we'll recommend the perfect setup for your needs." bm="Tempah sesi rundingan percuma 15 minit dan kami akan cadangkan persediaan terbaik buat anda." />
            </p>
            <div className="flex flex-col gap-4 pt-4">
              <Link
                href="/pricing"
                className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-violet-600/20 text-sm"
              >
                <T en="View Plans" bm="Lihat Pakej" /> <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/showcase"
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest rounded-2xl text-sm"
              >
                <T en="See Our Work" bm="Lihat Hasil Kerja" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ─── DESKTOP VIEW (hidden lg:block) ─── */}
      <div className="hidden lg:block">
        {/* Original Contact Section */}
        <div className="px-6 py-24 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16">
              
              <div className="space-y-12">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight italic text-white">
                    <T en={<>Let's talk <br /><span className="text-cyan-400 not-italic">performance.</span></>} bm={<>Mari bincang <br /><span className="text-cyan-400 not-italic">prestasi.</span></>} />
                  </h1>
                  <p className="text-zinc-500 text-lg leading-relaxed max-w-md">
                    <T en="Have questions about our managed website model? Reach out and we'll reply within 2 working hours." bm="Ada soalan tentang model laman web terurus kami? Hubungi kami dan kami akan balas dalam masa 2 jam waktu bekerja." />
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 uppercase font-bold tracking-widest"><T en="Email Us" bm="E-mel Kami" /></p>
                      <p className="text-xl font-bold text-zinc-300">saashouse.mail@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 uppercase font-bold tracking-widest"><T en="WhatsApp Business" bm="WhatsApp Perniagaan" /></p>
                      <p className="text-xl font-bold text-zinc-300">+60 11-35523788</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 uppercase font-bold tracking-widest"><T en="Based In" bm="Lokasi Kami" /></p>
                      <p className="text-xl font-bold text-zinc-300">Kuala Lumpur, Malaysia</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-indigo-500/10 blur-[100px] -z-10 rounded-full"></div>
                
                {status === 'success' ? (
                  <div className="p-12 md:p-16 rounded-[3rem] bg-[#0e0e11] border border-zinc-800 space-y-6 shadow-2xl flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-black text-white"><T en="Message Sent!" bm="Mesej Dihantar!" /></h3>
                    <p className="text-zinc-500 leading-relaxed">
                      <T 
                        en={`Thank you for reaching out, ${formData.full_name.split(' ')[0]}. Our team has received your message and we'll get back to you at ${formData.email} within 2 business hours.`} 
                        bm={`Terima kasih kerana menghubungi kami, ${formData.full_name.split(' ')[0]}. Pasukan kami telah menerima mesej anda dan akan membalas ke ${formData.email} dalam masa 2 jam waktu bekerja.`} 
                      />
                    </p>
                    <button 
                      onClick={() => setStatus('idle')}
                      className="px-8 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors"
                    >
                      <T en="Send Another Message" bm="Hantar Mesej Lain" />
                    </button>
                  </div>
                ) : (
                  <form 
                    onSubmit={handleSubmit}
                    className="p-8 md:p-12 rounded-[3rem] bg-[#0e0e11] border border-zinc-800 space-y-6 shadow-2xl shadow-purple-500/5 transition-all duration-500"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500"><T en="Full Name" bm="Nama Penuh" /></label>
                        <input 
                          required
                          type="text" 
                          placeholder={lang === "EN" ? "John Doe" : "Ali Abu"} 
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          className="w-full bg-[#09090b] text-white border border-zinc-800 rounded-2xl px-5 py-4 focus:border-cyan-400 transition-colors outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500"><T en="Email Address" bm="Alamat E-mel" /></label>
                        <input 
                          required
                          type="email" 
                          placeholder="john@example.com" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-[#09090b] text-white border border-zinc-800 rounded-2xl px-5 py-4 focus:border-cyan-400 transition-colors outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500"><T en="Subject" bm="Subjek" /></label>
                      <select 
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="w-full bg-[#09090b] text-white border border-zinc-800 rounded-2xl px-5 py-4 focus:border-cyan-400 transition-colors outline-none appearance-none cursor-pointer"
                      >
                        <option value="New Project Inquiry">{lang === "EN" ? "New Project Inquiry" : "Pertanyaan Projek Baru"}</option>
                        <option value="Bug Fix / Maintenance">{lang === "EN" ? "Bug Fix / Maintenance" : "Pembaikan Ralat Sistem / Penyelenggaraan"}</option>
                        <option value="Custom Partnership">{lang === "EN" ? "Custom Partnership" : "Perkongsian Khas"}</option>
                        <option value="Other">{lang === "EN" ? "Other" : "Lain-lain"}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500"><T en="Message" bm="Mesej" /></label>
                      <textarea 
                        required
                        rows={5}
                        placeholder={lang === "EN" ? "Tell us about your project..." : "Beritahu kami tentang projek anda..."} 
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className="w-full bg-[#09090b] text-white border border-zinc-800 rounded-2xl px-5 py-4 focus:border-cyan-400 transition-colors outline-none resize-none"
                      />
                    </div>

                    {status === 'error' && (
                      <p className="text-red-400 text-xs font-bold text-center bg-red-400/10 py-3 rounded-xl border border-red-400/20">
                        {errorMsg}
                      </p>
                    )}

                    <button 
                      disabled={status === 'loading'}
                      type="submit"
                      className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-lg shadow-xl shadow-purple-500/20 transition-all flex items-center justify-center gap-3 group"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <T en="Processing..." bm="Memproses..." />
                        </>
                      ) : (
                        <>
                          <T en="Send Message" bm="Hantar Mesej" />
                          <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* How It Works — Process Timeline */}
        <section className="px-6 pb-32">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
                <Zap className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-violet-300 tracking-wide"><T en="Simple Process" bm="Proses Mudah" /></span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white"><T en="How It Works" bm="Bagaimana Ia Berfungsi" /></h2>
              <p className="text-zinc-500 max-w-xl mx-auto"><T en="From first contact to live deployment — here's what to expect." bm="Daripada sesi pertama hingga pelancaran platform — ini yang anda dapati." /></p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-violet-500/50 via-cyan-500/50 to-emerald-500/50" />
              {[
                { step: "01", title: <T en="Start Project" bm="Bina Projek" />, desc: <T en="Fill out the project submission form to get started. Our team will review your requirements and contact you shortly." bm="Isi borang penyerahan projek untuk bermula. Pasukan kami akan menyemak keperluan anda dan menghubungi anda segera." />, icon: MessageSquare, color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
                { step: "02", title: <T en="Features" bm="Fungsi Sistem" />, desc: <T en="Define your unique requirements and additional features. Any changes can be requested through our dedicated ticket system." bm="Tetapkan keperluan unik dan fungsi sistem tambahan anda. Sebarang perubahan boleh diminta melalui sistem tiket khas kami." />, icon: Phone, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
                { step: "03", title: <T en="Build & Preview" bm="Bina & Semak Semula" />, desc: <T en="We build your project within 1 to 2 months. You get a private staging link to review every detail before going live." bm="Projek dibina dalam tempoh 1 hingga 2 bulan, diiringi sesi ujian persendirian untuk jaminan kepuasan anda." />, icon: Globe, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
                { step: "04", title: <T en="Go Live" bm="Pelancaran Segera" />, desc: <T en="Once approved, we deploy to production. DNS, SSL, and security — all handled by us automatically." bm="Sebaik diluluskan, kami mula memuat naik kod anda ke produksi (DNS, SSL dilindungi)." />, icon: Zap, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
              ].map((item, idx) => (
                <div key={idx} className="relative text-center space-y-5">
                  <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center mx-auto relative z-10 bg-[#09090b] ${item.color}`}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em]"><T en="Step" bm="Langkah" /> {item.step}</p>
                  <h4 className="text-xl font-bold text-white">{item.title}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="px-6 pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-10 rounded-3xl bg-[#0e0e11] border border-zinc-800 text-center space-y-4 hover:border-zinc-700 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
                <h4 className="text-3xl font-extrabold text-white">&lt; 2 <T en="Hours" bm="Jam" /></h4>
                <p className="text-zinc-500 text-sm"><T en="Average response time during business hours. We don't believe in making you wait." bm="Purata masa respons semasa waktu bekerja. Kami tidak suka membiarkan anda menunggu." /></p>
              </div>

              <div className="p-10 rounded-3xl bg-[#0e0e11] border border-zinc-800 text-center space-y-4 hover:border-zinc-700 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center text-violet-400 mx-auto">
                  <Headphones className="w-8 h-8" />
                </div>
                <h4 className="text-3xl font-extrabold text-white"><T en="Expert Support" bm="Sokongan Pakar" /></h4>
                <p className="text-zinc-500 text-sm"><T en="Direct access to the engineers who built your platform. No middlemen, no chatbots." bm="Akses terus kepada jurutera yang membina platform anda. Tiada orang tengah, tiada chatbot." /></p>
              </div>

              <div className="p-10 rounded-3xl bg-[#0e0e11] border border-zinc-800 text-center space-y-4 hover:border-zinc-700 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mx-auto">
                  <Shield className="w-8 h-8" />
                </div>
                <h4 className="text-3xl font-extrabold text-white">99.9% <T en="Uptime" bm="Kesediaan" /></h4>
                <p className="text-zinc-500 text-sm"><T en="Enterprise-grade infrastructure ensuring your business is always online and accessible." bm="Infrastruktur gred perusahaan menjamin perniagaan anda sentiasa dalam talian." /></p>
              </div>
            </div>
          </div>
        </section>

        {/* What Our Clients Say */}
        <section className="px-6 pb-32">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white"><T en="What Our Clients Say" bm="Apa Kata Pelanggan Kami" /></h2>
              <p className="text-zinc-500"><T en="Real feedback from real businesses we've partnered with." bm="Maklum balas sebenar daripada perniagaan yang telah bekerjasama dengan kami." /></p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  quote: "SaaS House transformed our online presence completely. The managed hosting means I never worry about server issues — I just focus on running my business.",
                  name: "Ahmad",
                  initial: "A"
                },
                {
                  quote: "The transition to a managed platform was seamless. They delivered a high-performance site that exceeded our expectations in both speed and reliability.",
                  name: "Mohamad",
                  initial: "M"
                },
                {
                  quote: "We moved from a shared hosting provider and immediately saw a 3x improvement in page load speed. Their enterprise infrastructure is no joke.",
                  name: "Muhammad",
                  initial: "M"
                },
                {
                  quote: "Having direct access to the lead engineers has been invaluable. They understand our project inside out and provide support that is both fast and personal.",
                  name: "Syakir",
                  initial: "S"
                },
              ].map((testimonial, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-[#0e0e11] border border-zinc-800 hover:border-zinc-700 transition-colors space-y-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-zinc-300 leading-relaxed italic">&ldquo;
                    {testimonial.quote === "SaaS House transformed our online presence completely. The managed hosting means I never worry about server issues — I just focus on running my business." ? <T en="SaaS House transformed our online presence completely. The managed hosting means I never worry about server issues — I just focus on running my business." bm="SaaS House memang ubah habis cara kami niaga online. Dengan hosting terurus ni, saya dah tak payah pening kepala fikir pasal masalah server." /> : 
                     testimonial.quote === "The transition to a managed platform was seamless. They delivered a high-performance site that exceeded our expectations in both speed and reliability." ? <T en="The transition to a managed platform was seamless. They delivered a high-performance site that exceeded our expectations in both speed and reliability." bm="Proses nak tukar ke platform ni memang smooth gila. Laman web yang dorang buat ni laju dan stabil, memang puas hati sangat." /> :
                     testimonial.quote === "We moved from a shared hosting provider and immediately saw a 3x improvement in page load speed. Their enterprise infrastructure is no joke." ? <T en="We moved from a shared hosting provider and immediately saw a 3x improvement in page load speed. Their enterprise infrastructure is no joke." bm="Dulu pakai shared hosting, bila tukar je terus nampak laju 3 kali ganda. Memang mantap infrastruktur dorang ni." /> :
                     testimonial.quote === "Having direct access to the lead engineers has been invaluable. They understand our project inside out and provide support that is both fast and personal." ? <T en="Having direct access to the lead engineers has been invaluable. They understand our project inside out and provide support that is both fast and personal." bm="Dapat bincang terus dengan developer dorang memang best. Dorang faham setiap inci projek kami dan support pun memang laju." /> : testimonial.quote}
                  &rdquo;</p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-black text-lg">
                      {testimonial.initial}
                    </div>
                    <div>
                      <p className="font-bold text-white">{testimonial.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Office Hours & Support Channels */}
        <section className="px-6 pb-32">
          <div className="max-w-5xl mx-auto">
            <div className="p-12 md:p-16 rounded-[3rem] bg-[#0e0e11] border border-zinc-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
              
              <div className="relative grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white"><T en="Office Hours" bm="Waktu Pejabat" /></h3>
                  <div className="space-y-4">
                    {[
                      { day: <T en="Monday - Friday" bm="Isnin - Jumaat" />, time: "9:00 AM — 6:00 PM MYT", active: true },
                      { day: <T en="Saturday - Sunday" bm="Sabtu - Ahad" />, time: <T en="Closed" bm="Tutup" />, active: false },
                      { day: <T en="Public Holiday" bm="Cuti Umum" />, time: <T en="Closed" bm="Tutup" />, active: false },
                    ].map((schedule, idx) => (
                      <div key={idx} className="flex items-center justify-between py-4 border-b border-zinc-800 last:border-b-0">
                        <span className="text-zinc-300 font-medium">{schedule.day}</span>
                        <span className={`text-sm font-bold ${schedule.active ? 'text-emerald-400' : 'text-zinc-600'}`}>{schedule.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white"><T en="Support Channels" bm="Saluran Sokongan" /></h3>
                  <div className="space-y-4">
                    {[
                      { channel: <T en="Email Support" bm="Sokongan E-mel" />, desc: <T en="For general inquiries and project discussions" bm="Untuk pertanyaan umum dan perbincangan projek" />, badge: <T en="All Plans" bm="Semua Pakej" />, icon: Mail },
                      { channel: <T en="WhatsApp Business" bm="WhatsApp Perniagaan" />, desc: <T en="Quick questions and urgent requests" bm="Soalan pantas dan permintaan kecemasan" />, badge: <T en="All Plans" bm="Semua Pakej" />, icon: MessageSquare },
                      { channel: <T en="Priority Hotline" bm="Talian Utama" />, desc: <T en="Direct line to your dedicated manager" bm="Talian terus kepada pengurus khas anda" />, badge: <T en="All Plans" bm="Semua Pakej" />, icon: Headphones },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-bold text-white">{item.channel}</p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full">{item.badge}</span>
                          </div>
                          <p className="text-zinc-500 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 pb-40">
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="relative space-y-8">
              <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
                <T 
                  en={<>Not sure which plan<br />fits your business?</>} 
                  bm={<>Tidak pasti pakej mana<br />yang sesuai?</>} 
                />
              </h2>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                <T en="Book a free 15-minute consultation call and we'll recommend the perfect setup for your needs." bm="Tempah sesi rundingan percuma 15 minit dan kami akan cadangkan persediaan terbaik buat anda." />
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-violet-600/20 text-lg"
                >
                  <T en="View Plans" bm="Lihat Pakej" /> <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/showcase"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-5 bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest rounded-2xl hover:bg-white/5 transition-all text-lg"
                >
                  <T en="See Our Work" bm="Lihat Hasil Kerja" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
