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
    Calendar
} from 'lucide-react';
import { doctorApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getUnifiedDocumentHTML } from '../../components/shared/UnifiedDocument';
import CalendarDatePicker from '../../components/ui/CalendarDatePicker';
import { motion, AnimatePresence } from 'framer-motion';

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

    const prescribeMutation = useMutation({
        mutationFn: (data) => doctorApi.createPrescription(data),
        onSuccess: (data) => {
            // Trigger Print
            const printData = {
                createdAt: new Date(),
                appointmentId: appointment?._id,
                prescription: {
                    doctor: appointment?.doctor,
                    patient: appointment?.patient,
                    medications: medications,
                    notes: notes,
                    followUpDate: followUpDate
                },
                clinicalDetails: {
                    vitals: vitals,
                    diagnosis: diagnosis
                }
            };

            const html = getUnifiedDocumentHTML(printData, 'prescription');
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
            }

            queryClient.invalidateQueries(['doctorAppointments']);
            navigate('/doctor/appointments');
        }
    });

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

    const handleSubmit = () => {
        prescribeMutation.mutate({
            patientId: appointment.patient?._id,
            appointmentId: appointment._id,
            medications,
            notes,
            diagnosis,
            clinicalNotes,
            vitals,
            followUpDate
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
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-secondary-50 rounded-xl">
                                        <Activity className="w-5 h-5 text-secondary-900" />
                                    </div>
                                    <h3 className="text-lg font-black text-secondary-900 uppercase tracking-tight">Medications</h3>
                                </div>
                                <button
                                    onClick={addMedication}
                                    className="px-4 py-2 bg-secondary-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Drug
                                </button>
                            </div>

                            <div className="space-y-4">
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
                                            <div className="col-span-2">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block ml-1">Freq</label>
                                                <input
                                                    value={med.frequency}
                                                    onChange={(e) => handleMedChange(index, 'frequency', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-secondary-500"
                                                    placeholder="1-0-1"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block ml-1">Days</label>
                                                <input
                                                    value={med.duration}
                                                    onChange={(e) => handleMedChange(index, 'duration', e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-secondary-500"
                                                    placeholder="5"
                                                />
                                            </div>
                                            <div className="col-span-3">
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
                                disabled={prescribeMutation.isPending}
                                className="w-full py-4 bg-secondary-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                            >
                                {prescribeMutation.isPending ? 'Saving...' : (
                                    <>
                                        <Printer className="w-4 h-4" />
                                        Print Prescription
                                    </>
                                )}
                            </button>
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
            if (query.length < 3) return [];
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
        enabled: query?.length >= 3,
    });

    // Control visibility based on query changes
    useEffect(() => {
        if (justSelected.current) {
            justSelected.current = false;
            setIsOpen(false);
            return;
        }
        if (query.length >= 3) {
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
