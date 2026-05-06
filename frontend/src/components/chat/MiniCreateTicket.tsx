"use client";

import { useState, useEffect } from "react";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { T } from "../Translate";
import { useLanguage } from "../providers/LanguageProvider";
import { translateError } from "@/utils/error-translator";

export default function MiniCreateTicket({ 
  onCreated, 
  onCancel 
}: { 
  onCreated: (newTicket: any) => void;
  onCancel: () => void;
}) {
  const { lang } = useLanguage();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("BUG");
  const [projectId, setProjectId] = useState<string>("");
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setProjects(arr);
        if (arr.length > 0) setProjectId(arr[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      
      const res = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        setAttachments(prev => [...prev, data.files[0]]);
        toast.success(lang === "EN" ? "Image attached!" : "Imej dilampirkan!");
      } else {
        throw new Error("No URL returned from backend.");
      }
    } catch (error: any) {
      toast.error(translateError(error.message || "Failed to upload image", lang));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !projectId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          title,
          description: desc,
          type_: type,
          attachment_urls: attachments
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Creation failed");
      }
      const data = await res.json();
      toast.success(lang === "EN" ? "Ticket created!" : "Tiket dicipta!");
      onCreated(data); // Returns the newly created ticket to ChatWidget
    } catch (err: any) {
      toast.error(translateError(err.message || "An error occurred", lang));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center text-zinc-500">
        <AlertCircle size={36} className="mb-4 text-zinc-300" />
        <p className="text-sm font-bold text-zinc-900 mb-2"><T en="No Active Projects" bm="Tiada Projek Aktif" /></p>
        <p className="text-xs leading-relaxed"><T en="You must have an active project assigned to your account in order to open a support ticket." bm="Anda mesti mempunyai projek aktif yang ditugaskan ke akaun anda untuk membuka tiket sokongan." /></p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="px-6 py-4 bg-white border-b border-zinc-100 flex items-center shadow-sm z-10 w-full flex-shrink-0">
        <h3 className="font-black tracking-tight text-[13px] text-zinc-900 uppercase"><T en="Create New Ticket" bm="Cipta Tiket Baharu" /></h3>
      </div>
      
      <div className="flex-1 overflow-y-auto w-full">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block"><T en="Select Project" bm="Pilih Projek" /></label>
              <select 
                value={projectId} 
                onChange={e => setProjectId(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-zinc-900 outline-none transition-all shadow-sm"
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block"><T en="Issue Category" bm="Kategori Isu" /></label>
              <div className="flex gap-3 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100">
                <button type="button" onClick={() => setType('BUG')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${type === 'BUG' ? 'bg-white text-red-600 shadow-sm border border-zinc-200/50' : 'text-zinc-400 hover:text-zinc-600'}`}><T en="Report Bug" bm="Lapor Ralat Sistem" /></button>
                <button type="button" onClick={() => setType('FEATURE')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${type === 'FEATURE' ? 'bg-white text-indigo-600 shadow-sm border border-zinc-200/50' : 'text-zinc-400 hover:text-zinc-600'}`}><T en="Request Feature" bm="Mohon Fungsi Sistem" /></button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block"><T en="Ticket Title" bm="Tajuk Tiket" /></label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={lang === "EN" ? "Summary of the issue..." : "Ringkasan isu ini..."} className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-zinc-900 outline-none transition-all shadow-sm placeholder:text-zinc-400" />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block"><T en="Description Details" bm="Butiran Penerangan" /></label>
              <textarea required value={desc} onChange={e => setDesc(e.target.value)} placeholder={lang === "EN" ? "Please elaborate on the situation..." : "Sila jelaskan keadaan situasi dengan lebih lanjut..."} rows={4} className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-zinc-900 outline-none transition-all shadow-sm resize-none placeholder:text-zinc-400 leading-relaxed" />
            </div>

            <div>
               <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block"><T en="Attachments (Optional)" bm="Lampiran (Pilihan)" /></label>
               <label className="flex flex-col items-center justify-center w-full bg-zinc-50/50 border border-dashed border-zinc-300 rounded-xl p-4 text-sm cursor-pointer hover:bg-zinc-100 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-zinc-100 flex items-center justify-center mb-3 group-hover:-translate-y-1 transition-transform">
                    {uploading ? <Loader2 size={18} className="animate-spin text-zinc-400" /> : <Upload size={18} className="text-zinc-500" />}
                  </div>
                  <span className="text-xs font-bold text-zinc-600">{uploading ? <T en="Uploading securely..." bm="Memuat naik dengan selamat..." /> : <T en="Click or tap to upload evidence" bm="Klik atau ketik untuk muat naik bukti" />}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
               </label>
               
               {attachments.length > 0 && (
                 <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                   {attachments.map((url, i) => (
                      <div key={i} className="w-12 h-12 rounded-lg border border-zinc-200 overflow-hidden flex-shrink-0 relative">
                        <img src={url} className="w-full h-full object-cover" alt="upload" />
                      </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </form>
      </div>
      
      <div className="p-5 bg-white border-t border-zinc-100 w-full flex-shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
         <button onClick={handleSubmit} disabled={submitting || !title || !desc} className="w-full bg-zinc-900 text-white disabled:bg-zinc-200 disabled:text-zinc-400 font-bold tracking-wide rounded-xl p-3.5 text-xs uppercase flex items-center justify-center hover:bg-black active:scale-[0.98] transition-all shadow-md">
                       {submitting ? <><Loader2 size={16} className="animate-spin mr-2" /> <T en="Creating Ticket..." bm="Mencipta Tiket..." /></> : <T en="Launch Ticket" bm="Lancar Tiket" />}

         </button>
      </div>
    </div>
  );
}
