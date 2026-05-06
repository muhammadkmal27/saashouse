"use client";

import { useState, useEffect } from "react";
import { 
  FileText, Plus, Trash2, ChevronUp, ChevronDown, 
  Info, AlertCircle, Save, Loader2, Zap, Server 
} from "lucide-react";
import { T } from "@/components/Translate";

interface Section {
  title: string;
  content: string;
}

interface AgreementSettingsProps {
  otpTemplate: Section[];
  saasTemplate: Section[];
  onSave: (key: string, value: Section[]) => Promise<void>;
  saving: string | null;
}

export default function AgreementSettings({ 
  otpTemplate, 
  saasTemplate, 
  onSave, 
  saving 
}: AgreementSettingsProps) {
  const [mode, setMode] = useState<"otp" | "saas">("otp");
  const [sections, setSections] = useState<Section[]>([]);

  // Sync with props when they load or mode changes
  useEffect(() => {
    const template = mode === "otp" ? otpTemplate : saasTemplate;
    if (template && template.length > 0) {
      setSections(template);
    } else {
      setSections([]);
    }
  }, [otpTemplate, saasTemplate, mode]);

  const handleToggleMode = (newMode: "otp" | "saas") => {
    setMode(newMode);
  };

  const updateSection = (index: number, field: keyof Section, value: string) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
  };

  const addSection = () => {
    setSections([...sections, { title: "New Section", content: "" }]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  const handleSave = () => {
    const key = mode === "otp" ? "agreement_template_otp" : "agreement_template_saas";
    onSave(key, sections);
  };

  return (
    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-100/60 p-5 md:p-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-50 pb-8">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <T en="Agreement Templates" bm="Templat Perjanjian" />
          </h2>
          <p className="text-sm text-zinc-400 font-medium">
            <T en="Customize the clauses and sections for legal agreements." bm="Suaikan klausa dan bahagian untuk perjanjian undang-undang." />
          </p>
        </div>
        
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-full sm:w-fit">
          <button 
            onClick={() => handleToggleMode("otp")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === "otp" ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Zap className="w-3 h-3" /> OTP
          </button>
          <button 
            onClick={() => handleToggleMode("saas")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === "saas" ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/5" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Server className="w-3 h-3" /> SaaS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Editor Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            {sections.map((section, idx) => (
              <div key={idx} className="group relative bg-zinc-50 border border-zinc-200 rounded-[1.5rem] p-5 md:p-6 transition-all hover:border-zinc-300">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block"><T en="Section" bm="Bahagian" /> {idx + 1}</span>
                    <input 
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(idx, "title", e.target.value)}
                      className="w-full bg-transparent text-sm font-black text-zinc-900 outline-none border-b border-transparent focus:border-zinc-300 pb-1"
                      placeholder={typeof window !== 'undefined' && localStorage.getItem('language') === 'BM' ? "Tajuk Bahagian" : "Section Title"}
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveSection(idx, "up")} className="p-2 hover:bg-zinc-200 rounded-xl text-zinc-500 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveSection(idx, "down")} className="p-2 hover:bg-zinc-200 rounded-xl text-zinc-500 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => removeSection(idx)} className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <textarea 
                  value={section.content}
                  onChange={(e) => updateSection(idx, "content", e.target.value)}
                  className="w-full h-40 bg-white border border-zinc-200 rounded-2xl p-5 text-sm font-medium text-zinc-600 outline-none focus:ring-2 ring-blue-100 resize-none transition-all shadow-inner"
                  placeholder={typeof window !== 'undefined' && localStorage.getItem('language') === 'BM' ? "Masukkan kandungan bahagian di sini... Anda boleh menggunakan **Markdown** untuk penggayaan." : "Enter section content here... You can use **Markdown** for styling."}
                />
              </div>
            ))}
          </div>

          <button 
            onClick={addSection}
            className="w-full py-5 border-2 border-dashed border-zinc-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> <T en="Add New Clause" bm="Tambah Klausa Baru" />
          </button>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-blue-50/50 border border-blue-100 rounded-[1.5rem] p-6">
            <details className="group open:space-y-4" open={typeof window !== 'undefined' && window.innerWidth > 768}>
              <summary className="list-none cursor-pointer">
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" /> <T en="Placeholders" bm="Penanda Tempat" />
                  </div>
                  <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180 md:hidden" />
                </h3>
              </summary>
              
              <ul className="space-y-3 pt-2 md:pt-0">
                {[
                  { key: "{{project_name}}", label: { en: "Project Title", bm: "Tajuk Projek" } },
                  { key: "{{client_name}}", label: { en: "Client Full Name", bm: "Nama Penuh Klien" } },
                  { key: "{{provider_name}}", label: { en: "Your Company Name", bm: "Nama Syarikat Anda" } },
                  { key: "{{total_cost}}", label: { en: "Total Project Cost", bm: "Kos Keseluruhan Projek" } },
                  { key: "{{deposit_amount}}", label: { en: "Deposit Amount", bm: "Jumlah Deposit" } },
                  { key: "{{monthly_price}}", label: { en: "SaaS Monthly Fee", bm: "Yuran Bulanan SaaS" } },
                  { key: "{{saas_setup_fee}}", label: { en: "SaaS Setup Fee", bm: "Yuran Persediaan SaaS" } },
                  { key: "{{balance_amount}}", label: { en: "Final Balance Owed", bm: "Baki Akhir Terhutang" } },
                  { key: "{{today}}", label: { en: "Today's Date", bm: "Tarikh Hari Ini" } },
                ].map((p) => (
                  <li key={p.key} className="flex flex-col">
                    <code className="text-[11px] font-black text-blue-600">{p.key}</code>
                    <span className="text-[10px] font-medium text-blue-400">
                      {typeof window !== 'undefined' && localStorage.getItem('language') === 'BM' ? p.label.bm : p.label.en}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-[1.5rem] p-6 hidden md:block">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> <T en="Pro Tip" bm="Petua Pro" />
            </h3>
            <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
              <T en="You can use **Markdown** syntax for bold text, bullet points, and more. The preview will render these automatically." bm="Anda boleh menggunakan sintaks **Markdown** untuk teks tebal, senarai bulet, dan banyak lagi. Pratonton akan memaparkannya secara automatik." />
            </p>
          </div>

          <div className="sticky bottom-4 md:relative md:bottom-0 pt-4 md:pt-0">
             <button 
               onClick={handleSave}
               disabled={saving === (mode === "otp" ? "agreement_template_otp" : "agreement_template_saas")}
               className="w-full py-5 bg-zinc-900 hover:bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-2xl shadow-zinc-900/20 active:scale-[0.98] disabled:opacity-50"
             >
               {saving === (mode === "otp" ? "agreement_template_otp" : "agreement_template_saas") ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               <T en={`Save ${mode.toUpperCase()} Template`} bm={`Simpan Templat ${mode.toUpperCase()}`} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
