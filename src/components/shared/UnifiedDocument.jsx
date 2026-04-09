import { findImageField, resolveImageUrl, isImagePrescription } from '../../utils/documentUtils';

export const UnifiedDocument = ({ data, type = 'prescription' }) => {
    const isPrescription = type === 'prescription';
    const dateStr = new Date(data.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const { prescription, clinicalDetails } = data;
    
    // Unify logic using documentUtils
    const imagePath = findImageField(data);
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
                     window.localStorage.getItem('api_url') || 
                     'http://localhost:5003/api';
    const prescriptionImageUrl = resolveImageUrl(imagePath, apiBase);
    const showImageOnly = isImagePrescription(data, type);

    const doctorName = prescription?.doctor?.name || data.doctor?.name || 'Medical Officer';
    const patientName = prescription?.patient?.name || data.patient?.name || 'Patient';
    const patientId = prescription?.patient?.displayId || data.patient?.displayId || 'N/A';
    const patientGender = prescription?.patient?.gender ? `(${prescription.patient.gender[0]})` : '';
    const patientAge = prescription?.patient?.age ? `/ ${prescription.patient.age} Y` : '';

    // If an image is provided, display only the handwritten image spanning the entire prescription
    if (showImageOnly && prescriptionImageUrl) {
        return (
            <div className="page-content bg-white min-h-screen p-0 m-0 flex justify-center items-center w-full relative">
                <img 
                    src={prescriptionImageUrl} 
                    alt="Handwritten Prescription" 
                    className="max-w-full h-auto max-h-screen object-contain"
                />
                <style>{`
                    @media print {
                        @page { size: A4; margin: 0; }
                        body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
                        .page-content { padding: 0 !important; margin: 0 !important; }
                    }
                `}</style>
            </div>
        );
    }

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

            {/* Patient Info */}
            <div className="flex justify-between items-end mb-1 text-sm font-bold uppercase tracking-tight">
                <div className="flex flex-wrap gap-x-4">
                    <span>ID: {patientId} - {patientName} {patientGender} {patientAge}</span>
                    <span>Mob. No.: {prescription?.patient?.phone || data.patient?.phone || ''}</span>
                </div>
                <div>Date: {dateStr}</div>
            </div>

            {/* Vitals Line */}
            {clinicalDetails?.vitals ? (
                <div className="border-b-2 border-black pb-3 mb-4 text-xs font-bold uppercase">
                    Weight (Kg): {clinicalDetails.vitals.weight || '-'}, 
                    Height (Cm): {clinicalDetails.vitals.height || '-'}, 
                    BP: {clinicalDetails.vitals.bloodPressure || '-'} mmHg
                </div>
            ) : <div className="border-b-2 border-black mb-4"></div>}

            {isPrescription ? (
                <>
                    {/* Clinical Details */}
                    <div className="grid grid-cols-2 gap-8 border-b-2 border-black pb-4 mb-4">
                        <div>
                            <h3 className="text-xs font-bold underline mb-1 uppercase">Chief Complaints</h3>
                            <div className="text-[11px] font-semibold uppercase pl-1">
                                {clinicalDetails?.diagnosis || '-'}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold underline mb-1 uppercase">Clinical Findings</h3>
                            <div className="text-[11px] font-semibold uppercase pl-1">
                                {clinicalDetails?.clinicalNotes || '-'}
                            </div>
                        </div>
                    </div>

                    <div className="text-lg font-bold mb-2">Rx</div>

                    {/* Medications Table */}
                    <table className="w-full mb-6 border-b-2 border-black">
                        <thead>
                            <tr className="border-b-2 border-black text-left">
                                <th className="py-1 text-xs font-bold uppercase w-[45%]">Medicine Name</th>
                                <th className="py-1 text-xs font-bold uppercase w-[35%]">Frequency</th>
                                <th className="py-1 text-xs font-bold uppercase w-[20%]">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(prescription?.medications || []).length > 0 ? (
                                prescription.medications.map((med, idx) => (
                                    <tr key={idx} className="border-b border-gray-400">
                                        <td className="py-3">
                                            <span className="font-bold text-[13px] uppercase">{idx + 1}) {med.name}</span>
                                        </td>
                                        <td className="py-3">
                                            <div className="font-semibold text-xs tracking-tight uppercase">{med.frequency}</div>
                                            <div className="text-[10px] text-gray-500 font-medium uppercase">({med.instruction || 'After Food'})</div>
                                        </td>
                                        <td className="py-3">
                                            <div className="font-bold text-sm tracking-tight uppercase">{med.duration} Days</div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="py-8 text-center text-gray-400 font-medium uppercase text-xs">
                                        Digital Prescription medications not specified.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Advice / Notes */}
                    {prescription?.notes && (
                        <div className="mb-4">
                            <h3 className="text-xs font-bold underline mb-1 uppercase">Advice:</h3>
                            <ul className="list-none p-0 m-0">
                                {prescription.notes.split('\n').map((note, i) => (
                                    <li key={i} className="text-[11px] font-bold uppercase pl-1 leading-relaxed">
                                        {note}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Fallback Image in Standard Template (if any) */}
                    {prescriptionImageUrl && (
                        <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-300">
                            <h3 className="font-bold text-sm underline mb-4 uppercase">Handwritten Prescription Attachment:</h3>
                            <img src={prescriptionImageUrl} alt="Prescription" className="max-w-full h-auto border border-gray-100 shadow-sm" />
                        </div>
                    )}

                    {/* Follow Up */}
                    {prescription?.followUpDate && (
                        <div className="mt-4 font-bold text-xs uppercase">
                            Follow Up: {new Date(prescription.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                    )}
                </>
            ) : (
                <div className="flex-grow">
                     <p className="text-sm text-gray-600">Document content not available.</p>
                </div>
            )}
            
            {/* Footer */}
            <div className="mt-auto pt-4 text-center">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-2">
                    Substitute with equivalent Generics as required.
                </div>
                <div className="text-sm font-bold text-blue-800 uppercase tracking-[0.2em] border-t border-black pt-3">
                    newvenusclinic.com
                </div>
            </div>
        </div>
    );
};
