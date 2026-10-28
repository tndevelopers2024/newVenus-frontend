import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Clock,
    FileText,
    Pill,
    Plus,
    Trash2,
    Save,
    CheckCircle2,
    Calendar,
    Search,
    User,
    Mail,
    Phone,
    Copy,
    ChevronRight,
    ExternalLink,
    AlertCircle,
    X,
    Stethoscope,
    Activity,
    RotateCcw,
    Check
} from 'lucide-react';
import { doctorApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const FREQUENCY_OPTIONS = ['1-0-1', '1-0-0', '0-0-1', '1-1-1', '1-1-1-1', '0-1-0', 'SOS', 'PRN', 'As Needed'];
const DURATION_UNITS = ['Days', 'Weeks', 'Months'];
const INSTRUCTION_OPTIONS = ['After Food', 'Before Food', 'With Food', 'Empty Stomach', 'At Bedtime'];

const PatientPrescriptionsPage = () => {
    const { id: patientId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Active selected prescription from Left list
    const [selectedRxId, setSelectedRxId] = useState(null);
    const [historySearch, setHistorySearch] = useState('');
    const [viewingImageModal, setViewingImageModal] = useState(null);

    // New Prescription State (Right Column)
    const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [medications, setMedications] = useState([]);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState(null);

    // Drug Autocomplete state
    const [activeDrugIndex, setActiveDrugIndex] = useState(null);
    const [drugSuggestions, setDrugSuggestions] = useState([]);

    // 1. Fetch Patient Clinical History (Prescriptions, Appointments, Patient Details)
    const { data: historyData, isLoading, isError, refetch } = useQuery({
        queryKey: ['patientHistory', patientId],
        queryFn: async () => {
            const res = await doctorApi.getPatientHistory(patientId);
            return res.data;
        },
        enabled: !!patientId,
    });

    const patient = historyData?.patient;
    const allPrescriptions = historyData?.prescriptions || [];
    const allAppointments = historyData?.appointments || [];

    // Filter prescriptions on Left Column by search term
    const filteredPrescriptions = allPrescriptions.filter(rx => {
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        const dateStr = rx.createdAt ? new Date(rx.createdAt).toLocaleDateString('en-GB') : '';
        const docName = rx.doctor?.name?.toLowerCase() || '';
        const diag = rx.appointment?.diagnosis?.toLowerCase() || rx.diagnosis?.toLowerCase() || '';
        const hasDrug = rx.medications?.some(m => m.name?.toLowerCase().includes(q));
        return dateStr.includes(q) || docName.includes(q) || diag.includes(q) || hasDrug;
    });

    // Auto-select first prescription when history loads
    useEffect(() => {
        if (allPrescriptions.length > 0 && !selectedRxId) {
            setSelectedRxId(allPrescriptions[0]._id);
        }
    }, [allPrescriptions, selectedRxId]);

    // Active Selected Prescription details for Middle Column
    const selectedRx = allPrescriptions.find(rx => rx._id === selectedRxId) || allPrescriptions[0];

    // Active Target Appointment for New Prescription
    const targetAppointment = allAppointments.find(a => a._id === selectedAppointmentId);

    // Pick default target appointment for New Prescription
    useEffect(() => {
        if (allAppointments.length > 0 && !selectedAppointmentId) {
            // Priority: Accepted or Pending or Rescheduled appointment
            const activeAppt = allAppointments.find(a => ['Accepted', 'Pending', 'Rescheduled'].includes(a.status));
            if (activeAppt) {
                setSelectedAppointmentId(activeAppt._id);
            } else {
                setSelectedAppointmentId(allAppointments[0]._id);
            }
        }
    }, [allAppointments, selectedAppointmentId]);

    // 2. Fetch Draft for the selected target appointment
    const { data: draftData } = useQuery({
        queryKey: ['appointmentDraft', selectedAppointmentId],
        queryFn: async () => {
            if (!selectedAppointmentId) return null;
            try {
                const res = await doctorApi.getPrescriptionByAppointment(selectedAppointmentId);
                return res.data;
            } catch {
                return null;
            }
        },
        enabled: !!selectedAppointmentId,
    });

    // Check if an unfinalized draft exists on an active (NOT Completed) appointment
    const hasUnfinalizedDraft = targetAppointment &&
        targetAppointment.status !== 'Completed' &&
        draftData?.prescription?.isDraft === true &&
        draftData?.prescription?.medications?.length > 0;

    const handleLoadSavedDraft = () => {
        if (!hasUnfinalizedDraft) return;
        const rx = draftData.prescription;
        const clin = draftData.clinicalDetails;
        setMedications(rx.medications.map(m => ({
            name: m.name || '',
            frequency: m.frequency || '1-0-1',
            duration: m.duration || '5',
            durationUnit: m.durationUnit || 'Days',
            instruction: m.instruction || 'After Food'
        })));
        if (rx.notes) setNotes(rx.notes);
        if (clin?.diagnosis || rx.diagnosis) setDiagnosis(clin?.diagnosis || rx.diagnosis || '');
        if (rx.followUpDate) {
            try {
                setFollowUpDate(new Date(rx.followUpDate).toISOString().split('T')[0]);
            } catch {
                // ignore
            }
        }
        toast.success('Loaded saved draft medications');
    };

    // Search medication autocomplete
    const handleDrugSearch = async (index, query) => {
        const updated = [...medications];
        updated[index].name = query;
        setMedications(updated);
        setActiveDrugIndex(index);

        if (query.trim().length >= 2) {
            try {
                const res = await doctorApi.searchMedications(query.trim());
                setDrugSuggestions(res.data || []);
            } catch {
                setDrugSuggestions([]);
            }
        } else {
            setDrugSuggestions([]);
        }
    };

    const selectDrugSuggestion = (index, drugName) => {
        const updated = [...medications];
        updated[index].name = drugName;
        setMedications(updated);
        setDrugSuggestions([]);
        setActiveDrugIndex(null);
    };

    // Medication Row Management
    const addMedicationRow = () => {
        setMedications(prev => [
            ...prev,
            { name: '', frequency: '1-0-1', duration: '5', durationUnit: 'Days', instruction: 'After Food' }
        ]);
    };

    const updateMedication = (index, field, value) => {
        const updated = [...medications];
        updated[index][field] = value;
        setMedications(updated);
    };

    const removeMedicationRow = (index) => {
        setMedications(prev => prev.filter((_, i) => i !== index));
    };

    // Check if drug already added to New Prescription
    const isDrugAlreadyAdded = (drugName) => {
        if (!drugName) return false;
        return medications.some(m => m.name && m.name.trim().toLowerCase() === drugName.trim().toLowerCase());
    };

    // Copy single selective drug from Middle to Right
    const handleAddDrugToNewRx = (drug) => {
        if (!drug || !drug.name) return;

        const newDrug = {
            name: drug.name,
            frequency: drug.frequency || '1-0-1',
            duration: drug.duration || '5',
            durationUnit: drug.durationUnit || 'Days',
            instruction: drug.instruction || 'After Food'
        };

        if (isDrugAlreadyAdded(drug.name)) {
            toast('This medicine is already in the new prescription', { icon: 'ℹ️' });
            return;
        }

        // If the only existing row is an empty manual row, replace it
        setMedications(prev => {
            if (prev.length === 1 && !prev[0].name.trim()) {
                return [newDrug];
            }
            return [...prev, newDrug];
        });

        toast.success(`Added ${drug.name} to new prescription`);
    };

    // Copy all drugs from Middle to Right
    const handleAddAllDrugsToNewRx = (drugs) => {
        if (!drugs || drugs.length === 0) return;

        const formatted = drugs.map(d => ({
            name: d.name || '',
            frequency: d.frequency || '1-0-1',
            duration: d.duration || '5',
            durationUnit: d.durationUnit || 'Days',
            instruction: d.instruction || 'After Food'
        }));

        setMedications(prev => {
            const existingNames = new Set(prev.map(m => m.name?.trim().toLowerCase()).filter(Boolean));
            const nonDuplicates = formatted.filter(d => !existingNames.has(d.name?.trim().toLowerCase()));
            if (nonDuplicates.length === 0) {
                toast('All medicines are already in the new prescription', { icon: 'ℹ️' });
                return prev;
            }
            toast.success(`Copied ${nonDuplicates.length} medicines to new prescription`);
            const cleanPrev = prev.filter(m => m.name && m.name.trim());
            return [...cleanPrev, ...nonDuplicates];
        });
    };

    // Start New Consultation (Appointment) on the fly
    const handleCreateNewAppointment = async () => {
        try {
            const res = await doctorApi.createAppointmentForPatient(patientId, {
                date: new Date(),
                reason: 'Follow-up Consultation',
                type: 'In-person'
            });
            await refetch();
            setSelectedAppointmentId(res.data._id);
            toast.success('Started new consultation session for today!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create new consultation');
        }
    };

    // Save Draft for the selected appointment
    const handleSaveDraft = async () => {
        const validMeds = medications.filter(m => m.name && m.name.trim().length > 0);
        if (validMeds.length === 0 && !diagnosis.trim() && !notes.trim()) {
            toast.error('Please add at least one medication, diagnosis, or clinical note');
            return;
        }

        setIsSavingDraft(true);
        try {
            let targetApptId = selectedAppointmentId;
            const targetAppt = allAppointments.find(a => a._id === selectedAppointmentId);

            // If no appointment or target appointment is already completed, create a new consultation for today
            if (!targetApptId || targetAppt?.status === 'Completed') {
                toast('Creating consultation session for today to save draft...', { icon: 'ℹ️' });
                const newApptRes = await doctorApi.createAppointmentForPatient(patientId, {
                    date: new Date(),
                    reason: 'Prescription & Consultation',
                    type: 'In-person'
                });
                targetApptId = newApptRes.data._id;
                setSelectedAppointmentId(targetApptId);
            }

            await doctorApi.saveDraft(targetApptId, {
                medications: validMeds,
                diagnosis: diagnosis.trim(),
                clinicalNotes: notes.trim(),
                notes: notes.trim(),
                followUpDate: followUpDate || undefined,
                patientId
            });

            await refetch();
            queryClient.invalidateQueries(['appointmentDraft', targetApptId]);
            queryClient.invalidateQueries(['patientHistory', patientId]);
            setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            toast.success('Prescription saved as draft for consultation!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save draft prescription');
        } finally {
            setIsSavingDraft(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="max-w-[1600px] mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[60vh]">
                    <Activity className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                    <p className="text-slate-500 font-bold tracking-wider text-sm uppercase">Loading Clinical Records...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (isError || !historyData) {
        return (
            <DashboardLayout>
                <div className="max-w-[1600px] mx-auto py-12 px-4 text-center">
                    <AlertCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">Clinical Record Not Available</h2>
                    <p className="text-slate-500 mt-2 text-sm">Unable to access clinical history for this patient or no relationship found.</p>
                    <button
                        onClick={() => navigate('/doctor/patients')}
                        className="btn-primary mt-6 inline-flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Return to Patients
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout noScroll>
            <div className="max-w-[1700px] w-full mx-auto flex flex-col lg:h-full lg:overflow-hidden gap-3.5">
                {/* Top Navigation & Patient Profile Banner */}
                <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/doctor/patients')}
                            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all flex items-center justify-center shrink-0 border border-slate-200/60 shadow-sm"
                            title="Back to Patients Directory"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white flex items-center justify-center text-xl font-black shadow-md shadow-primary-200 shrink-0">
                            {patient?.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black text-secondary-900 uppercase tracking-tight">
                                    {patient?.name || 'Patient Clinical Record'}
                                </h1>
                                <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-lg border border-primary-100">
                                    #{patient?.displayId || patient?._id?.slice(-8)}
                                </span>
                                {(patient?.age || patient?.gender) && (
                                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                                        {[patient?.age ? `${patient.age} Y` : null, patient?.gender].filter(Boolean).join(' / ')}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-1 flex-wrap">
                                {patient?.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        {patient.phone}
                                    </span>
                                )}
                                {patient?.email && (
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        {patient.email}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {allPrescriptions.length} Past Prescriptions
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Button to Open Clinical Session if needed */}
                    <div className="flex items-center gap-3">
                        {selectedAppointmentId && (
                            <button
                                onClick={() => navigate(`/doctor/session/${selectedAppointmentId}`)}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-200/80"
                                title="Open full clinical session workspace"
                            >
                                <ExternalLink className="w-4 h-4 text-slate-500" />
                                Full Clinical Session
                            </button>
                        )}
                    </div>
                </div>

                {/* 3-Panel Main Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 lg:min-h-0 items-stretch lg:overflow-hidden">
                    {/* PANEL 1: LEFT SIDE - Prescriptions History List */}
                    <div className="lg:col-span-3 glass-card flex flex-col h-[600px] lg:h-full lg:min-h-0 overflow-hidden bg-white/90">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary-600" />
                                    <h2 className="text-xs font-black text-secondary-900 uppercase tracking-wider">
                                        Prescriptions
                                    </h2>
                                </div>
                                <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-black rounded-md border border-primary-100">
                                    {allPrescriptions.length} Records
                                </span>
                            </div>

                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Filter by date, drug, doctor..."
                                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Prescription Items */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                            {filteredPrescriptions.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <Pill className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-wider">No Prescriptions Found</p>
                                </div>
                            ) : (
                                filteredPrescriptions.map((rx) => {
                                    const isSelected = rx._id === selectedRxId;
                                    const dateStr = rx.createdAt
                                        ? new Date(rx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : 'Unknown Date';
                                    const drugCount = rx.medications?.length || 0;
                                    const diag = rx.appointment?.diagnosis || rx.diagnosis;

                                    return (
                                        <div
                                            key={rx._id}
                                            onClick={() => setSelectedRxId(rx._id)}
                                            className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-left relative group ${isSelected
                                                ? 'bg-primary-50/70 border-primary-500 shadow-sm ring-1 ring-primary-500/30'
                                                : 'bg-white hover:bg-slate-50/90 border-slate-100 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-1.5 text-xs font-black text-secondary-900">
                                                    <Calendar className="w-3.5 h-3.5 text-primary-500" />
                                                    {dateStr}
                                                </div>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${rx.isDraft
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}>
                                                    {rx.isDraft ? 'Draft' : 'Finalized'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 text-[11px] text-slate-600 font-bold truncate">
                                                <Stethoscope className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span className="truncate">{rx.doctor?.name || 'Practitioner'}</span>
                                            </div>

                                            {diag && (
                                                <p className="text-[10px] text-slate-500 font-medium truncate mt-1">
                                                    Diagnosis: <span className="text-slate-700 font-semibold">{diag}</span>
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/80">
                                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                    <Pill className="w-3 h-3 text-primary-500" />
                                                    {drugCount} Medicine{drugCount === 1 ? '' : 's'}
                                                </span>
                                                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-primary-600 translate-x-1' : 'text-slate-300 group-hover:translate-x-0.5'}`} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* PANEL 2: MIDDLE - Selected Prescription Drugs */}
                    <div className="lg:col-span-4 glass-card flex flex-col h-[600px] lg:h-full lg:min-h-0 overflow-hidden bg-white/90">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-primary-600" />
                                    <h2 className="text-xs font-black text-secondary-900 uppercase tracking-wider">
                                        Prescription Drugs
                                    </h2>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    {selectedRx?.createdAt ? new Date(selectedRx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Selected Consultation'}
                                </p>
                            </div>

                            {selectedRx?.medications?.length > 0 && (
                                <button
                                    onClick={() => handleAddAllDrugsToNewRx(selectedRx.medications)}
                                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
                                    title="Add all medicines from this prescription into the new prescription"
                                >
                                    <Copy className="w-3 h-3" />
                                    Copy All Drugs
                                </button>
                            )}
                        </div>

                        {/* Selected Rx Content */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {!selectedRx ? (
                                <div className="p-12 text-center text-slate-400">
                                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Select a prescription from the left</p>
                                </div>
                            ) : (
                                <>
                                    {/* Consultation Meta Box */}
                                    <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-600">Doctor:</span>
                                            <span className="font-bold text-secondary-900">{selectedRx.doctor?.name || 'Practitioner'}</span>
                                        </div>
                                        {(selectedRx.appointment?.diagnosis || selectedRx.diagnosis) && (
                                            <div className="flex items-start justify-between text-xs pt-1 border-t border-slate-100 gap-2">
                                                <span className="font-bold text-slate-600 shrink-0">Diagnosis:</span>
                                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                    <span className="font-semibold text-primary-700 text-right">
                                                        {selectedRx.appointment?.diagnosis || selectedRx.diagnosis}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDiagnosis(selectedRx.appointment?.diagnosis || selectedRx.diagnosis);
                                                            toast.success('Diagnosis copied to new prescription');
                                                        }}
                                                        className="text-[10px] font-bold text-primary-600 hover:text-primary-800 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200 transition-colors"
                                                        title="Copy diagnosis to new prescription"
                                                    >
                                                        + Use
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {selectedRx.notes && (
                                            <div className="text-xs pt-1 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="font-bold text-slate-600">Advice / Notes:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setNotes(selectedRx.notes);
                                                            toast.success('Advice copied to new prescription');
                                                        }}
                                                        className="text-[10px] font-bold text-primary-600 hover:text-primary-800 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200 transition-colors"
                                                        title="Copy advice to new prescription"
                                                    >
                                                        + Use
                                                    </button>
                                                </div>
                                                <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 text-[11px]">
                                                    {selectedRx.notes}
                                                </p>
                                            </div>
                                        )}
                                        {selectedRx.image && (
                                            <button
                                                onClick={() => setViewingImageModal(selectedRx.image)}
                                                className="w-full mt-2 py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-primary-300 flex items-center justify-center gap-1.5 transition-all"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 text-primary-600" />
                                                View Handwritten Rx Image
                                            </button>
                                        )}
                                    </div>

                                    {/* Drugs List with selective '+ Add to New Rx' button */}
                                    <div>
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                                            Medicines Prescribed ({selectedRx.medications?.length || 0})
                                        </h3>

                                        {(!selectedRx.medications || selectedRx.medications.length === 0) ? (
                                            <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                                                No structured digital medicines in this prescription.
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {selectedRx.medications.map((drug, index) => {
                                                    const alreadyAdded = isDrugAlreadyAdded(drug.name);

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="p-3.5 bg-white rounded-2xl border border-slate-100 hover:border-primary-200 transition-all shadow-xs flex items-center justify-between gap-3 group"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                                        {index + 1}
                                                                    </div>
                                                                    <h4 className="text-xs font-black text-secondary-900 truncate">
                                                                        {drug.name}
                                                                    </h4>
                                                                </div>

                                                                <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px]">
                                                                    {drug.frequency && (
                                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md border border-blue-100">
                                                                            {drug.frequency}
                                                                        </span>
                                                                    )}
                                                                    {drug.duration && (
                                                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-md border border-amber-100">
                                                                            {drug.duration} {drug.durationUnit || 'Days'}
                                                                        </span>
                                                                    )}
                                                                    {drug.instruction && (
                                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-100">
                                                                            {drug.instruction}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Selective Add Button */}
                                                            <button
                                                                onClick={() => handleAddDrugToNewRx(drug)}
                                                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm ${alreadyAdded
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                                    : 'bg-primary-600 hover:bg-primary-700 text-white active:scale-95'
                                                                    }`}
                                                                title="Add this medicine to new prescription"
                                                            >
                                                                {alreadyAdded ? (
                                                                    <>
                                                                        <Check className="w-3.5 h-3.5" />
                                                                        <span>Added</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                        <span>Add to Rx</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* PANEL 3: RIGHT SIDE - New Prescription & Save Draft */}
                    <div className="lg:col-span-5 glass-card flex flex-col h-[700px] lg:h-full lg:min-h-0 overflow-hidden bg-white/95 border-2 border-primary-100/60 shadow-lg">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-primary-50/50 via-slate-50 to-white flex items-center justify-between gap-3 shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <h2 className="text-xs font-black text-secondary-900 uppercase tracking-wider">
                                        New Prescription (Draft)
                                    </h2>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    Build from past medications & save draft for consultation
                                </p>
                            </div>
                        </div>

                        {/* Prescriber Form Fields */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {/* Saved draft alert banner (optional, only if unfinalized draft exists on active appt and medications is empty) */}
                            {hasUnfinalizedDraft && medications.length === 0 && (
                                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2 text-amber-800">
                                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                        <span className="font-semibold text-[11px]">
                                            Saved draft found for this consultation ({draftData.prescription.medications.length} medicines)
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleLoadSavedDraft}
                                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider shrink-0 shadow-xs"
                                    >
                                        Load Draft
                                    </button>
                                </div>
                            )}

                            {/* Diagnosis & Notes Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                        Provisional Diagnosis
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Acute Bronchitis, Fever"
                                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        value={diagnosis}
                                        onChange={(e) => setDiagnosis(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                        Follow-up Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-600"
                                        value={followUpDate}
                                        onChange={(e) => setFollowUpDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Medications List */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[11px] font-black text-secondary-900 uppercase tracking-widest flex items-center gap-1.5">
                                        <Pill className="w-3.5 h-3.5 text-primary-500" />
                                        Medications ({medications.filter(m => m.name.trim()).length})
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addMedicationRow}
                                        className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-wider flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Manual Drug
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {medications.length === 0 ? (
                                        <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                                            <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-xs font-bold text-slate-600">No medicines added yet</p>
                                            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                                                Click <span className="font-bold text-primary-600">+ Add to Rx</span> on any medicine in the middle panel, or add a medicine manually.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={addMedicationRow}
                                                className="mt-3 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:border-primary-300 text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all"
                                            >
                                                <Plus className="w-3.5 h-3.5 text-primary-600" />
                                                Add Manual Drug
                                            </button>
                                        </div>
                                    ) : (
                                        medications.map((med, index) => (
                                        <div
                                            key={index}
                                            className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2 relative"
                                        >
                                            {/* Drug Name with Autocomplete */}
                                            <div className="relative">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-black text-[10px] flex items-center justify-center shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        placeholder="Drug name (e.g. Paracetamol 650mg)"
                                                        className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                                        value={med.name}
                                                        onChange={(e) => handleDrugSearch(index, e.target.value)}
                                                        onFocus={() => setActiveDrugIndex(index)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMedicationRow(index)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                                                        title="Remove medication"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Suggestions dropdown */}
                                                {activeDrugIndex === index && drugSuggestions.length > 0 && (
                                                    <div className="absolute left-7 right-8 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-40 overflow-y-auto custom-scrollbar">
                                                        {drugSuggestions.map((sug, sIdx) => (
                                                            <div
                                                                key={sIdx}
                                                                onMouseDown={() => selectDrugSuggestion(index, sug)}
                                                                className="px-3 py-2 text-xs font-medium hover:bg-primary-50 hover:text-primary-700 cursor-pointer border-b border-slate-50 last:border-0"
                                                            >
                                                                {sug}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Frequency, Duration, Instructions */}
                                            <div className="grid grid-cols-3 gap-2 pl-7">
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                                                        Frequency
                                                    </label>
                                                    <select
                                                        className="w-full text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-700"
                                                        value={med.frequency}
                                                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                    >
                                                        {FREQUENCY_OPTIONS.map(f => (
                                                            <option key={f} value={f}>{f}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                                                        Duration
                                                    </label>
                                                    <div className="flex gap-1">
                                                        <input
                                                            type="text"
                                                            className="w-12 text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-700"
                                                            value={med.duration}
                                                            onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                                        />
                                                        <select
                                                            className="flex-1 text-[11px] font-semibold px-1 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-700"
                                                            value={med.durationUnit || 'Days'}
                                                            onChange={(e) => updateMedication(index, 'durationUnit', e.target.value)}
                                                        >
                                                            {DURATION_UNITS.map(u => (
                                                                <option key={u} value={u}>{u}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                                                        Instructions
                                                    </label>
                                                    <select
                                                        className="w-full text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-700"
                                                        value={med.instruction}
                                                        onChange={(e) => updateMedication(index, 'instruction', e.target.value)}
                                                    >
                                                        {INSTRUCTION_OPTIONS.map(inst => (
                                                            <option key={inst} value={inst}>{inst}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                </div>
                            </div>

                            {/* Clinical Notes / Advice textarea */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                    Clinical Advice / Dietary Instructions
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="e.g. Avoid cold water, take plenty of fluids, review in 5 days..."
                                    className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Footer Action Bar */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                            <div className="text-xs text-slate-400 font-medium">
                                {lastSavedTime ? (
                                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Draft saved at {lastSavedTime}
                                    </span>
                                ) : (
                                    <span>Target: {targetAppointment ? new Date(targetAppointment.date).toLocaleDateString('en-GB') : 'No appointment selected'}</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMedications([]);
                                        setDiagnosis('');
                                        setNotes('');
                                        setFollowUpDate('');
                                    }}
                                    className="px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    Reset
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={isSavingDraft}
                                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-primary-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSavingDraft ? (
                                        <>
                                            <Activity className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Draft for Appt
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Handwritten Rx Image Modal Lightbox */}
            <AnimatePresence>
                {viewingImageModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-secondary-900/70 backdrop-blur-sm"
                        onClick={() => setViewingImageModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <h3 className="text-sm font-black text-secondary-900 uppercase">Handwritten Prescription Image</h3>
                                <button
                                    onClick={() => setViewingImageModal(null)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto py-4">
                                <img
                                    src={viewingImageModal}
                                    alt="Handwritten prescription"
                                    className="w-full h-auto object-contain rounded-xl max-h-[70vh]"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default PatientPrescriptionsPage;
