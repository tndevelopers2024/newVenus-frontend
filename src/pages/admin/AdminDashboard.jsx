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
    Stethoscope,
    UserPlus,
    CalendarPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/shared/ConfirmationModal';
import AppointmentsChart from '../../components/shared/AppointmentsChart';

import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            const res = await adminApi.getUsers();
            return res.data;
        }
    });

    const { data: appointments, isLoading: appointmentsLoading } = useQuery({
        queryKey: ['adminAppointmentsSummary'],
        queryFn: async () => {
            const res = await adminApi.getAppointments();
            return res.data;
        },
        enabled: user?.role === 'admin' || user?.role === 'superadmin'
    });

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
    const totalUsers = users?.length || 0;
    const doctorCount = users?.filter(u => u.role === 'doctor').length || 0;
    const activeAppointmentsCount = appointments?.filter(appt => appt.status !== 'Completed' && appt.status !== 'Cancelled').length || 0;

    const stats = user?.role === 'superadmin' ? [
        { label: 'Total Patients', value: patientCount, icon: Users, link: '/admin/patients' },
        { label: 'Active Appointments', value: activeAppointmentsCount, icon: CalendarCheck2, link: '/admin/appointments/list' },
        { label: 'Registered Doctors', value: doctorCount, icon: Stethoscope, link: '/admin/doctors' },
        { label: 'System Users', value: totalUsers, icon: UserSquare2, link: '/admin/users' },
    ] : [
        { label: 'Total Patients', value: patientCount, icon: Users, link: '/admin/patients' },
        { label: 'Active Appointments', value: activeAppointmentsCount, icon: CalendarCheck2, link: '/admin/appointments/list' },
    ];

    const quickActions = [
        { label: 'Add New Patient', desc: 'Register a new patient', to: '/admin/patients/register', icon: UserPlus },
        ...(user?.role === 'superadmin' ? [{ label: 'Add New Doctor', desc: 'Onboard a doctor account', to: '/admin/doctors/register', icon: Stethoscope }] : []),
        { label: 'New Appointment', desc: 'Assign a patient to a doctor', to: '/admin/appointments', icon: CalendarPlus },
        { label: 'Active Appointments', desc: 'Monitor all patient-doctor links', to: '/admin/appointments/list', icon: CalendarCheck2 },
    ];

    const isLoading = usersLoading || ((user?.role === 'admin' || user?.role === 'superadmin') && appointmentsLoading);

    return (
        <DashboardLayout>
            <div className="w-full max-w-[1600px] mx-auto">
                <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h1 className="page-title">Dashboard</h1>
                        <p className="page-sub">New Venus Clinic · Intelligence &amp; management</p>
                    </div>
                    <span className="self-start md:self-auto flex items-center gap-2 text-[13px] font-semibold text-emerald-700 bg-emerald-50 px-3 h-8 rounded-full border border-emerald-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        Operational
                    </span>
                </div>

                <div className={`grid grid-cols-2 ${user?.role === 'superadmin' ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-3 md:gap-4 mb-4`}>
                    {stats.map((stat, i) => (
                        <div key={i} onClick={() => stat.link && navigate(stat.link)} className="ui-card p-4 md:p-5 flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer">
                            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold text-ink leading-none tabular-nums">{isLoading ? '–' : stat.value}</p>
                                <p className="text-[13px] font-medium text-muted mt-1.5 truncate">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick actions */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${quickActions.length > 3 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-3 md:gap-4 mb-4`}>
                    {quickActions.map(a => (
                        <Link
                            key={a.label}
                            to={a.to}
                            className="ui-card p-4 flex items-center gap-3.5 hover:border-primary-300 hover:shadow-md transition-all group"
                        >
                            <span className="w-11 h-11 rounded-xl bg-secondary-900 text-white flex items-center justify-center shrink-0">
                                <a.icon className="w-5 h-5" />
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-semibold text-ink">{a.label}</span>
                                <span className="block text-xs text-muted truncate">{a.desc}</span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-subtle group-hover:text-primary-700 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                    ))}
                </div>

                <div className={`grid grid-cols-1 ${user?.role === 'superadmin' ? 'lg:grid-cols-[minmax(0,1fr)_440px]' : ''} gap-4 items-start`}>
                    {user?.role === 'superadmin' && (
                        <AppointmentsChart appointments={appointments || []} height={300} />
                    )}

                    <div className="ui-card overflow-hidden">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-line">
                            <h3 className="text-base font-bold text-ink">Recent patient registrations</h3>
                            <Link to="/admin/patients" className="text-primary-700 text-[13px] font-semibold hover:underline flex items-center gap-1">
                                View all <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <div className="divide-y divide-line">
                            {isLoading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse" />)
                            ) : (
                                users
                                    ?.filter(u => u.role === 'patient')
                                    .slice(-5)
                                    .reverse()
                                    .map((u) => (
                                        <div key={u._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 text-sm font-bold shrink-0">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-ink truncate">{u.name}</p>
                                                <p className="text-[13px] text-muted truncate">{[u.age ? `${u.age} Y` : null, u.gender, u.phone].filter(Boolean).join(' · ') || 'Patient'}</p>
                                            </div>
                                            <span className="text-[13px] text-muted tabular-nums shrink-0">{new Date(u.createdAt).toLocaleDateString('en-GB')}</span>
                                        </div>
                                    ))
                            )}
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
