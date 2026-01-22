import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    User,
    UserPlus,
    Mail,
    Phone,
    Key,
    CheckCircle2,
    ChevronLeft,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';

const PatientRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: adminApi.createPatient,
        onSuccess: () => {
            navigate('/admin/users');
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to create patient account.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        mutation.mutate(formData);
    };


    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                <div className="mb-10 flex items-center gap-4">
                    <Link to="/admin" className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-primary-600">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter">Add New Patient</h1>
                        <p className="text-slate-500 font-medium">Clerical Enrollment & Governance</p>
                    </div>
                </div>

                <div className="glass-card p-10">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-8 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs font-black uppercase tracking-widest flex items-center gap-3 rounded-r-2xl"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="John Doe"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="john@example.com"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="+91 98765 43210"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="w-full py-5 bg-secondary-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-secondary-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {mutation.isPending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Onboarding...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" />
                                        Complete Registration
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientRegistration;
