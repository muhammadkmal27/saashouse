"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, ShieldCheck, Download, X, CheckCircle2, Clock, Trash2, PenTool } from "lucide-react";
import { toast } from "sonner";
import { T } from "@/components/Translate";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { translateError } from "@/utils/error-translator";

interface Section {
    title: string;
    content: string;
}

interface ServiceAgreementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSigned: (agreement: any) => void;
    project: {
        id: string;
        title: string;
    };
    costs?: {
        deposit: number;
        final: number;
    };
    providerName?: string;
    providerSignature?: string;
    isOTP?: boolean;
    saasMonthlyPrice?: number;
    saasSetupFee?: number;
    planName?: string;
    template?: Section[];
}

const replacePlaceholders = (text: string, data: Record<string, string | number>, lang: string) => {
    return text.replace(/{{(\w+)}}/g, (_, key) => {
        if (key === 'client_name' && data[key] === 'Pelanggan' && lang === 'EN') return 'Client';
        return data[key]?.toString() || `{{${key}}}`;
    });
};

const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
        let content = line;
        let isBullet = false;
        
        if (line.trim().startsWith("- ")) {
            isBullet = true;
            content = line.trim().slice(2);
        }

        const parts = content.split(/(\*\*.*?\*\*)/g);
        const renderedContent = parts.map((part, partIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={partIdx} style={{ fontWeight: 'bold', color: '#18181b' }}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });

        if (isBullet) {
            return (
                <div key={lineIdx} style={{ display: 'flex', gap: '8px', paddingLeft: '8px', alignItems: 'flex-start', marginBottom: '0.5em' }}>
                    <span style={{ fontWeight: 'bold', marginTop: '4px', flexShrink: 0, color: '#a1a1aa' }}>•</span>
                    <span style={{ flex: 1 }}>{renderedContent}</span>
                </div>
            );
        }

        return (
            <div key={lineIdx} style={{ marginBottom: line.trim() === "" ? "1em" : "0" }}>
                {renderedContent}
            </div>
        );
    });
};

export default function ServiceAgreementModal({ 
    isOpen, 
    onClose, 
    onSigned, 
    project, 
    costs,
    providerName,
    providerSignature,
    isOTP = true,
    saasMonthlyPrice = 0,
    saasSetupFee = 0,
    planName,
    template = []
}: ServiceAgreementModalProps) {
    const { lang } = useLanguage();
    const [clientName, setClientName] = useState("");
    const [isSigning, setIsSigning] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [liveSignature, setLiveSignature] = useState<string | null>(null);

    const totalCost = isOTP ? (costs?.deposit || 0) + (costs?.final || 0) : saasMonthlyPrice;
    const finalDeposit = isOTP ? (costs?.deposit || 0) : saasSetupFee;

    const today = new Date().toLocaleDateString(lang === 'EN' ? 'en-US' : 'ms-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const data = {
        project_name: project.title,
        client_name: clientName || (lang === 'EN' ? "Client" : "Pelanggan"),
        provider_name: providerName || "Mohamad Akmal Bin Sis",
        total_cost: totalCost.toFixed(2),
        deposit_amount: finalDeposit.toFixed(2),
        monthly_price: saasMonthlyPrice.toFixed(2),
        balance_amount: (costs?.final || 0).toFixed(2),
        today: today
    };


    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- Drawing Logic ---
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx?.beginPath();
            
            const dataUrl = canvas.toDataURL("image/png");
            setLiveSignature(dataUrl);
            setHasSignature(true);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ("touches" in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        // Scale coordinates based on canvas internal size vs display size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
            setLiveSignature(null);
        }
    };

    const handleSign = async () => {
        if (!clientName.trim()) {
            toast.error(lang === 'EN' ? "Please enter your full name." : "Sila masukkan nama penuh anda.");
            return;
        }
        if (!hasSignature) {
            toast.error(lang === 'EN' ? "Please provide your signature." : "Sila turunkan tandatangan anda.");
            return;
        }

        setIsSigning(true);
        try {
            const signatureData = liveSignature || "";
            const csrfToken = document.cookie
                .split("; ")
                .find((row) => row.startsWith("csrf_token="))
                ?.split("=")[1];

            const res = await fetch(`/api/projects/${project.id}/agreement`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken || ""
                },
                body: JSON.stringify({ 
                    client_name: clientName,
                    signature_data: signatureData,
                    plan_name: planName
                }),
                credentials: "include"
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || (lang === 'EN' ? "Failed to save agreement" : "Gagal menyimpan perjanjian"));
            }
            
            const agreement = await res.json();
            onSigned(agreement);
        } catch (e: any) {
            console.error("SIGN_AGREEMENT_ERROR:", e);
            toast.error(translateError(e.message || "Error signing agreement", lang));
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-3xl max-h-[95vh] overflow-hidden rounded-[2.5rem] shadow-2xl border-2 border-zinc-100 flex flex-col relative text-zinc-800">
                
                {/* Header */}
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', lineHeight: 1.2, color: '#18181b', margin: 0 }}><T en="Service Agreement" bm="Perjanjian Perkhidmatan" /></h2>
                            <p style={{ fontSize: '0.75rem', fontWeight: '500', fontStyle: 'italic', color: '#71717a', margin: 0 }}><T en="Please review terms & provide signature" bm="Sila semak terma & turunkan tandatangan" /></p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
                    
                    {/* The Full Document */                    {/* The Full Document */}
                    <div style={{ 
                        backgroundColor: '#f9f9fb', 
                        borderRadius: '1.5rem', 
                        padding: typeof window !== 'undefined' && window.innerWidth < 768 ? '1rem' : '2rem', 
                        border: '1px solid #f1f1f4', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: typeof window !== 'undefined' && window.innerWidth < 768 ? '1rem' : '1.5rem', 
                        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
                        color: '#3f3f46' 
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '0.8rem' : '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#18181b', margin: '0 0 8px 0', textDecoration: 'underline', textDecorationColor: 'rgba(139, 92, 246, 0.3)', textUnderlineOffset: '8px', lineHeight: 1.4 }}>
                                PERJANJIAN PERKHIDMATAN PEMBANGUNAN LAMAN WEB
                            </h3>
                            <p style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a1a1aa', margin: 0 }}>TARIKH: {today}</p>
                        </div>
 
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '10px' : '13px', lineHeight: 1.5 }}>
                            <p style={{ margin: 0 }}>
                                <span style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#18181b' }}>ANTARA:</span> {providerName || "Penyedia Perkhidmatan"}, selepas ini dirujuk sebagai 'Penyedia Perkhidmatan'.
                            </p>
                            <p style={{ margin: 0 }}>
                                <span style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#18181b' }}>DAN:</span> <span style={{ borderBottom: '1px solid #d4d4d8', padding: '0 4px', fontWeight: 600, color: '#7c3aed' }}>{clientName || "...................................................."}</span>, selepas ini dirujuk sebagai 'Pelanggan'.
                            </p>
                        </div>
 
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {template.length > 0 ? (
                                template.map((section, idx) => (
                                    <section key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <h4 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#18181b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8b5cf6' }}></div>
                                            {idx + 1}. {section.title}
                                        </h4>
                                        <div style={{ paddingLeft: '0.75rem', fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? '10px' : '13px', color: '#52525b', lineHeight: 1.5 }}>
                                            {renderMarkdown(replacePlaceholders(section.content, data, lang))}
                                        </div>
                                    </section>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#a1a1aa', padding: '2.5rem 0' }}><T en="Loading agreement template..." bm="Memuatkan template perjanjian..." /></p>
                            )}
                        </div>

                        {/* Signature Preview Section */}
                        <div style={{ 
                            paddingTop: '1.5rem', 
                            borderTop: '1px solid #e4e4e7', 
                            marginTop: '1rem', 
                            display: 'flex', 
                            flexDirection: 'row',
                            justifyContent: 'space-between', 
                            gap: '1rem' 
                        }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.25rem', overflow: 'hidden' }}>
                                <div style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? '40px' : '60px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f1f1f4' }}                                     {providerSignature ? (
                                        <img src={providerSignature} alt="Tandatangan Penyedia" style={{ maxHeight: '100%' }} />
                                    ) : (
                                        <div style={{ fontSize: '8px', fontStyle: 'italic', color: '#d4d4d8' }}>Tiada tandatangan</div>
                                    )}
                                </div>
                                <p style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#18181b', margin: 0 }}>PENYEDIA</p>
                                <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#18181b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{providerName || "SaaS House"}</p>
                            </div>
                            
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.25rem', overflow: 'hidden' }}>
                                <div style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? '40px' : '60px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f1f1f4' }}>
                                    {liveSignature && (
                                        <img src={liveSignature} alt="Pratonton Tandatangan Pelanggan" style={{ maxHeight: '100%' }} />
                                    )}
                                </div>
                                <p style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#18181b', margin: 0 }}>PELANGGAN</p>
                                <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#18181b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{clientName || ".........."}</p>
                            </div>
>
                        </div>
                    </div>

                    {/* Digital Signature Pad */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1"><T en="Full Client Name (Individual/Company)" bm="Nama Penuh Pelanggan (Individu/Syarikat)" /></label>
                            <input 
                                type="text"
                                placeholder={lang === 'EN' ? "Enter your full name..." : "Masukkan nama penuh anda..."}
                                className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 text-zinc-900 focus:outline-none focus:border-violet-500 focus:bg-white transition-all font-bold"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                    <PenTool className="w-3 h-3" /> <T en="Digital Signature Here" bm="Tandatangan Digital Di Sini" />
                                </label>
                                <button 
                                    onClick={clearSignature}
                                    className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" /> <T en="Clear" bm="Padam" />
                                </button>
                            </div>
                            
                            <div className="relative group">
                                <canvas 
                                    ref={canvasRef}
                                    width={700}
                                    height={220}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    className="w-full h-[200px] bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[2.5rem] cursor-crosshair group-hover:border-violet-300 transition-colors touch-none shadow-inner"
                                />
                            </div>
                        </div>

                        <p className="text-[11px] font-medium text-zinc-400 leading-relaxed text-center px-4">
                            <T en="By signing digitally, you confirm that you have read, understood, and agreed to the terms above." bm="Dengan menandatangani secara digital, anda mengesahkan bahawa anda telah membaca, memahami, dan bersetuju dengan terma-terma di atas." />
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 md:p-6 border-t border-zinc-100 flex gap-3 bg-zinc-50/50">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 md:py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] text-zinc-400 hover:text-zinc-600 transition-all border-2 border-transparent"
                    >
                        <T en="Cancel" bm="Batal" />
                    </button>
                    <button 
                        onClick={handleSign}
                        disabled={isSigning || !clientName || !hasSignature}
                        className={`flex-[2] py-3 md:py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all flex items-center justify-center gap-2 shadow-lg ${
                            isSigning || !clientName || !hasSignature
                            ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                            : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-600/20'
                        }`}
                    >
                        {isSigning ? (
                            <Clock className="w-4 h-4 animate-spin" />
                        ) : (
                            <ShieldCheck className="w-4 h-4" />
                        )}
                        <T en="Agree & Confirm Agreement" bm="Setuju & Sahkan Perjanjian" />
                    </button>
                </div>
            </div>
        </div>
    );
}
