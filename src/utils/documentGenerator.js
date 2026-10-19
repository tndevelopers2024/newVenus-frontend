import { findImageField, resolveImageUrl, isImagePrescription, formatMedicationDuration } from './documentUtils';

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
                    ${previewMode ? `
                    html, body { width: 100%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; background: transparent; }
                    .preview-wrapper {
                        width: 794px;
                        height: 1123px;
                        background: white;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                        transform-origin: center center;
                        overflow: hidden;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        transition: transform 0.1s ease-out;
                    }
                    img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
                    ` : ``}
                </style>
            </head>
            <body>
                ${!previewMode ? '<button class="print-btn" onclick="window.print()">Print This Prescription</button>' : ''}
                ${previewMode ? `
                <div class="preview-wrapper">
                    <img src="${prescriptionImageUrl}" alt="Handwritten Prescription" />
                </div>
                ` : `
                <img src="${prescriptionImageUrl}" alt="Handwritten Prescription" />
                `}
                ${previewMode ? `
                <script>
                    function adjustScale() {
                        const wrapper = document.querySelector('.preview-wrapper');
                        if (wrapper) {
                            const scale = Math.min(window.innerWidth / 820, window.innerHeight / 1150);
                            wrapper.style.transform = 'scale(' + scale + ')';
                        }
                    }
                    window.addEventListener('resize', adjustScale);
                    window.onload = adjustScale;
                    // Run immediately as well
                    adjustScale();
                </script>
                ` : ''}
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
    const patientGender = patientGenderObj ? patientGenderObj : '-';
    const logoUrl = window.location.origin + '/images/venus-logo.webp';
    
    const doctorObj = prescription?.doctor || data.doctor;
    let doctorName = doctorObj?.name ? doctorObj.name.toUpperCase() : 'DR. C.R. MADHU PRABHU DOSS';
    doctorName = doctorName.replace(/^DR\.?\s*DR\.?\s*/i, 'DR. ');
    
    // Check if the doctor has customized details saved (meaning they were set via Admin UI)
    const hasDetails = !!doctorObj?.doctorDetails;
    
    const doctorQuals = hasDetails ? (doctorObj.doctorDetails.qualification || '') : 'M.B.B.S., M.D., D.M., Cardiology';
    const doctorTamil = hasDetails ? (doctorObj.doctorDetails.nameTamil || '') : 'டாக்டர். சி.ரா. மது பிரபு தாஸ், எம்.பி.பி.எஸ்., எம்.டி., டி.எம்., கார்டியாலஜி';
    const doctorAddQuals = hasDetails ? (doctorObj.doctorDetails.additionalQualifications || '') : 'Interventions (Canada), FESC (Europe), FSCAI (US)';
    const doctorRole = hasDetails ? (doctorObj.doctorDetails.roleTitle || '') : 'SENIOR CONSULTANT INTERVENTIONAL CARDIOLOGIST';
    const doctorRegd = hasDetails ? (doctorObj.doctorDetails.regdNo || '') : 'Regd. No. 65502';

    const renderDiv = (val, className) => val ? `<div class="${className}">${val}</div>` : '';

    return `
        <html>
            <head>
                <title>Prescription - ${patientName}</title>
                <style>
                    @page { size: A4; margin: 0; }
                    body { font-family: Arial, Helvetica, sans-serif; padding: 0; margin: 0; color: #000; background: white; -webkit-print-color-adjust: exact; }
                    .page-content { padding: 32px 45px; min-height: 100vh; display: flex; flex-direction: column; box-sizing: border-box; }
                    
                    /* Header */
                    .header-text { text-align: center; color: #004b93; line-height: 1.4; margin-bottom: 5px; }
                    .header-title { font-family: 'Times New Roman', Times, Baskerville, Georgia, serif; font-size: 34px; font-weight: 900; -webkit-text-stroke: 1.2px #004b93; text-stroke: 1.2px #004b93; letter-spacing: 2.5px; margin-bottom: 6px; text-transform: uppercase; color: #004b93; }
                    .header-doctor { font-size: 17px; margin-bottom: 3px; font-weight: 900; }
                    .doctor-name { font-weight: 900; }
                    .header-tamil { font-size: 15px; margin-bottom: 3px; font-weight: 900; font-family: 'BAMINI-Tamil54', 'Latha', 'Arial Unicode MS', sans-serif; }
                    .header-quals { font-size: 15px; margin-bottom: 3px; font-weight: 900; }
                    .header-role { font-size: 15px; margin-bottom: 8px; text-transform: uppercase; font-weight: 900; }
                    
                    .header-sep { border-top: 1.5px solid #004b93; margin: 4px 0; }
                    
                    .header-meta { display: flex; justify-content: space-between; color: #004b93; font-size: 13px; font-weight: bold; padding: 4px 10px; }
                    
                    /* Patient Info */
                    .patient-info { display: flex; justify-content: space-between; color: #004b93; font-size: 15px; font-weight: bold; margin-top: 10px; padding: 0 10px; }
                    .patient-left { display: flex; flex-direction: column; gap: 4px; }
                    
                    /* Body / Clinical */
                    .clinical-section { margin-top: 14px; flex-grow: 1; padding: 0 10px; color: #000; }
                    .clinical-grid { display: flex; gap: 20px; padding-bottom: 6px; margin-bottom: 6px; }
                    .col { flex: 1; }
                    .col h3 { font-size: 13px; font-weight: bold; text-decoration: underline; margin: 0 0 3px 0; }
                    .colcontent { font-size: 13px; line-height: 1.3; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                    th { text-align: left; padding: 4px 0 6px 0; font-size: 13px; font-weight: bold; border-bottom: 1.5px solid #000; }
                    td { padding: 4px 0 5px 0; border-bottom: 1px dashed #d1d5db; font-size: 13px; vertical-align: middle; }
                    
                    /* Footer */
                    .footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 8px; color: #004b93; }
                    .footer-logo { flex-shrink: 0; display: flex; align-items: center; }
                    .footer-logo img { height: 45px; width: auto; object-fit: contain; display: block; }
                    .footer-details { flex: 1; text-align: center; font-size: 11.5px; font-weight: bold; line-height: 1.45; }
                    
                    .handwritten-fallback { margin-top: 15px; text-align: center; }
                    .handwritten-fallback img { max-width: 100%; height: auto; mix-blend-mode: multiply; }
                    
                    ${previewMode ? `
                    html, body { width: 100%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; background: transparent; }
                    .preview-wrapper {
                        width: 794px;
                        height: 1123px;
                        background: white;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                        transform-origin: center center;
                        overflow: hidden;
                        box-sizing: border-box;
                        transition: transform 0.1s ease-out;
                    }
                    .page-content { padding: 32px 45px; height: 100%; display: flex; flex-direction: column; box-sizing: border-box; }
                    ` : `
                    .preview-wrapper { width: 100%; }
                    .page-content { padding: 32px 45px; min-height: 100vh; display: flex; flex-direction: column; box-sizing: border-box; }
                    `}
                </style>
            </head>
            <body>
                <div class="preview-wrapper">
                    <div class="page-content">
                        <!-- Header -->
                    <div class="header-text">
                        <div class="header-title">NEW VENUS CLINIC</div>
                        <div class="header-doctor"><span class="doctor-name">${doctorName}</span>${doctorQuals ? `, ${doctorQuals}` : ''}</div>
                        ${renderDiv(doctorTamil, 'header-tamil')}
                        ${renderDiv(doctorAddQuals, 'header-quals')}
                        ${renderDiv(doctorRole, 'header-role')}
                    </div>
                    
                    <div class="header-sep"></div>
                    <div class="header-meta">
                        <div>${doctorRegd}</div>
                        <div>APOLLO HOSPITALS - OMR</div>
                    </div>
                    <div class="header-sep"></div>
                    
                    <!-- Patient Info -->
                    <div class="patient-info">
                        <div class="patient-left">
                            <div>Name : <span style="color:#000; font-weight:normal; margin-left: 10px;">${patientName}</span></div>
                            <div>Age : <span style="color:#000; font-weight:normal; margin-left: 23px;">${patientAge || '-'}</span></div>
                            <div>Gender : <span style="color:#000; font-weight:normal; margin-left: 5px;">${patientGender}</span></div>
                        </div>
                        <div>
                            <div>Date : <span style="color:#000; font-weight:normal; margin-left: 10px;">${dateStr}</span></div>
                        </div>
                    </div>
                    
                    <!-- Clinical Info -->
                    <div class="clinical-section">
                        ${clinicalDetails?.vitals && (clinicalDetails.vitals.bloodPressure || clinicalDetails.vitals.pulse || clinicalDetails.vitals.spo2 || clinicalDetails.vitals.temperature || clinicalDetails.vitals.weight) ? `
                            <div style="margin-bottom: 14px;">
                                <div style="display: flex; gap: 20px; flex-wrap: wrap; background-color: #f8fafc; padding: 10px 14px; border-radius: 8px; font-size: 13px; border-left: 4px solid #004b93;">
                                    ${clinicalDetails.vitals.bloodPressure ? `<div><span style="color: #64748b; font-weight: bold; margin-right: 4px;">BP:</span><span style="font-weight: bold; color: #0f172a;">${clinicalDetails.vitals.bloodPressure}</span> <span style="color: #64748b; font-size: 11px;">mmHg</span></div>` : ''}
                                    ${clinicalDetails.vitals.pulse ? `<div><span style="color: #64748b; font-weight: bold; margin-right: 4px;">Pulse:</span><span style="font-weight: bold; color: #0f172a;">${clinicalDetails.vitals.pulse}</span> <span style="color: #64748b; font-size: 11px;">bpm</span></div>` : ''}
                                    ${clinicalDetails.vitals.spo2 ? `<div><span style="color: #64748b; font-weight: bold; margin-right: 4px;">SpO2:</span><span style="font-weight: bold; color: #0f172a;">${clinicalDetails.vitals.spo2}</span> <span style="color: #64748b; font-size: 11px;">%</span></div>` : ''}
                                    ${clinicalDetails.vitals.temperature ? `<div><span style="color: #64748b; font-weight: bold; margin-right: 4px;">Temp:</span><span style="font-weight: bold; color: #0f172a;">${clinicalDetails.vitals.temperature}</span> <span style="color: #64748b; font-size: 11px;">°F</span></div>` : ''}
                                    ${clinicalDetails.vitals.weight ? `<div><span style="color: #64748b; font-weight: bold; margin-right: 4px;">Weight:</span><span style="font-weight: bold; color: #0f172a;">${clinicalDetails.vitals.weight}</span> <span style="color: #64748b; font-size: 11px;">Kg</span></div>` : ''}
                                </div>
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
                                <div style="font-weight: bold; font-size: 20px; margin-bottom: 6px; font-family: 'Times New Roman', serif;">Rx</div>
                                <table>
                                    <thead><tr>
                                        <th style="width: 46%;">Medicine Name</th>
                                        <th style="width: 36%;">Frequency<br/><span style="font-size:9.5px; font-weight:normal; color:#4b5563;">(Morning-Afternoon-Evening)</span></th>
                                        <th style="width: 18%;">Duration</th>
                                    </tr></thead>
                                    <tbody>
                                        ${prescription.medications.map((med, idx) => `
                                            <tr>
                                                <td style="padding: 4px 0;"><span style="font-weight:bold; text-transform:uppercase;">${idx + 1}) ${med.name}</span></td>
                                                <td style="padding: 4px 0;"><div style="line-height: 1.25;">${med.frequency}${med.unit && med.unit !== '-' ? ` ${med.unit}` : ''}</div><div style="font-size:11px; color:#4b5563; line-height: 1.2;">(${med.instruction || 'After Food'})</div></td>
                                                <td style="padding: 4px 0;"><span>${formatMedicationDuration(med.duration, med.durationUnit)}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : ''}

                            ${prescription?.notes ? `
                                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                                    <strong style="font-size: 13px;">Instructions / Remarks:</strong>
                                    <div style="margin-top: 2px; font-size: 13px; white-space: pre-wrap; line-height: 1.3;">${prescription.notes}</div>
                                </div>
                            ` : ''}

                            ${prescription?.followUpDate ? `
                                <div style="margin-top: 8px; font-size: 13px;">
                                    <strong>Follow-up Date:</strong> <span>${new Date(prescription.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                </div>
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
                        <div class="footer-logo">
                            <img src="${logoUrl}" alt="New Venus Clinic Logo" />
                        </div>
                        <div class="footer-details">
                            <div>CLINIC: 200, Sri Subiksham Flats, Chitlapakkam Main Road, Ganesh Nagar, Selaiyur, Chennai - 600 073.</div>
                            <div>Ph. 70103 15857 / 77083 17826</div>
                            <div>TIMING: Morning - 10am to 12.30 pm / Evening - 6.00 pm to 9.00 pm</div>
                        </div>
                    </div>
                </div>
                </div>
                ${previewMode ? `
                <script>
                    function adjustScale() {
                        const wrapper = document.querySelector('.preview-wrapper');
                        if (wrapper) {
                            const scale = Math.min(window.innerWidth / 820, window.innerHeight / 1150);
                            wrapper.style.transform = 'scale(' + scale + ')';
                        }
                    }
                    window.addEventListener('resize', adjustScale);
                    window.onload = adjustScale;
                    // Run immediately as well
                    adjustScale();
                </script>
                ` : ''}
                ${!previewMode ? `
                <script>
                    window.onload = function() { window.print(); }
                </script>` : ''}
            </body>
        </html>
    `;
};
