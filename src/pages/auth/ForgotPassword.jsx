import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const mutation = useMutation({
        mutationFn: authApi.forgotPassword,
        onSuccess: () => {
            toast.success('OTP sent to your email');
            navigate('/reset-password', { state: { email } });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ email });
    };

    return (
        <div className="min-h-[100dvh] flex bg-white font-sans selection:bg-primary-100 selection:text-primary-900">
            {/* Left Side: Immersive Background Image */}
            <div className="hidden lg:block lg:w-3/5 relative overflow-hidden">
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url("/images/login-bg.png")' }}
                >
                    <div className="absolute inset-0 bg-secondary-900/10 backdrop-brightness-75" />
                </motion.div>

                <div className="absolute inset-0 flex flex-col justify-end p-20 bg-gradient-to-t from-secondary-900/60 to-transparent">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        <h2 className="text-5xl font-black text-white leading-tight mb-4 tracking-tighter uppercase">
                            ACCOUNT <br />
                            <span className="text-primary-400">RECOVERY</span>
                        </h2>
                        <p className="text-slate-200 text-lg font-medium max-w-md">
                            Securely restore access to your workspace
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Form Area */}
            <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 relative overflow-hidden bg-slate-50/50">
                {/* Motion Blobs */}
                <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary-100/50 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-secondary-100/50 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="mb-8 lg:mb-12 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block mb-6 lg:mb-8"
                        >
                            <img
                                src="/images/venus-logo.webp"
                                alt="Venus Logo"
                                className="w-48 lg:w-64 h-auto"
                            />
                        </motion.div>
                        <h1 className="text-xl lg:text-2xl font-black text-secondary-900 uppercase tracking-tighter mb-2">
                            Forgot Password
                        </h1>
                        <p className="text-slate-500 font-bold text-[10px] lg:text-xs uppercase tracking-widest flex items-center gap-2 lg:justify-start justify-center">
                            <span className="w-8 h-[2px] bg-primary-500 rounded-full" />
                            Enter email to receive OTP
                        </p>
                    </div>

                    {mutation.isError && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-8 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs font-black uppercase tracking-widest flex items-center gap-3 rounded-r-2xl"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {mutation.error.response?.data?.message || 'Failed to send OTP'}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-500">
                                    <Mail className="w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-base sm:text-xs font-bold text-secondary-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </motion.div>

                        <motion.button
                            type="submit"
                            disabled={mutation.isPending}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full bg-secondary-900 text-white font-black uppercase tracking-[0.2em] text-[10px] py-5 rounded-2xl shadow-xl shadow-secondary-900/20 hover:bg-primary-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {mutation.isPending ? 'Sending Logic Codes...' : (
                                <>
                                    Send OTP
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-12 text-center lg:text-left">
                        <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-secondary-900 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Back to Login</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
