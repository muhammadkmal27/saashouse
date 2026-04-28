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
      {/* ─── Original Contact Section ─── */}
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
                    <p className="text-xl font-bold text-zinc-300">hello@saashouse.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 uppercase font-bold tracking-widest"><T en="WhatsApp Business" bm="WhatsApp Perniagaan" /></p>
                    <p className="text-xl font-bold text-zinc-300">+60 12-345 6789</p>
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
              {/* Background decoration */}
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
                      <option value="Bug Fix / Maintenance">{lang === "EN" ? "Bug Fix / Maintenance" : "Pembaikan Pepijat / Penyelenggaraan"}</option>
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

      {/* ─── NEW: How It Works — Process Timeline ─── */}
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
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-violet-500/50 via-cyan-500/50 to-emerald-500/50" />

            {[
              { step: "01", title: <T en="Reach Out" bm="Berhubung" />, desc: <T en="Fill out the contact form or message us on WhatsApp. We typically respond within 2 hours." bm="Isi borang laluan pantas atau mesej pihak kami via WhatsApp. Kami balas dalam masa dua jam!" />, icon: MessageSquare, color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
              { step: "02", title: <T en="Requirements Call" bm="Panggilan Rundingan" />, desc: <T en="A 30-minute discovery call to understand your business goals, target audience, and technical needs." bm="Panggilan kajian 30-minit untuk kami kenal dan menelusuri kehendak matlamat perniagaan anda." />, icon: Phone, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
              { step: "03", title: <T en="Build & Preview" bm="Bina & Semak Semula" />, desc: <T en="We build your project in 5-7 days. You get a private staging link to review every detail before going live." bm="Projek dibina dan diserah dalam masa sesingkat 5 hari, diringi sesi ujian persendirian untuk jaminan kepuasan." />, icon: Globe, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
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

      {/* ─── NEW: Trust Indicators ─── */}
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
                <Users className="w-8 h-8" />
              </div>
              <h4 className="text-3xl font-extrabold text-white">150+ <T en="Clients" bm="Pelanggan" /></h4>
              <p className="text-zinc-500 text-sm"><T en="Trusted by businesses across Malaysia, from startups to established enterprises." bm="Dipercayai oleh perniagaan di seluruh Malaysia, dari syarikat permulaan hingga perusahaan besar." /></p>
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

      {/* ─── NEW: What Our Clients Say ─── */}
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
                name: "Ahmad Razif",
                role: "CEO, Razif Holdings",
                initial: "A"
              },
              {
                quote: "The onboarding process was incredibly smooth. From requirements to a live website in just 6 days. The speed optimization they did was phenomenal.",
                name: "Nurul Aisyah",
                role: "Founder, Aisyah Boutique",
                initial: "N"
              },
              {
                quote: "We moved from a shared hosting provider and immediately saw a 3x improvement in page load speed. Their enterprise infrastructure is no joke.",
                name: "Daniel Lim",
                role: "CTO, Finova Solutions",
                initial: "D"
              },
              {
                quote: "Having a dedicated manager who understands our project inside out has been invaluable. It's like having an in-house dev team without the overhead.",
                name: "Siti Mariam",
                role: "Director, EduPlatform MY",
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
                  {testimonial.quote === "SaaS House transformed our online presence completely. The managed hosting means I never worry about server issues — I just focus on running my business." ? <T en="SaaS House transformed our online presence completely. The managed hosting means I never worry about server issues — I just focus on running my business." bm="SaaS House telah mengubah kehadiran dalam talian kami sepenuhnya. Pengehosan terurus bermakna saya tidak perlu bimbang tentang masalah pelayan." /> : 
                   testimonial.quote === "The onboarding process was incredibly smooth. From requirements to a live website in just 6 days. The speed optimization they did was phenomenal." ? <T en="The onboarding process was incredibly smooth. From requirements to a live website in just 6 days. The speed optimization they did was phenomenal." bm="Proses kemasukan sangat lancar. Dari penetapan sehingga pelancaran hanya dalam masa 6 hari. Pengoptimuman kelajuan mereka sangat hebat." /> :
                   testimonial.quote === "We moved from a shared hosting provider and immediately saw a 3x improvement in page load speed. Their enterprise infrastructure is no joke." ? <T en="We moved from a shared hosting provider and immediately saw a 3x improvement in page load speed. Their enterprise infrastructure is no joke." bm="Kami bertukar daripada pengehosan kongsi dan segera melihat peningkatan kelajuan 3 kali ganda. Infrastruktur perusahaan mereka sangat mantap." /> :
                   testimonial.quote === "Having a dedicated manager who understands our project inside out has been invaluable. It's like having an in-house dev team without the overhead." ? <T en="Having a dedicated manager who understands our project inside out has been invaluable. It's like having an in-house dev team without the overhead." bm="Mempunyai pengurus khas yang memahami projek sangat berharga. Ia seperti mempunyai pasukan pembangun dalaman sendiri." /> : testimonial.quote}
                &rdquo;</p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-black text-lg">
                    {testimonial.initial}
                  </div>
                  <div>
                    <p className="font-bold text-white">{testimonial.name}</p>
                    <p className="text-zinc-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEW: Office Hours & Support Channels ─── */}
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
                    { day: <T en="Saturday" bm="Sabtu" />, time: "10:00 AM — 2:00 PM MYT", active: true },
                    { day: <T en="Sunday & Public Holiday" bm="Ahad & Cuti Umum" />, time: <T en="Closed" bm="Tutup" />, active: false },
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
                    { channel: <T en="Email Support" bm="Sokongan E-mel" />, desc: <T en="For general inquiries and project discussions" bm="Untuk pertanyaan umum dan perbincangan projek" />, badge: <T en="All Plans" bm="Semua Pelan" />, icon: Mail },
                    { channel: <T en="WhatsApp Business" bm="WhatsApp Perniagaan" />, desc: <T en="Quick questions and urgent requests" bm="Soalan pantas dan permintaan kecemasan" />, badge: "Growth+", icon: MessageSquare },
                    { channel: <T en="Priority Hotline" bm="Talian Utama" />, desc: <T en="Direct line to your dedicated manager" bm="Talian terus kepada pengurus khas anda" />, badge: "Enterprise+", icon: Headphones },
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

      {/* ─── NEW: Final CTA ─── */}
      <section className="px-6 pb-40">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative space-y-8">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
              <T 
                en={<>Not sure which plan<br />fits your business?</>} 
                bm={<>Tidak pasti pelan mana<br />yang sesuai?</>} 
              />
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              <T en="Book a free 15-minute consultation call and we'll recommend the perfect setup for your needs." bm="Tempah sesi rundingan percuma 15 minit dan kami akan cadangkan persediaan terbaik buat anda." />
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-violet-600/20 text-lg"
              >
                <T en="View Plans" bm="Lihat Pelan" /> <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/showcase"
                className="inline-flex items-center gap-2 px-10 py-5 bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest rounded-2xl hover:bg-white/5 transition-all text-lg"
              >
                <T en="See Our Work" bm="Lihat Hasil Kerja" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
