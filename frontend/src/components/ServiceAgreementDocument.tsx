import React from "react";

interface Section {
  title: string;
  content: string;
}

interface ServiceAgreement {
  client_name: string;
  provider_name: string;
  title: string; // Project title
  total_cost: number;
  deposit_amount: number;
  balance_amount: number;
  signed_at?: string;
  signature_data?: string;
  provider_signature?: string;
  plan_name?: string;
}

const replacePlaceholders = (text: string, data: Record<string, string | number>) => {
  return text.replace(/{{(\w+)}}/g, (_, key) => {
    return data[key]?.toString() || `{{${key}}}`;
  });
};

const renderMarkdown = (text: string, lineSpacing: number) => {
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
        return <strong key={partIdx} style={{ fontWeight: 900, color: '#18181b' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} style={{ display: 'flex', gap: '8px', paddingLeft: '16px', alignItems: 'flex-start', marginBottom: `${lineSpacing * 0.2}em`, lineHeight: lineSpacing }}>
          <span style={{ fontWeight: 'bold', marginTop: '2px', color: '#a1a1aa' }}>•</span>
          <span style={{ flex: 1 }}>{renderedContent}</span>
        </div>
      );
    }

    return (
      <div key={lineIdx} style={{ lineHeight: lineSpacing, marginBottom: line.trim() === "" ? "1em" : "0" }}>
        {renderedContent}
      </div>
    );
  });
};

export default function ServiceAgreementDocument({ 
    project, 
    fontSize = 14, 
    sectionGap = 8, 
    signatureGap = 12,
    lineSpacing = 1.6,
    padding = 48,
    template = []
}: { 
    project: ServiceAgreement, 
    fontSize?: number, 
    sectionGap?: number, 
    signatureGap?: number,
    lineSpacing?: number,
    padding?: number,
    template?: Section[]
}) {
    const today = project.signed_at 
        ? new Date(project.signed_at).toLocaleDateString('ms-MY', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('ms-MY', { year: 'numeric', month: 'long', day: 'numeric' });

    const data = {
        project_name: project.title || "Projek",
        project_title: project.title || "Projek", // Support both project_name and project_title
        client_name: project.client_name || "Pelanggan",
        provider_name: project.provider_name || "Penyedia Perkhidmatan",
        total_cost: (project.total_cost || 0).toFixed(2),
        deposit_amount: (project.deposit_amount || 0).toFixed(2),
        balance_amount: (project.balance_amount || 0).toFixed(2),
        today: today
    };

    return (
        <div 
            id="agreement-document-print"
            style={{ 
                padding: `${padding}px`, 
                color: '#27272a', 
                backgroundColor: '#ffffff',
                fontFamily: 'serif',
                lineHeight: lineSpacing,
                maxWidth: '210mm',
                margin: '0 auto',
                outline: 'none',
                boxSizing: 'border-box'
            }}
            contentEditable
            suppressContentEditableWarning
        >
            <style dangerouslySetInnerHTML={{ __html: `
                #agreement-document-print * {
                    box-sizing: border-box;
                    --tw-shadow: 0 0 #0000;
                    --tw-ring-color: #0000;
                    --tw-ring-shadow: 0 0 #0000;
                }
                #agreement-document-print section {
                    page-break-inside: avoid;
                    break-inside: avoid;
                    margin-bottom: ${sectionGap * 4}px;
                    padding-top: 8px;
                }
                #agreement-document-print h1, #agreement-document-print h2 {
                    page-break-after: avoid;
                }
                @media print {
                    #agreement-document-print { padding: 10mm !important; }
                    section { padding-top: 15mm; }
                }
            `}} />
            
            <div style={{ textAlign: 'center', marginBottom: `${sectionGap * 5}px`, borderBottom: '2px solid #18181b', paddingBottom: `${sectionGap * 2}px` }}>
                <h1 style={{ fontSize: `${fontSize + 8}px`, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#18181b', margin: '0 0 12px 0' }}>
                    PERJANJIAN PERKHIDMATAN PEMBANGUNAN LAMAN WEB
                </h1>
                <p style={{ fontSize: `${fontSize - 1}px`, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#71717a', margin: 0 }}>Tarikh: {today}</p>
            </div>

            <div style={{ fontSize: `${fontSize}px` }}>
                <div style={{ marginBottom: `${sectionGap * 3}px`, pageBreakInside: 'avoid' }}>
                    <p style={{ margin: '0 0 8px 0' }}><span style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ANTARA:</span> {project.provider_name}, selepas ini dirujuk sebagai "Penyedia Perkhidmatan".</p>
                    <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DAN:</span> {project.client_name}, selepas ini dirujuk sebagai "Pelanggan".</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {template.length > 0 ? (
                        template.map((section, idx) => (
                            <section key={idx}>
                                <h2 style={{ 
                                    fontSize: `${fontSize + 2}px`,
                                    fontWeight: 900, 
                                    borderBottom: '1px solid #18181b', 
                                    marginBottom: '10px', 
                                    paddingBottom: '4px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    fontStyle: 'italic',
                                    color: '#18181b'
                                }}>
                                    <span style={{ 
                                        backgroundColor: '#18181b', 
                                        color: '#ffffff', 
                                        width: '22px', 
                                        height: '22px', 
                                        borderRadius: '4px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '11px', 
                                        fontStyle: 'normal' 
                                    }}>{idx + 1}</span>
                                    {section.title}
                                </h2>
                                <div style={{ paddingLeft: '20px' }}>
                                    {renderMarkdown(replacePlaceholders(section.content, data), lineSpacing)}
                                </div>
                            </section>
                        ))
                    ) : (
                        <p style={{ fontStyle: 'italic', color: '#a1a1aa' }}>No agreement template found. Please configure it in Settings.</p>
                    )}
                </div>

                <div 
                    style={{ 
                        borderTop: '1px solid #e4e4e7', 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '40px',
                        marginTop: `${signatureGap * 2}px`, 
                        paddingTop: `${signatureGap}px`,
                        pageBreakInside: 'avoid'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ height: '80px', borderBottom: '1px solid #a1a1aa', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px' }}>
                            {project.provider_signature && <img src={project.provider_signature} style={{ maxHeight: '100%' }} alt="Provider Signature" />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                            <p style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', margin: 0 }}>TANDATANGAN PENYEDIA PERKHIDMATAN</p>
                            <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Nama:</span> {project.provider_name}</p>
                            <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Tarikh:</span> {today}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ height: '80px', borderBottom: '1px solid #a1a1aa', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px' }}>
                            {project.signature_data && <img src={project.signature_data} style={{ maxHeight: '100%' }} alt="Client Signature" />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                            <p style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', margin: 0 }}>TANDATANGAN PELANGGAN</p>
                            <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Nama:</span> {project.client_name}</p>
                            <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Tarikh:</span> {today}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>


    );
}
