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
    AlertCircle,
    Calendar,
    Users,
    Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FormSection, Field } from '../../components/shared/FormKit';

const PatientRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        occupation: ''
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
            <div className="w-full max-w-[1200px] mx-auto">
                <div className="mb-5 flex items-center gap-3">
                    <Link to="/admin" className="ui-icon-btn !bg-white border border-line">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="page-title">Add New Patient</h1>
                        <p className="page-sub !mt-0.5">Clerical enrollment &amp; governance</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="ui-card overflow-hidden">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="m-6 mb-0 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-3 rounded-xl"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <FormSection icon={User} title="Personal details" description="Basic information used to identify the patient across the clinic.">
                        <Field label="Full name" icon={User}>
                            <input
                                className="ui-input pl-10"
                                placeholder="Name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Field>
                        <Field label="Occupation" optional icon={Briefcase}>
                            <input
                                className="ui-input pl-10"
                                placeholder="Occupation"
                                value={formData.occupation}
                                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                            />
                        </Field>
                        <Field label="Age" icon={Calendar}>
                            <input
                                type="number"
                                min="0"
                                className="ui-input pl-10"
                                placeholder="Age"
                                required
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            />
                        </Field>
                        <Field label="Gender" icon={Users} select>
                            <select
                                className="ui-input pl-10 pr-10 appearance-none"
                                required
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="" disabled>Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </Field>
                    </FormSection>

                    <FormSection icon={Phone} title="Contact" description="Used for appointment communication and sharing prescriptions.">
                        <Field label="Phone number" icon={Phone}>
                            <input
                                className="ui-input pl-10"
                                placeholder="Phone Number"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </Field>
                        <Field label="Email address" optional icon={Mail}>
                            <input
                                type="email"
                                className="ui-input pl-10"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Field>
                    </FormSection>

                    <div className="px-6 md:px-8 py-4 bg-slate-50 border-t border-line flex items-center justify-end gap-3">
                        <Link to="/admin" className="ui-btn-outline !h-11 !px-5">Cancel</Link>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="ui-btn-dark !h-11 !px-6 !text-sm"
                        >
                            {mutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Onboarding...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Complete Registration
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default PatientRegistration;
