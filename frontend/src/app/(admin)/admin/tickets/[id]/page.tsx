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
    Mail,
    ArrowRight
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
    creator_email?: string;
    type_: "BUG" | "FIX" | "FEATURE";
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    title: string;
    description: string;
    attachment_urls: string[];
    created_at: string;
};

export default function AdminTicketDetailPage() {
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
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const { lastEvent } = useSocket();
    
    const chatEndRef = useRef<HTMLDivElement>(null);

    const fetchTicketData = async () => {
        try {
            const res = await fetch(`/api/requests?t=${Date.now()}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                const found = data.find((t: any) => t.id === id);
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

    // Live Socket Array Listener (Chat)
    useEffect(() => {
        if (lastEvent?.type === 'NewComment' && lastEvent.request_id === id) {
            setComments(prev => {
                if (prev.some(c => c.id === lastEvent.comment.id)) return prev;
                return [...prev, lastEvent.comment];
            });

            // Omega-Sync: Auto-mark as read if we are on the page
            fetch(`/api/requests/${id}/comments/read`, { method: "PATCH", credentials: "include" }).catch(console.error);
        }
    }, [lastEvent, id]);

    // Omega-Sync: Read Synchronization Listener
    useEffect(() => {
        if (lastEvent?.type === 'ReadSync' && lastEvent.request_id === id) {
            console.log("Omega-Sync: Read synchronization pulse received in Admin Page");
            fetchComments();
        }
    }, [lastEvent, id]);

    const { sendMessage } = useSocket();

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            setUpdatingStatus(true);
            console.log("Admin: Requesting status update to", newStatus);
            const res = await fetch(`/api/admin/requests/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
                credentials: "include"
            });
            
            if (res.ok) {
                console.log("Admin: Status update success, updating local state...");
                // Step 1: Immediate local response
                setTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
                
                // Step 2: Omega-Pulse (Manual WebSocket Trigger)
                sendMessage({ type: "StatusPulse", request_id: id });
                
                // Step 3: Redundant refresh fallback
                fetchTicketData();
                fetchComments();
                
                toast.success(`Ticket marked as ${newStatus}`);
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error("Admin: Status update failed server-side:", errData);
                toast.error("Server rejected status update.");
            }
        } catch (err) {
            console.error("Admin: Status update fetch error:", err);
            toast.error("Failed to connect to server.");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch(`/api/assets/upload`, { 
                method: "POST", 
                body: formData, 
                credentials: "include" 
            });
            const data = await res.json();
            if (res.ok && data.files?.length > 0) {
                setCommentData(prev => ({ 
                    ...prev, 
                    attachment_urls: [...prev.attachment_urls, data.files[0]] 
                }));
                toast.success("File uploaded.");
            }
        } catch(_) {
            toast.error("Upload failed.");
        } finally { 
            setUploading(false); 
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentData.message.trim() && commentData.attachment_urls.length === 0) return;
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
                // We rely on WebSocket for real-time addition
                toast.success("Message sent.");
            }
        } catch(_) {
            toast.error("Send failed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-zinc-400" /></div>;
    if (!ticket) return <div className="p-12 text-center text-zinc-400 italic">Ticket not found.</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-zinc-100 pb-8">
                <div className="space-y-4">
                    <Link 
                        href="/admin/tickets"
                        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 font-black uppercase tracking-widest text-[10px] group mb-4"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Admin Console / Tickets
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ticket.type_ === 'BUG' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {ticket.type_ === 'BUG' ? <Bug className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900">{ticket.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {ticket.status !== 'CLOSED' && (
                        <button 
                            onClick={() => handleUpdateStatus('CLOSED')}
                            disabled={updatingStatus}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl px-6 py-3 text-xs font-black uppercase transition-colors shadow-sm disabled:opacity-50"
                        >
                            {updatingStatus ? "Closing..." : "Close Ticket"}
                        </button>
                    )}
                    <select 
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        disabled={updatingStatus}
                        className="bg-white border border-zinc-200 rounded-2xl px-6 py-3 text-xs font-black uppercase outline-none focus:ring-2 ring-zinc-900 transition-all cursor-pointer"
                        value={ticket.status}
                    >
                        <option value="OPEN">Mark Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    {/* Client Report */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-xl shadow-zinc-200/40">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center">
                                <UserCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black text-sm text-zinc-900 uppercase tracking-widest">Client Message</p>
                                <p className="text-xs text-zinc-400">{ticket.creator_email} • {new Date(ticket.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div className="prose prose-zinc max-w-none mb-8 text-zinc-600 font-medium leading-relaxed">
                            <ReactMarkdown>
                                {ticket.description}
                            </ReactMarkdown>
                        </div>

                        {ticket.attachment_urls && ticket.attachment_urls.length > 0 && (
                            <div className="flex flex-wrap gap-3 pt-6 border-t border-zinc-50">
                                {ticket.attachment_urls.map((url, i) => (
                                    <button 
                                        type="button"
                                        key={i} 
                                        onClick={() => setPreviewImage(url)} 
                                        className="w-24 h-24 rounded-2xl border border-zinc-100 overflow-hidden hover:ring-2 ring-zinc-900 transition-all bg-zinc-50 cursor-zoom-in"
                                    >
                                        <img src={url} className="w-full h-full object-cover" alt="attachment" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat Thread */}
                    <div className="space-y-6 relative">
                        <div className="absolute left-10 top-0 bottom-0 w-px bg-zinc-100 -z-10" />
                        
                        {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-4">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 ${comment.user_id === ticket.created_by ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-900 text-white'}`}>
                                    {comment.user_id === ticket.created_by ? <UserCircle2 className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
                                </div>
                                
                                <div className="flex-1 bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-lg shadow-zinc-200/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400">
                                            {comment.user_id === ticket.created_by ? 'Client' : 'You (Admin)'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-medium text-zinc-300">
                                                {new Date(comment.created_at).toLocaleTimeString()}
                                            </p>
                                            {comment.user_id !== ticket.created_by && comment.is_read && (
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Read</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="prose prose-sm prose-zinc text-zinc-600 font-medium leading-relaxed">
                                        <ReactMarkdown>
                                            {comment.message}
                                        </ReactMarkdown>
                                    </div>
                                    
                                    {comment.attachment_urls && comment.attachment_urls.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-50">
                                            {comment.attachment_urls.map((url, i) => (
                                                <button 
                                                    type="button"
                                                    key={i} 
                                                    onClick={() => setPreviewImage(url)} 
                                                    className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-50 bg-zinc-50 cursor-zoom-in"
                                                >
                                                    <img src={url} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Admin Reply Box */}
                    {ticket.status !== 'CLOSED' ? (
                        <div className="mt-8 bg-zinc-900 rounded-[2.5rem] p-4 shadow-xl shadow-zinc-900/40">
                            <form onSubmit={handleSendComment} className="flex flex-col gap-3">
                                <textarea 
                                    value={commentData.message}
                                    onChange={(e) => setCommentData(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Reply to client... (Markdown supported)"
                                    className="w-full px-6 py-4 bg-zinc-800 rounded-2xl border-none outline-none focus:ring-1 ring-zinc-700 font-medium text-sm text-white placeholder:text-zinc-500 resize-none"
                                    rows={2}
                                />
                                
                                <div className="flex items-center justify-between gap-3 px-2">
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 p-3 text-zinc-500 hover:text-white transition-colors cursor-pointer">
                                            <input type="file" className="hidden" onChange={handleFileUpload} />
                                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                        </label>
                                        {commentData.attachment_urls.length > 0 && (
                                            <div className="flex gap-1">
                                                {commentData.attachment_urls.map((url, i) => (
                                                    <div key={i} className="relative group">
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                                                            <img src={url} className="w-full h-full object-cover" />
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setCommentData(prev => ({ ...prev, attachment_urls: prev.attachment_urls.filter((_, idx) => idx !== i) }))}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                        disabled={submitting || (!commentData.message.trim() && commentData.attachment_urls.length === 0)}
                                        className="px-8 py-3 bg-white text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-zinc-100 transition-all disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Send Response</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="mt-8 bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-8 text-center">
                             <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                             <p className="text-sm font-black text-zinc-900 uppercase tracking-widest">This ticket is CLOSED</p>
                             <p className="text-xs text-zinc-400 font-medium">No further responses can be sent from this portal.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Context */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-xl shadow-zinc-200/40">
                        <h3 className="text-xl font-black text-zinc-900 mb-6 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-indigo-500" /> Client Info
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Email Address</p>
                                <p className="text-sm font-bold text-zinc-900 break-all">{ticket.creator_email}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Ticket ID</p>
                                <p className="text-[10px] font-mono font-medium text-zinc-400">{ticket.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-50 rounded-[2.5rem] p-8 border border-zinc-200/50">
                        <h3 className="text-xl font-black text-zinc-900 mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-zinc-400" /> Timeline
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Created</span>
                                <span className="text-xs font-bold text-zinc-900">{new Date(ticket.created_at).toISOString().split('T')[0]}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Update</span>
                                <span className="text-xs font-bold text-zinc-900">{new Date().toISOString().split('T')[0]}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Image Zoom Lightbox Overlay */}
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
