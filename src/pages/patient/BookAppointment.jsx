import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Calendar,
    Clock,
    User,
    ArrowRight,
    CheckCircle2,
    Search,
    ClipboardList,
    History as HistoryIcon,
    Upload
} from 'lucide-react';
import { patientApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';

const BookAppointment = () => {
    const [step, setStep] = useState(1);
    const [bookingData, setBookingData] = useState({
        doctorId: '',
        date: '',
        time: '',
        reason: '',
        type: 'In-person'
    });

    const { data: doctors, isLoading: loadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const res = await patientApi.getDoctors();
            return res.data;
        }
    });

    const bookMutation = useMutation({
        mutationFn: (data) => patientApi.bookAppointment(data),
        onSuccess: () => setStep(4)
    });

    const patientLinks = [
        { label: 'Dashboard', path: '/patient', icon: ClipboardList },
        { label: 'Book Appointment', path: '/patient/book', icon: Calendar },
        { label: 'Medical History', path: '/patient/history', icon: HistoryIcon },
        { label: 'Test Reports', path: '/patient/reports', icon: Upload },
    ];

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleDoctorSelect = (id) => {
        setBookingData({ ...bookingData, doctorId: id });
        nextStep();
    };

    const handleBooking = () => {
        // Combine date and time
        const appointmentDate = new Date(`${bookingData.date}T${bookingData.time}`);
        bookMutation.mutate({
            doctorId: bookingData.doctorId,
            date: appointmentDate,
            reason: bookingData.reason,
            type: bookingData.type
        });
    };

    return (
        <DashboardLayout links={patientLinks}>
            <div className="max-w-4xl mx-auto py-10">
                {/* Stepper */}
                <div className="flex items-center justify-between mb-12">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-4 flex-1 last:flex-none">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                {s}
                            </div>
                            {s < 3 && <div className={`h-1 flex-1 mx-4 rounded-full transition-all ${step > s ? 'bg-primary-600' : 'bg-slate-100'}`} />}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="glass-card p-10"
                        >
                            <h2 className="text-2xl font-bold mb-2 ">Select a Doctor</h2>
                            <p className="text-slate-500 mb-8">Choose the specialist you'd like to consult with</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {loadingDoctors ? (
                                    [1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-2xl" />)
                                ) : (
                                    doctors?.map((doc) => (
                                        <div
                                            key={doc._id}
                                            onClick={() => handleDoctorSelect(doc._id)}
                                            className="p-6 border border-slate-100 rounded-2xl hover:border-primary-500 hover:bg-primary-50/30 transition-all cursor-pointer group flex items-center gap-4"
                                        >
                                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-primary-600 font-bold text-xl shadow-sm border border-slate-100">
                                                {doc.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Dr. {doc.name}</h4>
                                                <p className="text-sm text-slate-500">Cardiology specialist</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="glass-card p-10"
                        >
                            <h2 className="text-2xl font-bold mb-2 ">Select Date & Time</h2>
                            <p className="text-slate-500 mb-8">When would you like to visit?</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-slate-700">Choose Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-slate-700">Available Slots</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['09:00', '10:30', '13:00', '15:30'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setBookingData({ ...bookingData, time: t })}
                                                className={`py-3 rounded-xl border font-bold text-sm transition-all ${bookingData.time === t ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-primary-200 hover:bg-primary-50/50'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={prevStep} className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50">Back</button>
                                <button
                                    onClick={nextStep}
                                    disabled={!bookingData.date || !bookingData.time}
                                    className="flex-[2] btn-primary"
                                >
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="glass-card p-10"
                        >
                            <h2 className="text-2xl font-bold mb-2 ">Confirm Details</h2>
                            <p className="text-slate-500 mb-8">Please provide a brief reason for your visit</p>

                            <textarea
                                placeholder="Reason for appointment..."
                                className="input-field h-32 mb-8 resize-none py-4"
                                onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                            />

                            <div className="flex gap-4">
                                <button onClick={prevStep} className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50">Back</button>
                                <button
                                    onClick={handleBooking}
                                    disabled={bookMutation.isPending}
                                    className="flex-[2] btn-primary flex items-center justify-center gap-2"
                                >
                                    {bookMutation.isPending ? 'Processing...' : 'Confirm Appointment'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-card p-10 text-center"
                        >
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2 ">Scheduled Successfully!</h2>
                            <p className="text-slate-500 mb-10 max-w-sm mx-auto">
                                Your appointment with <strong>Dr. {doctors?.find(d => d._id === bookingData.doctorId)?.name}</strong> has been confirmed.
                            </p>
                            <button
                                onClick={() => window.location.href = '/patient'}
                                className="btn-primary px-10"
                            >
                                Back to Dashboard
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default BookAppointment;
