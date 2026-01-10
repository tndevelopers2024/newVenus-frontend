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
    User
} from 'lucide-react';
import { doctorApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';

const ClinicalSession = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Vitals and clinical state
    const [medications, setMedications] = useState([{ name: '', frequency: '', duration: '' }]);
    const [medicationToDelete, setMedicationToDelete] = useState(null);
    const [notes, setNotes] = useState('');
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
        onSuccess: () => {
            queryClient.invalidateQueries(['doctorAppointments']);
            navigate('/doctor/appointments');
        }
    });

    const addMedication = () => {
        setMedications([...medications, { name: '', frequency: '', duration: '' }]);
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
            vitals
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
            <div className="max-w-7xl mx-auto py-10 px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/doctor/appointments')}
                            className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-secondary-900 shadow-sm transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black text-secondary-900 uppercase tracking-tighter">Clinical Session</h1>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Patient: {appointment.patient?.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">ID: {appointment._id?.slice(-8).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-10">

                    {/* 1. Patient Profile */}
                    <div className="bg-secondary-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-secondary-900/20">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-black">
                                    {appointment.patient?.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Patient Profile</p>
                                    <h4 className="text-3xl font-black uppercase tracking-tight">{appointment.patient?.name}</h4>
                                    <p className="text-sm text-slate-400 mt-1">{appointment.patient?.email}</p>
                                </div>
                            </div>
                            <div className="h-px md:h-16 w-full md:w-px bg-white/10" />
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Appointment Date</p>
                                    <p className="text-base font-bold">{new Date(appointment.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Reason</p>
                                    <p className="text-base font-bold truncate max-w-[200px]">{appointment.reason || 'General Checkup'}</p>
                                </div>
                            </div>
                        </div>
                        <User className="absolute bottom-[-40px] right-[-40px] w-64 h-64 text-white/5 opacity-5" />
                    </div>

                    {/* 2. Medication Details */}
                    <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/50 relative">
                        {/* RX Watermark */}
                        <div className="absolute top-10 right-10 text-[200px] font-black text-slate-50 opacity-[0.5] select-none pointer-events-none leading-none">Rx</div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-secondary-50 rounded-2xl">
                                        <Activity className="w-6 h-6 text-secondary-900" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">Medications</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Prescription Details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={addMedication}
                                    className="flex items-center gap-3 px-6 py-3 bg-secondary-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-secondary-200"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Drug
                                </button>
                            </div>

                            <div className="space-y-6">
                                <AnimatePresence mode="popLayout">
                                    {medications.map((med, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pb-8 border-b border-slate-50 last:border-0 group relative bg-secondary-50/30 p-6 rounded-3xl"
                                        >
                                            <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="relative">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Drugs</label>
                                                    <input
                                                        value={med.name}
                                                        onChange={(e) => handleMedChange(index, 'name', e.target.value)}
                                                        className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-secondary-500/10 transition-all shadow-sm"
                                                        placeholder="Drug Name"
                                                    />
                                                    <DrugAutosuggest
                                                        query={med.name}
                                                        onSelect={(val) => handleMedChange(index, 'name', val)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Frequency</label>
                                                    <input
                                                        value={med.frequency}
                                                        onChange={(e) => handleMedChange(index, 'frequency', e.target.value)}
                                                        className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-secondary-500/10 transition-all shadow-sm"
                                                        placeholder="1-0-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Duration (Days)</label>
                                                    <input
                                                        value={med.duration}
                                                        onChange={(e) => handleMedChange(index, 'duration', e.target.value)}
                                                        className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-secondary-500/10 transition-all shadow-sm"
                                                        placeholder="5 Days"
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-1 pb-1 flex justify-end">
                                                {medications.length > 1 && (
                                                    <button onClick={() => removeMedication(index)} className="p-3 text-slate-400 hover:text-white hover:bg-rose-500 transition-all rounded-xl">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </section>

                    {/* 3. Clinical Vitals */}
                    <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary-50 rounded-2xl">
                                <Activity className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">Clinical Vitals</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Patient Vitals Record</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {Object.entries(vitals).map(([key, value]) => (
                                <div key={key}>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/10 transition-all shadow-inner"
                                        placeholder={key === 'bloodPressure' ? '120/80' : '-'}
                                        value={value}
                                        onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. Diagnosis and Notes */}
                    <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-emerald-50 rounded-2xl">
                                <Stethoscope className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">Diagnosis</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Medical Conclusion</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Medical Diagnosis</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-transparent rounded-2xl px-6 py-4 text-base font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/10 shadow-inner"
                                    placeholder="Principal diagnosis..."
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Clinical Observations</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-transparent rounded-[24px] px-6 py-5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/10 h-40 resize-none shadow-inner"
                                        placeholder="Detailed clinical findings..."
                                        value={clinicalNotes}
                                        onChange={(e) => setClinicalNotes(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Physician's Closing Advice</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-slate-50 border border-transparent rounded-[24px] px-6 py-5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/10 h-40 resize-none shadow-inner"
                                        placeholder="Instructions for the patient..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={prescribeMutation.isPending}
                                className="group relative overflow-hidden px-12 py-5 bg-secondary-900 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-secondary-900/40 hover:bg-black transition-all active:scale-95 flex items-center gap-4"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                                {prescribeMutation.isPending ? 'Syncing...' : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Create Prescription
                                    </>
                                )}
                            </button>
                        </div>
                    </section>

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
