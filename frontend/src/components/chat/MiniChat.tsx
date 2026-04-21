"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, Paperclip, X } from "lucide-react";
import { useSocket } from "../providers/SocketProvider";

export default function MiniChat({ 
  ticketId, 
  userProfile,
  ticket 
}: { 
  ticketId: string; 
  userProfile: any; 
  ticket?: any;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const { lastEvent } = useSocket();

  // Memuatkan Perbualan Apabila Dibuka
  useEffect(() => {
    fetch(`/api/requests/${ticketId}/comments`)
      .then(res => res.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
        // Tandakan mesej sebagai telah dibaca
        fetch(`/api/requests/${ticketId}/comments/read`, { method: "PATCH" });
      })
      .catch(() => setLoading(false));
  }, [ticketId]);

  // Omega-Sync: Universal Real-time Refetch
  useEffect(() => {
    const handleGlobalUpdate = () => {
      console.log("Omega-Sync: MiniChat refreshing messages...");
      fetch(`/api/requests/${ticketId}/comments?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
            setMessages(Array.isArray(data) ? data : []);
        });
    };

    window.addEventListener('global-ticket-update' as any, handleGlobalUpdate);
    return () => window.removeEventListener('global-ticket-update' as any, handleGlobalUpdate);
  }, [ticketId]);

  // Direct Status Interceptor (Alpha-Sync)
  useEffect(() => {
    if (lastEvent?.type === 'TicketStatusUpdate' && lastEvent.request_id === ticketId) {
       if (lastEvent.status === 'CLOSED') {
          console.log("Alpha-Sync: Ticket Closed signal caught in MiniChat!");
          // Force prompt refresh of the parent ticket data
          window.dispatchEvent(new CustomEvent('global-ticket-update'));
       }
    }
  }, [lastEvent, ticketId]);

  // Pendengar Automatik Soket Real-time
  useEffect(() => {
    if (lastEvent?.type === 'NewComment' && lastEvent.request_id === ticketId) {
      setMessages(prev => {
        // Elak Duplikasi
        if (prev.some(m => m.id === lastEvent.comment.id)) return prev;
        
        // If it's a closure system message, force refresh
        if (lastEvent.comment.message.includes("CLOSED")) {
             window.dispatchEvent(new CustomEvent('global-ticket-update'));
        }
        
        return [...prev, lastEvent.comment];
      });
      // Maklumkan Backend kita Sedang Membaca
      fetch(`/api/requests/${ticketId}/comments/read`, { method: "PATCH" });
    }
  }, [lastEvent, ticketId]);


  // Tatal Menjunam ke Mesej Terbaru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/assets/upload", {
        method: "POST",
        body: uploadData
      });
      const result = await res.json();
      if (res.ok && result.files?.length > 0) {
        setAttachments(prev => [...prev, result.files[0]]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || sending) return;
    setSending(true);

    try {
      const res = await fetch(`/api/requests/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, attachment_urls: attachments })
      });
      
      if (res.ok) {
        setInput("");
        setAttachments([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // Omega-Sync: Read Synchronization Listener
  useEffect(() => {
    if (lastEvent?.type === 'ReadSync' && lastEvent.request_id === ticketId) {
      console.log("Omega-Sync: Read synchronization pulse received in MiniChat");
      fetch(`/api/requests/${ticketId}/comments?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
            setMessages(Array.isArray(data) ? data : []);
        });
    }
  }, [lastEvent, ticketId]);

  if (loading) {
    return <div className="flex px-4 py-10 justify-center items-center flex-1 h-full"><Loader2 className="animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-zinc-900 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto w-full p-5 space-y-5">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
             <MessageCircle size={32} className="mb-4 text-zinc-400" />
             <p className="text-xs text-center text-zinc-500 font-medium">This is the start of your request conversation.</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMine = msg.user_id === userProfile?.user?.id;
          return (
            <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'} w-full`}>
               <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm shadow-sm ${isMine ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-br-sm' : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-sm'}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                {msg.attachment_urls && msg.attachment_urls.map((url: string, uidx: number) => (
                   <button 
                     key={uidx} 
                     onClick={() => setPreviewImage(url)} 
                     className="block mt-3 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 opacity-90 hover:opacity-100 transition-opacity w-full cursor-zoom-in"
                   >
                     <img src={url} className="w-full h-auto max-h-32 object-cover" />
                   </button>
                ))}
                <div className="flex items-center justify-end space-x-2 mt-1">
                  <p className={`text-[9px] font-medium tracking-wide ${isMine ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400'}`}>
                    {new Date(msg.created_at).toISOString()}
                  </p>
                  {isMine && msg.is_read && (
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Read</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-1" />
      </div>

      {ticket?.status !== 'CLOSED' ? (
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 flex-shrink-0 flex items-center justify-between gap-3 relative shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10 flex-wrap">
          {attachments.length > 0 && (
             <div className="w-full flex gap-3 pb-3 px-1">
               {attachments.map((url, idx) => (
                  <div key={idx} className="relative group">
                        <img src={url} className="w-full h-full object-cover" />

                    <button 
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                        disabled={sending}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md z-20 hover:scale-110 active:scale-95"
                        title="Remove attachment"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
               ))}
             </div>
          )}
          <label className="cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading || sending} />
          </label>
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl px-4 py-3 flex items-center relative border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all">
             <input 
               type="text"
               value={input}
               onChange={e => setInput(e.target.value)}
               placeholder="Type your message..."
               className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-zinc-400 text-zinc-900 dark:text-white"
               disabled={sending || uploading}
             />
          </div>
          <button type="submit" disabled={(!input.trim() && attachments.length === 0) || sending} className="text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 p-3 rounded-xl disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 hover:bg-black active:scale-95 transition-all shadow-sm">
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      ) : (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-center flex-shrink-0">
          <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500">Notice</p>
          <p className="text-xs text-zinc-500 font-medium">This ticket has been closed.</p>
        </div>
      )}

      {/* Image Zoom Lightbox Overlay */}
      {previewImage && (
        <div 
          className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
          >
            <X size={20} />
          </button>
          <div className="relative max-w-full max-h-full">
             <img 
               src={previewImage} 
               className="max-w-full max-h-full object-contain rounded border border-white/10 shadow-2xl" 
               onClick={(e) => e.stopPropagation()}
               alt="Enlarged Preview"
             />
          </div>
        </div>
      )}
    </div>
  );
}
