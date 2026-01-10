import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ClipboardList,
    Calendar,
    Users,
    FileEdit,
    MessageSquare,
    Search,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doctorApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const DoctorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [dashSearch, setDashSearch] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    const { data: appointments, isLoading } = useQuery({
        queryKey: ['doctorAppointments'],
        queryFn: async () => {
            const res = await doctorApi.getAppointments();
            return res.data;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => doctorApi.updateAppointment(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['doctorAppointments']);
            setConfirmModal({ isOpen: false, id: null }); // Close modal on success
        }
    });


    const upcomingAppointments = appointments?.filter(a => ['Pending', 'Accepted', 'Rescheduled'].includes(a.status)) || [];

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 ">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Dr. {user?.name}'s Portal</h1>
                        <p className="text-slate-500 mt-1">Manage your consultations and patient records</p>
                    </div>
                    <button
                        onClick={() => navigate('/doctor/appointments')}
                        className="btn-primary flex items-center justify-center gap-2"
                    >
                        <Calendar className="w-5 h-5" />
                        Manage Schedule
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 glass-card p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold ">Upcoming Appointments</h3>
                            <button
                                onClick={() => navigate('/doctor/appointments')}
                                className="text-primary-600 text-sm font-bold hover:underline"
                            >
                                View Schedule
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl"></div>)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingAppointments.length === 0 && (
                                    <p className="text-slate-400 text-center py-10 ">No appointments for today yet.</p>
                                )}
                                {upcomingAppointments.map((appt) => (
                                    <div key={appt._id} className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm border border-slate-100 shrink-0">
                                            <span className="text-xs font-bold text-slate-400 uppercase">
                                                {new Date(appt.date).toLocaleString('default', { month: 'short' })}
                                            </span>
                                            <span className="text-xl font-extrabold text-slate-900">
                                                {new Date(appt.date).getDate()}
                                            </span>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h4
                                                onClick={() => navigate(`/doctor/patients?id=${appt.patient?._id}`)}
                                                className="font-bold text-slate-900 truncate cursor-pointer hover:text-primary-600 transition-colors"
                                            >
                                                {appt.patient?.name}
                                            </h4>
                                            <p className="text-sm text-slate-500">{appt.reason || 'Checkup'} • {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setConfirmModal({ isOpen: true, id: appt._id })}
                                                className="px-4 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => navigate('/doctor/appointments')}
                                                className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700 shadow-md transition-shadow active:shadow-inner"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass-card p-8">
                        <h3 className="text-xl font-bold mb-6 ">Quick Search</h3>
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Patient Name/ID..."
                                className="input-field pl-11 py-2 text-sm"
                                value={dashSearch}
                                onChange={(e) => setDashSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && dashSearch.trim()) {
                                        navigate(`/doctor/patients?search=${encodeURIComponent(dashSearch.trim())}`);
                                    }
                                }}
                            />

                            {/* Real-time Search Results */}
                            {dashSearch && (
                                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-50 z-[60] overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
                                    {appointments?.filter(a =>
                                        a.patient?.name?.toLowerCase().includes(dashSearch.toLowerCase()) ||
                                        a.patient?._id?.includes(dashSearch)
                                    ).length === 0 ? (
                                        <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No Matches</div>
                                    ) : (
                                        [...new Map(appointments?.filter(a =>
                                            a.patient?.name?.toLowerCase().includes(dashSearch.toLowerCase()) ||
                                            a.patient?._id?.includes(dashSearch)
                                        ).map(a => [a.patient?._id, a.patient])).values()].map((patient) => (
                                            <button
                                                key={patient._id}
                                                onClick={() => navigate(`/doctor/patients?id=${patient._id}`)}
                                                className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-black text-[10px]">
                                                    {patient.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-bold text-slate-900 truncate">{patient.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium truncate">{patient.email}</p>
                                                </div>
                                                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Assigned Patients</h4>
                        <div className="space-y-3">
                            {appointments?.slice(0, 5).map((appt) => (
                                <div
                                    key={appt._id}
                                    onClick={() => navigate(`/doctor/patients?id=${appt.patient?._id}`)}
                                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-primary-600 font-bold border-2 border-white">
                                        {appt.patient?.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-slate-900 truncate">{appt.patient?.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{appt.patient?.email}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/doctor/patients')}
                            className="w-full mt-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all "
                        >
                            View All Patients
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={() => updateStatusMutation.mutate({ id: confirmModal.id, status: 'Cancelled' })}
                title="Cancel Appointment?"
                message="Are you sure you want to cancel this appointment? This action cannot be undone."
                confirmText="Yes, Cancel"
                cancelText="No, Keep It"
                type="danger"
                isLoading={updateStatusMutation.isPending}
            />
        </DashboardLayout>
    );
};

export default DoctorDashboard;
