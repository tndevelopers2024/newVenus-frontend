import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, User, Mail, Phone, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        otp: '',
    });
    const [userId, setUserId] = useState(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, verifyOTP } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const data = await register(formData);
            setUserId(data.userId);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await verifyOTP({ userId, otp: formData.otp });
            setStep(3); // Success step
            setTimeout(() => navigate('/patient'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'OTP verification failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary-100 rounded-full blur-3xl opacity-50" />

            <motion.div
                layout
                className="glass-card max-w-md w-full p-8 relative z-10"
            >
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="text-center mb-8 ">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100/50 rounded-3xl mb-6 relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-primary-400 rounded-3xl rotate-6 opacity-20 group-hover:rotate-12 transition-transform" />
                                    <img
                                        src="/images/venus-logo.webp"
                                        alt="Venus Logo"
                                        className="w-12 h-12 object-contain relative z-10"
                                    />
                                </div>
                                <h1 className="text-3xl font-bold text-secondary-900 tracking-tight uppercase">Join Venus Clinic</h1>
                                <p className="text-slate-500 mt-2 font-medium">Start your healthcare journey today</p>
                            </div>

                            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm ">{error}</div>}

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full Name"
                                        className="input-field pl-12"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="Email Address"
                                        className="input-field pl-12"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Phone Number"
                                        className="input-field pl-12"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="Create Password"
                                        className="input-field pl-12"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full btn-primary h-12 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Sending OTP...' : (
                                        <>
                                            Next Step
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4 text-primary-600">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Identity</h1>
                                <p className="text-slate-500 mt-2">Enter the 6-digit code sent to your phone</p>
                            </div>

                            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm ">{error}</div>}

                            <form onSubmit={handleVerify} className="space-y-4">
                                <input
                                    type="text"
                                    maxLength="6"
                                    required
                                    placeholder="000000"
                                    className="input-field text-center text-3xl tracking-[1em] font-bold"
                                    value={formData.otp}
                                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full btn-primary h-12"
                                >
                                    {isSubmitting ? 'Verifying...' : 'Complete Registration'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-slate-500 text-sm hover:underline"
                                >
                                    Change phone number
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Success!</h1>
                            <p className="text-slate-500">Your account has been created. Redirecting to your dashboard...</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {step === 1 && (
                    <div className="mt-8 pt-8 border-t border-slate-100 text-center text-sm">
                        <p className="text-slate-500 underline underline-offset-4 decoration-slate-200">
                            Already have an account? {' '}
                            <Link to="/login" className="text-primary-600 font-bold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Register;
