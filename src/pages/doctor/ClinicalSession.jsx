import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
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
    X,
    Settings,
    Edit3,
    Eye,
    History,
    Copy,
    RotateCcw,
    ChevronRight,
    ChevronDown,
    Check,
    Pill,
    ClipboardList,
    NotebookPen,
    Lightbulb,
    CalendarCheck,
    BookmarkPlus,
    Save
} from 'lucide-react';
import { doctorApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getUnifiedDocumentHTML } from '../../utils/documentGenerator';
import { printDocument } from '../../utils/printHelper';
import { UnifiedDocument } from '../../components/shared/UnifiedDocument';
import CalendarDatePicker from '../../components/ui/CalendarDatePicker';
import { normalizeMedication, formatMedicationDuration } from '../../utils/documentUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { VITALS_META } from '../../config/vitals';
import AppLoader from '../../components/shared/AppLoader';

const ClinicalSession = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Vitals and clinical state
    const [medications, setMedications] = useState([{ name: '', frequency: '', duration: '', durationUnit: 'Days', instruction: 'After Food' }]);
    const [activeDrugIndex, setActiveDrugIndex] = useState(null);
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
        weight: '',
        spo2: ''
    });
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showManageTemplatesModal, setShowManageTemplatesModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showHandwritten, setShowHandwritten] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [loadedTemplateId, setLoadedTemplateId] = useState(null);
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    
    // Copy previous prescription state
    const [showPastRxModal, setShowPastRxModal] = useState(false);
    const [selectedPastRxIndex, setSelectedPastRxIndex] = useState(0);
    const [copyOptions, setCopyOptions] = useState({
        medications: true,
        diagnosis: true,
        notes: true
    });

    // Refs for auto-save on unmount
    const isSubmittedRef = useRef(false);
    const [editTemplateName, setEditTemplateName] = useState('');

    // Fetch appointment data
    const { data: appointment, isLoading: isLoadingAppt } = useQuery({
        queryKey: ['appointment', appointmentId],
        queryFn: async () => {
            const res = await doctorApi.getAppointments();
            return res.data.find(a => a._id === appointmentId);
        },
        staleTime: Infinity,
    });

    // Fetch Draft (if exists)
    const { data: draftData, isLoading: isLoadingDraft } = useQuery({
        queryKey: ['prescriptionDraft', appointmentId],
        queryFn: async () => {
            try {
                const res = await doctorApi.getPrescriptionByAppointment(appointmentId);
                return res.data;
            } catch {
                return null;
            }
        },
        enabled: !!appointmentId,
        staleTime: Infinity,
    });

    // Fetch patient history for review/repeat prescriptions
    const { data: patientHistory } = useQuery({
        queryKey: ['patientHistory', appointment?.patient?._id],
        queryFn: async () => {
            const res = await doctorApi.getPatientHistory(appointment.patient._id);
            return res.data;
        },
        enabled: !!appointment?.patient?._id,
        staleTime: 60000,
    });

    const pastPrescriptions = (patientHistory?.prescriptions || []).filter(p => {
        const pApptId = p.appointment?._id || p.appointment;
        return pApptId?.toString() !== appointmentId?.toString() && !p.isDraft;
    });

    const isCurrentSessionBlank = (
        (!medications || medications.length === 0 || (medications.length === 1 && !medications[0].name?.trim())) &&
        !diagnosis?.trim() &&
        !imagePreview
    );

    // Guard initial data loading so background refetches never overwrite user edits
    const initialLoadedRef = useRef(false);
    const userEditedRef = useRef({
        diagnosis: false,
        clinicalNotes: false,
        notes: false
    });

    useEffect(() => {
        if (!initialLoadedRef.current && (appointment || draftData)) {
            if (draftData === undefined && appointmentId) return;

            initialLoadedRef.current = true;

            const prescription = draftData?.prescription;
            const clinicalDetails = draftData?.clinicalDetails;

            // Sync vitals from draft or appointment
            const sourceVitals = clinicalDetails?.vitals || appointment?.vitals;
            if (sourceVitals) {
                setVitals({
                    bloodPressure: sourceVitals.bloodPressure || '',
                    temperature: sourceVitals.temperature || '',
                    pulse: sourceVitals.pulse || '',
                    weight: sourceVitals.weight || '',
                    spo2: sourceVitals.spo2 || ''
                });
            }

            // Sync prescription details if present
            if (prescription) {
                if (prescription.medications?.length > 0) setMedications(prescription.medications.map(normalizeMedication));
                if (prescription.notes && !userEditedRef.current.notes) setNotes(prescription.notes);
                if (prescription.image) {
                    setPrescriptionMode('handwritten');
                    setImagePreview(prescription.image);
                }
                if (prescription.followUpDate) setFollowUpDate(prescription.followUpDate.split('T')[0]);
            }

            // Sync diagnosis (only if not already edited by user)
            const initialDiagnosis = clinicalDetails?.diagnosis || appointment?.diagnosis;
            if (initialDiagnosis && !userEditedRef.current.diagnosis) {
                setDiagnosis(initialDiagnosis);
            }

            // Sync clinical notes (only if not already edited by user)
            const initialClinicalNotes = clinicalDetails?.clinicalNotes || appointment?.clinicalNotes;
            if (initialClinicalNotes && !userEditedRef.current.clinicalNotes) {
                setClinicalNotes(initialClinicalNotes);
            }
        }
    }, [appointment, draftData, appointmentId]);

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
            printDocument(printData, 'prescription');
        },
        onError: () => toast.error('Failed to finalize session')
    });

    // Fetch Templates
    const { data: templates } = useQuery({
        queryKey: ['prescriptionTemplates', appointment?.doctor?._id || appointment?.doctor],
        queryFn: async () => {
            const docId = appointment?.doctor?._id || appointment?.doctor;
            const res = await doctorApi.getTemplates(docId);
            return res.data;
        },
        enabled: !!(appointment?.doctor?._id || appointment?.doctor)
    });

    const draftMutation = useMutation({
        mutationFn: (data) => doctorApi.saveDraft(appointmentId, data),
        onSuccess: () => {
            toast.success('Draft saved successfully');
            queryClient.invalidateQueries(['doctorAppointments']);
        },
        onError: () => toast.error('Failed to save draft')
    });

    const templateMutation = useMutation({
        mutationFn: (data) => doctorApi.saveTemplate({ ...data, doctorId: appointment?.doctor?._id }),
        onSuccess: () => {
            toast.success('Template saved globally');
            queryClient.invalidateQueries(['prescriptionTemplates']);
        },
        onError: () => toast.error('Failed to save template')
    });

    const updateTemplateMutation = useMutation({
        mutationFn: ({ id, data }) => doctorApi.updateTemplate(id, data),
        onSuccess: () => {
            toast.success('Template updated successfully');
            queryClient.invalidateQueries(['prescriptionTemplates']);
        },
        onError: () => toast.error('Failed to update template')
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: (id) => doctorApi.deleteTemplate(id),
        onSuccess: () => {
            toast.success('Template deleted successfully');
            queryClient.invalidateQueries(['prescriptionTemplates']);
        },
        onError: () => toast.error('Failed to delete template')
    });

    const handleSaveDraft = () => {
        const payload = {
            medications: medications.filter(m => m.name.trim() !== ''),
            notes,
            diagnosis,
            clinicalNotes,
            followUpDate,
            prescriptionMode,
            clearImage: !imagePreview,
            vitals,
            patientId: appointment?.patient?._id
        };
        draftMutation.mutate(payload);
    };

    const handleSaveTemplate = () => {
        setShowTemplateModal(true);
    };

    const confirmSaveTemplate = () => {
        if (!templateName.trim()) return toast.error('Please enter a template name');
        const payload = {
            name: templateName,
            medications: medications.filter(m => m.name.trim() !== ''),
            notes,
            diagnosis
        };
        templateMutation.mutate(payload);
        setShowTemplateModal(false);
        setTemplateName('');
    };


    const stateRef = useRef({ medications, notes, diagnosis, clinicalNotes, followUpDate, vitals, isFinalized, appointment, prescriptionMode, imagePreview });
    useEffect(() => {
        stateRef.current = { medications, notes, diagnosis, clinicalNotes, followUpDate, vitals, isFinalized, appointment, prescriptionMode, imagePreview };
    }, [medications, notes, diagnosis, clinicalNotes, followUpDate, vitals, isFinalized, appointment, prescriptionMode, imagePreview]);

    useEffect(() => {
        const saveDraft = () => {
            const { medications, notes, diagnosis, clinicalNotes, followUpDate, vitals, isFinalized, appointment, prescriptionMode, imagePreview } = stateRef.current;
            if (isFinalized || isSubmittedRef.current || !appointment) return;
            
            if (medications.some(m => m.name.trim() !== '') || diagnosis || notes || clinicalNotes) {
                const payload = {
                    medications: medications.filter(m => m.name.trim() !== ''),
                    notes,
                    diagnosis,
                    clinicalNotes,
                    followUpDate,
                    prescriptionMode,
                    clearImage: !imagePreview,
                    vitals,
                    patientId: appointment.patient?._id
                };
                doctorApi.saveDraft(appointmentId, payload)
                    .then(() => queryClient.invalidateQueries(['doctorAppointments']))
                    .catch(err => console.warn('Draft save error:', err));
            }
        };

        const interval = setInterval(saveDraft, 10000); // every 10s
        
        return () => {
            clearInterval(interval);
            saveDraft(); // Save on unmount
        };
    }, [appointmentId, queryClient]);

    const handleLoadTemplate = (e) => {
        const templateId = e.target.value;
        if (!templateId) return;
        const t = templates?.find(t => t._id === templateId);
        if (t) {
            setActiveDrugIndex(null);
            if (t.medications?.length > 0) setMedications(t.medications.map(normalizeMedication));
            if (t.notes && !notes.trim()) setNotes(t.notes);
            if (t.diagnosis) {
                // If user has already typed a diagnosis, don't overwrite it
                if (!diagnosis.trim()) {
                    setDiagnosis(t.diagnosis);
                } else if (t.diagnosis.trim() !== diagnosis.trim()) {
                    toast('Template loaded (existing diagnosis preserved)', { icon: 'ℹ️' });
                }
            }
            setLoadedTemplateId(t._id);
            toast.success(`Template "${t.name}" loaded`);
        }
        e.target.value = ''; // Reset dropdown
    };

    const handleCopyPrescription = (targetPrescription, customOptions = copyOptions) => {
        if (!targetPrescription) return;

        const opts = customOptions || copyOptions;
        let copiedCount = 0;
        const copiedItems = [];

        setActiveDrugIndex(null);

        // 1. Copy Medications
        if (opts.medications) {
            if (targetPrescription.medications && targetPrescription.medications.length > 0) {
                const normalizedMeds = targetPrescription.medications.map(normalizeMedication);
                setMedications(normalizedMeds);
                setPrescriptionMode('digital');
                copiedItems.push(`${normalizedMeds.length} medicines`);
                copiedCount++;
            } else if (targetPrescription.image) {
                setPrescriptionMode('handwritten');
                setImagePreview(targetPrescription.image);
                setPrescriptionImage(null);
                copiedItems.push('handwritten prescription');
                copiedCount++;
            }
        }

        // 2. Copy Diagnosis
        if (opts.diagnosis) {
            const pastDiag = targetPrescription.appointment?.diagnosis;
            if (pastDiag && pastDiag.trim()) {
                setDiagnosis(pastDiag);
                userEditedRef.current.diagnosis = true;
                copiedItems.push('diagnosis');
                copiedCount++;
            }
        }

        // 3. Copy Notes
        if (opts.notes) {
            const pastNotes = targetPrescription.notes;
            const pastClinNotes = targetPrescription.appointment?.clinicalNotes;
            if (pastNotes && pastNotes.trim()) {
                setNotes(pastNotes);
                userEditedRef.current.notes = true;
                copiedCount++;
            }
            if (pastClinNotes && pastClinNotes.trim()) {
                setClinicalNotes(pastClinNotes);
                userEditedRef.current.clinicalNotes = true;
                copiedCount++;
            }
            if ((pastNotes && pastNotes.trim()) || (pastClinNotes && pastClinNotes.trim())) {
                copiedItems.push('advice/notes');
            }
        }

        setShowPastRxModal(false);

        if (copiedCount > 0) {
            const visitDate = targetPrescription.createdAt 
                ? new Date(targetPrescription.createdAt).toLocaleDateString('en-GB')
                : 'previous visit';
            toast.success(`Copied from visit on ${visitDate}: ${copiedItems.join(', ')}`);
        } else {
            toast.error('No content available to copy for selected options');
        }
    };

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
        setMedications([...medications, { name: '', frequency: '', duration: '', durationUnit: 'Days', instruction: 'After Food' }]);
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
        const currentFreq = newMeds[index].frequency || '--';
        const parts = currentFreq.split('-');
        parts[partIndex] = value;
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
    const hasImage = !!prescriptionImage || !!imagePreview;
    
    // Validation based on active mode
    const isFormValid = hasVitals && (
        (prescriptionMode === 'digital' && hasMedications) || 
        (prescriptionMode === 'handwritten' && hasImage)
    );

    const handleSubmit = () => {
        isSubmittedRef.current = true;
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
        formData.append('prescriptionMode', prescriptionMode);

        if (prescriptionMode === 'handwritten' && prescriptionImage) {
            formData.append('image', prescriptionImage);
        } else if (!imagePreview || prescriptionMode === 'digital') {
            formData.append('clearImage', 'true');
        }

        prescribeMutation.mutate(formData, {
            onSettled: () => toast.dismiss(toastId)
        });
    };

    if (isLoadingAppt || isLoadingDraft) {
        return (
            <DashboardLayout>
                <AppLoader fullScreen={false} label="Loading clinical session" />
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
                        className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-primary-100/50 p-12 text-center"
                    >
                        <div className="w-24 h-24 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-ink mb-3">Prescription finalized</h2>
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
                                    printDocument(printData, 'prescription');
                                }}
                                className="flex items-center gap-2.5 px-6 py-3.5 bg-secondary-900 text-white rounded-xl font-semibold text-sm hover:bg-black shadow-xl shadow-slate-200 transition-all active:scale-95"
                            >
                                <Printer className="w-5 h-5" />
                                Print Now
                            </button>
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="flex items-center gap-2.5 px-6 py-3.5 bg-white border-2 border-primary-100 text-primary-600 rounded-xl font-semibold text-sm hover:border-primary-300 shadow-lg shadow-primary-50 transition-all active:scale-95"
                            >
                                <Share2 className="w-5 h-5" />
                                Share via Email
                            </button>
                            <button
                                onClick={() => {
                                    setIsFinalized(false);
                                    isSubmittedRef.current = false;
                                }}
                                className="flex items-center gap-2.5 px-6 py-3.5 bg-amber-50 border-2 border-amber-100 text-amber-600 rounded-xl font-semibold text-sm hover:border-amber-300 shadow-lg shadow-amber-50 transition-all active:scale-95"
                            >
                                <Edit3 className="w-5 h-5" />
                                Edit Prescription
                            </button>
                            <button
                                onClick={() => navigate('/doctor/appointments')}
                                className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-50 text-slate-500 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-all active:scale-95"
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
                                    className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mb-6">
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
                                                className="w-full py-5 bg-primary-600 text-white rounded-xl font-semibold text-sm shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
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
            <div className="w-full max-w-[1600px] mx-auto space-y-4">
                {/* Patient banner */}
                <div className="rounded-2xl bg-gradient-to-r from-primary-50 via-white to-secondary-50 border border-primary-100 text-ink p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4 min-w-0">
                        <button
                            onClick={() => navigate('/doctor/appointments')}
                            className="w-10 h-10 rounded-lg bg-white border border-line hover:bg-slate-50 text-muted hover:text-ink flex items-center justify-center transition-colors shrink-0"
                            title="Back to appointments"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center text-base font-bold shrink-0">
                            {(appointment.patient?.name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                        </span>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-700">Clinical session</p>
                            <h1 className="text-xl md:text-2xl font-bold leading-tight truncate">{appointment.patient?.name}</h1>
                            <div className="flex items-center gap-2 flex-wrap mt-1.5">
                                <span className="text-xs font-semibold bg-white border border-line text-muted rounded-md px-2 py-0.5">#{appointment.patient?.displayId}</span>
                                {(appointment.patient?.age || appointment.patient?.gender) && (
                                    <span className="text-xs bg-white border border-line text-muted rounded-md px-2 py-0.5">
                                        {[
                                            appointment.patient?.age ? `${appointment.patient.age} Y` : null,
                                            appointment.patient?.gender
                                        ].filter(Boolean).join(' / ')}
                                    </span>
                                )}
                                {appointment.patient?.phone && (
                                    <span className="text-xs bg-white border border-line text-muted rounded-md px-2 py-0.5 tabular-nums">{appointment.patient.phone}</span>
                                )}
                                {pastPrescriptions.length > 0 && (
                                    <span className="text-xs font-bold bg-primary-600 text-white rounded-md px-2 py-0.5 flex items-center gap-1.5">
                                        <RotateCcw className="w-3 h-3" />
                                        Returning patient · last Rx {pastPrescriptions[0].createdAt ? new Date(pastPrescriptions[0].createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'on file'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:items-stretch gap-3">
                        <div className="bg-white border border-line rounded-xl px-4 py-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-700 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Appointment</p>
                            <p className="text-sm font-bold mt-1 tabular-nums">{new Date(appointment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="bg-white border border-line rounded-xl px-4 py-2.5 sm:max-w-[320px]">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-700 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Reason</p>
                            <p className="text-sm font-bold mt-1 truncate" title={appointment.reason || 'General'}>{appointment.reason || 'General'}</p>
                        </div>
                    </div>
                </div>

                {/* Vitals */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(vitals).map(([key, value]) => {
                        const meta = VITALS_META[key];
                        const Icon = meta.icon;
                        return (
                            <div key={key} className="rounded-xl border border-line bg-white p-3 flex items-center gap-3 transition-colors focus-within:border-primary-400 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                                <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary-50 text-primary-700">
                                    <Icon className="w-5 h-5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <label className="text-xs font-semibold block text-muted">{meta.label} <span className="font-normal opacity-70">· {meta.unit}</span></label>
                                    <input
                                        type="text"
                                        className="w-full bg-transparent border-none p-0 mt-0.5 text-lg font-bold text-ink outline-none placeholder:text-slate-200 tabular-nums"
                                        placeholder={key === 'bloodPressure' ? '120/80' : '–'}
                                        value={value}
                                        onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-4 items-start">
                    {/* Medications */}
                    <div className="ui-card overflow-hidden">
                        <div className="px-5 py-4 bg-slate-50 border-b border-line flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${prescriptionMode === 'digital' ? 'bg-secondary-900 text-white' : 'bg-white text-subtle border border-line'}`}>
                                    <Pill className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="text-lg font-bold text-ink leading-tight">Medications</h3>
                                    <p className="text-xs text-muted">Digital prescription</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center bg-white border border-line rounded-lg h-9 pl-1">
                                    <div className="relative h-full">
                                    <select
                                        onChange={handleLoadTemplate}
                                        className="appearance-none text-[13px] bg-transparent font-semibold text-ink outline-none cursor-pointer pl-2 pr-6 h-full max-w-[170px]"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Load template</option>
                                        {templates?.map(t => (
                                            <option key={t._id} value={t._id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle pointer-events-none" />
                                    </div>
                                    <button
                                        onClick={() => setShowManageTemplatesModal(true)}
                                        className="w-8 h-8 mr-0.5 flex items-center justify-center text-muted hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                                        title="Manage Templates"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                                {pastPrescriptions && pastPrescriptions.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPastRxIndex(0);
                                            setShowPastRxModal(true);
                                        }}
                                        className="ui-btn-primary ring-4 ring-primary-400/20"
                                        title="Copy previous prescription for this review patient"
                                    >
                                        <span className="relative flex w-2 h-2">
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                                            <span className="relative inline-flex w-2 h-2 rounded-full bg-white" />
                                        </span>
                                        <RotateCcw className="w-4 h-4" />
                                        Copy previous Rx
                                        <span className="min-w-5 h-5 px-1.5 bg-white text-primary-700 rounded-full text-[11px] font-bold flex items-center justify-center">
                                            {pastPrescriptions.length}
                                        </span>
                                    </button>
                                )}
                                {prescriptionMode !== 'digital' && (
                                    <button
                                        onClick={() => setPrescriptionMode('digital')}
                                        className="ui-btn-soft"
                                    >
                                        Use digital
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        addMedication();
                                        setPrescriptionMode('digital');
                                    }}
                                    className="ui-btn-dark"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add drug
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {pastPrescriptions && pastPrescriptions.length > 0 && isCurrentSessionBlank && (
                                <div className="p-4 bg-gradient-to-r from-primary-50 to-white border border-primary-200 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
                                            <RotateCcw className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-ink">Returning patient — review visit</span>
                                                <span className="text-xs font-semibold px-2 py-0.5 bg-white text-primary-700 border border-primary-200 rounded-full">
                                                    Last Rx: {pastPrescriptions[0].createdAt ? new Date(pastPrescriptions[0].createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Previous Visit'}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-muted mt-0.5">
                                                {pastPrescriptions[0].medications?.length || 0} medicines prescribed{pastPrescriptions[0].doctor?.name ? ` by Dr. ${pastPrescriptions[0].doctor.name}` : ''}.
                                            </p>
                                            {pastPrescriptions[0].medications?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {pastPrescriptions[0].medications.slice(0, 4).map((m, i) => (
                                                        <span key={i} className="text-xs font-medium bg-white border border-line text-ink rounded-md px-2 py-0.5 truncate max-w-[180px]">{m.name}</span>
                                                    ))}
                                                    {pastPrescriptions[0].medications.length > 4 && (
                                                        <span className="text-xs font-semibold text-muted px-1 py-0.5">+{pastPrescriptions[0].medications.length - 4} more</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyPrescription(pastPrescriptions[0], { medications: true, diagnosis: true, notes: true })}
                                            className="ui-btn-primary"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Quick copy last Rx
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedPastRxIndex(0);
                                                setShowPastRxModal(true);
                                            }}
                                            className="ui-btn-outline"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Review &amp; select
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className={`space-y-3 transition-all duration-500 ${prescriptionMode === 'handwritten' ? 'opacity-20 pointer-events-none scale-[0.99]' : 'opacity-100'}`}>
                                <AnimatePresence mode="popLayout">
                                    {medications.map((med, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.97 }}
                                            className="grid grid-cols-12 gap-3 items-end p-3 bg-slate-50 rounded-xl border border-line"
                                        >
                                                                            <div className="col-span-12 md:col-span-5 xl:col-span-4 relative">
                                                <label className="text-xs font-semibold text-muted mb-1 flex items-center gap-1.5">
                                                    <span className="w-4 h-4 rounded-full bg-secondary-900 text-white text-[10px] font-bold flex items-center justify-center">{index + 1}</span>
                                                    Drug name
                                                </label>
                                                <input
                                                    value={med.name}
                                                    onFocus={() => setActiveDrugIndex(index)}
                                                    onChange={(e) => {
                                                        handleMedChange(index, 'name', e.target.value);
                                                        setActiveDrugIndex(index);
                                                    }}
                                                    className="w-full h-10 bg-white border border-line rounded-lg px-3 text-sm font-semibold text-ink outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-400/15 transition-all"
                                                    placeholder="Enter name"
                                                />
                                                {activeDrugIndex === index && (
                                                    <DrugAutosuggest
                                                        query={med.name}
                                                        onSelect={(val) => {
                                                            handleMedChange(index, 'name', val);
                                                            setActiveDrugIndex(null);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div className="col-span-12 sm:col-span-6 md:col-span-4 xl:col-span-3">
                                                <div className="grid grid-cols-3 gap-1 mb-1 text-center text-[11px] font-semibold text-muted">
                                                    <span>Morning</span>
                                                    <span>Noon</span>
                                                    <span>Night</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1">
                                                    {[0, 1, 2].map((part) => (
                                                        <input
                                                            key={part}
                                                            type="text"
                                                            value={(med.frequency || '').split('-')[part] || ''}
                                                            onChange={(e) => handleFrequencyPartChange(index, part, e.target.value)}
                                                            className="w-full h-10 bg-white border border-line rounded-lg text-center text-sm font-bold text-ink outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-400/15"
                                                            placeholder="0"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="col-span-6 sm:col-span-3 md:col-span-3 xl:col-span-2">
                                                <label className="text-xs font-semibold text-muted mb-1 block">Duration</label>
                                                <div className="flex items-center h-10 bg-white border border-line rounded-lg overflow-hidden focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-400/15 transition-all">
                                                    {med.durationUnit !== 'Till Review' && (
                                                        <input
                                                            type="text"
                                                            value={med.duration}
                                                            onChange={(e) => handleMedChange(index, 'duration', e.target.value)}
                                                            className="w-10 px-1 text-sm font-bold outline-none text-center bg-transparent text-ink"
                                                            placeholder="5"
                                                        />
                                                    )}
                                                    <div className="relative flex-1 min-w-0 h-full">
                                                    <select
                                                        value={med.durationUnit || 'Days'}
                                                        onChange={(e) => {
                                                            const newUnit = e.target.value;
                                                            const newMeds = [...medications];
                                                            newMeds[index].durationUnit = newUnit;
                                                            if (newUnit === 'Till Review') {
                                                                newMeds[index].duration = 'Till Review';
                                                            } else if (newMeds[index].duration === 'Till Review') {
                                                                newMeds[index].duration = '';
                                                            }
                                                            setMedications(newMeds);
                                                        }}
                                                        className={`w-full h-full appearance-none bg-slate-50 text-ink text-[13px] font-semibold pl-2.5 pr-7 ${med.durationUnit !== 'Till Review' ? 'border-l border-line' : ''} outline-none cursor-pointer hover:bg-slate-100 transition-colors`}
                                                    >
                                                        <option value="Days">Days</option>
                                                        <option value="Weeks">Weeks</option>
                                                        <option value="Months">Months</option>
                                                        <option value="Till Review">Till Review</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-5 sm:col-span-3 md:col-span-4 xl:col-span-2">
                                                <label className="text-xs font-semibold text-muted mb-1 block">Instruction</label>
                                                <div className="relative">
                                                <select
                                                    value={med.instruction || 'After Food'}
                                                    onChange={(e) => handleMedChange(index, 'instruction', e.target.value)}
                                                    className="w-full h-10 appearance-none bg-white border border-line rounded-lg pl-2.5 pr-8 text-[13px] font-semibold text-ink outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-400/15 transition-all cursor-pointer"
                                                >
                                                    <option value="After Food">After Food</option>
                                                    <option value="Before Food">Before Food</option>
                                                    <option value="With Food">With Food</option>
                                                    <option value="Empty Stomach">Empty Stomach</option>
                                                </select>
                                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                {medications.length > 1 && (
                                                    <button onClick={() => removeMedication(index)} className="ui-icon-btn-danger" title="Remove medication">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    addMedication();
                                    setPrescriptionMode('digital');
                                }}
                                className="w-full h-11 rounded-xl border-2 border-dashed border-slate-200 text-[13px] font-semibold text-muted hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 flex items-center justify-center gap-2 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Add drug
                            </button>

                            {/* Image Upload Section (collapsed by default) */}
                            <div className="rounded-xl border border-line bg-slate-50">
                                <button
                                    type="button"
                                    onClick={() => setShowHandwritten(!showHandwritten)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                                >
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${prescriptionMode === 'handwritten' ? 'bg-secondary-900 text-white' : 'bg-white text-subtle border border-line'}`}>
                                        <ImageIcon className="w-4 h-4" />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-ink leading-tight">Handwritten prescription</h3>
                                        <p className="text-xs text-muted">{imagePreview ? 'Image attached' : 'Upload an image instead of typing'}</p>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-subtle transition-transform ${(showHandwritten || imagePreview) ? 'rotate-180' : ''}`} />
                                </button>
                                {(showHandwritten || imagePreview) && (
                                <div className="px-4 pb-4">

                                {prescriptionMode === 'digital' && imagePreview && (
                                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        <p className="text-[13px] font-medium text-amber-800">
                                            Switch to image mode to use the uploaded prescription instead of digital entries.
                                        </p>
                                        <button
                                            onClick={() => setPrescriptionMode('handwritten')}
                                            className="ml-auto ui-btn !h-8 bg-amber-500 text-white hover:bg-amber-600"
                                        >
                                            Switch now
                                        </button>
                                    </div>
                                )}

                                <div className={`transition-all duration-500 ${prescriptionMode === 'digital' && !imagePreview ? 'opacity-100' : prescriptionMode === 'digital' ? 'opacity-40' : 'opacity-100'}`}>
                                    {!imagePreview ? (
                                        <label className="flex items-center justify-center gap-4 border-2 border-dashed border-slate-200 bg-white rounded-xl p-5 hover:border-primary-400 transition-all cursor-pointer group">
                                            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                                <UploadCloud className="w-6 h-6 text-primary-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-ink">Click to upload</p>
                                                <p className="text-xs text-muted">PNG, JPG or WEBP (Max 5MB)</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    ) : (
                                        <div className="relative rounded-xl overflow-hidden border border-line group">
                                            <img src={imagePreview} className="w-full h-auto max-h-[400px] object-contain bg-white" alt="Prescription" />
                                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                                <button
                                                    onClick={removeImage}
                                                    className="w-9 h-9 flex items-center justify-center bg-rose-500 text-white rounded-lg shadow-lg hover:bg-rose-600 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Diagnosis, notes & actions */}
                    <div className="flex flex-col gap-3">
                        <div className="ui-card overflow-hidden">
                            <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center"><Stethoscope className="w-4 h-4" /></span>
                                <h3 className="text-sm font-bold text-ink">Diagnosis</h3>
                            </div>
                            <div className="p-3">
                                <AutoTextarea
                                    className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 min-h-[72px] overflow-hidden resize-none transition-all"
                                    placeholder="Primary finding..."
                                    value={diagnosis}
                                    onChange={(e) => {
                                        userEditedRef.current.diagnosis = true;
                                        setDiagnosis(e.target.value);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="ui-card overflow-hidden">
                            <div className="px-4 py-2.5 bg-sky-50 border-b border-sky-100 flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center"><NotebookPen className="w-4 h-4" /></span>
                                <h3 className="text-sm font-bold text-ink">Clinical notes</h3>
                            </div>
                            <div className="p-3">
                                <AutoTextarea
                                    className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 min-h-[72px] overflow-hidden resize-none transition-all"
                                    placeholder="Observations..."
                                    value={clinicalNotes}
                                    onChange={(e) => {
                                        userEditedRef.current.clinicalNotes = true;
                                        setClinicalNotes(e.target.value);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="ui-card overflow-hidden">
                            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center"><Lightbulb className="w-4 h-4" /></span>
                                <h3 className="text-sm font-bold text-ink">Patient instructions</h3>
                            </div>
                            <div className="p-3">
                                <AutoTextarea
                                    value={notes}
                                    onChange={(e) => {
                                        userEditedRef.current.notes = true;
                                        setNotes(e.target.value);
                                    }}
                                    className="w-full bg-white border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 min-h-[72px] overflow-hidden resize-none transition-all"
                                    placeholder="Instructions..."
                                />
                            </div>
                        </div>

                        <div className="ui-card">
                            <div className="px-4 py-2.5 bg-primary-50 border-b border-primary-100 flex items-center gap-2.5 rounded-t-2xl">
                                <span className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center"><CalendarCheck className="w-4 h-4" /></span>
                                <h3 className="text-sm font-bold text-ink">Follow-up date</h3>
                            </div>
                            <div className="p-3">
                                <CalendarDatePicker
                                    value={followUpDate}
                                    onChange={setFollowUpDate}
                                    label="Select Date"
                                />
                            </div>
                        </div>

                        <div className="ui-card p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={draftMutation.isPending}
                                    className="ui-btn-outline !h-10"
                                >
                                    <Save className="w-4 h-4" />
                                    {draftMutation.isPending ? 'Saving...' : 'Save draft'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (loadedTemplateId) {
                                            const payload = {
                                                medications: medications.filter(m => m.name.trim() !== ''),
                                                notes,
                                                diagnosis
                                            };
                                            updateTemplateMutation.mutate({ id: loadedTemplateId, data: payload });
                                        } else {
                                            handleSaveTemplate();
                                        }
                                    }}
                                    disabled={templateMutation.isPending || updateTemplateMutation.isPending}
                                    className="ui-btn-outline !h-10"
                                >
                                    <BookmarkPlus className="w-4 h-4" />
                                    {(templateMutation.isPending || updateTemplateMutation.isPending) ? 'Saving...' : (loadedTemplateId ? 'Update template' : 'Save template')}
                                </button>
                            </div>
                            <button
                                onClick={() => setShowPreviewModal(true)}
                                disabled={!isFormValid}
                                className="ui-btn-outline !w-full !h-10"
                            >
                                <Eye className="w-4 h-4" />
                                Preview prescription
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={prescribeMutation.isPending || !isFormValid}
                                className="ui-btn-dark !w-full !h-12 !text-sm"
                            >
                                {prescribeMutation.isPending ? 'Saving...' : (
                                    <>
                                        <Printer className="w-4 h-4" />
                                        Print Prescription
                                    </>
                                )}
                            </button>
                            {!isFormValid && (
                                <p className="text-xs text-muted text-center leading-relaxed px-2">
                                    Required: at least one vital entry and ({prescriptionMode === 'digital' ? 'one drug' : 'an uploaded image'})
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
                            className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl overflow-hidden"
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

                {showTemplateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-secondary-900 mb-6 text-center">Save Template</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Template Name</label>
                                    <input 
                                        type="text"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                        placeholder="e.g. Standard Viral Fever"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button 
                                        onClick={() => setShowTemplateModal(false)}
                                        className="py-4 px-6 rounded-2xl border-2 border-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={confirmSaveTemplate}
                                        disabled={!templateName.trim() || templateMutation.isPending}
                                        className="py-4 px-6 rounded-2xl bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50"
                                    >
                                        {templateMutation.isPending ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showManageTemplatesModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-secondary-900">Manage Templates</h3>
                                <button onClick={() => setShowManageTemplatesModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {!templates || templates.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm font-medium">
                                        No templates saved yet.
                                    </div>
                                ) : (
                                    templates.map(t => (
                                        <div key={t._id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                            {editingTemplateId === t._id ? (
                                                <div className="flex-1 flex gap-2 mr-4">
                                                    <input 
                                                        type="text" 
                                                        value={editTemplateName}
                                                        onChange={(e) => setEditTemplateName(e.target.value)}
                                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500"
                                                        autoFocus
                                                    />
                                                    <button 
                                                        onClick={() => {
                                                            if (editTemplateName.trim()) {
                                                                updateTemplateMutation.mutate({ id: t._id, data: { name: editTemplateName } });
                                                                setEditingTemplateId(null);
                                                            }
                                                        }}
                                                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingTemplateId(null)}
                                                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col">
                                                    <span className="font-bold text-sm text-slate-700">{t.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.medications?.length || 0} Drugs</span>
                                                </div>
                                            )}
                                            
                                            {editingTemplateId !== t._id && (
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingTemplateId(t._id);
                                                            setEditTemplateName(t.name);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Rename"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if(window.confirm('Are you sure you want to delete this template?')) {
                                                                deleteTemplateMutation.mutate(t._id);
                                                                if (loadedTemplateId === t._id) setLoadedTemplateId(null);
                                                            }
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {showPastRxModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary-900/50 backdrop-blur-sm p-3 md:p-5">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 16 }}
                            className="relative w-full max-w-[1500px] h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 bg-gradient-to-r from-primary-50 via-white to-secondary-50 border-b border-line flex justify-between items-center flex-shrink-0">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
                                        <History className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <h3 className="text-xl font-bold text-ink">Copy previous prescription</h3>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-600 text-white">
                                                {pastPrescriptions.length} {pastPrescriptions.length === 1 ? 'past visit' : 'past visits'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted mt-0.5 flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-ink">{appointment?.patient?.name}</span>
                                            <span>#{appointment?.patient?.displayId}</span>
                                            {(appointment?.patient?.age || appointment?.patient?.gender) && (
                                                <span className="text-xs bg-white border border-line rounded-md px-2 py-0.5">
                                                    {[
                                                        appointment.patient?.age ? `${appointment.patient.age} Y` : null,
                                                        appointment.patient?.gender
                                                    ].filter(Boolean).join(' / ')}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPastRxModal(false)}
                                    className="ui-icon-btn !bg-white border border-line"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            {pastPrescriptions.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-subtle mb-4">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-base font-bold text-ink mb-1">No previous prescriptions</h4>
                                    <p className="text-sm text-muted max-w-sm">
                                        This patient has no earlier completed prescriptions. Prescriptions written in this session will appear for future reviews.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-[360px_minmax(0,1fr)] min-h-0">
                                    {/* Left: Visit List */}
                                    <div className="flex flex-col border-r border-line bg-slate-50 min-h-0 max-h-[40vh] md:max-h-none">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                                            <span className="label-caps">Previous consultations</span>
                                            <span className="text-xs text-muted">Click to preview</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                            {pastPrescriptions.map((rx, idx) => {
                                                const isSelected = idx === selectedPastRxIndex;
                                                const rxDate = rx.createdAt ? new Date(rx.createdAt) : null;
                                                const medCount = rx.medications?.length || 0;
                                                const diag = rx.appointment?.diagnosis;
                                                const docName = rx.doctor?.name ? `Dr. ${rx.doctor.name}` : 'Doctor';

                                                return (
                                                    <button
                                                        key={rx._id || idx}
                                                        type="button"
                                                        onClick={() => setSelectedPastRxIndex(idx)}
                                                        className={`w-full text-left p-3.5 rounded-xl transition-all border flex gap-3 ${
                                                            isSelected
                                                                ? 'bg-white border-primary-500 shadow-md ring-2 ring-primary-400/20'
                                                                : 'bg-white border-line hover:border-slate-200 hover:shadow-sm'
                                                        }`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 ${isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-ink'}`}>
                                                            <span className="text-[10px] font-semibold uppercase leading-none opacity-80">{rxDate ? rxDate.toLocaleString('default', { month: 'short' }) : '--'}</span>
                                                            <span className="text-lg font-bold leading-none mt-0.5 tabular-nums">{rxDate ? rxDate.getDate() : '--'}</span>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-sm font-semibold text-ink tabular-nums">{rxDate ? rxDate.getFullYear() : 'Unknown date'}</span>
                                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                                                    rx.image
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                }`}>
                                                                    {rx.image ? 'Handwritten' : `${medCount} ${medCount === 1 ? 'drug' : 'drugs'}`}
                                                                </span>
                                                            </div>
                                                            <p className="text-[13px] text-muted truncate mt-0.5">{docName}</p>
                                                            {diag && (
                                                                <p className="text-xs text-ink bg-slate-100 rounded px-1.5 py-0.5 mt-1.5 truncate">{diag}</p>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Right: Selected prescription */}
                                    {(() => {
                                        const activeRx = pastPrescriptions[selectedPastRxIndex] || pastPrescriptions[0];
                                        if (!activeRx) return null;
                                        const hasDiagnosis = !!activeRx.appointment?.diagnosis;
                                        const hasNotes = !!activeRx.notes || !!activeRx.appointment?.clinicalNotes;
                                        const hasMeds = (activeRx.medications && activeRx.medications.length > 0) || !!activeRx.image;
                                        const rxDate = activeRx.createdAt ? new Date(activeRx.createdAt) : null;

                                        const copyChip = (key, label, enabled, extra) => {
                                            const checked = copyOptions[key] && enabled;
                                            return (
                                                <label className={`flex items-center gap-2.5 h-10 px-3.5 rounded-lg border text-sm font-semibold cursor-pointer select-none transition-all ${!enabled ? 'opacity-40 pointer-events-none bg-slate-50 border-line text-muted' : checked ? 'bg-primary-50 border-primary-400 text-primary-800' : 'bg-white border-line text-ink hover:border-slate-200'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        disabled={!enabled}
                                                        onChange={(e) => setCopyOptions({ ...copyOptions, [key]: e.target.checked })}
                                                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
                                                    />
                                                    <span>{label}{extra ? <span className="font-normal text-muted"> {extra}</span> : null}</span>
                                                </label>
                                            );
                                        };

                                        return (
                                            <div className="flex flex-col min-h-0 min-w-0">
                                                {/* Selected visit + copy options */}
                                                <div className="px-6 py-4 border-b border-line flex flex-col xl:flex-row xl:items-center justify-between gap-3 shrink-0">
                                                    <div>
                                                        <p className="label-caps">Selected visit</p>
                                                        <p className="text-lg font-bold text-ink mt-0.5">
                                                            {rxDate ? rxDate.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Unknown date'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="label-caps mb-1.5">Choose what to copy</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {copyChip('medications', 'Medications', hasMeds, activeRx.medications?.length ? `(${activeRx.medications.length})` : activeRx.image ? '(Image)' : '')}
                                                            {copyChip('diagnosis', 'Diagnosis', hasDiagnosis)}
                                                            {copyChip('notes', 'Advice & notes', hasNotes)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Preview */}
                                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                                    {hasDiagnosis && (
                                                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                                            <span className="label-caps !text-emerald-700 block mb-1">Diagnosis recorded</span>
                                                            <p className="text-base font-semibold text-ink">{activeRx.appointment.diagnosis}</p>
                                                        </div>
                                                    )}

                                                    {activeRx.medications && activeRx.medications.length > 0 ? (
                                                        <div>
                                                            <p className="label-caps mb-2">Prescribed medicines ({activeRx.medications.length})</p>
                                                            <div className="border border-line rounded-xl overflow-hidden">
                                                                <table className="w-full text-left text-sm">
                                                                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-line">
                                                                        <tr>
                                                                            <th className="px-4 py-3 w-10">#</th>
                                                                            <th className="px-4 py-3">Medicine</th>
                                                                            <th className="px-4 py-3">Dosage</th>
                                                                            <th className="px-4 py-3">Duration</th>
                                                                            <th className="px-4 py-3">Instructions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-line">
                                                                        {activeRx.medications.map((m, mIdx) => {
                                                                            const norm = normalizeMedication(m);
                                                                            return (
                                                                                <tr key={mIdx} className="hover:bg-slate-50">
                                                                                    <td className="px-4 py-3 text-subtle tabular-nums">{mIdx + 1}</td>
                                                                                    <td className="px-4 py-3 font-semibold text-ink">{norm.name || 'Unnamed drug'}</td>
                                                                                    <td className="px-4 py-3 text-ink font-mono tabular-nums">{norm.frequency || '-'}</td>
                                                                                    <td className="px-4 py-3 text-ink">{formatMedicationDuration(norm.duration, norm.durationUnit)}</td>
                                                                                    <td className="px-4 py-3 text-muted">{norm.instruction || '-'}</td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    ) : activeRx.image ? (
                                                        <div className="p-4 bg-slate-50 rounded-xl border border-line">
                                                            <span className="label-caps block mb-2">Handwritten prescription image</span>
                                                            <img
                                                                src={activeRx.image}
                                                                alt="Handwritten prescription"
                                                                className="max-h-[50vh] object-contain rounded-lg border border-line bg-white"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="p-6 text-center text-sm text-muted bg-slate-50 rounded-xl">
                                                            No medications recorded for this visit.
                                                        </div>
                                                    )}

                                                    {(activeRx.notes || activeRx.appointment?.clinicalNotes) && (
                                                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                                            <span className="label-caps !text-amber-700 block mb-1">Doctor's advice &amp; notes</span>
                                                            {activeRx.notes && <p className="text-sm text-ink">{activeRx.notes}</p>}
                                                            {activeRx.appointment?.clinicalNotes && (
                                                                <p className="text-sm text-muted mt-1.5 italic">{activeRx.appointment.clinicalNotes}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Modal Footer */}
                            {pastPrescriptions.length > 0 && (
                                <div className="px-6 py-4 border-t border-line bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
                                    <span className="text-[13px] text-muted">
                                        Copying fills the current session with the selected data. You can still edit everything before printing.
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowPastRxModal(false)}
                                            className="ui-btn-outline !h-11 !px-5"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const target = pastPrescriptions[selectedPastRxIndex] || pastPrescriptions[0];
                                                handleCopyPrescription(target);
                                            }}
                                            className="ui-btn-primary !h-11 !px-6 !text-sm"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copy to today's prescription
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {showPreviewModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full h-[95vh] flex flex-col items-center justify-center pointer-events-none"
                        >
                            <div className="w-full h-full pointer-events-auto relative">
                                <button 
                                    onClick={() => setShowPreviewModal(false)} 
                                    className="absolute top-4 right-10 z-50 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all shadow-lg"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <iframe 
                                    srcDoc={getUnifiedDocumentHTML({
                                        doctor: appointment?.doctor,
                                        patient: appointment?.patient,
                                        prescription: {
                                            medications: medications.filter(m => m.name.trim() !== ''),
                                            notes,
                                            diagnosis,
                                            image: imagePreview,
                                            followUpDate
                                        },
                                        clinicalDetails: {
                                            vitals: vitals,
                                            diagnosis: diagnosis,
                                            clinicalNotes: clinicalNotes
                                        }
                                    }, 'prescription', true)}
                                    className="w-full h-full border-0"
                                />
                            </div>

                            <div className="absolute bottom-6 flex gap-4 pointer-events-auto bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50">
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="px-6 py-3 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-all"
                                >
                                    Close Preview
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPreviewModal(false);
                                        handleSubmit();
                                    }}
                                    disabled={prescribeMutation.isPending}
                                    className="px-8 py-3 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
                                >
                                    {prescribeMutation.isPending ? 'Saving...' : (
                                        <>
                                            <Printer className="w-4 h-4" />
                                            Confirm & Submit
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

// Textarea that grows with its content instead of showing a scrollbar
const AutoTextarea = ({ value, ...props }) => {
    const ref = useRef(null);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);
    return <textarea ref={ref} rows={1} value={value} {...props} />;
};

const DrugAutosuggest = ({ query, onSelect }) => {
    const [isOpen, setIsOpen] = useState(true);
    const wrapperRef = useRef(null);
    const justSelected = useRef(false);

    const { data: results, isLoading } = useQuery({
        queryKey: ['medSearch', query],
        queryFn: async () => {
            try {
                const response = await doctorApi.searchMedications(query || '');
                return response.data || [];
            } catch (error) {
                console.error("Local Drug Search Error:", error);
                return [];
            }
        },
        enabled: true,
    });

    // Control visibility based on query changes
    useEffect(() => {
        if (justSelected.current) {
            justSelected.current = false;
            setIsOpen(false);
            return;
        }
        setIsOpen(true);
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
        <div ref={wrapperRef} className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] overflow-hidden min-w-[300px] max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Formulary Suggestions</span>
                <span className="text-emerald-600 font-extrabold">{results.length} found</span>
            </div>
            {results.map((drug) => (
                <button
                    key={drug}
                    onClick={() => handleSelect(drug)}
                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 text-slate-700 text-xs font-bold border-b border-slate-50 last:border-0 flex items-center gap-3 transition-colors group"
                >
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                        <Pill className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{drug}</span>
                </button>
            ))}
        </div>
    );
};

export default ClinicalSession;
