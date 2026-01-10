import React from 'react';

const Logo = () => (
    <div className="flex flex-col items-start gap-2">
        <img src="/images/venus-logo.webp" alt="Venus Clinic" className="h-16 w-auto" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Healthcare Excellence Registry</p>
    </div>
);

export const UnifiedDocument = ({ data, type = 'prescription' }) => {
    const isPrescription = type === 'prescription';
    const dateStr = new Date(data.createdAt || Date.now()).toLocaleDateString('en-GB');
    const title = isPrescription ? 'Prescription' : 'Invoice';
    const referenceLabel = isPrescription ? 'Appointment Index' : 'Invoice Reference';
    const referenceValue = isPrescription ? (data.appointmentId?.slice(-8).toUpperCase() || 'N/A') : data.invoiceNumber;

    const { prescription, clinicalDetails } = data;
    const doctorName = prescription?.doctor?.name || data.doctor?.name || 'Medical Officer';
    const patientName = prescription?.patient?.name || data.patient?.name || 'Patient';
    const patientEmail = prescription?.patient?.email || data.patient?.email || '';

    return (
        <div className="page-content bg-white min-h-screen p-12 relative flex flex-col font-['Inter'] text-[#080c2e]">
            {isPrescription && (
                <div className="absolute top-[280px] left-[70px] text-[160px] font-black text-[#00ddcb] opacity-[0.05] pointer-events-none select-none z-0">
                    Rx
                </div>
            )}

            <div className="flex justify-between items-start border-b-[5px] border-[#00ddcb] pb-8 mb-10 relative z-10">
                <Logo />
                <div className="text-right">
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{title}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{referenceLabel}: {referenceValue}</p>
                    {isPrescription && (
                        <div className="text-sm font-black text-[#00ddcb] uppercase tracking-widest mt-2">Dr. {doctorName}</div>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-end border-b border-slate-100 pb-8 mb-10 relative z-10">
                <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{isPrescription ? 'Patient Details' : 'Bill To'}</span>
                    <h3 className="text-2xl font-black leading-none">{patientName}</h3>
                    <p className="text-sm font-semibold text-slate-500">{patientEmail || 'No contact on record'}</p>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{isPrescription ? 'Consultation Date' : 'Billing Date'}</span>
                    <p className="text-lg font-black">{dateStr}</p>
                </div>
            </div>

            {isPrescription ? (
                <div className="relative z-10 space-y-10">
                    {clinicalDetails?.vitals && (
                        <div className="grid grid-cols-4 gap-6 bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                            {Object.entries(clinicalDetails.vitals).map(([key, value]) => value && (
                                <div key={key}>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{key.replace(/([A-Z])/g, ' $1')}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-black">{value}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                                            {key === 'temperature' ? '°C' : key === 'weight' ? 'KG' : key === 'pulse' ? 'BPM' : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinical Diagnosis</span>
                        <div className="text-4xl font-black leading-tight tracking-tight">
                            {clinicalDetails?.diagnosis || 'Symptomatic Review'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medication Schedule</span>
                        <div className="overflow-hidden border border-slate-100 rounded-[24px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Medicine</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Dosage</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Frequency</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prescription?.medications?.map((med, idx) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-4 text-sm font-black border-b border-slate-50">{med.name}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-600 border-b border-slate-50">{med.dosage}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-600 border-b border-slate-50">{med.frequency}</td>
                                            <td className="px-6 py-4 text-sm font-black text-[#00ddcb] border-b border-slate-50">{med.duration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {prescription?.notes && (
                        <div className="space-y-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Doctor's Advice</span>
                            <div className="p-8 bg-[#fffcf0] border border-[#fef3c7] rounded-[32px] italic text-sm font-medium text-[#78350f]">
                                "{prescription.notes}"
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative z-10 space-y-8">
                    <div className="text-right">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${data.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {data.status}
                        </span>
                    </div>

                    <div className="overflow-hidden border border-slate-100 rounded-[24px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Description</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 text-sm font-black border-b border-slate-50">{item.description}</td>
                                        <td className="px-6 py-4 text-sm font-black border-b border-slate-50 text-right">₹{item.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Payable Amount</span>
                        <span className="text-5xl font-black">₹{data.totalAmount}</span>
                    </div>
                </div>
            )}

            <div className="mt-auto pt-12 relative z-10">
                <div className="flex flex-col items-end gap-2">
                    <div className="w-64 h-1 bg-[#080c2e]" />
                    <p className="text-[11px] font-black uppercase tracking-widest">{isPrescription ? 'Authenticated Digital Signature' : 'Authorized Signature'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">Validated by New Venus Digital Portal</p>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    Computer Generated Document • System Authenticated • Venus Healthcare © 2026
                </div>
            </div>

            <style jsx>{`
                @media print {
                    .page-content { padding: 50px 70px !important; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};

export const getUnifiedDocumentHTML = (data, type = 'prescription') => {
    // We can't easily render the React component to string here without extra deps,
    // so we'll maintain a synced HTML template if needed, OR we can use the technique of 
    // rendering the component into a hidden div and copying its innerHTML.
    // Given the constraints, I'll provide a synced HTML string for print window.

    // Actually, I'll use the HTML string I already wrote but make it look IDENTICAL to the React component above.

    const isPrescription = type === 'prescription';
    const dateStr = new Date(data.createdAt || Date.now()).toLocaleDateString('en-GB');
    const logoUrl = window.location.origin + '/images/venus-logo.webp';
    const title = isPrescription ? 'Prescription' : 'Invoice';
    const referenceLabel = isPrescription ? 'Appointment Index' : 'Invoice Reference';
    const referenceValue = isPrescription ? (data.appointmentId?.slice(-8).toUpperCase() || 'N/A') : data.invoiceNumber;

    const { prescription, clinicalDetails } = data;
    const doctorName = prescription?.doctor?.name || data.doctor?.name || 'Medical Officer';
    const patientName = prescription?.patient?.name || data.patient?.name || 'Patient';
    const patientEmail = prescription?.patient?.email || data.patient?.email || '';

    return `
        <html>
            <head>
                <title>${title} - ${referenceValue}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap" rel="stylesheet">
                <style>
                    @page { size: A4; margin: 0; }
                    body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #080c2e; background: white; -webkit-print-color-adjust: exact; }
                    .page-content { padding: 50px 70px; position: relative; display: flex; flex-direction: column; min-height: 100vh; box-sizing: border-box; }
                    .header { display: flex; justify-content: space-between; border-bottom: 5px solid #00ddcb; padding-bottom: 30px; margin-bottom: 40px; align-items: flex-start; }
                    .logo-area img { height: 70px; width: auto; margin-bottom: 5px; }
                    .logo-area p { margin: 0; color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
                    .doc-info { text-align: right; }
                    .doc-info h2 { margin: 0; font-weight: 900; color: #080c2e; font-size: 36px; line-height: 1; text-transform: uppercase; letter-spacing: -2px; }
                    .doc-info .ref { margin: 10px 0 0 0; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
                    .doc-info .doc { margin-top: 5px; font-size: 14px; font-weight: 900; color: #00ddcb; text-transform: uppercase; letter-spacing: 1px; }
                    .details-section { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 35px; margin-bottom: 40px; }
                    .label-small { color: #94a3b8; text-transform: uppercase; font-size: 9px; font-weight: 900; letter-spacing: 1.5px; display: block; margin-bottom: 8px; }
                    .main-val h3 { margin: 0 0 5px 0; font-size: 24px; font-weight: 900; color: #080c2e; line-height: 1; }
                    .main-val p { margin: 0; font-size: 13px; color: #64748b; font-weight: 600; }
                    .meta-val { text-align: right; }
                    .meta-val p { margin: 0; font-weight: 900; color: #080c2e; font-size: 18px; }
                    .watermark { position: absolute; top: 280px; left: 70px; font-size: 160px; font-weight: 900; color: #00ddcb; opacity: 0.05; pointer-events: none; z-index: 0; }
                    .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; background: #f8fafc; padding: 25px; border-radius: 24px; margin-bottom: 40px; border: 1px solid #e2e8f0; }
                    .vital-item p { margin: 0; font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
                    .vital-item b { font-size: 18px; font-weight: 900; color: #080c2e; }
                    .vital-item i { font-size: 9px; color: #94a3b8; font-style: normal; margin-left: 3px; font-weight: 700; }
                    .content-section { margin-bottom: 40px; position: relative; z-index: 1; }
                    .section-label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; display: block; }
                    .big-text { font-size: 28px; font-weight: 900; color: #080c2e; line-height: 1.2; letter-spacing: -0.5px; }
                    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background: white; }
                    th { text-align: left; padding: 18px 20px; background: #f8fafc; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; font-weight: 900; border-bottom: 1px solid #e2e8f0; }
                    td { padding: 18px 20px; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #080c2e; font-size: 13px; }
                    .notes-box { padding: 25px; background: #fffcf0; border: 1px solid #fef3c7; border-radius: 24px; font-size: 14px; font-weight: 500; color: #78350f; font-style: italic; line-height: 1.6; }
                    .total-area { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
                    .total-area label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; }
                    .total-area span { font-size: 48px; font-weight: 900; color: #080c2e; letter-spacing: -2px; }
                    .status-tag { padding: 6px 15px; border-radius: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; display: inline-block; }
                    .status-paid { background: #e0fcf5; color: #009384; border: 1px solid #ccfcf5; }
                    .status-unpaid { background: #fff1f2; color: #e11d48; border: 1px solid #ffe4e6; }
                    .footer-part { margin-top: auto; padding-top: 40px; }
                    .sig-block { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
                    .sig-line { width: 250px; height: 3px; background: #080c2e; margin-bottom: 5px; }
                    .sig-tag { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
                    .sig-sub { font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
                    .legal { margin-top: 40px; padding-top: 30px; border-top: 1px solid #f1f5f9; font-size: 9px; color: #cbd5e1; text-align: center; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; }
                </style>
            </head>
            <body>
                <div class="page-content">
                    ${isPrescription ? '<div class="watermark">Rx</div>' : ''}
                    <div class="header">
                        <div class="logo-area">
                            <img src="${logoUrl}" alt="Logo" id="logoImg" />
                            <p>${isPrescription ? 'Clinical Excellence Registry' : 'Financial Operations Wing'}</p>
                        </div>
                        <div class="doc-info">
                            <h2>${title}</h2>
                            <div class="ref">${referenceLabel}: ${referenceValue}</div>
                            ${isPrescription ? `<div class="doc">Dr. ${doctorName}</div>` : ''}
                        </div>
                    </div>

                    <div class="details-section">
                        <div class="main-val">
                            <span class="label-small">${isPrescription ? 'Patient Details' : 'Bill To'}</span>
                            <h3>${patientName}</h3>
                            <p>${patientEmail}</p>
                        </div>
                        <div class="meta-val">
                            <span class="label-small">${isPrescription ? 'Consultation Date' : 'Billing Date'}</span>
                            <p>${dateStr}</p>
                        </div>
                    </div>

                    ${isPrescription ? `
                        ${clinicalDetails?.vitals ? `
                            <div class="vitals-grid">
                                ${Object.entries(clinicalDetails.vitals).map(([key, value]) => value ? `
                                    <div class="vital-item">
                                        <p>${key.replace(/([A-Z])/g, ' $1')}</p>
                                        <b>${value}</b>
                                        <i>${key === 'temperature' ? '°C' : key === 'weight' ? 'KG' : key === 'pulse' ? 'BPM' : ''}</i>
                                    </div>
                                ` : '').join('')}
                            </div>
                        ` : ''}

                        <div class="content-section">
                            <span class="section-label">Clinical Diagnosis</span>
                            <div class="big-text">${clinicalDetails?.diagnosis || 'Symptomatic Review'}</div>
                        </div>

                        <div class="content-section">
                            <span class="section-label">Medication Schedule</span>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Medicine</th>
                                        <th>Dosage</th>
                                        <th>Frequency</th>
                                        <th>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${prescription?.medications?.map(med => `
                                        <tr>
                                            <td style="font-weight: 900;">${med.name}</td>
                                            <td>${med.dosage}</td>
                                            <td>${med.frequency}</td>
                                            <td style="color: #00ddcb; font-weight: 900;">${med.duration}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        ${prescription?.notes ? `
                            <div class="content-section">
                                <span class="section-label">Doctor's Advice</span>
                                <div class="notes-box">"${prescription.notes}"</div>
                            </div>
                        ` : ''}
                    ` : `
                        <div style="text-align: right;">
                             <div class="status-tag ${data.status === 'Paid' ? 'status-paid' : 'status-unpaid'}">
                                ${data.status}
                             </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th style="text-align: right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.items?.map(item => `
                                    <tr>
                                        <td style="font-weight: 900;">${item.description}</td>
                                        <td style="text-align: right; font-weight: 900;">₹${item.amount}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="total-area">
                            <label>Net Payable Amount</label>
                            <span>₹${data.totalAmount}</span>
                        </div>
                    `}

                    <div class="footer-part">
                        <div class="sig-block">
                            <div class="sig-line"></div>
                            <div class="sig-tag">${isPrescription ? 'Authenticated Digital Signature' : 'Authorized Signature'}</div>
                            <div class="sig-sub">Validated by New Venus Digital Portal</div>
                        </div>
                        <div class="legal">
                            This is a digitally generated document • System Authenticated • Venus Healthcare © 2026
                        </div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        const img = document.getElementById('logoImg');
                        const trigger = () => {
                            setTimeout(() => { window.print(); }, 500);
                        };
                        if (img.complete) trigger();
                        else { img.onload = trigger; img.onerror = trigger; setTimeout(trigger, 3000); }
                    };
                </script>
            </body>
        </html>
    `;
};
