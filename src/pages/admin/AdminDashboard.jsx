import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Users,
    UserSquare2,
    MapPin,
    Key,
    BarChart3,
    History,
    Activity,
    CalendarCheck2,
    Trash2,
    ChevronRight,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const AdminDashboard = () => {
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            const res = await adminApi.getUsers();
            return res.data;
        }
    });

    const { data: invoices, isLoading: invoicesLoading } = useQuery({
        queryKey: ['adminInvoicesSummary'],
        queryFn: async () => {
            const res = await adminApi.getInvoices();
            return res.data;
        }
    });

    const queryClient = useQueryClient();
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });

    const deleteMutation = useMutation({
        mutationFn: (id) => adminApi.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsers']);
            setConfirmModal({ isOpen: false, id: null, name: '' });
            toast.success('User removed successfully');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to remove user');
        }
    });


    // Calculate real stats
    const patientCount = users?.filter(u => u.role === 'patient').length || 0;
    const totalRevenue = invoices?.reduce((acc, inv) => acc + inv.totalAmount, 0) || 0;
    const totalUsers = users?.length || 0;

    const stats = [
        { label: 'Total Patients', value: patientCount, change: '+12%', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        // { label: 'System Revenue', value: `₹${totalRevenue.toLocaleString()}`, change: 'Live', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { label: 'System Users', value: totalUsers, change: '+8%', icon: CalendarCheck2, color: 'text-amber-600', bg: 'bg-amber-100' },
        { label: 'Security Events', value: 'Active', change: 'Audit Log', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-100' },
    ];

    const isLoading = usersLoading || invoicesLoading;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 md:mb-10 md:flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-secondary-900 uppercase tracking-tighter">Dashboard</h1>
                        <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">New Venus Clinic • Intelligence & Management</p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            Operational
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-10">
                    {stats.map((stat, i) => (
                        <div key={i} className="glass-card p-4 md:p-6 flex items-center gap-4 md:gap-5 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-default group border-b-4 border-b-slate-50 hover:border-b-primary-200">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 ${stat.bg} ${stat.color} shrink-0`}>
                                <stat.icon className="w-6 h-6 md:w-7 md:h-7" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl md:text-2xl font-black text-secondary-900 tracking-tighter ">{stat.value}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="lg:col-span-2 glass-card p-4 md:p-8">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <h3 className="text-lg md:text-xl font-black text-secondary-900 uppercase tracking-tighter">Recent Patient Registrations</h3>
                            <Link to="/admin/users" className="text-primary-600 text-[10px] md:text-xs font-black uppercase tracking-widest hover:underline">Directory</Link>
                        </div>
                        <div className="space-y-3 md:space-y-4">
                            {isLoading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-2xl" />)
                            ) : (
                                users?.filter(u => u.role === 'patient').slice(-5).reverse().map((u, i) => (
                                    <div key={u._id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary-600 font-black group-hover:bg-primary-100/50 group-hover:rotate-12 transition-all shrink-0">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-xs md:text-sm font-black text-secondary-900 uppercase tracking-tight truncate">
                                                {u.name}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest truncate">
                                                {new Date(u.createdAt).toLocaleDateString('en-GB')} • {u.email}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setConfirmModal({ isOpen: true, id: u._id, name: u.name })}
                                            className="text-slate-200 hover:text-rose-500 transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 p-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="glass-card p-4 md:p-8">
                        <h3 className="text-lg md:text-xl font-black text-secondary-900 uppercase tracking-tighter mb-6 md:mb-8">Admin Directives</h3>
                        <div className="grid gap-4">
                            <Link to="/admin/users" className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl hover:bg-primary-600 hover:text-white transition-all text-left group shadow-sm shadow-black/5">
                                <div className="flex items-center gap-4">
                                    <Users className="w-6 h-6 transition-transform group-hover:scale-110" />
                                    <span className="font-black text-xs uppercase tracking-widest">User Directory</span>
                                </div>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1" />
                            </Link>
                            <Link to="/admin/patients/register" className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl hover:bg-emerald-600 hover:text-white transition-all text-left group shadow-sm shadow-black/5">
                                <div className="flex items-center gap-4">
                                    <Users className="w-6 h-6 transition-transform group-hover:scale-110" />
                                    <span className="font-black text-xs uppercase tracking-widest">Onboard Patient</span>
                                </div>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1" />
                            </Link>
                            {/* <Link to="/admin/billing" className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl hover:bg-emerald-600 hover:text-white transition-all text-left group shadow-sm shadow-black/5">
                                <div className="flex items-center gap-4">
                                    <BarChart3 className="w-6 h-6 transition-transform group-hover:scale-110" />
                                    <span className="font-black text-xs uppercase tracking-widest">Financial Audit</span>
                                </div>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1" />
                            </Link> */}
                            <Link to="/admin/logs" className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl hover:bg-rose-600 hover:text-white transition-all text-left group shadow-sm shadow-black/5">
                                <div className="flex items-center gap-4">
                                    <History className="w-6 h-6 transition-transform group-hover:scale-110" />
                                    <span className="font-black text-xs uppercase tracking-widest">System Security</span>
                                </div>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1" />
                            </Link>
                            {/* <button className="flex items-center justify-center gap-3 p-5 border-2 border-dashed border-slate-200 rounded-3xl transition-all hover:border-primary-400 hover:text-primary-600 mt-4 group">
                                <CalendarCheck2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                <span className="font-black text-[10px] uppercase tracking-widest">System Maintenance</span>
                            </button> */}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null, name: '' })}
                onConfirm={() => deleteMutation.mutate(confirmModal.id)}
                title="Remove User?"
                message={`Are you sure you want to remove ${confirmModal.name}? This action cannot be undone.`}
                confirmText="Yes, Remove"
                cancelText="No, Keep It"
                type="danger"
                isLoading={deleteMutation.isPending}
            />
        </DashboardLayout>
    );
};

export default AdminDashboard;
