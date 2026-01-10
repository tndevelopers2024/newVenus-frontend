import React, { useState, useEffect } from 'react';
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
    Calendar,
    Clock,
    ClipboardList
} from 'lucide-react';
import { doctorApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';

const ClinicalSession = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Vitals and clinical state
    const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
    const [notes, setNotes] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [vitals, setVitals] = useState({
        bloodPressure: '',
        temperature: '',
        pulse: '',
        weight: ''
    });
    const [consultationFee, setConsultationFee] = useState(500);
    const [paymentStatus, setPaymentStatus] = useState('Unpaid');

    // Fetch appointment data
    const { data: appointment, isLoading: isLoadingAppt } = useQuery({
        queryKey: ['appointment', appointmentId],
        queryFn: async () => {
            const res = await doctorApi.getAppointments(); // We have to filter because there's no getAppointmentById yet
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
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
    };

    const removeMedication = (index) => {
        setMedications(medications.filter((_, i) => i !== index));
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
            consultationFee: Number(consultationFee),
            paymentStatus
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Vitals & Diagnosis */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Patient Badge */}
                        <div className="bg-secondary-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Patient Profile</p>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-black">
                                        {appointment.patient?.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black uppercase tracking-tight">{appointment.patient?.name}</h4>
                                        <p className="text-xs text-slate-400">{appointment.patient?.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Appointment Date</p>
                                        <p className="text-xs font-bold">{new Date(appointment.date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Reason</p>
                                        <p className="text-xs font-bold truncate">{appointment.reason || 'General Checkup'}</p>
                                    </div>
                                </div>
                            </div>
                            <User className="absolute bottom-[-20px] right-[-20px] w-40 h-40 text-white/5 opacity-5" />
                        </div>

                        <section className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-primary-50 rounded-2xl">
                                    <Activity className="w-5 h-5 text-primary-600" />
                                </div>
                                <h3 className="font-black text-secondary-900 uppercase tracking-tighter">Clinical Vitals</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                {Object.entries(vitals).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-transparent rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/10 transition-all shadow-inner"
                                            placeholder={key === 'bloodPressure' ? '120/80' : ''}
                                            value={value}
                                            onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-secondary-50 rounded-2xl">
                                    <Stethoscope className="w-5 h-5 text-secondary-600" />
                                </div>
                                <h3 className="font-black text-secondary-900 uppercase tracking-tighter">Diagnosis</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Medical Diagnosis</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-transparent rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-secondary-500/10 shadow-inner"
                                        placeholder="Principal diagnosis..."
                                        value={diagnosis}
                                        onChange={(e) => setDiagnosis(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Clinical Observations</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-transparent rounded-[24px] px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-secondary-500/10 h-40 resize-none shadow-inner"
                                        placeholder="Detailed clinical findings..."
                                        value={clinicalNotes}
                                        onChange={(e) => setClinicalNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Prescription Builder */}
                    <div className="lg:col-span-2 space-y-10">
                        <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[600px] flex flex-col relative">
                            {/* RX Watermark */}
                            <div className="absolute top-10 left-10 text-[160px] font-black text-slate-50 opacity-[0.03] select-none pointer-events-none">Rx</div>

                            <div className="relative z-10 flex items-center justify-between mb-12">
                                <div>
                                    <h3 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter">Prescription</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Authenticated Medication Sheet</p>
                                </div>
                                <button
                                    onClick={addMedication}
                                    className="flex items-center gap-3 px-8 py-4 bg-secondary-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-secondary-200"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Medication
                                </button>
                            </div>

                            <div className="relative z-10 flex-1 space-y-8">
                                <AnimatePresence mode="popLayout">
                                    {medications.map((med, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pb-8 border-b border-slate-50 last:border-0 group relative"
                                        >
                                            <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-4 gap-6">
                                                <div className="relative">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Medication</label>
                                                    <input
                                                        value={med.name}
                                                        onChange={(e) => handleMedChange(index, 'name', e.target.value)}
                                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/10 transition-all shadow-sm"
                                                        placeholder="Drug Name"
                                                    />
                                                    <DrugAutosuggest
                                                        query={med.name}
                                                        onSelect={(val) => handleMedChange(index, 'name', val)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Dosage</label>
                                                    <input
                                                        value={med.dosage}
                                                        onChange={(e) => handleMedChange(index, 'dosage', e.target.value)}
                                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/10 transition-all shadow-sm"
                                                        placeholder="e.g. 1 Tab"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Frequency</label>
                                                    <input
                                                        value={med.frequency}
                                                        onChange={(e) => handleMedChange(index, 'frequency', e.target.value)}
                                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/10 transition-all shadow-sm"
                                                        placeholder="1-0-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Duration</label>
                                                    <input
                                                        value={med.duration}
                                                        onChange={(e) => handleMedChange(index, 'duration', e.target.value)}
                                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/10 transition-all shadow-sm"
                                                        placeholder="5 Days"
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-1 pb-1">
                                                {medications.length > 1 && (
                                                    <button onClick={() => removeMedication(index)} className="p-3 text-slate-200 hover:text-rose-500 transition-all hover:bg-rose-50 rounded-xl">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="relative z-10 mt-12 pt-10 border-t border-slate-50">
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-4 block tracking-[0.2em]">Physician's Closing Advice</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-[32px] p-8 text-sm font-medium text-slate-600 focus:bg-white focus:ring-4 focus:ring-primary-500/5 outline-none transition-all resize-none h-32 shadow-inner"
                                    placeholder="Instructions for the patient..."
                                />
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 flex items-center justify-between shadow-xl shadow-slate-200/20">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Fee</p>
                                    <div className="flex items-center gap-1 group">
                                        <span className="text-3xl font-black text-secondary-900">₹</span>
                                        <input
                                            type="number"
                                            value={consultationFee}
                                            onChange={(e) => setConsultationFee(e.target.value)}
                                            className="w-32 bg-transparent border-none p-0 text-3xl font-black text-secondary-900 outline-none focus:text-primary-600 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                                    <Activity className="w-8 h-8" />
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col justify-center gap-4 shadow-xl shadow-slate-200/20">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Status</p>
                                <div className="flex p-1 bg-slate-100 rounded-[20px] w-full">
                                    {['Unpaid', 'Paid'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setPaymentStatus(status)}
                                            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentStatus === status
                                                    ? (status === 'Paid' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-secondary-900 text-white shadow-lg shadow-slate-200')
                                                    : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={prescribeMutation.isPending}
                                className="group relative overflow-hidden px-10 py-8 bg-primary-600 text-white rounded-[40px] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary-500/40 hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-4"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                                {prescribeMutation.isPending ? 'Syncing Portal...' : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Finalize Clinical Record
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

const DrugAutosuggest = ({ query, onSelect }) => {
    const { data: results, isLoading } = useQuery({
        queryKey: ['medSearch', query],
        queryFn: async () => {
            if (query.length < 2) return [];
            const res = await doctorApi.searchMedications(query);
            return res.data;
        },
        enabled: query?.length >= 2,
    });

    if (isLoading || !results || results.length === 0) return null;

    return (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-50 z-[60] overflow-hidden min-w-[300px]">
            {results.map((drug) => (
                <button
                    key={drug}
                    onClick={() => onSelect(drug)}
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
