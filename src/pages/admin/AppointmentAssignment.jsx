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
    Check
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
        patientId: '',
        doctorId: '',
        reasons: [],
        additionalNotes: ''
    });

    const [searchTerms, setSearchTerms] = useState({
        patient: '',
        doctor: ''
    });

    const { data: users } = useQuery({
        queryKey: ['adminUsersAssignment'],
        queryFn: () => adminApi.getUsers().then(res => res.data)
    });

    const assignMutation = useMutation({
        mutationFn: adminApi.assignAppointment,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminInvoicesSummary']);
            queryClient.invalidateQueries(['adminAppointmentsAll']);
            toast.success('Patient assigned successfully!', {
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
            // Reset form for next assignment
            setFormData({
                patientId: '',
                doctorId: '',
                reasons: [],
                additionalNotes: ''
            });
        }
    });

    const patients = (users || [])
        .filter(u => u.role === 'patient')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const doctors = (users || []).filter(u => u.role === 'doctor');

    const filteredPatients = searchTerms.patient
        ? patients.filter(p =>
            p.name?.toLowerCase().includes(searchTerms.patient.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerms.patient.toLowerCase())
        )
        : patients.slice(0, 5);

    const filteredDoctors = doctors.filter(d =>
        d.name.toLowerCase().includes(searchTerms.doctor.toLowerCase()) ||
        d.email.toLowerCase().includes(searchTerms.doctor.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        const combinedReason = [
            ...formData.reasons,
            ...(formData.additionalNotes ? [formData.additionalNotes] : [])
        ].join('. ');

        assignMutation.mutate({
            patientId: formData.patientId,
            doctorId: formData.doctorId,
            reason: combinedReason || 'Scheduled Visit'
        });
    };

    const commonReasons = [
        'General Checkup',
        'Fever & Cold',
        'Blood Test',
        'Follow-up Visit',
        'Vaccination',
        'Physiotherapy',
        'Post-Op Review',
        'Consultation'
    ];

    const toggleReason = (reason) => {
        setFormData(prev => ({
            ...prev,
            reasons: prev.reasons.includes(reason)
                ? prev.reasons.filter(r => r !== reason)
                : [...prev.reasons, reason]
        }));
    };


    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto pb-20">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                    placeholder="Search by name or email..."
                                    value={searchTerms.patient}
                                    onChange={(e) => setSearchTerms({ ...searchTerms, patient: e.target.value })}
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                                {filteredPatients.map(p => (
                                    <button
                                        key={p._id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, patientId: p._id })}
                                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${formData.patientId === p._id
                                            ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-100'
                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black uppercase text-primary-600">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-secondary-900 uppercase">{p.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{p.email}</p>
                                            </div>
                                        </div>
                                        {formData.patientId === p._id && <Check className="w-4 h-4 text-primary-600" />}
                                    </button>
                                ))}
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
                                    value={searchTerms.doctor}
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
                                                <p className="text-xs font-black text-secondary-900 uppercase">{d.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{d.email}</p>
                                            </div>
                                        </div>
                                        {formData.doctorId === d._id && <Check className="w-4 h-4 text-emerald-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-10 space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h3 className="font-black text-secondary-900 uppercase tracking-tight">Consultation Details</h3>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Common Reasons</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                {commonReasons.map(reason => (
                                    <button
                                        key={reason}
                                        type="button"
                                        onClick={() => toggleReason(reason)}
                                        className={`px-4 py-3 rounded-2xl text-[13px] font-black uppercase tracking-tight border transition-all ${formData.reasons.includes(reason)
                                            ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200'
                                            : 'bg-white border-slate-100 text-[#2c2c2c] hover:border-slate-200'
                                            }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-black uppercase tracking-widest ml-1">Additional Medical Notes (Optional)</label>
                            <div className="relative mt-4">
                                <MessageSquare className="absolute left-4 top-5 w-4 h-4 text-slate-400" />
                                <textarea
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold min-h-[100px] focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="Any specific symptoms or context..."
                                    value={formData.additionalNotes}
                                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={assignMutation.isPending || !formData.patientId || !formData.doctorId}
                            className="w-full py-5 bg-secondary-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-secondary-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {assignMutation.isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating Record...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Finalize Assignment
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default AppointmentAssignment;
