import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    Search,
    ArrowRight,
    GripVertical,
    Users,
    CheckCircle2,
    Activity,
    CalendarCheck2,
    Clock,
    X
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    TouchSensor,
    MouseSensor
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useAuth } from '../../contexts/AuthContext';
import { doctorApi, adminApi } from '../../services/api';
import { matchesPatientQuery } from '../../utils/searchUtils';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AppLoader from '../../components/shared/AppLoader';
import ConfirmationModal from '../../components/shared/ConfirmationModal';
import AppointmentsChart from '../../components/shared/AppointmentsChart';

// Sortable Item Component
const SortableItem = ({ appt, navigate, setConfirmModal }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: appt._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 5 : 1,
        position: 'relative',
        opacity: isDragging ? 0.5 : 1,
    };

    const apptDate = new Date(appt.date);
    const statusClass = appt.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : appt.status === 'Rescheduled' ? 'bg-violet-50 text-violet-700 border-violet-200'
            : 'bg-amber-50 text-amber-700 border-amber-200';

    return (
        <div ref={setNodeRef} style={style} className="flex flex-wrap sm:flex-nowrap items-center gap-3 md:gap-4 p-3 bg-white rounded-xl border border-line hover:border-primary-300 hover:shadow-sm transition-all">
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="p-1.5 text-slate-200 hover:text-subtle cursor-grab active:cursor-grabbing touch-none shrink-0"
                title="Drag to reorder"
            >
                <GripVertical className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-line shrink-0">
                <span className="text-[11px] font-semibold text-muted uppercase leading-none">
                    {apptDate.toLocaleString('default', { month: 'short' })}
                </span>
                <span className="text-xl font-bold text-ink leading-none mt-1 tabular-nums">
                    {apptDate.getDate()}
                </span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h4
                        onClick={() => navigate(`/doctor/patients/${appt.patient?._id}`)}
                        className="font-semibold text-ink truncate cursor-pointer hover:text-primary-700 transition-colors text-base"
                    >
                        {appt.patient?.name}
                    </h4>
                    {(appt.patient?.age || appt.patient?.gender) && (
                        <span className="text-xs text-muted bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {[
                                appt.patient?.age ? `${appt.patient.age} Y` : null,
                                appt.patient?.gender
                            ].filter(Boolean).join(' / ')}
                        </span>
                    )}
                </div>
                <p className="text-[13px] text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <Clock className="w-3.5 h-3.5 text-subtle" />
                    <span className="tabular-nums">{apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-subtle">·</span>
                    <span className="truncate">{appt.reason || 'Checkup'}</span>
                </p>
            </div>

            <span className={`ui-chip hidden md:inline-flex ${statusClass}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {appt.status}
            </span>

            <div className="flex gap-2 w-full sm:w-auto">
                <button
                    onClick={() => setConfirmModal({ isOpen: true, id: appt._id })}
                    className="ui-btn-outline flex-1 sm:flex-none"
                >
                    Cancel
                </button>
                <button
                    onClick={() => navigate(`/doctor/appointments?search=${encodeURIComponent(appt.patient?.displayId || appt.patient?.name || '')}`)}
                    className="ui-btn-dark flex-1 sm:flex-none"
                >
                    View
                </button>
            </div>
        </div>
    );
};

const DoctorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [dashSearch, setDashSearch] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
    const [orderedAppointments, setOrderedAppointments] = useState([]);

    const viewAsDoctorId = localStorage.getItem('viewAsDoctorId');
    const isDoctorView = viewAsDoctorId && user?.role === 'superadmin';

    const { data: targetDoctor } = useQuery({
        queryKey: ['targetDoctor', viewAsDoctorId],
        queryFn: async () => {
            const res = await adminApi.getUserById(viewAsDoctorId);
            return res.data;
        },
        enabled: !!isDoctorView
    });

    const displayDoctorName = isDoctorView ? (targetDoctor?.name || '...') : user?.name;

    const { data: appointments, isLoading } = useQuery({
        queryKey: ['doctorAppointments'],
        queryFn: async () => {
            const res = await doctorApi.getAppointments();
            return res.data;
        }
    });

    // Initialize local state when data loads
    useEffect(() => {
        if (appointments) {
            const pending = appointments.filter(a => ['Pending', 'Accepted', 'Rescheduled'].includes(a.status));
            // Sort by order field if it exists, otherwise preserve backend sort (usually date)
            // Manual drag order first; ties (e.g. new appointments) show the latest appointment first
            const sorted = [...pending].sort((a, b) =>
                (a.order || 0) - (b.order || 0) ||
                new Date(b.date) - new Date(a.date) ||
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            // If all orders are 0 (legacy), fallback to date? No, let's trust backend or default.
            // Actually, if we want drag and drop to work, we should just use the array order.
            // If the backend sends them sorted by date by default, we just use that.
            setOrderedAppointments(sorted);
        }
    }, [appointments]);

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => doctorApi.updateAppointment(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['doctorAppointments']);
            setConfirmModal({ isOpen: false, id: null });
        }
    });

    const reorderMutation = useMutation({
        mutationFn: (orderedIds) => doctorApi.reorderAppointments(orderedIds),
        onSuccess: () => {
            queryClient.invalidateQueries(['doctorAppointments']);
        }
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
        useSensor(TouchSensor),
        useSensor(MouseSensor)
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setOrderedAppointments((items) => {
                const oldIndex = items.findIndex((item) => item._id === active.id);
                const newIndex = items.findIndex((item) => item._id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Trigger API update
                reorderMutation.mutate(newItems.map(item => item._id));

                return newItems;
            });
        }
    };

    // Calculate stats
    const todayStr = new Date().toISOString().split('T')[0];
    const totalAppointments = appointments?.length || 0;
    const completedAppointments = appointments?.filter(a => a.status === 'Completed').length || 0;
    const pendingAppointments = appointments?.filter(a => ['Pending', 'Accepted'].includes(a.status)).length || 0;
    const todaysAppointments = appointments?.filter(a => new Date(a.date).toISOString().split('T')[0] === todayStr).length || 0;

    const stats = [
        { label: 'Today\'s Appointments', value: todaysAppointments, icon: Clock, link: '/doctor/appointments?filter=today' },
        { label: 'Pending Consultations', value: pendingAppointments, icon: Activity, link: '/doctor/appointments' },
        { label: 'Completed Appointments', value: completedAppointments, icon: CheckCircle2, link: '/doctor/appointments?filter=previous' },
        { label: 'Total Appointments', value: totalAppointments, icon: CalendarCheck2, link: '/doctor/appointments' }
    ];

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <DashboardLayout>
            <div className="w-full max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div>
                        <h1 className="page-title">{greeting}, {displayDoctorName}</h1>
                        <p className="page-sub">
                            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Manage your consultations and patient records
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/doctor/appointments')}
                        className="ui-btn-dark !h-10 !px-4 w-full md:w-auto"
                    >
                        <Calendar className="w-4 h-4" />
                        Manage Schedule
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
                    {stats.map((stat, i) => (
                        <div key={i} onClick={() => stat.link && navigate(stat.link)} className="ui-card p-4 md:p-5 flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer">
                            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold text-ink leading-none tabular-nums">{stat.value}</p>
                                <p className="text-[13px] font-medium text-muted mt-1.5 truncate">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
                    {/* Queue */}
                    <div className="ui-card overflow-hidden">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-line">
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-base font-bold text-ink">Upcoming appointments</h3>
                                <span className="min-w-6 h-6 px-2 rounded-full bg-secondary-50 text-secondary-700 text-xs font-bold flex items-center justify-center tabular-nums">
                                    {orderedAppointments.length}
                                </span>
                            </div>
                            <button
                                onClick={() => navigate('/doctor/appointments')}
                                className="text-primary-700 text-[13px] font-semibold hover:underline flex items-center gap-1"
                            >
                                View schedule <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50/60">
                            {isLoading ? (
                                <AppLoader fullScreen={false} compact label="Loading" />
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={orderedAppointments.map(a => a._id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2.5">
                                            {orderedAppointments.length === 0 && (
                                                <div className="py-12 text-center">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                                        <Calendar className="w-6 h-6 text-subtle" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-ink">No appointments for today yet</p>
                                                    <p className="text-[13px] text-muted mt-1">New assignments will appear here.</p>
                                                </div>
                                            )}
                                            {orderedAppointments.map((appt) => (
                                                <SortableItem
                                                    key={appt._id}
                                                    appt={appt}
                                                    navigate={navigate}
                                                    setConfirmModal={setConfirmModal}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Quick search & assigned patients */}
                        <div className="ui-card p-5">
                            <h3 className="text-base font-bold text-ink mb-3">Quick search</h3>
                            <div className="relative mb-4">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Patient name, ID or phone"
                                    className="ui-input pl-10 pr-9"
                                    value={dashSearch}
                                    onChange={(e) => setDashSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && dashSearch.trim()) {
                                            navigate(`/doctor/patients?search=${encodeURIComponent(dashSearch.trim())}`);
                                        }
                                    }}
                                />
                                {dashSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setDashSearch('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-md text-subtle hover:text-ink transition-colors"
                                        title="Clear search"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {/* Real-time Search Results */}
                                {dashSearch && (
                                    <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-line z-[60] overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
                                        {appointments?.filter(a => matchesPatientQuery(a.patient, dashSearch)).length === 0 ? (
                                            <div className="p-4 text-center text-sm text-muted">No matches</div>
                                        ) : (
                                            [...new Map(appointments?.filter(a => matchesPatientQuery(a.patient, dashSearch)).map(a => [a.patient?._id, a.patient])).values()].map((patient) => (
                                                <button
                                                    key={patient._id}
                                                    onClick={() => navigate(`/doctor/patients/${patient._id}`)}
                                                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-line last:border-0"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-xs">
                                                        {patient.name?.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-sm font-semibold text-ink truncate">{patient.name}</p>
                                                        <p className="text-xs text-muted truncate">
                                                            #{patient.displayId || patient._id?.slice(-8)}
                                                            {patient.phone ? ` · ${patient.phone}` : patient.email ? ` · ${patient.email}` : ''}
                                                        </p>
                                                    </div>
                                                    <ArrowRight className="w-3.5 h-3.5 text-subtle" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <p className="label-caps mb-2">Assigned patients</p>
                            <div className="-mx-2">
                                {appointments?.slice(0, 5).map((appt) => (
                                    <div
                                        key={appt._id}
                                        onClick={() => navigate(`/doctor/patients/${appt.patient?._id}`)}
                                        className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 text-sm font-bold shrink-0">
                                            {appt.patient?.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-semibold text-ink truncate">{appt.patient?.name}</p>
                                            <p className="text-xs text-muted truncate">
                                                {[
                                                    appt.patient?.age ? `${appt.patient.age} Y` : null,
                                                    appt.patient?.gender,
                                                    appt.patient?.phone || appt.patient?.email
                                                ].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-subtle" />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => navigate('/doctor/patients')}
                                className="ui-btn-outline !w-full mt-3"
                            >
                                View all patients
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <AppointmentsChart appointments={appointments || []} height={260} />
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
