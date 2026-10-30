import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User,
    Stethoscope,
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
import { VITALS_META } from '../../config/vitals';
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
        .filter(u => u.role === 'patient' && !u.isDeleted)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const doctors = (users || []).filter(u => u.role === 'doctor' && !u.isDeleted);

    useEffect(() => {
        if (users && !formData.doctorId) {
            const madhu = doctors.find(d => d.name.toLowerCase().includes('madhu'));
            if (madhu) {
                setFormData(prev => ({ ...prev, doctorId: madhu._id }));
            }
        }
    }, [users]);

    const filteredPatients = searchTerms.patient
        ? patients.filter(p => {
            const displayId = getDisplayId(p);
            return (
                p.name?.toLowerCase().includes(searchTerms.patient.toLowerCase()) ||
                displayId.toLowerCase().includes(searchTerms.patient.toLowerCase()) ||
                p.phone?.includes(searchTerms.patient)
            );
        })
        : patients.slice(0, 40);

    const filteredDoctors = doctors.filter(d => {
        const displayId = getDisplayId(d);
        return (
            d.name.toLowerCase().includes(searchTerms.doctor.toLowerCase()) ||
            displayId.toLowerCase().includes(searchTerms.doctor.toLowerCase())
        );
    });

    const openPatientModal = (patient) => {
        const existingConfig = formData.patientConfigs[patient._id] || {
            reasons: ['CONSULTATION'],
            notes: '',
            vitals: { bloodPressure: '', temperature: '', pulse: '', weight: '', spo2: '' }
        };
        setModalState({
            isOpen: true,
            patient,
            config: existingConfig
        });
    };

    const handleSavePatientConfig = () => {
        const { bloodPressure, pulse } = modalState.config.vitals;
        if (!bloodPressure || !pulse) {
            toast.error('BP and Pulse are mandatory fields', {
                icon: '⚠️',
                style: { borderRadius: '15px', background: '#1e293b', color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }
            });
            return;
        }

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


    const selectedDoctor = doctors.find(d => d._id === formData.doctorId);
    const initials = (name) => (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const closeModal = () => setModalState({ ...modalState, isOpen: false });

    return (
        <DashboardLayout noScroll>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 gap-4 w-full max-w-[1600px] mx-auto">
                {/* Header: title + compact doctor picker */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <Link to="/admin" className="ui-icon-btn !bg-white border border-line">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="page-title">Assign Appointment</h1>
                            <p className="page-sub !mt-0.5">Pick a patient, record vitals, then book with a doctor</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                        <span className="label-caps hidden sm:flex items-center gap-1.5 shrink-0">
                            <Stethoscope className="w-4 h-4" /> Doctor
                        </span>
                        {doctors.length > 5 && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
                                <input
                                    className="ui-input !h-11 pl-9 w-40"
                                    placeholder="Search doctors"
                                    onChange={(e) => setSearchTerms({ ...searchTerms, doctor: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-1 p-1 bg-white border border-line rounded-xl overflow-x-auto custom-scrollbar">
                            {filteredDoctors.map(d => {
                                const active = formData.doctorId === d._id;
                                return (
                                    <button
                                        key={d._id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, doctorId: d._id })}
                                        className={`flex items-center gap-2.5 h-9 pl-1.5 pr-3.5 rounded-lg text-left transition-all shrink-0 ${active ? 'bg-secondary-900 text-white shadow-sm' : 'hover:bg-slate-100 text-ink'}`}
                                    >
                                        <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${active ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                                            {initials(d.name)}
                                        </span>
                                        <span className="leading-tight">
                                            <span className="block text-[13px] font-semibold">{d.name}</span>
                                            <span className={`block text-[11px] ${active ? 'text-white/70' : 'text-muted'}`}>{d.specialization || 'General Medicine'}</span>
                                        </span>
                                        {active && <Check className="w-4 h-4 text-primary-300" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 lg:flex-1 lg:min-h-0">
                    {/* Patient Selection */}
                    <section className="ui-card flex flex-col overflow-hidden min-h-0 max-h-[70vh] lg:max-h-none">
                        <div className="px-5 py-3.5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
                                    <User className="w-[18px] h-[18px]" />
                                </span>
                                <div>
                                    <h2 className="text-base font-bold text-ink leading-tight">Select patient</h2>
                                    <p className="text-xs text-muted">
                                        {searchTerms.patient
                                            ? `${filteredPatients.length} match${filteredPatients.length === 1 ? '' : 'es'}`
                                            : `Showing latest ${filteredPatients.length} of ${patients.length} · search to find others`}
                                    </p>
                                </div>
                            </div>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
                                <input
                                    className="ui-input pl-10"
                                    placeholder="Search by name, ID or phone"
                                    value={searchTerms.patient}
                                    onChange={(e) => setSearchTerms({ ...searchTerms, patient: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 bg-slate-50/60">
                            {filteredPatients.length === 0 ? (
                                <div className="py-14 text-center">
                                    <p className="text-sm font-semibold text-ink">No patients found</p>
                                    <p className="text-sm text-muted mt-1">Try a different name, ID or phone number.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                                    {filteredPatients.map(p => {
                                        const isSelected = formData.patientIds.includes(p._id);
                                        const config = formData.patientConfigs[p._id];

                                        return (
                                            <div
                                                key={p._id}
                                                className={`flex items-center gap-1 pr-3 rounded-xl border transition-all ${isSelected
                                                    ? 'bg-primary-50 border-primary-400 ring-1 ring-primary-200'
                                                    : 'bg-white border-line hover:border-slate-200 hover:shadow-sm'
                                                    }`}
                                            >
                                                {/* Selection Trigger */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => togglePatientSelection(e, p._id)}
                                                    className={`pl-3 pr-2 py-4 transition-colors ${isSelected ? 'text-primary-600' : 'text-slate-200 hover:text-subtle'}`}
                                                    title={isSelected ? 'Remove from assignment' : 'Add to assignment'}
                                                >
                                                    {isSelected ? <CheckCircle className="w-5 h-5 fill-primary-100" /> : <Circle className="w-5 h-5" />}
                                                </button>

                                                {/* Config Trigger */}
                                                <button
                                                    type="button"
                                                    onClick={() => openPatientModal(p)}
                                                    className="flex-1 min-w-0 py-2.5 flex items-center justify-between gap-3 text-left"
                                                >
                                                    <span className="flex items-center gap-3 min-w-0">
                                                        <span className="w-9 h-9 rounded-full bg-secondary-50 text-secondary-700 flex items-center justify-center text-xs font-bold shrink-0">
                                                            {initials(p.name)}
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block text-sm font-semibold text-ink truncate">{p.name}</span>
                                                            <span className="block text-xs text-muted truncate mt-0.5">
                                                                #{getDisplayId(p)}{p.phone && <span className="text-primary-700 font-medium"> · {p.phone}</span>}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <span className="shrink-0 text-right">
                                                        {config ? (
                                                            <>
                                                                <span className="ui-chip !h-5 !text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                                                    <Check className="w-3 h-3" /> Vitals saved
                                                                </span>
                                                                <span className="block text-[11px] text-muted mt-1 tabular-nums">
                                                                    {config.vitals.bloodPressure} · {config.vitals.pulse} bpm
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="block text-[11px] text-subtle">Registered</span>
                                                                <span className="block text-xs font-medium text-muted tabular-nums">{new Date(p.createdAt).toLocaleDateString('en-GB')}</span>
                                                            </>
                                                        )}
                                                    </span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Assignment Summary */}
                    <section className="ui-card flex flex-col overflow-hidden min-h-0 lg:max-h-none">
                        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-lg bg-secondary-900 text-white flex items-center justify-center">
                                    <ClipboardCheck className="w-[18px] h-[18px]" />
                                </span>
                                <h2 className="text-base font-bold text-ink">Assignment summary</h2>
                            </div>
                            <span className="min-w-6 h-6 px-2 rounded-full bg-secondary-50 text-secondary-700 text-xs font-bold flex items-center justify-center tabular-nums">
                                {formData.patientIds.length}
                            </span>
                        </div>

                        <div className="flex-1 min-h-[160px] overflow-y-auto custom-scrollbar p-3">
                            {formData.patientIds.length === 0 ? (
                                <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center px-6">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                                        <User className="w-6 h-6 text-subtle" />
                                    </div>
                                    <p className="text-sm font-semibold text-ink">No patients selected</p>
                                    <p className="text-[13px] text-muted mt-1 max-w-[220px]">Click a patient to record vitals, then tick them to add here.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {formData.patientIds.map(id => {
                                        const patient = patients.find(p => p._id === id);
                                        const config = formData.patientConfigs[id];
                                        if (!patient) return null;
                                        return (
                                            <div key={id} className="p-3 rounded-xl border border-line bg-white">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                                                            {initials(patient.name)}
                                                        </span>
                                                        <p className="text-sm font-semibold text-ink truncate">{patient.name}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removePatient(id); }}
                                                        className="ui-icon-btn-danger !w-7 !h-7 shrink-0"
                                                        title="Remove"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-muted tabular-nums">
                                                    <span className="flex items-center gap-1.5">
                                                        <Activity className="w-3.5 h-3.5 text-rose-500" />
                                                        {config?.vitals?.bloodPressure || 'N/A'} mmHg
                                                    </span>
                                                    <span>{config?.vitals?.pulse || 'N/A'} bpm</span>
                                                    <span className="ml-auto flex items-center gap-1 text-emerald-700 font-semibold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                                                    </span>
                                                </div>
                                                {config?.reasons?.length > 0 && (
                                                    <p className="text-xs text-muted mt-1.5 truncate" title={config.reasons.join(', ')}>
                                                        {config.reasons.join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-line bg-white shrink-0">
                            <div className="flex items-center gap-2.5 mb-3 text-[13px]">
                                {selectedDoctor ? (
                                    <>
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        <span className="text-muted">Assigning to</span>
                                        <span className="font-semibold text-ink truncate">{selectedDoctor.name}</span>
                                    </>
                                ) : (
                                    <span className="flex items-center gap-2 text-rose-600 font-semibold">
                                        <AlertCircle className="w-4 h-4" /> Select a doctor above
                                    </span>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={assignMutation.isPending || formData.patientIds.length === 0 || !formData.doctorId}
                                className="ui-btn-dark !w-full !h-12 !text-sm"
                            >
                                {assignMutation.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Confirming...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Book {formData.patientIds.length} {formData.patientIds.length === 1 ? 'Appointment' : 'Appointments'}
                                    </>
                                )}
                            </button>
                        </div>
                    </section>
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
                            onClick={closeModal}
                            className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.97, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.97, opacity: 0, y: 12 }}
                            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 bg-gradient-to-r from-secondary-900 via-secondary-800 to-secondary-700 text-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4 min-w-0">
                                    <span className="w-12 h-12 rounded-xl bg-primary-400 text-secondary-900 flex items-center justify-center text-base font-bold shrink-0">
                                        {initials(modalState.patient.name)}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-300">Patient check-in</p>
                                        <h2 className="text-xl font-bold leading-tight truncate">{modalState.patient.name}</h2>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            <span className="text-xs font-semibold bg-white/10 rounded-md px-2 py-0.5">#{getDisplayId(modalState.patient)}</span>
                                            {modalState.patient.phone && <span className="text-xs bg-white/10 rounded-md px-2 py-0.5 tabular-nums">{modalState.patient.phone}</span>}
                                            {(modalState.patient.age || modalState.patient.gender) && (
                                                <span className="text-xs bg-white/10 rounded-md px-2 py-0.5">
                                                    {[modalState.patient.age ? `${modalState.patient.age} Y` : null, modalState.patient.gender].filter(Boolean).join(' / ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button type="button" onClick={closeModal} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar bg-slate-50">
                                {/* Entry Vitals */}
                                <div className="bg-white rounded-xl border border-line p-4">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center"><Activity className="w-4 h-4" /></span>
                                        <h3 className="text-sm font-bold text-ink">Entry vitals</h3>
                                        <span className="ml-auto text-xs text-muted">BP and pulse are required</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        {Object.entries(VITALS_META).map(([field, meta]) => {
                                            const Icon = meta.icon;
                                            const missing = meta.required && !modalState.config.vitals[field];
                                            return (
                                                <div key={field} className={`rounded-xl border p-2.5 transition-colors ${meta.card} ${missing ? '!border-rose-300' : ''}`}>
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center ${meta.iconBox}`}><Icon className="w-3 h-3" /></span>
                                                        <label className={`text-xs font-semibold ${meta.label_}`}>
                                                            {meta.label}{meta.required && <span className="text-rose-500"> *</span>}
                                                        </label>
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <input
                                                            className="w-full min-w-0 bg-white border border-white rounded-lg h-10 px-2.5 text-base font-bold text-ink outline-none focus:border-transparent tabular-nums"
                                                            placeholder={meta.placeholder}
                                                            value={modalState.config.vitals[field]}
                                                            onChange={(e) => updateModalVitals(field, e.target.value)}
                                                        />
                                                    </div>
                                                    <p className="text-[11px] text-muted mt-1 px-0.5">{meta.unit}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Purpose */}
                                <div className="bg-white rounded-xl border border-line p-4">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center"><Stethoscope className="w-4 h-4" /></span>
                                        <h3 className="text-sm font-bold text-ink">Consultation purpose</h3>
                                        <span className="ml-auto text-xs text-muted">Select all that apply</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {commonReasons.map(reason => {
                                            const on = modalState.config.reasons.includes(reason);
                                            return (
                                                <button
                                                    key={reason}
                                                    type="button"
                                                    onClick={() => toggleModalReason(reason)}
                                                    className={`min-h-11 px-3 py-2 rounded-lg text-[13px] font-semibold border transition-all text-left flex items-center gap-2 ${on
                                                        ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                                                        : 'bg-slate-50 border-line text-ink hover:border-primary-300 hover:bg-primary-50'
                                                        }`}
                                                >
                                                    <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${on ? 'bg-white/20 border-white/40' : 'border-slate-200 bg-white'}`}>
                                                        {on && <Check className="w-3 h-3" />}
                                                    </span>
                                                    {reason}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Observation */}
                                <div className="bg-white rounded-xl border border-line p-4">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><MessageSquare className="w-4 h-4" /></span>
                                        <h3 className="text-sm font-bold text-ink">Notes / observation</h3>
                                        <span className="ml-auto text-xs text-subtle">Optional</span>
                                    </div>
                                    <textarea
                                        className="ui-input !h-auto py-3 min-h-[84px] resize-none"
                                        placeholder="Document any symptoms or background history here..."
                                        value={modalState.config.notes}
                                        onChange={(e) => setModalState(prev => ({ ...prev, config: { ...prev.config, notes: e.target.value } }))}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-line bg-white shrink-0">
                                <button
                                    type="button"
                                    onClick={handleSavePatientConfig}
                                    className="ui-btn-success !w-full !h-12 !text-sm"
                                >
                                    <Check className="w-5 h-5" />
                                    Done - Ready to Assign
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default AppointmentAssignment;
