"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, ChevronRight, User, CirclePlus } from "lucide-react";
import { T } from "../Translate";
import { useSocket } from "../providers/SocketProvider";
import { useRouter } from "next/navigation";
import MiniChat from "./MiniChat";
import MiniCreateTicket from "./MiniCreateTicket";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { isConnected, unreadCount, setUnreadCount, lastEvent } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        fetch("/api/me").then(res => res.ok ? res.json() : null),
        fetch("/api/requests").then(res => res.ok ? res.json() : [])
      ]).then(([profileData, reqData]) => {
        setUserProfile(profileData);
        const arr = Array.isArray(reqData) ? reqData : [];
        setTickets(arr);
        
        // Auto-select logic for Client
        if (profileData?.user?.role !== 'ADMIN' && arr.length === 1) {
          setActiveTicketId(arr[0].id);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isOpen]);

  // Omega-Sync: Universal Real-time Refetch
  useEffect(() => {
    const handleGlobalUpdate = () => {
      fetch(`/api/requests?t=${Date.now()}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          console.log("Omega-Sync: ChatWidget data refreshed via cache-buster");
          setTickets(Array.isArray(data) ? data : []);
        });
    };

    window.addEventListener('global-ticket-update' as any, handleGlobalUpdate);
    return () => window.removeEventListener('global-ticket-update' as any, handleGlobalUpdate);
  }, []);

  if (!loading && !userProfile && isOpen) {
    // Failsafe hiding if somehow opened but not authenticated
    return null;
  }

  const renderContent = () => {
    if (loading) return <div className="p-10 text-center w-full text-sm text-zinc-500 animate-pulse mt-10"><T en="Loading connection..." bm="Memuatkan sambungan..." /></div>;

    // ADMIN VIEW
    if (userProfile?.user?.role === 'ADMIN') {
      if (tickets.length === 0) return <div className="p-10 text-center w-full text-sm text-zinc-500 mt-10"><T en="No active tickets." bm="Tiada tiket aktif." /></div>;
      return (
        <div className="flex-1 overflow-y-auto w-full h-full">
          {tickets.map(t => (
            <div 
              key={t.id} 
              onClick={() => { setIsOpen(false); router.push(`/admin/tickets/${t.id}`); }}
              className="p-4 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer flex items-center justify-between transition-colors"
            >
               <div className="w-full pr-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.creator_email}</h4>
                    <p className="text-xs text-zinc-500 truncate">{t.title}</p>
                  </div>
                  {t.unread_count > 0 && (
                     <div className="bg-red-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                        {t.unread_count}
                     </div>
                  )}
               </div>
               <ChevronRight size={16} className="text-zinc-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      );
    }

    // CLIENT VIEW
    if (tickets.length === 0) {
      return <MiniCreateTicket onCreated={(t) => { setTickets([t]); setActiveTicketId(t.id); }} onCancel={() => setIsOpen(false)} />;
    }

    if (activeTicketId) {
      const activeTicket = tickets.find(t => t.id === activeTicketId);
      return <MiniChat ticketId={activeTicketId} userProfile={userProfile} ticket={activeTicket} />;
    }

    // Client Multi-tickets View
    return (
      <div className="flex-1 overflow-y-auto w-full h-full">
        {tickets.map(t => (
          <div 
            key={t.id} 
            onClick={() => setActiveTicketId(t.id)}
            className="p-4 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer flex items-center justify-between transition-colors"
          >
             <div className="w-full pr-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 mb-1">
                    <T en={t.type_} bm={t.type_ === 'BUG' ? 'PEPIGAT' : 'CIRI'} />
                  </p>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{t.title}</h4>
                </div>
                {t.unread_count > 0 && (
                  <div className="bg-red-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                     {t.unread_count}
                  </div>
                )}
             </div>
             <ChevronRight size={16} className="text-zinc-300 flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      {isOpen ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-[350px] h-[580px] flex flex-col overflow-hidden transition-all duration-300 transform scale-100 opacity-100 animate-in fade-in slide-in-from-bottom-5">
           <div className="bg-zinc-900 dark:bg-black text-white p-4 flex justify-between items-center cursor-pointer shadow-sm relative z-10 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-400 border-2 border-emerald-900" : "bg-red-500 animate-pulse"}`}></div>
                <h3 className="font-semibold text-sm tracking-wide">
                  {userProfile?.user?.role === 'ADMIN' ? <T en="Client Inbox" bm="Peti Masuk Pelanggan" /> : (activeTicketId && tickets.length ? <T en="Live Support" bm="Sokongan Langsung" /> : <T en="Support Hub" bm="Hab Sokongan" />)}
                </h3>
              </div>
              <div className="flex space-x-3 items-center">
                 {/* Back button if client is inside a chat but has multiple tickets */}
                 {userProfile?.user?.role !== 'ADMIN' && activeTicketId && tickets.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); setActiveTicketId(null); }} className="text-zinc-400 hover:text-white text-xs font-medium transition-colors"><T en="Back" bm="Kembali" /></button>
                 )}
                 <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-zinc-400 hover:text-white transition-colors">
                   <X size={18} />
                 </button>
              </div>
           </div>
           
           <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 flex flex-col items-stretch justify-start relative w-full h-full overflow-hidden">
               {renderContent()}
           </div>
        </div>
      ) : (
        <button 
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className="relative bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 p-4 rounded-full shadow-xl transition-transform hover:scale-110 active:scale-95 duration-200 group"
          suppressHydrationWarning
        >
          <MessageCircle size={28} className="transform group-hover:rotate-12 transition-transform duration-300" />
          
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-950 shadow-sm animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
