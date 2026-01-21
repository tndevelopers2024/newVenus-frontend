import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, User, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const user = await login(email, password);
            if (user.role === 'patient') navigate('/patient');
            else if (user.role === 'doctor') navigate('/doctor');
            else if (user.role === 'superadmin') navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
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
                        <h2 className="text-5xl font-black text-primary-400 leading-tight mb-4 tracking-tighter uppercase">
                            NEW <br />
                            <span className="text-white">VENUS CLINIC</span>
                        </h2>
                        <p className="text-slate-200 text-lg font-medium max-w-md">
                            Healthcare Excellence Reimagined
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Login Form Area */}
            <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-20 relative overflow-hidden bg-slate-50/50">
                {/* Motion Blobs for Right Side Aesthetic */}
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
                            Sign In
                        </h1>
                        <p className="text-slate-500 font-bold text-[10px] lg:text-xs uppercase tracking-widest flex items-center gap-2 lg:justify-start justify-center">
                            <span className="w-8 h-[2px] bg-primary-500 rounded-full" />
                            Healthcare Excellence Reimagined
                        </p>
                    </div>

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
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-500">
                                    <User className="w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-base sm:text-xs font-bold text-secondary-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
                                    placeholder="doctor@venus.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full pl-11 pr-12 py-4 bg-white border border-slate-100 rounded-2xl text-base sm:text-xs font-bold text-secondary-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </motion.div>

                        <div className="flex items-center justify-end">
                            <Link to="/forgot-password" size="sm" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full bg-secondary-900 text-white font-black uppercase tracking-[0.2em] text-[10px] py-5 rounded-2xl shadow-xl shadow-secondary-900/20 hover:bg-primary-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Authenticating...' : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-12 text-center lg:text-left">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                            Administrative Directives Only
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
