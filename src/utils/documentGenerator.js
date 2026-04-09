import { findImageField, resolveImageUrl, isImagePrescription } from './documentUtils';

// Utility to generate HTML for printing documents
export const getUnifiedDocumentHTML = (data, type = 'prescription') => {
    const isPrescription = type === 'prescription';
    const { prescription, clinicalDetails } = data;
    
    // 1. EXTRACT IMAGE PATH - USE SHARED UTILS
    const imagePath = findImageField(data);
    
    // 2. RESOLVE API BASE URL
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
                     window.localStorage.getItem('api_url') || 
                     'http://localhost:5003/api';
    const prescriptionImageUrl = resolveImageUrl(imagePath, apiBase);
    const showImageOnly = isImagePrescription(data, type);

    // 3. IMAGE-ONLY MODE (PRIORITY)
    if (showImageOnly && prescriptionImageUrl) {
        const patientName = prescription?.patient?.name || data.patient?.name || 'Patient';
        return `
        <html>
            <head>
                <title>Prescription - ${patientName}</title>
                <style>
                    @page { size: A4; margin: 0; }
                    body { font-family: sans-serif; padding: 0; margin: 0; background: white; -webkit-print-color-adjust: exact; display: flex; justify-content: center; align-items: start; width: 100%; min-height: 100vh; }
                    img { max-width: 100%; width: 100%; height: auto; object-fit: contain; display: block; }
                    .print-btn { position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 5px; cursor: pointer; display: block; font-weight: bold; z-index: 9999; }
                    @media print { .print-btn { display: none; } }
                </style>
            </head>
            <body>
                <button class="print-btn" onclick="window.print()">Print This Prescription</button>
                <img src="${prescriptionImageUrl}" alt="Handwritten Prescription" />
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                        }, 1000);
                    }
                </script>
            </body>
        </html>
        `;
    }

    // 4. STANDARD TEMPLATE (FALLBACK)
    const dateStr = new Date(data.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const doctorName = prescription?.doctor?.name || data.doctor?.name || 'Medical Officer';
    const patientName = prescription?.patient?.name || data.patient?.name || 'Patient';
    const patientId = prescription?.patient?.displayId || data.patient?.displayId || 'N/A';
    const patientGender = prescription?.patient?.gender ? '(' + prescription.patient.gender[0] + ')' : '';
    const patientAge = prescription?.patient?.age ? '/ ' + prescription.patient.age + ' Y' : '';
    const patientPhone = prescription?.patient?.phone || '';
    const logoUrl = window.location.origin + '/images/venus-logo.webp';

    return `
        <html>
            <head>
                <title>Prescription - ${patientName}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    @page { size: A4; margin: 0; }
                    body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #000; background: white; -webkit-print-color-adjust: exact; }
                    .page-content { padding: 40px 50px; min-height: 100vh; display: flex; flex-direction: column; box-sizing: border-box; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
                    .doc-info { width: 50%; }
                    .doc-name { font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 0; }
                    .clinic-info { width: 50%; text-align: right; display: flex; justify-content: flex-end; gap: 10px; }
                    .clinic-details h2 { font-size: 16px; font-weight: 700; color: #1e40af; text-transform: uppercase; margin: 0 0 5px 0; }
                    .clinic-details p { font-size: 10px; margin: 2px 0; color: #1f2937; line-height: 1.25; font-weight: 500; }
                    .patient-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 5px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                    .patient-details { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
                    .clinical-grid { display: flex; gap: 20px; border-bottom: 20px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
                    .col { flex: 1; }
                    .col h3 { font-size: 12px; font-weight: 700; text-decoration: underline; margin: 0 0 5px 0; text-transform: uppercase; }
                    .colcontent { font-size: 11px; text-transform: uppercase; font-weight: 600; padding-left: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 2px solid #000; }
                    th { text-align: left; border-bottom: 2px solid #000; padding: 5px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                    td { padding: 12px 0; border-bottom: 1px solid #9ca3af; font-size: 12px; vertical-align: top; }
                    .footer-note { margin-top: auto; padding-top: 10px; text-align: center; }
                    .site-link { font-size: 12px; color: #1e40af; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; border-top: 1px solid #000; padding-top: 10px; width: 100%; display: block; }
                    .handwritten-fallback { margin-top: 20px; border: 1px dashed #ccc; padding: 20px; text-align: center; }
                    .handwritten-fallback img { max-width: 100%; height: auto; }
                </style>
            </head>
            <body>
                <div class="page-content">
                    <div class="header">
                        <div class="doc-info"><h1 class="doc-name">Dr. ${doctorName}</h1></div>
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
                             <span>Weight (Kg): ${clinicalDetails.vitals.weight || '-'}, Height (Cm): ${clinicalDetails.vitals.height || '-'}, BP: ${clinicalDetails.vitals.bloodPressure || '-'} mmHg</span>
                        </div>
                    ` : '<div style="margin-bottom: 20px;"></div>'}

                    ${isPrescription ? `
                        <div class="clinical-grid">
                            <div class="col"><h3>Chief Complaints</h3><div class="colcontent">${clinicalDetails?.diagnosis || '-'}</div></div>
                            <div class="col"><h3>Clinical Findings</h3><div class="colcontent">${clinicalDetails?.clinicalNotes || '-'}</div></div>
                        </div>
                        <div style="font-weight: 700; font-size: 18px; margin-bottom: 10px;">Rx</div>
                        <table>
                            <thead><tr><th>Medicine Name</th><th>Frequency</th><th>Duration</th></tr></thead>
                            <tbody>
                                ${prescription?.medications?.length > 0 ? prescription.medications.map((med, idx) => `
                                    <tr>
                                        <td><span style="font-weight:700;">${idx + 1}) ${med.name}</span></td>
                                        <td><div>${med.frequency}</div><div style="font-size:10px;">(${med.instruction || 'After Food'})</div></td>
                                        <td>${med.duration} Days</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="3" style="text-align:center; padding: 20px;">Digital Prescription medications not specified.</td></tr>'}
                            </tbody>
                        </table>
                        ${prescriptionImageUrl ? `
                            <div class="handwritten-fallback">
                                <h3 style="font-size: 12px; margin-bottom: 10px; text-decoration: underline;">Handwritten Prescription Attachment:</h3>
                                <img src="${prescriptionImageUrl}" />
                            </div>
                        ` : ''}
                    ` : ''}
                    
                    <div class="footer-note">
                        <div style="font-size: 10px; color: #6b7280; font-weight: 700; margin-bottom: 10px;">Substitute with equivalent Generics as required.</div>
                        <div class="site-link">newvenusclinic.com</div>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
        </html>
    `;
};
