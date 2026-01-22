import React from 'react';

export const UnifiedDocument = ({ data, type = 'prescription' }) => {
    const isPrescription = type === 'prescription';
    const dateStr = new Date(data.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const { prescription, clinicalDetails } = data;
    const doctorName = prescription?.doctor?.name || data.doctor?.name || 'Medical Officer';
    const patientName = prescription?.patient?.name || data.patient?.name || 'Patient';
    const patientId = prescription?.patient?.displayId || data.patient?.displayId || 'N/A';
    const patientGender = prescription?.patient?.gender ? `(${prescription.patient.gender[0]})` : '';
    const patientAge = prescription?.patient?.age ? `/ ${prescription.patient.age} Y` : '';

    return (
        <div className="page-content bg-white min-h-screen p-8 relative flex flex-col font-sans text-black">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                <div className="w-1/2">
                    <h1 className="text-xl font-bold uppercase">Dr. {doctorName}</h1>
                </div>
                <div className="w-1/2 text-right flex flex-col items-end">
                    <div className="flex items-start justify-end gap-3">

                        <div className="text-right">
                            <img src="/images/venus-logo.webp" alt="Logo" className="h-12 w-auto" />
                            <p className="text-xs max-w-[250px] leading-tight text-gray-800">
                                200, Sri Subiksham Flats, Chitlapakkam Main Road, Ganesh Nagar, Selaiyur, Chennai - 600 073
                            </p>
                            <p className="text-xs mt-1">Ph: 7708317826, 7010315857</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient Info Strip */}
            <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                    <div className="font-bold text-sm uppercase">
                        ID: {patientId} - {patientName} {patientGender} {patientAge} <span className="ml-4">Mob. No.: {prescription?.patient?.phone || ''}</span>
                    </div>
                    <div className="font-bold text-sm">
                        Date: {dateStr}
                    </div>
                </div>
                {clinicalDetails?.vitals && (
                    <div className="text-xs border-b-2 border-black pb-2 mb-2 uppercase font-semibold">
                        <span>
                            Weight (Kg): {clinicalDetails.vitals.weight || '-'},
                            Height (Cm): {clinicalDetails.vitals.height || '-'},
                            BP: {clinicalDetails.vitals.bloodPressure || '-'} mmHg
                        </span>
                    </div>
                )}
            </div>

            {/* Clinical Details */}
            {isPrescription && (
                <div className="flex-1">
                    {/* Diagnosis / Complaints */}
                    <div className="grid grid-cols-2 gap-4 border-b-2 border-black pb-4 mb-4">
                        <div>
                            <h3 className="font-bold text-sm underline mb-1 uppercase">Chief Complaints</h3>
                            <ul className="list-none text-xs uppercase font-semibold pl-2">
                                {clinicalDetails?.diagnosis ?
                                    (<li>{clinicalDetails.diagnosis}</li>) :
                                    (<li>-</li>)
                                }
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm underline mb-1 uppercase">Clinical Findings</h3>
                            <p className="text-xs uppercase font-semibold pl-2">
                                {clinicalDetails?.clinicalNotes || '-'}
                            </p>
                        </div>
                    </div>

                    {/* Rx Symbol */}
                    <div className="mb-2 font-bold text-lg">Rx</div>

                    {/* Medicine Table */}
                    <table className="w-full text-left border-collapse border-b-2 border-black mb-4">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="py-1 text-sm font-bold w-1/2 uppercase">Medicine Name</th>
                                <th className="py-1 text-sm font-bold uppercase">Frequency</th>
                                <th className="py-1 text-sm font-bold uppercase">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-semibold uppercase">
                            {prescription?.medications?.map((med, idx) => (
                                <tr key={idx} className="border-b border-gray-400 last:border-0">
                                    <td className="py-3 pr-2 align-top">
                                        <div className="font-bold text-sm">{idx + 1}) {med.name}</div>
                                    </td>
                                    <td className="py-3 align-top">
                                        {med.frequency}
                                        <div className="text-[10px] text-gray-500 mt-0.5">({med.instruction || 'After Food'})</div>
                                    </td>
                                    <td className="py-3 align-top">
                                        {med.duration} Days
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Advice */}
                    {prescription?.notes && (
                        <div className="mb-4">
                            <h3 className="font-bold text-sm underline mb-1 uppercase">Advice:</h3>
                            <ul className="text-xs uppercase font-bold list-none pl-2">
                                {prescription.notes.split('\n').map((note, i) => (
                                    <li key={i}>{note}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Follow Up */}
                    {prescription?.followUpDate && (
                        <div className="font-bold text-xs uppercase mt-6">
                            Follow Up: {new Date(prescription.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            {!isPrescription && (
                <div className="border p-4 mb-4">
                    <p>Invoice Total: ₹{data.totalAmount}</p>
                </div>
            )}

            <div className="mt-auto flex flex-col items-center">
                <div className="text-center text-[10px] text-gray-500 mb-2 uppercase font-bold">
                    Substitute with equivalent Generics as required.
                </div>
                <div className="w-full border-t border-black pt-2 text-center text-xs font-bold uppercase tracking-widest text-blue-800">
                    newvenusclinic.com
                </div>
            </div>

            <style>{`
                @media print {
                    .page-content { padding: 40px !important; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};

export const getUnifiedDocumentHTML = (data, type = 'prescription') => {
    const isPrescription = type === 'prescription';
    const dateStr = new Date(data.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const logoUrl = window.location.origin + '/images/venus-logo.webp';

    const { prescription, clinicalDetails } = data;
    const doctorName = prescription?.doctor?.name || data.doctor?.name || 'Medical Officer';
    const patientName = prescription?.patient?.name || data.patient?.name || 'Patient';
    const patientId = prescription?.patient?.displayId || data.patient?.displayId || 'N/A';
    const patientGender = prescription?.patient?.gender ? '(' + prescription.patient.gender[0] + ')' : '';
    const patientAge = prescription?.patient?.age ? '/ ' + prescription.patient.age + ' Y' : '';
    const patientPhone = prescription?.patient?.phone || '';

    return `
        <html>
            <head>
                <title>Prescription - ${patientName}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    @page { size: A4; margin: 0; }
                    body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #000; background: white; -webkit-print-color-adjust: exact; }
                    .page-content { padding: 40px 50px; min-height: 100vh; display: flex; flex-direction: column; box-sizing: border-box; }
                    
                    /* Header */
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
                    .doc-info { width: 50%; }
                    .doc-name { font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 0; }
                    
                    .clinic-info { width: 50%; text-align: right; display: flex; justify-content: flex-end; gap: 10px; }
                    .clinic-details h2 { font-size: 16px; font-weight: 700; color: #1e40af; text-transform: uppercase; margin: 0 0 5px 0; }
                    .clinic-details p { font-size: 10px; margin: 2px 0; color: #1f2937; line-height: 1.25; font-weight: 500; }
                    
                    /* Patient Info */
                    .patient-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 5px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                    .patient-details { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
                    
                    /* Clinical Grid */
                    .clinical-grid { display: flex; gap: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
                    .col { flex: 1; }
                    .col h3 { font-size: 12px; font-weight: 700; text-decoration: underline; margin: 0 0 5px 0; text-transform: uppercase; }
                    .colcontent { font-size: 11px; text-transform: uppercase; font-weight: 600; padding-left: 5px; }
                    .colcontent p { margin: 2px 0; }
                    
                    /* Table */
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 2px solid #000; }
                    th { text-align: left; border-bottom: 2px solid #000; padding: 5px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                    td { padding: 12px 0; border-bottom: 1px solid #9ca3af; font-size: 12px; vertical-align: top; }
                    tr:last-child td { border-bottom: none; }
                    .med-name { font-weight: 700; text-transform: uppercase; font-size: 13px; margin-right: 5px; }
                    .instruction { font-size: 10px; color: #6b7280; font-weight: 500; }
                    
                    .advice h3 { font-size: 12px; font-weight: 700; text-decoration: underline; margin: 0 0 5px 0; text-transform: uppercase; }
                    .advice ul { margin: 0; padding: 0; list-style: none; }
                    .advice li { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; padding-left: 5px; }
                    
                    .footer-note { margin-top: auto; padding-top: 10px; text-align: center; }
                    .sub-note { font-size: 10px; color: #6b7280; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; }
                    .site-link { font-size: 12px; color: #1e40af; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; border-top: 1px solid #000; padding-top: 10px; width: 100%; display: block; }
                </style>
            </head>
            <body>
                <div class="page-content">
                    <div class="header">
                        <div class="doc-info">
                            <h1 class="doc-name">Dr. ${doctorName}</h1>
                        </div>
                        <div class="clinic-info">
                            
                            <div class="clinic-details">
                                <img src="${logoUrl}" style="height: 50px; margin-right: 15px;" />
                                <p style="max-width: 250px; margin-left: auto;">200, Sri Subiksham Flats, Chitlapakkam Main Road, Ganesh Nagar, Selaiyur, Chennai - 600 073</p>
                                <p>Ph: 7708317826, 7010315857</p>
                            </div>
                        </div>
                    </div>

                    <div class="patient-row">
                        <div>ID: ${patientId} - ${patientName} ${patientGender} ${patientAge} <span style="margin-left: 20px;">Mob. No.: ${patientPhone}</span></div>
                        <div>Date: ${dateStr}</div>
                    </div>
                    ${clinicalDetails?.vitals ? `
                        <div class="patient-details">
                             <span>
                                 Weight (Kg): ${clinicalDetails.vitals.weight || '-'}, 
                                 Height (Cm): ${clinicalDetails.vitals.height || '-'}, 
                                 BP: ${clinicalDetails.vitals.bloodPressure || '-'} mmHg
                             </span>
                        </div>
                    ` : '<div style="margin-bottom: 20px;"></div>'}

                    ${isPrescription ? `
                        <div class="clinical-grid">
                            <div class="col">
                                <h3>Chief Complaints</h3>
                                <div class="colcontent">
                                    ${clinicalDetails?.diagnosis ? `<p>${clinicalDetails.diagnosis}</p>` : '<p>-</p>'}
                                </div>
                            </div>
                            <div class="col">
                                <h3>Clinical Findings</h3>
                                <div class="colcontent">
                                    <p>${clinicalDetails?.clinicalNotes || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div style="font-weight: 700; font-size: 18px; margin-bottom: 10px;">Rx</div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 45%;">Medicine Name</th>
                                    <th style="width: 35%;">Frequency</th>
                                    <th style="width: 20%;">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${prescription?.medications?.map((med, idx) => `
                                    <tr>
                                        <td>
                                            <span class="med-name">${idx + 1}) ${med.name}</span>
                                        </td>
                                        <td>
                                            <div style="font-weight: 600;">${med.frequency}</div>
                                            <div class="instruction">(${med.instruction || 'After Food'})</div>
                                        </td>
                                        <td>
                                            <div style="font-weight: 700;">${med.duration} Days</div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        ${prescription?.notes ? `
                            <div class="advice">
                                <h3>Advice:</h3>
                                <ul>
                                    ${prescription.notes.split('\n').map(n => `<li>${n}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                         ${prescription?.followUpDate ? `
                             <div style="font-weight: 700; font-size: 12px; margin-top: 20px; text-transform: uppercase;">
                                Follow Up: ${new Date(prescription.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                        ` : ''}
                    ` : ''}
                    
                    <div class="footer-note">
                        <div class="sub-note">Substitute with equivalent Generics as required.</div>
                        <div class="site-link">newvenusclinic.com</div>
                    </div>
                </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
        </html>
    `;
};
