"use client";

import { useState, useEffect } from "react";
import { 
  FileText, Plus, Trash2, ChevronUp, ChevronDown, 
  Info, AlertCircle, Save, Loader2, Zap, Server 
} from "lucide-react";

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
    <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-100/60 p-10 space-y-8">
      <div className="flex items-center justify-between border-b border-zinc-50 pb-6">
        <div>
          <h2 className="text-lg font-black text-zinc-900 mb-1 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Agreement Templates
          </h2>
          <p className="text-sm text-zinc-400">
            Customize the clauses and sections for legal agreements.
          </p>
        </div>
        
        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button 
            onClick={() => handleToggleMode("otp")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === "otp" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Zap className="w-3 h-3" /> OTP Mode
          </button>
          <button 
            onClick={() => handleToggleMode("saas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === "saas" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Server className="w-3 h-3" /> SaaS Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Editor Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            {sections.map((section, idx) => (
              <div key={idx} className="group relative bg-zinc-50 border border-zinc-200 rounded-2xl p-6 transition-all hover:border-zinc-300">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Section {idx + 1}</span>
                    <input 
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(idx, "title", e.target.value)}
                      className="w-full bg-transparent text-sm font-black text-zinc-900 outline-none border-b border-transparent focus:border-zinc-300 pb-1"
                      placeholder="Section Title"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveSection(idx, "up")} className="p-1.5 hover:bg-zinc-200 rounded-md text-zinc-500"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveSection(idx, "down")} className="p-1.5 hover:bg-zinc-200 rounded-md text-zinc-500"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => removeSection(idx)} className="p-1.5 hover:bg-red-100 rounded-md text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <textarea 
                  value={section.content}
                  onChange={(e) => updateSection(idx, "content", e.target.value)}
                  className="w-full h-32 bg-white border border-zinc-200 rounded-xl p-4 text-sm font-medium text-zinc-600 outline-none focus:ring-2 ring-blue-100 resize-none transition-all"
                  placeholder="Enter section content here... You can use **Markdown** for styling."
                />
              </div>
            ))}
          </div>

          <button 
            onClick={addSection}
            className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Section
          </button>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-900 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> Available Placeholders
            </h3>
            <ul className="space-y-3">
              {[
                { key: "{{project_name}}", label: "Project Title" },
                { key: "{{client_name}}", label: "Client Full Name" },
                { key: "{{provider_name}}", label: "Your Company Name" },
                { key: "{{total_cost}}", label: "Total Project Cost" },
                { key: "{{deposit_amount}}", label: "Deposit / Monthly Fee" },
                { key: "{{balance_amount}}", label: "Final Balance Owed" },
                { key: "{{today}}", label: "Today's Date" },
              ].map((p) => (
                <li key={p.key} className="flex flex-col">
                  <code className="text-[11px] font-black text-blue-600">{p.key}</code>
                  <span className="text-[10px] font-medium text-blue-400">{p.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Pro Tip
            </h3>
            <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
              You can use **Markdown** syntax for bold text, bullet points, and more. 
              The preview on the client side will render these styles automatically.
            </p>
          </div>

          <div className="pt-4">
             <button 
               onClick={handleSave}
               disabled={saving === (mode === "otp" ? "agreement_template_otp" : "agreement_template_saas")}
               className="w-full py-4 bg-zinc-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/10"
             >
               {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Save {mode.toUpperCase()} Template
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
