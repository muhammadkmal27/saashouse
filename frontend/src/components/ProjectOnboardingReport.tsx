import React from 'react';
import { 
    CheckCircle2, 
    Layout, 
    Globe, 
    Box, 
    ShieldCheck, 
    Camera, 
    Cpu, 
    Info, 
    Briefcase,
    FileSearch,
    MapPin,
    Terminal,
    Code,
    Activity,
    Server,
    Database,
    Zap,
    MessageCircle,
    Hash
} from "lucide-react";
import { getAssetUrl } from "@/utils/url";

interface ProjectOnboardingReportProps {
    project: any;
}

const ProjectOnboardingReport: React.FC<ProjectOnboardingReportProps> = ({ project }) => {
    if (!project) return null;
    const req = project.requirements || {};

    const TechnicalSection = ({ index, title, children, icon: Icon }: { index: string, title: string, children: React.ReactNode, icon?: any }) => (
        <div className="mb-10 break-inside-avoid">
            <div className="flex items-center gap-4 border-b border-zinc-200 pb-3 mb-5">
                <span className="text-[10px] font-mono font-black text-zinc-300 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">{index}</span>
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400" />}
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-900">{title}</h2>
                </div>
            </div>
            {children}
        </div>
    );

    const TechnicalDataGrid = ({ data }: { data: { label: string, value: any, isCode?: boolean, fullWidth?: boolean }[] }) => (
        <div className="grid grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 rounded-xl overflow-hidden">
            {data.map((item, idx) => (
                <div key={idx} className={`bg-white p-3.5 flex flex-col gap-1 hover:bg-zinc-50 transition-colors ${item.fullWidth ? 'col-span-2' : ''}`}>
                    <span className="text-[7px] font-black text-zinc-400 uppercase tracking-[0.2em]">{item.label}</span>
                    <span className={`text-[10px] font-bold ${item.isCode ? 'font-mono text-indigo-600' : 'text-zinc-900'} break-words whitespace-pre-wrap`}>
                        {item.value || "NOT_DEFINED"}
                    </span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="bg-white text-zinc-900 p-[1.5cm] md:p-[2cm] min-h-[29.7cm] w-[21cm] mx-auto shadow-2xl font-sans relative">
            {/* TECHNICAL HEADER BAR */}
            <div className="border-b-4 border-zinc-900 pb-8 mb-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-zinc-900 flex items-center justify-center rounded-lg shadow-sm">
                                <Terminal className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800">SaaS House Technical Blueprint</span>
                        </div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1">Onboarding Summary</h1>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Full 7-Section Intelligence Report</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <div className="px-3 py-1 bg-zinc-100 text-zinc-900 text-[9px] font-black uppercase tracking-widest rounded-lg border border-zinc-200">
                            DOC_STATUS: {project.status}
                        </div>
                        <div className="text-[9px] font-mono font-bold text-zinc-400">
                            GEN_TS: {new Date().getTime()}
                        </div>
                    </div>
                </div>

                {/* METADATA MODULE */}
                <div className="grid grid-cols-4 gap-4 bg-zinc-50 p-5 rounded-3xl border border-zinc-100">
                    <div className="border-r border-zinc-200 pr-4">
                        <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Project ID</p>
                        <p className="text-[10px] font-mono font-black text-zinc-900">#{project.id.split('-')[0].toUpperCase()}</p>
                    </div>
                    <div className="border-r border-zinc-200 px-4">
                        <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Creation Date</p>
                        <p className="text-[10px] font-bold text-zinc-900">{new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="border-r border-zinc-200 px-4">
                        <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Active Plan</p>
                        <p className="text-[10px] font-bold text-zinc-900 uppercase">{project.selected_plan || "Custom"}</p>
                    </div>
                    <div className="pl-4">
                        <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Project Lead</p>
                        <p className="text-[10px] font-bold text-zinc-900 truncate">@{project.whatsapp_number}</p>
                    </div>
                </div>
            </div>

            {/* 01: INFRASTRUCTURE NODE */}
            <TechnicalSection index="01" title="Infrastructure Node" icon={Server}>
                <TechnicalDataGrid data={[
                    { label: "Selected Frame Work", value: project.selected_plan },
                    { label: "Deployment Cluster (PROD)", value: project.prod_url || "NOT_PUBLISHED", isCode: true },
                    { label: "Staging Pipeline (DEV)", value: project.dev_url || "BUILD_IN_PROGRESS", isCode: true },
                    { label: "Technical Tier", value: "Enterprise High-Performance" }
                ]} />
            </TechnicalSection>

            {/* 02: FINANCIAL TERMINAL */}
            <TechnicalSection index="02" title="Financial Terminal & Compliance" icon={ShieldCheck}>
                <TechnicalDataGrid data={[
                    { label: "Merchant Gateway", value: req.payment_setup?.has_toyyibpay ? "TOYYIBPAY_ESTABLISHED" : "NEW_REGISTRATION_REQUEST" },
                    { label: "TOYYIBPAY Category Code", value: req.payment_setup?.category_code, isCode: true },
                    { label: "SSM Verification Status", value: req.payment_setup?.ssm_url ? "DOCUMENT_SUBMITTED_AND_VERIFIED" : "PENDING_DOCUMENTATION" },
                    { label: "Regulatory Compliance", value: "Verified Official Registry" }
                ]} />
            </TechnicalSection>

            {/* 03: OPERATIONAL LOGIC */}
            <TechnicalSection index="03" title="Operational Logic & Features" icon={Cpu}>
                <div className="grid grid-cols-2 gap-2 mb-4 text-left">
                    {req.features?.map((feat: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                            <Zap className="w-3 h-3 text-indigo-500" />
                            <span className="text-[9px] font-black uppercase text-zinc-700">{feat}</span>
                        </div>
                    ))}
                </div>
                {req.custom_needs && (
                    <div className="p-4 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-100">
                        <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Custom Directives / Overrides</p>
                        <p className="text-[10px] font-bold text-zinc-600 italic leading-relaxed">"{req.custom_needs}"</p>
                    </div>
                )}
            </TechnicalSection>

            {/* 04: BRAND IDENTITY */}
            <TechnicalSection index="04" title="Brand Identity Specs" icon={Camera}>
                <div className="flex gap-8">
                    <div className="w-1/4 space-y-2">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Master Asset</p>
                        <div className="aspect-square bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center overflow-hidden p-3">
                            {req.brand_assets?.logo_url ? (
                                <img 
                                    src={getAssetUrl(req.brand_assets.logo_url)} 
                                    alt="Logo" 
                                    className="w-full h-full object-contain" 
                                />
                            ) : (
                                <Box className="w-8 h-8 text-zinc-200" />
                            )}
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg shadow-sm border border-white" style={{ backgroundColor: req.brand_assets?.theme_color || '#F4F4F5' }} />
                            <div>
                                <p className="text-[10px] font-mono font-black text-indigo-600 uppercase">{req.brand_assets?.theme_color || "#F4F4F5"}</p>
                                <p className="text-[8px] font-bold text-zinc-400 uppercase">System Aesthetic Code (HEX)</p>
                            </div>
                        </div>
                        <TechnicalDataGrid data={[
                            { label: "Identity Baseline", value: "High-Fidelity Branding Stack" }
                        ]} />
                    </div>
                </div>
            </TechnicalSection>

            {/* 05: STRATEGIC ARCHITECTURE */}
            <TechnicalSection index="05" title="Strategic Architecture" icon={Layout}>
                <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6 font-mono overflow-hidden relative mb-4">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Code className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10 space-y-0.5">
                        <p className="text-zinc-600 mb-3 text-[8px] uppercase font-black tracking-[0.3em] font-sans italic">// SITE_TREE_PROTO</p>
                        {req.sitemap?.map((page: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 text-[10px] text-zinc-400 translate-y-0">
                                <span className="text-zinc-700 w-6 font-bold">{idx + 1}.</span>
                                <span className="text-indigo-400 opacity-50">root</span>
                                <span className="text-zinc-600">/</span>
                                <span className="text-zinc-100 font-bold uppercase tracking-widest">{page.replace(/\s+/g, '_').toLowerCase()}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <TechnicalDataGrid data={[
                    { label: "Comparative Market Benchmark", value: req.competitor_ref, isCode: true }
                ]} />
            </TechnicalSection>

            {/* 06: CONNECTIVITY MATRIX */}
            <TechnicalSection index="06" title="Connectivity Matrix" icon={Globe}>
                <TechnicalDataGrid data={[
                    { label: "Requested Primary Host", value: req.domain_requested, isCode: true },
                    { label: "Secondary Resolver Node", value: req.domain_2, isCode: true },
                    { label: "Official Enterprise Email", value: req.business_email, isCode: true },
                    { label: "Operational Schedule", value: req.operation_hours },
                    { label: "Social Hook: FB", value: req.social_media?.facebook, isCode: true },
                    { label: "Social Hook: IG", value: req.social_media?.instagram, isCode: true }
                ]} />
                <div className="mt-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Company Physical HQ</p>
                    <p className="text-[10px] font-bold text-zinc-700">{req.business_address || "NO_PHYSICAL_HQ_PROVIDED"}</p>
                </div>
            </TechnicalSection>

            {/* 07: CORPORATE VISION */}
            <TechnicalSection index="07" title="Technical Vision & Mission" icon={FileSearch}>
                <div className="bg-zinc-900 p-8 rounded-[2.5rem] border-4 border-zinc-800 shadow-inner relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <MessageCircle className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-4 font-mono">// EXECUTIVE_VISION_STATEMENT</p>
                        <p className="text-[12px] font-bold text-zinc-300 leading-[1.8] italic break-words whitespace-pre-wrap">
                            "{req.project_vision || "NO_VISION_DATA: Prototype awaiting executive branding input."}"
                        </p>
                    </div>
                </div>
            </TechnicalSection>

            {/* FOOTER */}
            <div className="mt-16 pt-6 border-t border-zinc-100 flex justify-between items-center opacity-40">
                <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    <p className="text-[8px] font-black uppercase tracking-[0.3em]">System Generated Documentation Node</p>
                </div>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] font-mono">BLUEPRINT_X{project.id.split('-')[0].toUpperCase()}</p>
            </div>
        </div>
    );
};

export default ProjectOnboardingReport;
