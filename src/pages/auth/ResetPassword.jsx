import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Key, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: location.state?.email || '',
        otp: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!formData.email) {
            navigate('/forgot-password');
        }
    }, [formData.email, navigate]);

    const mutation = useMutation({
        mutationFn: authApi.resetPassword,
        onSuccess: () => {
            toast.success('Password reset successfully');
            navigate('/login');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return toast.error("Passwords don't match");
        }
        mutation.mutate({
            email: formData.email,
            otp: formData.otp,
            password: formData.password
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="w-full max-w-md">
                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-600/20 rotate-12">
                        <ShieldCheck className="w-8 h-8 text-white -rotate-12" />
                    </div>
                    <h1 className="text-4xl font-black text-secondary-900 uppercase tracking-tighter italic">Reset Password</h1>
                    <p className="text-slate-500 font-medium mt-2">Verify OTP and set new password</p>
                </div>

                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">OTP Code</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 tracking-[1em] text-center"
                                    placeholder="000000"
                                    required
                                    value={formData.otp}
                                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="••••••••"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full py-5 bg-secondary-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-secondary-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
                        >
                            {mutation.isPending ? 'Resetting...' : (
                                <>
                                    Update Password
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
