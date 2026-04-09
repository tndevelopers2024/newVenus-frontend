import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Activity,
    Stethoscope,
    Plus,
    Trash2,
    Send,
    ArrowLeft,
    Search,
    User,
    Printer,
    Calendar,
    Image as ImageIcon,
    UploadCloud,
    FileText,
    Mail,
    Share2,
    CheckCircle2,
    X
} from 'lucide-react';
import { doctorApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getUnifiedDocumentHTML } from '../../utils/documentGenerator';
import { UnifiedDocument } from '../../components/shared/UnifiedDocument';
import CalendarDatePicker from '../../components/ui/CalendarDatePicker';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ClinicalSession = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Vitals and clinical state
    const [medications, setMedications] = useState([{ name: '', frequency: '', duration: '', instruction: 'After Food' }]);
    const [medicationToDelete, setMedicationToDelete] = useState(null);
    const [notes, setNotes] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [prescriptionImage, setPrescriptionImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [prescriptionMode, setPrescriptionMode] = useState('digital'); // 'digital' or 'handwritten'
    const [isFinalized, setIsFinalized] = useState(false);
    const [prescribedData, setPrescribedData] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [vitals, setVitals] = useState({
        bloodPressure: '',
        temperature: '',
        pulse: '',
        weight: ''
    });

    // Fetch appointment data
    const { data: appointment, isLoading: isLoadingAppt } = useQuery({
        queryKey: ['appointment', appointmentId],
        queryFn: async () => {
            const res = await doctorApi.getAppointments();
            return res.data.find(a => a._id === appointmentId);
        }
    });

    // Sync initial vitals from appointment
    useEffect(() => {
        if (appointment?.vitals) {
            setVitals({
                bloodPressure: appointment.vitals.bloodPressure || '',
                temperature: appointment.vitals.temperature || '',
                pulse: appointment.vitals.pulse || '',
                weight: appointment.vitals.weight || ''
            });
        }
    }, [appointment]);

    const prescribeMutation = useMutation({
        mutationFn: (data) => doctorApi.createPrescription(data),
        onSuccess: (response) => {
            const savedPrescription = response.data || response;
            toast.success('Clinical session finalized');
            setIsFinalized(true);
            setPrescribedData(savedPrescription);
            setShareEmail(appointment?.patient?.email || '');
            queryClient.invalidateQueries(['doctorAppointments']);

            // Auto-trigger print window
            // Create a temporary object URL if there's a local file (failsafe for immediate print)
            const localImageUrl = prescriptionImage ? URL.createObjectURL(prescriptionImage) : null;

            const printData = {
                createdAt: new Date(),
                prescription: {
                    ...savedPrescription,
                    doctor: appointment?.doctor,
                    patient: appointment?.patient,
                    image: localImageUrl || savedPrescription.image // Prioritize local URL for immediate print
                },
                clinicalDetails: {
                    vitals: vitals,
                    diagnosis: diagnosis,
                    clinicalNotes: clinicalNotes
                }
            };
            const html = getUnifiedDocumentHTML(printData, 'prescription');
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
            }
        },
        onError: () => toast.error('Failed to finalize session')
    });

    const shareMutation = useMutation({
        mutationFn: ({ id, email }) => doctorApi.sharePrescription(id, email),
        onSuccess: () => {
            toast.success('Prescription shared via email');
            setShowShareModal(false);
        },
        onError: () => toast.error('Failed to share prescription')
    });

    const handleShare = () => {
        if (!shareEmail) return toast.error('Please enter an email address');
        shareMutation.mutate({ id: prescribedData?._id, email: shareEmail });
    };

    const addMedication = () => {
        setMedications([...medications, { name: '', frequency: '', duration: '', instruction: 'After Food' }]);
    };

    const removeMedication = (index) => {
        setMedicationToDelete(index);
    };

    const confirmRemoveMedication = () => {
        if (medicationToDelete !== null) {
            setMedications(medications.filter((_, i) => i !== medicationToDelete));
            setMedicationToDelete(null);
        }
    };

    const cancelRemoveMedication = () => {
        setMedicationToDelete(null);
    };

    const handleMedChange = (index, field, value) => {
        const newMeds = [...medications];
        newMeds[index][field] = value;
        setMedications(newMeds);
    };

    const handleFrequencyPartChange = (index, partIndex, value) => {
        const newMeds = [...medications];
        const currentFreq = newMeds[index].frequency || '0-0-0';
        const parts = currentFreq.split('-');
        parts[partIndex] = value || '0';
        newMeds[index].frequency = parts.join('-');
        setMedications(newMeds);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPrescriptionImage(file);
            setPrescriptionMode('handwritten');
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setPrescriptionImage(null);
        setImagePreview(null);
    };

    const hasVitals = Object.values(vitals).some(v => v && v.trim() !== '');
    const hasMedications = medications.some(m => m.name && m.name.trim() !== '');
    const hasImage = !!prescriptionImage;
    
    // Validation based on active mode
    const isFormValid = hasVitals && (
        (prescriptionMode === 'digital' && hasMedications) || 
        (prescriptionMode === 'handwritten' && hasImage)
    );

    const handleSubmit = () => {
        const toastId = toast.loading('Finalizing clinical session and generating prescription...');
        const formData = new FormData();
        formData.append('patientId', appointment.patient?._id);
        formData.append('appointmentId', appointment._id);
        formData.append('notes', notes);
        formData.append('diagnosis', diagnosis);
        formData.append('clinicalNotes', clinicalNotes);
        formData.append('followUpDate', followUpDate);

        // Medications and Vitals must be stringified for FormData
        const filteredMeds = prescriptionMode === 'digital' ? medications.filter(m => m.name.trim() !== '') : [];
        formData.append('medications', JSON.stringify(filteredMeds));
        formData.append('vitals', JSON.stringify(vitals));

        if (prescriptionMode === 'handwritten' && prescriptionImage) {
            formData.append('image', prescriptionImage);
        }

        prescribeMutation.mutate(formData, {
            onSettled: () => toast.dismiss(toastId)
        });
    };

    if (isLoadingAppt) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] opacity-50">
                    <Activity className="w-12 h-12 text-primary-500 animate-pulse mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Loading Clinical Session...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!appointment) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <p className="text-slate-400">Appointment not found.</p>
                    <button onClick={() => navigate('/doctor/appointments')} className="mt-4 text-primary-600 font-bold hover:underline">Back to Appointments</button>
                </div>
            </DashboardLayout>
        );
    }

    if (isFinalized) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto py-12 px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-primary-100/50 p-12 text-center"
                    >
                        <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-black text-secondary-900 uppercase tracking-tight mb-4">Prescription Finalized</h2>
                        <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto">
                            The clinical record for <span className="text-secondary-900 font-bold">{appointment.patient?.name}</span> has been securely saved and the prescription is ready.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <button
                                onClick={() => {
                                    const localImageUrl = prescriptionImage ? URL.createObjectURL(prescriptionImage) : null;
                                    const printData = {
                                        createdAt: new Date(),
                                        prescription: {
                                            ...prescribedData,
                                            doctor: appointment?.doctor,
                                            patient: appointment?.patient,
                                            image: localImageUrl || prescribedData?.image
                                        },
                                        clinicalDetails: {
                                            vitals: prescribedData?.vitals || vitals,
                                            diagnosis: prescribedData?.diagnosis || diagnosis,
                                            clinicalNotes: prescribedData?.clinicalNotes || clinicalNotes
                                        }
                                    };
                                    const html = getUnifiedDocumentHTML(printData, 'prescription');
                                    const printWindow = window.open('', '_blank');
                                    if (printWindow) {
                                        printWindow.document.write(html);
                                        printWindow.document.close();
                                    }
                                }}
                                className="flex items-center gap-3 px-8 py-5 bg-secondary-900 text-white rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95"
                            >
                                <Printer className="w-5 h-5" />
                                Print Now
                            </button>
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="flex items-center gap-3 px-8 py-5 bg-white border-2 border-primary-100 text-primary-600 rounded-[24px] font-black uppercase text-xs tracking-widest hover:border-primary-300 shadow-lg shadow-primary-50 transition-all active:scale-95"
                            >
                                <Share2 className="w-5 h-5" />
                                Share via Email
                            </button>
                            <button
                                onClick={() => navigate('/doctor/appointments')}
                                className="flex items-center gap-3 px-8 py-5 bg-slate-50 text-slate-500 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Return to List
                            </button>
                        </div>
                    </motion.div>

                    {/* Share Modal */}
                    <AnimatePresence>
                        {showShareModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowShareModal(false)}
                                    className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-primary-50 rounded-[24px] flex items-center justify-center mb-6">
                                            <Mail className="w-8 h-8 text-primary-600" />
                                        </div>
                                        <h2 className="text-xl font-black text-secondary-900 uppercase tracking-tight mb-2">Email Prescription</h2>
                                        <p className="text-sm text-slate-500 mb-8 max-w-[280px]">
                                            A digital copy will be sent to the patient.
                                        </p>

                                        <div className="w-full space-y-4">
                                            <div className="text-left">
                                                <label className="text-[10px] font-black text-secondary-900 uppercase tracking-widest mb-1.5 ml-1 block">Patient Email Address</label>
                                                <input
                                                    type="email"
                                                    value={shareEmail}
                                                    onChange={(e) => setShareEmail(e.target.value)}
                                                    placeholder="Enter email..."
                                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-secondary-900"
                                                />
                                            </div>

                                            <button
                                                onClick={handleShare}
                                                disabled={shareMutation.isPending}
                                                className="w-full py-5 bg-primary-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                            >
                                                {shareMutation.isPending ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        Send to Patient
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto py-6 px-4">
                {/* Header & Patient Info Combined */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/doctor/appointments')}
                            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-secondary-900 uppercase tracking-tight">Clinical Session</h1>
                            <div className="flex items-center gap-3">
                                <p className="text-sm font-bold text-slate-700">{appointment.patient?.name}</p>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">#{appointment.patient?.displayId}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Appointment Date</span>
                            <span className="font-bold text-secondary-900">{new Date(appointment.date).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-widest">Reason</span>
                            <span className="font-bold text-secondary-900">{appointment.reason || 'General'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">

                    {/* Vitals Grid - Compact */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(vitals).map(([key, value]) => (
                            <div key={key} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                                    placeholder={key === 'bloodPressure' ? '120/80' : '-'}
                                    value={value}
                                    onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Medications - Compact List */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-colors ${prescriptionMode === 'digital' ? 'bg-secondary-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-lg font-black text-secondary-900 uppercase tracking-tight">Medications</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital Prescription Mode</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {prescriptionMode !== 'digital' && (
                                        <button
                                            onClick={() => setPrescriptionMode('digital')}
                                            className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all"
                                        >
                                            Use Digital
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            addMedication();
                                            setPrescriptionMode('digital');
                                        }}
                                        className="px-4 py-2 bg-secondary-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Drug
                                    </button>
                                </div>
                            </div>

                            <div className={`space-y-4 transition-all duration-500 ${prescriptionMode === 'handwritten' ? 'opacity-20 pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
                                <AnimatePresence mode="popLayout">
                                    {medications.map((med, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="grid grid-cols-12 gap-3 items-end p-3 bg-slate-50/50 rounded-2xl border border-slate-100"
                                        >
                                            <div className="col-span-4 relative">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block ml-1">Drug Name</label>
                                                <input
                                                    value={med.name}
                                                    onChange={(e) => handleMedChange(index, 'name', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-secondary-500"
                                                    placeholder="Enter name"
                                                />
                                                <DrugAutosuggest
                                                    query={med.name}
                                                    onSelect={(val) => handleMedChange(index, 'name', val)}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block ml-1 text-center">Freq (M-A-N)</label>
                                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                                                    {[0, 1, 2].map((part) => (
                                                        <React.Fragment key={part}>
                                                            <input
                                                                type="text"
                                                                value={(med.frequency || '0-0-0').split('-')[part] || '0'}
                                                                onChange={(e) => handleFrequencyPartChange(index, part, e.target.value)}
                                                                className="w-full bg-slate-50 border-none rounded-lg py-1 text-center text-xs font-black outline-none focus:bg-primary-50 transition-colors"
                                                                placeholder="0"
                                                            />
                                                            {part < 2 && <span className="text-[10px] font-bold text-slate-300">-</span>}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block ml-1 uppercase">Days</label>
                                                <input
                                                    value={med.duration}
                                                    onChange={(e) => handleMedChange(index, 'duration', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-secondary-500"
                                                    placeholder="5"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block ml-1">Instruction</label>
                                                <select
                                                    value={med.instruction || 'After Food'}
                                                    onChange={(e) => handleMedChange(index, 'instruction', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-secondary-500 appearance-none"
                                                >
                                                    <option value="After Food">After Food</option>
                                                    <option value="Before Food">Before Food</option>
                                                    <option value="With Food">With Food</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1 flex justify-center pb-1">
                                                {medications.length > 1 && (
                                                    <button onClick={() => removeMedication(index)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Image Upload Section */}
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-xl transition-colors ${prescriptionMode === 'handwritten' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-black text-secondary-900 uppercase tracking-tight">Handwritten Prescription</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Image Upload Mode</p>
                                    </div>
                                </div>

                                {prescriptionMode === 'digital' && imagePreview && (
                                    <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                            Switch to "Image Mode" to use the uploaded prescription instead of digital entries.
                                        </p>
                                        <button 
                                            onClick={() => setPrescriptionMode('handwritten')}
                                            className="ml-auto px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors"
                                        >
                                            Switch Now
                                        </button>
                                    </div>
                                )}

                                <div className={`transition-all duration-500 ${prescriptionMode === 'digital' && !imagePreview ? 'opacity-100' : prescriptionMode === 'digital' ? 'opacity-40' : 'opacity-100'}`}>
                                    {!imagePreview ? (
                                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] p-10 hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer group">
                                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <UploadCloud className="w-6 h-6 text-primary-500" />
                                            </div>
                                            <p className="text-xs font-black text-secondary-900 uppercase tracking-widest mb-1">Click to Upload</p>
                                            <p className="text-[10px] font-bold text-slate-400">PNG, JPG or WEBP (Max 5MB)</p>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    ) : (
                                        <div className="relative rounded-[32px] overflow-hidden border border-slate-100 shadow-sm group">
                                            <img src={imagePreview} className="w-full h-auto max-h-[400px] object-contain bg-slate-50" alt="Prescription" />
                                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                                <button
                                                    onClick={removeImage}
                                                    className="p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Diagnosis & Submit - Sidebar Style */}
                        <div className="flex flex-col gap-4">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-emerald-50 rounded-xl">
                                        <Stethoscope className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-black text-secondary-900 uppercase tracking-tight">Diagnosis</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block tracking-widest">Medical Diagnosis</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                                            placeholder="Primary finding..."
                                            value={diagnosis}
                                            onChange={(e) => setDiagnosis(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block tracking-widest">Clinical Notes</label>
                                        <textarea
                                            className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 h-24 resize-none"
                                            placeholder="Observations..."
                                            value={clinicalNotes}
                                            onChange={(e) => setClinicalNotes(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 h-24 resize-none"
                                            placeholder="Instructions..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block tracking-widest">Follow-up Date</label>
                                        <CalendarDatePicker
                                            value={followUpDate}
                                            onChange={setFollowUpDate}
                                            label="Select Date"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={prescribeMutation.isPending || !isFormValid}
                                className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 ${
                                    !isFormValid 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                    : 'bg-secondary-900 text-white hover:bg-black'
                                }`}
                            >
                                {prescribeMutation.isPending ? 'Saving...' : (
                                    <>
                                        <Printer className="w-4 h-4" />
                                        Print Prescription
                                    </>
                                )}
                            </button>
                            
                            {!isFormValid && (
                                <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-wider mt-2 px-4 leading-relaxed">
                                    Required: Fill at least one Vitalic entry AND ({prescriptionMode === 'digital' ? 'Add a Drug' : 'Upload Image'})
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {medicationToDelete !== null && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={cancelRemoveMedication}
                            className="absolute inset-0 bg-secondary-900/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
                                    <Trash2 className="w-8 h-8 text-rose-500" />
                                </div>
                                <h3 className="text-xl font-black text-secondary-900 mb-2">Remove Medication?</h3>
                                <p className="text-sm text-slate-500 font-medium mb-8">
                                    Are you sure you want to remove this medication from the prescription?
                                </p>
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={cancelRemoveMedication}
                                        className="py-4 px-6 rounded-2xl border-2 border-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmRemoveMedication}
                                        className="py-4 px-6 rounded-2xl bg-rose-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

const DrugAutosuggest = ({ query, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const justSelected = useRef(false);

    const { data: results, isLoading } = useQuery({
        queryKey: ['medSearch', query],
        queryFn: async () => {
            if (query.length < 1) return [];
            try {
                // Use RxTerms API which is better for clinical autosuggest
                const response = await fetch(`https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${query}&maxList=10`);
                const data = await response.json();

                // RxTerms format: [count, [ "Name 1", "Name 2" ], ... ]
                if (!data || !data[1]) return [];

                return data[1];
            } catch (error) {
                console.error("RxTerms Search Error:", error);
                return [];
            }
        },
        enabled: query?.length >= 1,
    });

    // Control visibility based on query changes
    useEffect(() => {
        if (justSelected.current) {
            justSelected.current = false;
            setIsOpen(false);
            return;
        }
        if (query.length >= 1) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [query]);

    // Handle click outside to close
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (drug) => {
        justSelected.current = true;
        onSelect(drug);
        setIsOpen(false);
    };

    if (isLoading || !results || results.length === 0 || !isOpen) return null;

    return (
        <div ref={wrapperRef} className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-50 z-[60] overflow-hidden min-w-[300px] max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
            {results.map((drug) => (
                <button
                    key={drug}
                    onClick={() => handleSelect(drug)}
                    className="w-full p-5 text-left hover:bg-primary-50 text-slate-700 text-xs font-bold border-b border-slate-50 last:border-0 flex items-center gap-4 transition-colors"
                >
                    <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Search className="w-3 h-3 text-primary-600" />
                    </div>
                    {drug}
                </button>
            ))}
        </div>
    );
};

export default ClinicalSession;
