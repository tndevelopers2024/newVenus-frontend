import { findImageField, resolveImageUrl, isImagePrescription } from './documentUtils';

// Utility to generate HTML for printing documents
export const getUnifiedDocumentHTML = (data, type = 'prescription', previewMode = false) => {
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
                ${!previewMode ? '<button class="print-btn" onclick="window.print()">Print This Prescription</button>' : ''}
                <img src="${prescriptionImageUrl}" alt="Handwritten Prescription" />
                ${!previewMode ? `
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                        }, 1000);
                    }
                </script>` : ''}
            </body>
        </html>
        `;
    }

    // 4. STANDARD TEMPLATE (FALLBACK)
    const dateStr = new Date(data.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const patientName = prescription?.patient?.name || data.patient?.name || '';
    const patientAgeObj = prescription?.patient?.age || data.patient?.age;
    const patientGenderObj = prescription?.patient?.gender || data.patient?.gender;
    const patientAge = patientAgeObj ? patientAgeObj + ' Y' : '';
    const patientGender = patientGenderObj ? '(' + patientGenderObj[0] + ')' : '';
    const logoUrl = window.location.origin + '/images/venus-logo.webp';

    return `
        <html>
            <head>
                <title>Prescription - ${patientName}</title>
                <style>
                    @page { size: A4; margin: 0; }
                    body { font-family: Arial, Helvetica, sans-serif; padding: 0; margin: 0; color: #000; background: white; -webkit-print-color-adjust: exact; }
                    .page-content { padding: 40px 50px; min-height: 100vh; display: flex; flex-direction: column; box-sizing: border-box; }
                    
                    /* Header */
                    .header-text { text-align: center; color: #004b93; line-height: 1.4; margin-bottom: 5px; }
                    .header-title { font-size: 26px; font-weight: 900; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
                    .header-doctor { font-size: 17px; margin-bottom: 3px; }
                    .doctor-name { font-weight: bold; }
                    .header-tamil { font-size: 15px; margin-bottom: 3px; font-weight: normal; font-family: 'BAMINI-Tamil54', 'Latha', 'Arial Unicode MS', sans-serif; }
                    .header-quals { font-size: 15px; margin-bottom: 3px; font-weight: normal; }
                    .header-role { font-size: 15px; margin-bottom: 15px; text-transform: uppercase; font-weight: normal; }
                    
                    .header-sep { border-top: 1.5px solid #004b93; margin: 4px 0; }
                    
                    .header-meta { display: flex; justify-content: space-between; color: #004b93; font-size: 13px; font-weight: bold; padding: 5px 10px; }
                    
                    /* Patient Info */
                    .patient-info { display: flex; justify-content: space-between; color: #004b93; font-size: 16px; font-weight: bold; margin-top: 15px; padding: 0 10px; }
                    .patient-left { display: flex; flex-direction: column; gap: 8px; }
                    
                    /* Body / Clinical */
                    .clinical-section { margin-top: 30px; flex-grow: 1; padding: 0 10px; color: #000; }
                    .clinical-grid { display: flex; gap: 20px; padding-bottom: 15px; margin-bottom: 15px; }
                    .col { flex: 1; }
                    .col h3 { font-size: 14px; font-weight: bold; text-decoration: underline; margin: 0 0 5px 0; }
                    .colcontent { font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th { text-align: left; padding: 5px 0; font-size: 14px; font-weight: bold; border-bottom: 1px solid #000; }
                    td { padding: 10px 0; border-bottom: 1px dashed #ccc; font-size: 14px; vertical-align: top; }
                    
                    /* Footer */
                    .footer { color: #004b93; text-align: center; font-size: 13px; font-weight: bold; line-height: 1.6; padding-top: 15px; }
                    
                    .handwritten-fallback { margin-top: 20px; text-align: center; }
                    .handwritten-fallback img { max-width: 100%; height: auto; mix-blend-mode: multiply; }
                </style>
            </head>
            <body>
                <div class="page-content">
                    <!-- Header -->
                    <div class="header-text">
                        <img src="${logoUrl}" style="height: 50px; margin-bottom: 8px; display: inline-block;" />
                        <div class="header-doctor">Dr. <span class="doctor-name">C.R. MADHU PRABHU DOSS,</span> M.B.B.S., M.D., D.M., Cardiology</div>
                        <div class="header-tamil">டாக்டர். சி.ஆர். மது பிரபு தாஸ், எம்.பி.பி.எஸ்., எம்.டி., டி.எம்., கார்டியாலஜி</div>
                        <div class="header-quals">Interventions (Canada), FESC (Europe), FSCAI (US)</div>
                        <div class="header-role">SENIOR CONSULTANT INTERVENTIONAL CARDIOLOGIST</div>
                    </div>
                    
                    <div class="header-sep"></div>
                    <div class="header-meta">
                        <div>Regd. No. 65582</div>
                        <div>APOLLO HOSPITALS - OMR</div>
                    </div>
                    <div class="header-sep"></div>
                    
                    <!-- Patient Info -->
                    <div class="patient-info">
                        <div class="patient-left">
                            <div>Name : <span style="color:#000; font-weight:normal; margin-left: 10px;">${patientName} ${patientGender}</span></div>
                            <div>Age : <span style="color:#000; font-weight:normal; margin-left: 20px;">${patientAge || '-'}</span></div>
                        </div>
                        <div>
                            <div>Date : <span style="color:#000; font-weight:normal; margin-left: 10px;">${dateStr}</span></div>
                        </div>
                    </div>
                    
                    <!-- Clinical Info -->
                    <div class="clinical-section">
                        ${clinicalDetails?.vitals && (clinicalDetails.vitals.bloodPressure || clinicalDetails.vitals.pulse || clinicalDetails.vitals.spo2 || clinicalDetails.vitals.temperature || clinicalDetails.vitals.weight) ? `
                            <div style="font-size: 13px; margin-bottom: 20px; color: #4b5563;">
                                <strong>Vitals:</strong> BP: ${clinicalDetails.vitals.bloodPressure || '-'} mmHg, Pulse: ${clinicalDetails.vitals.pulse || '-'} bpm, SPO2: ${clinicalDetails.vitals.spo2 || '-'}%, Temp: ${clinicalDetails.vitals.temperature || '-'} °F, Weight: ${clinicalDetails.vitals.weight || '-'} Kg
                            </div>
                        ` : ''}

                        ${isPrescription ? `
                            ${(clinicalDetails?.diagnosis || clinicalDetails?.clinicalNotes) ? `
                                <div class="clinical-grid">
                                    <div class="col"><h3>Chief Complaints</h3><div class="colcontent">${clinicalDetails?.diagnosis || '-'}</div></div>
                                    <div class="col"><h3>Clinical Findings</h3><div class="colcontent">${clinicalDetails?.clinicalNotes || '-'}</div></div>
                                </div>
                            ` : ''}
                            
                            ${prescription?.medications?.length > 0 ? `
                                <div style="font-weight: bold; font-size: 24px; margin-bottom: 15px; font-family: 'Times New Roman', serif;">Rx</div>
                                <table>
                                    <thead><tr><th>Medicine Name</th><th>Frequency</th><th>Duration</th></tr></thead>
                                    <tbody>
                                        ${prescription.medications.map((med, idx) => `
                                            <tr>
                                                <td><span style="font-weight:bold;">${idx + 1}) ${med.name}</span></td>
                                                <td><div>${med.frequency}</div><div style="font-size:11px;">(${med.instruction || 'After Food'})</div></td>
                                                <td>${med.duration} Days</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : ''}
                            
                            ${prescriptionImageUrl ? `
                                <div class="handwritten-fallback">
                                    <img src="${prescriptionImageUrl}" />
                                </div>
                            ` : ''}
                        ` : ''}
                    </div>
                    
                    <!-- Footer -->
                    <div class="header-sep" style="margin-top: auto;"></div>
                    <div class="footer">
                        <div>CLINIC: 200, Sri Subiksham Flats, Chitlapakkam Main Road, Ganesh Nagar, Selaiyur, Chennai - 600 073.</div>
                        <div>Ph. 70103 15857 / 77083 17826 / 81480 70207</div>
                        <div>TIMING: Morning - 10am to 12.30 pm / Evening - 6.00 pm to 9.00 pm</div>
                    </div>
                </div>
                ${!previewMode ? `
                <script>
                    window.onload = function() { window.print(); }
                </script>` : ''}
            </body>
        </html>
    `;
};
