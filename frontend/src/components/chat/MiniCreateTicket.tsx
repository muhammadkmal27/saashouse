"use client";

import { useState, useEffect } from "react";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function MiniCreateTicket({ 
  onCreated, 
  onCancel 
}: { 
  onCreated: (newTicket: any) => void;
  onCancel: () => void;
}) {
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
        toast.success("Image attached!");
      } else {
        throw new Error("No URL returned from backend.");
      }
    } catch (error) {
      toast.error("Failed to upload image");
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

      if (!res.ok) throw new Error("Creation failed");
      const data = await res.json();
      toast.success("Ticket created!");
      onCreated(data); // Returns the newly created ticket to ChatWidget
    } catch (err) {
      toast.error("An error occurred");
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
        <p className="text-sm font-bold text-zinc-900 dark:text-white mb-2">No Active Projects</p>
        <p className="text-xs leading-relaxed">You must have an active project assigned to your account in order to open a support ticket.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-950">
      <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center shadow-sm z-10 w-full flex-shrink-0">
        <h3 className="font-black tracking-tight text-[13px] text-zinc-900 dark:text-zinc-100 uppercase">Create New Ticket</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto w-full">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 block">Select Project</label>
              <select 
                value={projectId} 
                onChange={e => setProjectId(e.target.value)}
                className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-zinc-900 dark:ring-zinc-100 outline-none transition-all shadow-sm"
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 block">Issue Category</label>
              <div className="flex gap-3 bg-zinc-50 dark:bg-zinc-900/30 p-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                <button type="button" onClick={() => setType('BUG')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${type === 'BUG' ? 'bg-white dark:bg-zinc-800 text-red-600 shadow-sm border border-zinc-200/50 dark:border-zinc-700' : 'text-zinc-400 hover:text-zinc-600'}`}>Report Bug</button>
                <button type="button" onClick={() => setType('FEATURE')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${type === 'FEATURE' ? 'bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm border border-zinc-200/50 dark:border-zinc-700' : 'text-zinc-400 hover:text-zinc-600'}`}>Request Feature</button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 block">Ticket Title</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Summary of the issue..." className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-zinc-900 dark:ring-zinc-100 outline-none transition-all shadow-sm placeholder:text-zinc-400" />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 block">Description Details</label>
              <textarea required value={desc} onChange={e => setDesc(e.target.value)} placeholder="Please elaborate on the situation..." rows={4} className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-zinc-900 dark:ring-zinc-100 outline-none transition-all shadow-sm resize-none placeholder:text-zinc-400 leading-relaxed" />
            </div>

            <div>
               <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 block">Attachments (Optional)</label>
               <label className="flex flex-col items-center justify-center w-full bg-zinc-50/50 dark:bg-zinc-900/30 border border-dashed border-zinc-300 dark:border-zinc-700/60 rounded-xl p-4 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center justify-center mb-3 group-hover:-translate-y-1 transition-transform">
                    {uploading ? <Loader2 size={18} className="animate-spin text-zinc-400" /> : <Upload size={18} className="text-zinc-500" />}
                  </div>
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{uploading ? 'Uploading securely...' : 'Click or tap to upload evidence'}</span>
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
      
      <div className="p-5 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 w-full flex-shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
         <button onClick={handleSubmit} disabled={submitting || !title || !desc} className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 font-bold tracking-wide rounded-xl p-3.5 text-xs uppercase flex items-center justify-center hover:bg-black dark:hover:bg-white active:scale-[0.98] transition-all shadow-md">
           {submitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Creating Ticket...</> : 'Launch Ticket'}
         </button>
      </div>
    </div>
  );
}
