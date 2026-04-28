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
        <div style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 900, color: '#d1d5db', backgroundColor: '#f9fafb', padding: '2px 8px', borderRadius: '4px', border: '1px solid #f3f4f6' }}>{index}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Icon && <Icon size={14} style={{ color: '#9ca3af' }} />}
                    <h2 style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#111827', margin: 0 }}>{title}</h2>
                </div>
            </div>
            {children}
        </div>
    );

    const TechnicalDataGrid = ({ data }: { data: { label: string, value: any, isCode?: boolean, fullWidth?: boolean }[] }) => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', backgroundColor: '#e5e7eb', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            {data.map((item, idx) => (
                <div key={idx} style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '14px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px',
                    gridColumn: item.fullWidth ? 'span 2' : 'auto'
                }}>
                    <span style={{ fontSize: '7px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{item.label}</span>
                    <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 700, 
                        color: item.isCode ? '#4f46e5' : '#111827',
                        fontFamily: item.isCode ? 'monospace' : 'inherit',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {item.value || "NOT_DEFINED"}
                    </span>
                </div>
            ))}
        </div>
    );

    return (
        <div id="project-report-print" style={{ 
            backgroundColor: '#ffffff', 
            color: '#111827', 
            padding: '2cm', 
            minHeight: '29.7cm', 
            width: '21cm', 
            margin: '0 auto', 
            fontFamily: 'sans-serif', 
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
            <style dangerouslySetInnerHTML={{ __html: `
                #project-report-print {
                    --tw-shadow: 0 0 #0000;
                    --tw-ring-color: #0000;
                    --tw-ring-shadow: 0 0 #0000;
                }
                #project-report-print * {
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact;
                }
                @media print {
                    #project-report-print {
                        box-shadow: none !important;
                        margin: 0 !important;
                        width: 100% !important;
                        padding: 1.5cm !important;
                    }
                }
            `}} />
            
            {/* TECHNICAL HEADER BAR */}
            <div style={{ borderBottom: '4px solid #111827', paddingBottom: '32px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '32px', height: '32px', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyCenter: 'center', borderRadius: '8px' }}>
                                <Terminal size={20} style={{ color: '#ffffff', margin: 'auto' }} />
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: '#1f2937' }}>SaaS House Technical Blueprint</span>
                        </div>
                        <h1 style={{ fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', lineHeight: 1, margin: '0 0 4px 0' }}>Onboarding Summary</h1>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.15em', fontStyle: 'italic', margin: 0 }}>Full 7-Section Intelligence Report</p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ padding: '4px 12px', backgroundColor: '#f3f4f6', color: '#111827', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            DOC_STATUS: {project.status}
                        </div>
                        <div style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 700, color: '#9ca3af' }}>
                            GEN_TS: {new Date().getTime()}
                        </div>
                    </div>
                </div>

                {/* METADATA MODULE */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '24px', border: '1px solid #f3f4f6' }}>
                    <div style={{ borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
                        <p style={{ fontSize: '7px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', margin: 0 }}>Project ID</p>
                        <p style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 900, color: '#111827', margin: 0 }}>#{project.id.split('-')[0].toUpperCase()}</p>
                    </div>
                    <div style={{ borderRight: '1px solid #e5e7eb', paddingLeft: '16px', paddingRight: '16px' }}>
                        <p style={{ fontSize: '7px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', margin: 0 }}>Creation Date</p>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#111827', margin: 0 }}>{new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ borderRight: '1px solid #e5e7eb', paddingLeft: '16px', paddingRight: '16px' }}>
                        <p style={{ fontSize: '7px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', margin: 0 }}>Active Plan</p>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', margin: 0 }}>{project.selected_plan || "Custom"}</p>
                    </div>
                    <div style={{ paddingLeft: '16px' }}>
                        <p style={{ fontSize: '7px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', margin: 0 }}>Project Lead</p>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>@{project.whatsapp_number}</p>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
                    {req.features?.map((feat: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                            <Zap size={12} style={{ color: '#6366f1' }} />
                            <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#374151' }}>{feat}</span>
                        </div>
                    ))}
                </div>
                {req.custom_needs && (
                    <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px dashed #f3f4f6' }}>
                        <p style={{ fontSize: '7px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px', margin: 0 }}>Custom Directives / Overrides</p>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>"{req.custom_needs}"</p>
                    </div>
                )}
            </TechnicalSection>

            {/* 04: BRAND IDENTITY */}
            <TechnicalSection index="04" title="Brand Identity Specs" icon={Camera}>
                <div style={{ display: 'flex', gap: '32px' }}>
                    <div style={{ width: '25%' }}>
                        <p style={{ fontSize: '8px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px', margin: 0 }}>Master Asset</p>
                        <div style={{ aspectRatio: '1/1', backgroundColor: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '12px' }}>
                            {req.brand_assets?.logo_url ? (
                                <img 
                                    src={getAssetUrl(req.brand_assets.logo_url)} 
                                    alt="Logo" 
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                                />
                            ) : (
                                <Box size={32} style={{ color: '#e5e7eb' }} />
                            )}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #ffffff', backgroundColor: req.brand_assets?.theme_color || '#f4f4f5', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} />
                            <div>
                                <p style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', margin: 0 }}>{req.brand_assets?.theme_color || "#F4F4F5"}</p>
                                <p style={{ fontSize: '8px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>System Aesthetic Code (HEX)</p>
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
                <div style={{ backgroundColor: '#111827', border: '2px solid #1f2937', borderRadius: '16px', padding: '24px', fontFamily: 'monospace', overflow: 'hidden', position: 'relative', marginBottom: '16px' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '16px', opacity: 0.1 }}>
                        <Code size={96} style={{ color: '#ffffff' }} />
                    </div>
                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <p style={{ color: '#4b5563', marginBottom: '12px', fontSize: '8px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.3em', fontStyle: 'italic', margin: '0 0 12px 0' }}>// SITE_TREE_PROTO</p>
                        {req.sitemap?.map((page: string, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px', color: '#9ca3af' }}>
                                <span style={{ color: '#374151', width: '24px', fontWeight: 700 }}>{idx + 1}.</span>
                                <span style={{ color: '#818cf8', opacity: 0.5 }}>root</span>
                                <span style={{ color: '#4b5563' }}>/</span>
                                <span style={{ color: '#f3f4f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{page.replace(/\s+/g, '_').toLowerCase()}</span>
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
                <div style={{ marginTop: '12px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: '7px', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px', margin: 0 }}>Company Physical HQ</p>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#374151', margin: 0 }}>{req.business_address || "NO_PHYSICAL_HQ_PROVIDED"}</p>
                </div>
            </TechnicalSection>

            {/* 07: CORPORATE VISION */}
            <TechnicalSection index="07" title="Technical Vision & Mission" icon={FileSearch}>
                <div style={{ backgroundColor: '#111827', padding: '32px', borderRadius: '40px', border: '4px solid #1f2937', position: 'relative', overflow: 'hidden', textAlign: 'left' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '32px', opacity: 0.05 }}>
                       <MessageCircle size={128} style={{ color: '#ffffff' }} />
                    </div>
                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <p style={{ fontSize: '8px', fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5em', marginBottom: '16px', fontFamily: 'monospace', margin: '0 0 16px 0' }}>// EXECUTIVE_VISION_STATEMENT</p>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#d1d5db', lineHeight: 1.8, fontStyle: 'italic', wordBreak: 'break-word', whiteSpace: 'pre-wrap', margin: 0 }}>
                            "{req.project_vision || "NO_VISION_DATA: Prototype awaiting executive branding input."}"
                        </p>
                    </div>
                </div>
            </TechnicalSection>

            {/* FOOTER */}
            <div style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={12} />
                    <p style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>System Generated Documentation Node</p>
                </div>
                <p style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', fontFamily: 'monospace', margin: 0 }}>BLUEPRINT_X{project.id.split('-')[0].toUpperCase()}</p>
            </div>
        </div>
    );
};

export default ProjectOnboardingReport;
