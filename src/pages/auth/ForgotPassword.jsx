import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail, ChevronLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const mutation = useMutation({
        mutationFn: authApi.forgotPassword,
        onSuccess: () => {
            toast.success('OTP sent to your email');
            navigate('/reset-password', { state: { email } });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ email });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="w-full max-w-md">
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-600/20 rotate-12">
                        <ShieldCheck className="w-8 h-8 text-white -rotate-12" />
                    </div>
                    <h1 className="text-4xl font-black text-secondary-900 uppercase tracking-tighter italic">Forgot Password</h1>
                    <p className="text-slate-500 font-medium mt-2">Enter your email to receive a reset OTP</p>
                </div>

                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="your@email.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full py-5 bg-secondary-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-secondary-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {mutation.isPending ? 'Sending...' : (
                                <>
                                    Send OTP
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-slate-100 pt-8">
                        <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
                            <ChevronLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
