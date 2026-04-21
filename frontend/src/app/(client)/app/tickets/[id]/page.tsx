"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    Send, 
    Paperclip, 
    X, 
    Loader2,
    Bug,
    Zap,
    MessageSquare,
    Clock,
    CheckCircle2,
    Calendar,
    UserCircle2,
    ShieldCheck,
    FileText
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/SocketProvider";

type Comment = {
    id: string;
    request_id: string;
    user_id: string;
    message: string;
    attachment_urls: string[];
    is_read: boolean;
    created_at: string;
};

type Ticket = {
    id: string;
    project_id: string;
    created_by: string;
    type_: "BUG" | "FIX" | "FEATURE";
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    title: string;
    description: string;
    attachment_urls: string[];
    created_at: string;
};

export default function TicketDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentData, setCommentData] = useState({
        message: "",
        attachment_urls: [] as string[]
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const { lastEvent } = useSocket();
    
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) {
            fetchTicketData();
            fetchComments();
            // Omega-Sync: Mark as read on mount
            fetch(`/api/requests/${id}/comments/read`, { 
                method: "PATCH",
                credentials: "include"
            }).catch(console.error);
        }
    }, [id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    // Omega-Sync: Master Real-time Signal Listener
    useEffect(() => {
        const handleGlobalUpdate = () => {
            console.log("Omega-Sync: Global update signal received, refreshing...");
            fetchTicketData();
            fetchComments();
        };

        window.addEventListener('global-ticket-update' as any, handleGlobalUpdate);
        return () => window.removeEventListener('global-ticket-update' as any, handleGlobalUpdate);
    }, [id]);

    // Live Event Listener (Omega-Sync Hardened)
    useEffect(() => {
        if (!lastEvent) return;

        // Condition 1: Direct Status Update Signal or Manual Pulse
        if ((lastEvent.type === 'TicketStatusUpdate' || lastEvent.type === 'StatusPulse') && lastEvent.request_id === id) {
            console.log("Omega-Sync: Received Pulse/Update signal", lastEvent);
            toast.info("Status focus: Ticket state has changed.");
            fetchTicketData();
        }

        // Condition 2: Content/System Message Signal
        if (lastEvent.type === 'NewComment' && lastEvent.request_id === id) {
            console.log("Omega-Sync: Received NewComment signal", lastEvent);
            setComments(prev => {
                if (prev.some(c => c.id === lastEvent.comment.id)) return prev;
                return [...prev, lastEvent.comment];
            });

            if (lastEvent.comment.message.includes("CLOSED") || lastEvent.comment.message.includes("[SYSTEM]")) {
                console.log("Omega-Sync: System closure detected in comment string.");
                toast.success("Ticket closed by admin.");
                fetchTicketData();
            }

            fetch(`/api/requests/${id}/comments/read`, { method: "PATCH", credentials: "include" }).catch(console.error);
        }
    }, [lastEvent, id]);

    // Omega-Sync: Read Synchronization Listener
    useEffect(() => {
        if (lastEvent?.type === 'ReadSync' && lastEvent.request_id === id) {
            console.log("Omega-Sync: Read synchronization pulse received in Client Page");
            fetchComments();
        }
    }, [lastEvent, id]);

    const fetchTicketData = async () => {
        try {
            const res = await fetch(`/api/requests?t=${Date.now()}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const found = data.find((t: any) => t.id === id);
                console.log("Omega-Sync: TicketDetail data refreshed via cache-buster");
                setTicket(found);
            }
        } catch (err) {
            console.error("Failed to load ticket", err);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/requests/${id}/comments?t=${Date.now()}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (err) {
            console.error("Failed to load comments", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append("file", file);

        try {
            setUploading(true);
            const res = await fetch(`/api/assets/upload`, {
                method: "POST",
                body: uploadData,
                credentials: "include"
            });
            const result = await res.json();
            if (res.ok && result.files && result.files.length > 0) {
                setCommentData(prev => ({
                    ...prev,
                    attachment_urls: [...prev.attachment_urls, result.files[0]]
                }));
                toast.success("File uploaded successfully.");
            }
        } catch (err) {
            toast.error("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentData.message.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/requests/${id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(commentData),
                credentials: "include"
            });

            if (res.ok) {
                setCommentData({ message: "", attachment_urls: [] });
                // Rely on WebSocket for real-time addition
                toast.success("Reply sent.");
            } else {
                toast.error("Failed to send reply.");
            }
        } catch (err) {
            toast.error("Network error.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-violet-600" /></div>;
    if (!ticket) return <div className="p-12 text-center text-slate-400 font-medium italic">Ticket not found.</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">
            {/* Main Background Purple Bloom */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-400/15 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-violet-300/15 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 pb-8 relative z-10 w-full mb-4">
                <div className="space-y-4 w-full">
                    <Link 
                        href="/app/tickets"
                        className="flex items-center gap-2 text-slate-400 hover:text-violet-600 font-black uppercase tracking-widest text-[10px] group mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Ticket List
                    </Link>
                    
                    <div className="flex items-center gap-4 w-full border-b pb-6 border-slate-50 mb-6">
                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shadow-lg shrink-0 ${ticket.type_ === 'BUG' ? 'bg-orange-50 text-orange-500 shadow-orange-500/10' : 'bg-violet-50 text-violet-600 shadow-violet-500/10'}`}>
                            {ticket.type_ === 'BUG' ? <Bug className="w-6 h-6" strokeWidth={2.5} /> : <Zap className="w-6 h-6 text-violet-600" strokeWidth={2.5} />}
                        </div>
                        <h1 className="text-[2.25rem] font-extrabold tracking-tight text-slate-900 leading-none truncate">{ticket.title}</h1>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 border border-slate-100/50 rounded-full text-[10px] uppercase tracking-widest">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {ticket.status.replace("_", " ")}
                        </div>
                        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 border border-slate-100/50 rounded-full text-[10px] uppercase tracking-widest">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Main Thread */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Original Request Card */}
                    <div className="bg-white/80 bg-gradient-to-br from-white to-violet-50/40 rounded-[2rem] p-8 lg:p-10 border border-violet-100/50 shadow-xl shadow-violet-100/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none -mr-10 -mt-10">
                            {ticket.type_ === 'BUG' ? <Bug className="w-64 h-64 text-orange-600" /> : <Zap className="w-64 h-64 text-violet-600" />}
                        </div>
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-12 h-12 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-violet-600/30 shrink-0">
                                <UserCircle2 className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="font-extrabold text-[12px] text-slate-900 uppercase tracking-widest mb-0.5">Original Post</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{new Date(ticket.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div className="prose max-w-none mb-8 text-slate-600 font-medium leading-relaxed">
                            <ReactMarkdown>
                                {ticket.description}
                            </ReactMarkdown>
                        </div>

                        {ticket.attachment_urls && ticket.attachment_urls.length > 0 && (
                            <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-50">
                                {ticket.attachment_urls.map((url, i) => (
                                    <button 
                                        type="button"
                                        key={i} 
                                        onClick={() => setPreviewImage(url)} 
                                        className="w-28 h-28 rounded-[1rem] border border-slate-100 overflow-hidden hover:ring-4 ring-violet-500/20 transition-all cursor-zoom-in shadow-sm hover:shadow-xl"
                                    >
                                        <img src={url} className="w-full h-full object-cover" alt="attachment" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Comments List */}
                    <div className="space-y-6 relative mt-10">
                        <div className="absolute left-[3.25rem] top-0 bottom-0 w-[2px] bg-gradient-to-b from-violet-200/80 via-violet-100/40 to-transparent -z-10" />
                        
                        {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-5 group">
                                <div className={`w-[4.5rem] h-[4.5rem] sm:w-[4.5rem] sm:h-[4.5rem] w-14 h-14 rounded-full flex shrink-0 items-center justify-center border-4 border-white shadow-md z-10 transition-transform group-hover:scale-105 duration-300 ${comment.user_id === ticket.created_by ? 'bg-slate-50 text-slate-400' : 'bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-violet-600/30'}`}>
                                    {comment.user_id === ticket.created_by ? <UserCircle2 className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                                </div>
                                
                                <div className={`flex-1 rounded-[2.5rem] p-6 lg:p-8 border shadow-xl overflow-hidden transition-all duration-300 ${comment.user_id === ticket.created_by ? 'bg-white border-slate-100 shadow-slate-200/30' : 'bg-gradient-to-br from-white to-violet-50/60 border-violet-100/50 shadow-violet-100/40 relative'}`}>
                                    {comment.user_id !== ticket.created_by && <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-violet-400/10 rounded-full blur-[30px] pointer-events-none"></div>}
                                    <div className="flex items-center justify-between mb-5 relative z-10">
                                        <p className={`font-extrabold text-[10px] uppercase tracking-widest ${comment.user_id === ticket.created_by ? 'text-slate-400' : 'text-violet-600'}`}>
                                            {comment.user_id === ticket.created_by ? 'You' : 'Admin Response'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                {new Date(comment.created_at).toLocaleTimeString().replace(/(.*)\D\d+/, '$1')}
                                            </p>
                                            {comment.user_id === ticket.created_by && comment.is_read && (
                                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-2 bg-emerald-50 px-2.5 py-1 rounded-full">Read</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="prose prose-slate text-sm text-slate-600 font-medium leading-relaxed max-w-none">
                                        <ReactMarkdown>
                                            {comment.message}
                                        </ReactMarkdown>
                                    </div>
                                    
                                    {comment.attachment_urls && comment.attachment_urls.length > 0 && (
                                        <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-slate-50">
                                            {comment.attachment_urls.map((url, i) => (
                                                <button 
                                                    type="button" 
                                                    key={i} 
                                                    onClick={() => setPreviewImage(url)} 
                                                    className="w-16 h-16 rounded-[1rem] overflow-hidden border border-slate-100 cursor-zoom-in hover:ring-2 ring-violet-500/20 transition-all shadow-sm group"
                                                >
                                                    <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Reply Box Conditional */}
                    {ticket.status !== 'CLOSED' ? (
                        <div className="mt-10 bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-4 lg:p-5 border border-slate-100 shadow-xl shadow-slate-200/30">
                            <form onSubmit={handleSendComment} className="flex flex-col gap-3">
                                <textarea 
                                    value={commentData.message}
                                    onChange={(e) => setCommentData(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Write your reply here... (Markdown supported)"
                                    className="w-full px-6 pt-5 pb-8 bg-slate-50/50 rounded-[1.5rem] border border-slate-100/50 outline-none focus:ring-4 ring-violet-500/10 focus:border-violet-200 font-medium text-sm text-slate-800 resize-none transition-all placeholder:text-slate-400"
                                    rows={2}
                                />
                                
                                <div className="flex items-center justify-between gap-3 px-2">
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 p-3 text-slate-400 hover:text-violet-600 transition-colors cursor-pointer group">
                                            <input type="file" className="hidden" onChange={handleFileUpload} />
                                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                        </label>
                                        {commentData.attachment_urls.length > 0 && (
                                            <div className="flex gap-1.5 flex-wrap">
                                                {commentData.attachment_urls.map((url, i) => (
                                                    <div key={i} className="relative group">
                                                        <div className="w-10 h-10 rounded-[10px] bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                                            <img src={url} className="w-full h-full object-cover" />
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setCommentData(prev => ({ ...prev, attachment_urls: prev.attachment_urls.filter((_, idx) => idx !== i) }))}
                                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                        >
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={submitting || !commentData.message.trim()}
                                        className="px-8 py-3.5 bg-violet-600 text-white rounded-full font-extrabold uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-violet-700 transition-all disabled:opacity-50 outline-none focus:ring-4 ring-violet-500/20 shadow-[0_8px_30px_rgba(124,58,237,0.35)]"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Reply</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="mt-8 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 text-center shadow-lg shadow-slate-200/20">
                            <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">Notice</p>
                            <p className="text-xs text-slate-500 font-medium">This ticket has been officially closed.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6 relative z-10 w-full lg:max-w-sm lg:ml-auto">
                    <div className="bg-[#18181A] rounded-[2rem] p-8 lg:p-10 text-white relative overflow-hidden group shadow-2xl shadow-violet-900/10">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-violet-600/30 rounded-full blur-[60px] pointer-events-none group-hover:bg-violet-600/40 transition-colors"></div>
                        <div className="relative z-10">
                            <h3 className="text-[1.3rem] font-black mb-8 flex items-center gap-3 tracking-tight">
                                <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-violet-400" />
                                </div>
                                Ticket Status
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Current Phase</span>
                                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-violet-400">{ticket.status.replace("_", " ")}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Priority</span>
                                    <span className={`text-[11px] font-extrabold uppercase tracking-widest ${ticket.type_ === 'BUG' ? 'text-orange-400' : 'text-violet-400'}`}>{ticket.type_ === 'BUG' ? 'High' : 'Medium'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/90 bg-gradient-to-br from-white to-violet-50/50 backdrop-blur-xl rounded-[2rem] p-8 lg:p-10 border border-violet-100/50 shadow-xl shadow-violet-100/40 relative overflow-hidden">
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-400/10 rounded-full blur-[40px] pointer-events-none"></div>
                        <h3 className="text-[1.3rem] font-black text-slate-900 mb-8 flex items-center gap-3 tracking-tight relative z-10">
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shadow-inner shadow-white">
                                <MessageSquare className="w-4 h-4 text-violet-600" />
                            </div>
                            Interaction Stats
                        </h3>
                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between pb-4 border-b border-violet-100/50">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-700">Total Replies</span>
                                <span className="text-xl font-black text-violet-900">{comments.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-700">Response Time</span>
                                <span className="text-[11px] font-extrabold text-violet-900 uppercase tracking-widest">~ 2 Hours</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Zoom Lightbox Overlay */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full backdrop-blur-md transition-colors shadow-2xl"
                        onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                    >
                        <X size={24} />
                    </button>
                    <div className="relative max-w-full max-h-full flex items-center justify-center">
                        <img 
                            src={previewImage} 
                            className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl border border-white/10 shadow-2xl" 
                            onClick={(e) => e.stopPropagation()}
                            alt="Enlarged Preview"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
