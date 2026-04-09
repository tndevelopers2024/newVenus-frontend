import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    User,
    Stethoscope,
    Clock,
    MessageSquare,
    CheckCircle2,
    ChevronLeft,
    Search,
    Check,
    Activity,
    X,
    ClipboardCheck,
    Circle,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';

const AppointmentAssignment = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        patientIds: [],
        doctorId: '',
        patientConfigs: {} // { [id]: { reasons: [], notes: '', vitals: { bloodPressure: '', ... } } }
    });

    const [modalState, setModalState] = useState({
        isOpen: false,
        patient: null,
        config: {
            reasons: [],
            notes: '',
            vitals: { bloodPressure: '', temperature: '', pulse: '', weight: '' }
        }
    });

    const [searchTerms, setSearchTerms] = useState({
        patient: '',
        doctor: ''
    });

    const getDisplayId = (user) => {
        if (!user) return 'XXX-000';
        if (user.displayId) return user.displayId;
        if (!user.name || !user._id) return 'XXX-000';
        const prefix = user.name.slice(0, 3).toUpperCase();
        const decimal = parseInt(user._id.slice(-4), 16);
        const suffix = (decimal % 1000).toString().padStart(3, '0');
        return `${prefix}-${suffix}`;
    };

    const { data: users } = useQuery({
        queryKey: ['adminUsersAssignment'],
        queryFn: () => adminApi.getUsers().then(res => res.data)
    });

    const assignMutation = useMutation({
        mutationFn: adminApi.assignAppointment
    });

    const patients = (users || [])
        .filter(u => u.role === 'patient')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const doctors = (users || []).filter(u => u.role === 'doctor');

    const filteredPatients = searchTerms.patient
        ? patients.filter(p => {
            const displayId = getDisplayId(p);
            return (
                p.name?.toLowerCase().includes(searchTerms.patient.toLowerCase()) ||
                displayId.toLowerCase().includes(searchTerms.patient.toLowerCase()) ||
                p.phone?.includes(searchTerms.patient)
            );
        })
        : patients.slice(0, 10); // Show more patients by default now that we have better search

    const filteredDoctors = doctors.filter(d => {
        const displayId = getDisplayId(d);
        return (
            d.name.toLowerCase().includes(searchTerms.doctor.toLowerCase()) ||
            displayId.toLowerCase().includes(searchTerms.doctor.toLowerCase())
        );
    });

    const openPatientModal = (patient) => {
        const existingConfig = formData.patientConfigs[patient._id] || {
            reasons: [],
            notes: '',
            vitals: { bloodPressure: '', temperature: '', pulse: '', weight: '' }
        };
        setModalState({
            isOpen: true,
            patient,
            config: existingConfig
        });
    };

    const handleSavePatientConfig = () => {
        const patientId = modalState.patient._id;
        setFormData(prev => ({
            ...prev,
            patientConfigs: {
                ...prev.patientConfigs,
                [patientId]: modalState.config
            }
        }));
        setModalState({ isOpen: false, patient: null, config: null });
        toast.success(`Data saved for ${modalState.patient.name}`, {
            style: { borderRadius: '15px', background: '#1e293b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
        });
    };

    const togglePatientSelection = (e, id) => {
        e.stopPropagation();

        // Enforce configuration before selection
        if (!formData.patientConfigs[id]) {
            const patient = patients.find(p => p._id === id);
            toast.error(`Please record vitals for ${patient?.name || 'patient'} first`, {
                icon: '📋',
                style: { borderRadius: '15px', background: '#1e293b', color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }
            });
            if (patient) openPatientModal(patient);
            return;
        }

        setFormData(prev => {
            const isSelected = prev.patientIds.includes(id);
            return {
                ...prev,
                patientIds: isSelected
                    ? prev.patientIds.filter(pid => pid !== id)
                    : [...prev.patientIds, id]
            };
        });
    };

    const removePatient = (id) => {
        setFormData(prev => {
            const newConfigs = { ...prev.patientConfigs };
            delete newConfigs[id];
            return {
                ...prev,
                patientIds: prev.patientIds.filter(pid => pid !== id),
                patientConfigs: newConfigs
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.patientIds.length === 0 || !formData.doctorId) return;

        try {
            await Promise.all(formData.patientIds.map(patientId => {
                const config = formData.patientConfigs[patientId];
                const combinedReason = [
                    ...config.reasons,
                    ...(config.notes ? [config.notes] : [])
                ].join('. ');

                return assignMutation.mutateAsync({
                    patientId,
                    doctorId: formData.doctorId,
                    reason: combinedReason || 'Scheduled Visit',
                    vitals: config.vitals
                });
            }));

            queryClient.invalidateQueries(['adminInvoicesSummary']);
            queryClient.invalidateQueries(['adminAppointmentsAll']);
            toast.success('Appointments assigned successfully!', {
                icon: '🏥',
                style: {
                    borderRadius: '20px',
                    background: '#1e293b',
                    color: '#fff',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    letterSpacing: '1px'
                },
            });

            // Reset form
            setFormData({
                patientIds: [],
                doctorId: '',
                patientConfigs: {}
            });
        } catch (error) {
            toast.error('Failed to assign some appointments');
        }
    };

    const commonReasons = [
        'CONSULTATION',
        'ECG',
        'ECHO [2D ECHO CARDIOGRAM]',
        'TMT',
        'MASTER HEALTH CHECK UP (basic)',
        'MASTER HEALTH CHECK UP (ADVANCED)'
    ];

    const toggleModalReason = (reason) => {
        setModalState(prev => ({
            ...prev,
            config: {
                ...prev.config,
                reasons: prev.config.reasons.includes(reason)
                    ? prev.config.reasons.filter(r => r !== reason)
                    : [...prev.config.reasons, reason]
            }
        }));
    };

    const updateModalVitals = (field, value) => {
        setModalState(prev => ({
            ...prev,
            config: {
                ...prev.config,
                vitals: { ...prev.config.vitals, [field]: value }
            }
        }));
    };


    return (
        <DashboardLayout>
            <div className="max-w-8xl mx-auto pb-20">
                <div className="mb-10 flex items-center gap-4">
                    <Link to="/admin" className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-primary-600">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter">Assign Appointment</h1>
                        <p className="text-slate-500 font-medium">Link patients with specialized providers</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Patient Selection */}
                        <div className="glass-card p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-secondary-900 uppercase tracking-tight">Select Patient</h3>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="Search by name, ID or phone..."
                                    value={searchTerms.patient}
                                    onChange={(e) => setSearchTerms({ ...searchTerms, patient: e.target.value })}
                                />
                            </div>

                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-2">
                                {filteredPatients.map(p => {
                                    const isSelected = formData.patientIds.includes(p._id);
                                    const isConfigured = formData.patientConfigs[p._id];

                                    return (
                                        <div
                                            key={p._id}
                                            className={`group relative flex items-center gap-3 p-3 rounded-2xl border transition-all ${isSelected
                                                ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-100/50'
                                                : 'bg-white border-slate-100 hover:border-slate-200'
                                                }`}
                                        >
                                            {/* Selection Trigger */}
                                            <button
                                                type="button"
                                                onClick={(e) => togglePatientSelection(e, p._id)}
                                                className={`p-1 rounded-full transition-all ${isSelected ? 'text-rose-600' : 'text-slate-300 hover:text-slate-400'}`}
                                            >
                                                {isSelected ? <CheckCircle className="w-5 h-5 fill-rose-50" /> : <Circle className="w-5 h-5" />}
                                            </button>

                                            {/* Config Trigger */}
                                            <button
                                                type="button"
                                                onClick={() => openPatientModal(p)}
                                                className="flex-1 flex items-center justify-between text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black uppercase text-primary-600">
                                                        {p.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-secondary-900 uppercase">{p.name}</p>
                                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                                            <p className="text-[10px] text-slate-400 font-bold tracking-wider">#{getDisplayId(p)}</p>
                                                            {p.phone && <p className="text-[9px] text-primary-600 font-black tracking-tight">{p.phone}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-0.5">
                                                    {isConfigured ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">Saved</span>
                                                            <Activity className="w-3 h-3 text-rose-400 mt-1" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Reg. Date</span>
                                                            <span className="text-[9px] font-bold text-slate-500">{new Date(p.createdAt).toLocaleDateString('en-GB')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Doctor Selection */}
                        <div className="glass-card p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Stethoscope className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-secondary-900 uppercase tracking-tight">Select Doctor</h3>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20"
                                    placeholder="Search specialists..."
                                    onChange={(e) => setSearchTerms({ ...searchTerms, doctor: e.target.value })}
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                                {filteredDoctors.map(d => (
                                    <button
                                        key={d._id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, doctorId: d._id })}
                                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${formData.doctorId === d._id
                                            ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100'
                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black uppercase text-emerald-600">
                                                Dr.
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-secondary-900 uppercase">{d.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold tracking-wider">{d.specialization || 'General Medicine'}</p>
                                            </div>
                                        </div>
                                        {formData.doctorId === d._id && <Check className="w-4 h-4 text-emerald-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Consultation Registry Summary */}
                        <div className="glass-card p-8 flex flex-col h-full bg-slate-50/50 border-slate-200/50">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-secondary-900 flex items-center justify-center text-white">
                                    <ClipboardCheck className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-secondary-900 uppercase tracking-tight">Assignment Summary</h3>
                            </div>

                            <div className="flex-1 space-y-4">
                                {formData.patientIds.length === 0 ? (
                                    <div className="h-40 flex flex-col items-center justify-center text-center opacity-40">
                                        <User className="w-8 h-8 mb-2 text-slate-300" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No patients selected</p>
                                        <p className="text-[9px] font-medium max-w-[150px] mt-1 text-slate-500 italic">Click a patient to record vitals and start</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Scheduled Patients</label>
                                        {formData.patientIds.map(id => {
                                            const patient = patients.find(p => p._id === id);
                                            const config = formData.patientConfigs[id];
                                            if (!patient) return null;
                                            return (
                                                <div key={id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[8px] font-black text-rose-600">
                                                                {patient.name.charAt(0)}
                                                            </div>
                                                            <p className="text-xs font-black text-secondary-900 uppercase">{patient.name}</p>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); removePatient(id); }}
                                                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-50 rounded-lg transition-all"
                                                        >
                                                            <X className="w-3 h-3 text-slate-400" />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <Activity className="w-3 h-3 text-rose-500" />
                                                            <span className="text-[9px] font-bold text-slate-600 italic">
                                                                {config?.vitals?.bloodPressure || 'N/A'} mmHg
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-end gap-1.5 opacity-50">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                            <span className="text-[9px] font-black uppercase text-slate-400">Ready</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={assignMutation.isPending || formData.patientIds.length === 0 || !formData.doctorId}
                                    className="w-full py-4 bg-secondary-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-secondary-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    {assignMutation.isPending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Confirming...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Book {formData.patientIds.length} Appointments
                                        </>
                                    )}
                                </button>
                                {formData.doctorId ? (
                                    <p className="text-[9px] font-black text-emerald-600 text-center uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Assigning to {doctors.find(d => d._id === formData.doctorId)?.name}
                                    </p>
                                ) : formData.patientIds.length > 0 && (
                                    <p className="text-[9px] font-black text-rose-500 text-center uppercase tracking-widest mt-4 flex items-center justify-center gap-2 bg-rose-50 py-2 rounded-xl border border-rose-100 animate-bounce">
                                        <AlertCircle className="w-3 h-3" />
                                        Specialist Selection Required
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Patient Configuration Modal */}
                <AnimatePresence>
                    {modalState.isOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setModalState({ ...modalState, isOpen: false })}
                                className="absolute inset-0 bg-secondary-900/40 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                            >
                                {/* Modal Header */}
                                <div className="p-8 pb-0 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-secondary-900 uppercase tracking-tighter">Configure Patient</h2>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">{modalState.patient.name} • {getDisplayId(modalState.patient)}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setModalState({ ...modalState, isOpen: false })}
                                        className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                                    >
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    {/* Entry Vitals */}
                                    <div className="bg-rose-50/50 p-6 rounded-[2.5rem] border border-rose-100/50">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest">Entry Vitals</h3>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {['bloodPressure', 'temperature', 'pulse', 'weight'].map((field) => (
                                                <div key={field}>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                                                        {field === 'bloodPressure' ? 'BP (mmHg)' : field === 'temperature' ? 'Temp (°F)' : field === 'pulse' ? 'Pulse (bpm)' : 'Weight (kg)'}
                                                    </label>
                                                    <input
                                                        className="w-full px-4 py-3 bg-white border border-rose-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-500/10 focus:border-rose-300 outline-none transition-all"
                                                        placeholder={field === 'bloodPressure' ? '120/80' : field === 'temperature' ? '98.6' : field === 'pulse' ? '72' : '70'}
                                                        value={modalState.config.vitals[field]}
                                                        onChange={(e) => updateModalVitals(field, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Purpose */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Consultation Purpose</label>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                            {commonReasons.map(reason => (
                                                <button
                                                    key={reason}
                                                    type="button"
                                                    onClick={() => toggleModalReason(reason)}
                                                    className={`px-3 py-3 rounded-2xl text-[9px] font-black uppercase tracking-tight border transition-all ${modalState.config.reasons.includes(reason)
                                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200'
                                                        : 'bg-slate-50 border-slate-100 text-[#2c2c2c] hover:border-slate-200'
                                                        }`}
                                                >
                                                    {reason}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Observation */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Notes / Observation</label>
                                            <MessageSquare className="w-4 h-4 text-primary-500" />
                                        </div>
                                        <textarea
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold min-h-[120px] focus:ring-2 focus:ring-primary-500/10 outline-none placeholder:italic placeholder:font-medium text-secondary-900"
                                            placeholder="Document any symptoms or background history here..."
                                            value={modalState.config.notes}
                                            onChange={(e) => setModalState(prev => ({ ...prev, config: { ...prev.config, notes: e.target.value } }))}
                                        />
                                    </div>
                                </div>

                                <div className="p-8 pt-4">
                                    <button
                                        onClick={handleSavePatientConfig}
                                        className="w-full py-5 bg-secondary-900 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-secondary-900/10 flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        <Check className="w-6 h-6" />
                                        Done - Ready to Assign
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default AppointmentAssignment;
