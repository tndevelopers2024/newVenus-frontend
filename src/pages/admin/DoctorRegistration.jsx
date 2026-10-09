import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    User,
    UserPlus,
    Mail,
    Phone,
    Key,
    ChevronLeft,
    ShieldCheck,
    Stethoscope,
    AlertCircle,
    Calendar,
    Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';

const DoctorRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        age: '',
        gender: '',
        doctorDetails: {
            qualification: '',
            nameTamil: '',
            additionalQualifications: '',
            roleTitle: '',
            regdNo: ''
        }
    });

    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: adminApi.createDoctor,
        onSuccess: () => {
            navigate('/admin/users');
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to create doctor account.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        mutation.mutate(formData);
    };


    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-10 flex items-center gap-4">
                    <Link to="/admin/users" className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-primary-600">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter">Add New Doctor</h1>
                        <p className="text-slate-500 font-medium">Professional Enrollment & System Access</p>
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
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Doctor Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="Name"
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
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="Email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
                                <div className="relative">
                                    <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="Specialization"
                                        required
                                        value={formData.specialization}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="Phone Number"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                            placeholder="Age"
                                            required
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <select
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 appearance-none text-slate-600"
                                            required
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        >
                                            <option value="" disabled>Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-800 mt-6 border-b pb-2">Prescription Header Details</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qualification (e.g. M.B.B.S., M.D.)</label>
                                    <div className="relative">
                                        <input
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                            placeholder="Qualification"
                                            value={formData.doctorDetails.qualification}
                                            onChange={(e) => setFormData({ ...formData, doctorDetails: { ...formData.doctorDetails, qualification: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name in Tamil</label>
                                    <div className="relative">
                                        <input
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                            placeholder="டாக்டர். ..."
                                            value={formData.doctorDetails.nameTamil}
                                            onChange={(e) => setFormData({ ...formData, doctorDetails: { ...formData.doctorDetails, nameTamil: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Qualifications</label>
                                    <div className="relative">
                                        <input
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                            placeholder="Interventions (Canada)..."
                                            value={formData.doctorDetails.additionalQualifications}
                                            onChange={(e) => setFormData({ ...formData, doctorDetails: { ...formData.doctorDetails, additionalQualifications: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Title</label>
                                    <div className="relative">
                                        <input
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                            placeholder="SENIOR CONSULTANT..."
                                            value={formData.doctorDetails.roleTitle}
                                            onChange={(e) => setFormData({ ...formData, doctorDetails: { ...formData.doctorDetails, roleTitle: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registration Number</label>
                                    <div className="relative">
                                        <input
                                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                            placeholder="Regd. No. 65502"
                                            value={formData.doctorDetails.regdNo}
                                            onChange={(e) => setFormData({ ...formData, doctorDetails: { ...formData.doctorDetails, regdNo: e.target.value } })}
                                        />
                                    </div>
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
                                        <Stethoscope className="w-5 h-5" />
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

export default DoctorRegistration;
