import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    Search,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    ClipboardList,
    Users,
    FileEdit,
    ArrowRight,
    ArrowLeft,
    Plus,
    Trash2,
    Send,
    Filter,
    MoreVertical,
    Activity,
    Printer,
    Stethoscope,
    CreditCard,
    DollarSign,
    Mail,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { UnifiedDocument } from '../../components/shared/UnifiedDocument';
import { getUnifiedDocumentHTML } from '../../utils/documentGenerator';
import { printDocument } from '../../utils/printHelper';
import { useAuth } from '../../contexts/AuthContext';
import { doctorApi } from '../../services/api';
import { getLocalDateString, formatDateDisplay } from '../../utils/documentUtils';
import { matchesPatientQuery } from '../../utils/searchUtils';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AppLoader from '../../components/shared/AppLoader';
import { motion, AnimatePresence } from 'framer-motion';
import TablePagination from '../../components/shared/TablePagination';
import ConfirmationModal from '../../components/shared/ConfirmationModal';
import { toast } from 'react-hot-toast';

const Appointments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Add location hook
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const filterParam = new URLSearchParams(location.search).get('filter');

    useEffect(() => {
        setDateRange({ start: '', end: '' });
        setCurrentPage(1);
    }, [filterParam]);
    const [viewDate, setViewDate] = useState(new Date());
    const [viewingPrescription, setViewingPrescription] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareData, setShareData] = useState({ id: '', email: '' });

    const handlePrintPrescription = async (appointmentId) => {
        try {
            const toastId = toast.loading('Preparing prescription for printing...', {
                style: { borderRadius: '15px', background: '#1e293b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
            });
            const res = await doctorApi.getPrescriptionByAppointment(appointmentId);
            toast.dismiss(toastId);
            if (res.data) {
                printDocument({
                    ...res.data,
                    appointmentId,
                    createdAt: res.data.prescription?.createdAt
                }, 'prescription');
            }
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to load prescription for printing', {
                style: { borderRadius: '15px', background: '#1e293b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
            });
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get('search');
        if (query) {
            setSearchQuery(query);
            setCurrentPage(1);
            // Optionally reset tab to 'All' if searching, or keep as is
            if (activeTab === 'Upcoming' || activeTab === 'Completed') {
                // Consider if we want to search across all tabs when a global search is done
                // For now, let's keep tab context or maybe switch to 'All' if user searches globally?
                // Let's switch to 'All' to ensure results are found
                setActiveTab('All');
            }
        }
    }, [location.search]);

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
            setConfirmModal({ isOpen: false, id: null });
        }
    });

    const shareMutation = useMutation({
        mutationFn: ({ id, email }) => doctorApi.sharePrescription(id, email),
        onSuccess: () => {
            toast.success('Prescription shared with patient');
            setShowShareModal(false);
        },
        onError: () => toast.error('Failed to share prescription')
    });

    const handleQuickShare = async (appt) => {
        try {
            const res = await doctorApi.getPrescriptionByAppointment(appt._id);
            if (!res.data.prescription) return toast.error('Prescription record not found');
            
            setShareData({
                id: res.data.prescription._id,
                email: appt.patient?.email || ''
            });
            setShowShareModal(true);
        } catch (error) {
            toast.error('Failed to fetch prescription');
        }
    };

    const handleFinalShare = () => {
        if (!shareData.email) return toast.error('Enter recipient email');
        const toastId = toast.loading('Sending prescription email...');
        shareMutation.mutate(
            { id: shareData.id, email: shareData.email },
            { onSettled: () => toast.dismiss(toastId) }
        );
    };



    const baseFiltered = appointments?.filter(appt => {
        const matchesSearch = matchesPatientQuery(appt.patient, searchQuery);

        const apptDate = getLocalDateString(appt.date || appt.createdAt);
        const todayStr = getLocalDateString(new Date());

        const hasDateFilter = Boolean(dateRange.start);
        let matchesDate = true;
        if (hasDateFilter) {
            if (dateRange.start && dateRange.end) {
                matchesDate = apptDate >= dateRange.start && apptDate <= dateRange.end;
            } else if (dateRange.start) {
                matchesDate = apptDate === dateRange.start;
            }
        } else {
            if (filterParam === 'today') {
                matchesDate = apptDate === todayStr;
            } else if (filterParam === 'previous') {
                matchesDate = apptDate < todayStr;
            } else if (filterParam === 'upcoming') {
                matchesDate = apptDate > todayStr;
            }
        }

        return matchesSearch && matchesDate;
    }) || [];

    const filteredAppointments = baseFiltered.filter(appt => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Upcoming') return ['Accepted', 'Rescheduled'].includes(appt.status);
        return appt.status === activeTab;
    }).reverse();

    // Pagination Logic
    const totalPages = Math.ceil((filteredAppointments?.length || 0) / itemsPerPage);
    const paginatedAppointments = filteredAppointments?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (newSize) => {
        setItemsPerPage(newSize);
        setCurrentPage(1);
    };

    const getDisplayId = (user) => {
        if (!user) return 'XXX-000';
        if (user.displayId) return user.displayId;
        if (!user.name || !user._id) return 'XXX-000';
        const prefix = user.name.slice(0, 3).toUpperCase();
        const decimal = parseInt(user._id.slice(-4), 16);
        const suffix = (decimal % 1000).toString().padStart(3, '0');
        return `${prefix}-${suffix}`;
    };

    const handleDateClick = (dateStr) => {
        if (!dateRange.start || (dateRange.start && dateRange.end)) {
            setDateRange({ start: dateStr, end: '' });
        } else {
            if (dateStr < dateRange.start) {
                setDateRange({ start: dateStr, end: dateRange.start });
            } else {
                setDateRange({ start: dateRange.start, end: dateStr });
            }
        }
        setCurrentPage(1);
    };

    const tabs = ['All', 'Upcoming', 'Completed', 'Cancelled'];

    const tabMeta = {
        All: { label: 'All appointments', icon: ClipboardList, tint: 'bg-secondary-50 text-secondary-700' },
        Upcoming: { label: 'Upcoming', icon: Clock, tint: 'bg-emerald-50 text-emerald-700' },
        Completed: { label: 'Completed', icon: CheckCircle2, tint: 'bg-sky-50 text-sky-700' },
        Cancelled: { label: 'Cancelled', icon: XCircle, tint: 'bg-rose-50 text-rose-600' }
    };

    const tabCounts = {
        All: baseFiltered.length,
        Upcoming: baseFiltered.filter(a => ['Accepted', 'Rescheduled'].includes(a.status)).length,
        Completed: baseFiltered.filter(a => a.status === 'Completed').length,
        Cancelled: baseFiltered.filter(a => a.status === 'Cancelled').length
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Completed': return 'bg-sky-50 text-sky-700 border-sky-200';
            case 'Cancelled': return 'bg-rose-50 text-rose-600 border-rose-200';
            case 'Rescheduled': return 'bg-violet-50 text-violet-700 border-violet-200';
            default: return 'bg-slate-100 text-muted border-line';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Unpaid': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getInitials = (name) =>
        (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    const renderPatient = (appt) => (
        <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                {getInitials(appt.patient?.name)}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{appt.patient?.name}</p>
                <p className="text-[13px] text-muted mt-0.5 truncate">
                    #{getDisplayId(appt.patient)}
                    {(appt.patient?.age || appt.patient?.gender) && (
                        <span className="text-subtle">
                            {' · '}
                            {[
                                appt.patient?.age ? `${appt.patient.age} Y` : null,
                                appt.patient?.gender
                            ].filter(Boolean).join(' / ')}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );

    const renderActions = (appt) => (
        <>
            {(appt.status === 'Pending' || appt.status === 'Cancelled') && (
                <>
                    <button
                        onClick={() => setConfirmModal({ isOpen: true, id: appt._id })}
                        className="ui-icon-btn-danger"
                        title="Cancel Appointment"
                        disabled={appt.status === 'Cancelled'}
                    >
                        <XCircle className="w-[18px] h-[18px]" />
                    </button>
                    <button
                        onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'Accepted' })}
                        className="ui-btn-success"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        {appt.status === 'Cancelled' ? 'Re-Accept' : 'Accept'}
                    </button>
                </>
            )}
            {(appt.status === 'Accepted' || appt.status === 'Rescheduled') && (
                <button
                    onClick={() => {
                        if (!appt.sessionStartTime) {
                            // Save start time if not already started
                            doctorApi.updateAppointment(appt._id, { sessionStartTime: new Date() });
                        }
                        navigate(`/doctor/session/${appt._id}`);
                    }}
                    className="ui-btn-dark"
                >
                    <Activity className="w-4 h-4" />
                    {appt.hasDraft ? 'Resume Draft' : 'Start Consultation'}
                </button>
            )}
            {appt.status === 'Completed' && (
                <>
                    <button
                        onClick={() => handleQuickShare(appt)}
                        className="ui-icon-btn"
                        title="Share via Email"
                    >
                        <Mail className="w-[18px] h-[18px]" />
                    </button>
                    <button
                        onClick={() => handlePrintPrescription(appt._id)}
                        className="ui-btn-soft"
                        title="Print Prescription"
                    >
                        <Printer className="w-4 h-4" />
                        Print Prescription
                    </button>
                    <button
                        onClick={() => navigate(`/doctor/session/${appt._id}`)}
                        className="ui-btn-warn"
                        title="Edit Prescription"
                    >
                        Edit Prescription
                    </button>
                </>
            )}
        </>
    );

    const emptyState = (
        <div className="py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-subtle" />
            </div>
            <p className="text-base font-semibold text-ink">No {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}appointments found</p>
            <p className="text-sm text-muted mt-1">Try a different status, date range or search term.</p>
            {(searchQuery || dateRange.start) && (
                <button
                    onClick={() => {
                        setSearchQuery('');
                        setDateRange({ start: '', end: '' });
                        setCurrentPage(1);
                    }}
                    className="ui-btn-outline mt-5"
                >
                    Clear filters
                </button>
            )}
        </div>
    );

    return (
        <>
            <DashboardLayout>
                <div className="w-full max-w-[1600px] mx-auto py-2 print:hidden">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
                        <div>
                            <h1 className="page-title">
                                {filterParam === 'today' ? 'Today\'s Appointments' : filterParam === 'previous' ? 'Previous Appointments' : filterParam === 'upcoming' ? 'Upcoming Appointments' : 'Appointment Manager'}
                            </h1>
                            <p className="page-sub">Coordinate patient consultations and schedule logistics</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by name, ID or phone"
                                    className="ui-input pl-10 pr-9"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setCurrentPage(1);
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-md text-subtle hover:text-ink transition-colors"
                                        title="Clear search"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="relative">
                                <div className={`h-10 flex items-center bg-white rounded-lg border transition-all ${dateRange.start ? 'border-primary-500' : 'border-line hover:border-slate-200'}`}>
                                    <button
                                        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                        className="h-full pl-3.5 pr-3 flex items-center gap-2.5 flex-1"
                                    >
                                        <Calendar className={`w-4 h-4 ${dateRange.start ? 'text-primary-600' : 'text-subtle'}`} />
                                        <span className={`text-sm font-medium whitespace-nowrap ${dateRange.start ? 'text-ink' : 'text-muted'}`}>
                                            {dateRange.start && dateRange.end ? (
                                                `${formatDateDisplay(dateRange.start, { day: '2-digit', month: 'short' })} - ${formatDateDisplay(dateRange.end, { day: '2-digit', month: 'short' })}`
                                            ) : dateRange.start ? (
                                                formatDateDisplay(dateRange.start, { day: '2-digit', month: 'short', year: 'numeric' })
                                            ) : 'Filter by date'}
                                        </span>
                                    </button>
                                    {dateRange.start && (
                                        <button
                                            onClick={() => {
                                                setDateRange({ start: '', end: '' });
                                                setCurrentPage(1);
                                            }}
                                            className="mr-2 p-1 hover:bg-slate-100 rounded-md transition-colors"
                                            title="Clear date filter"
                                        >
                                            <X className="w-3.5 h-3.5 text-subtle" />
                                        </button>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {isDatePickerOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsDatePickerOpen(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                                className="absolute top-full right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-line p-5 w-[320px]"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-sm font-bold text-ink">
                                                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                    </h4>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                                            className="ui-icon-btn !w-8 !h-8"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                                            className="ui-icon-btn !w-8 !h-8"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-7 gap-1 mb-1">
                                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                                        <div key={day} className="text-center label-caps py-1.5">{day}</div>
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-7 gap-1">
                                                    {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }).map((_, i) => (
                                                        <div key={`empty-${i}`} />
                                                    ))}
                                                    {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                                                        const day = i + 1;
                                                        const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                                                        const isStart = dateRange.start === dateStr;
                                                        const isEnd = dateRange.end === dateStr;
                                                        const isInRange = dateRange.start && dateRange.end && dateStr > dateRange.start && dateStr < dateRange.end;
                                                        const isToday = getLocalDateString(new Date()) === dateStr;

                                                        return (
                                                            <button
                                                                key={day}
                                                                onClick={() => handleDateClick(dateStr)}
                                                                className={`h-9 w-full rounded-lg text-[13px] font-medium transition-all flex items-center justify-center ${isStart || isEnd
                                                                    ? 'bg-secondary-900 text-white font-bold shadow-md'
                                                                    : isInRange
                                                                        ? 'bg-primary-50 text-primary-700 rounded-none'
                                                                        : isToday
                                                                            ? 'border border-primary-500 text-primary-700 font-semibold'
                                                                            : 'text-ink hover:bg-slate-100'
                                                                    }`}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                                                    <button
                                                        onClick={() => {
                                                            const today = getLocalDateString(new Date());
                                                            setDateRange({ start: today, end: '' });
                                                            setCurrentPage(1);
                                                            setIsDatePickerOpen(false);
                                                        }}
                                                        className="text-[13px] font-semibold text-primary-700 hover:underline"
                                                    >
                                                        Today
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDateRange({ start: '', end: '' });
                                                            setCurrentPage(1);
                                                            setIsDatePickerOpen(false);
                                                        }}
                                                        className="text-[13px] font-semibold text-muted hover:text-rose-600 transition-colors"
                                                    >
                                                        Clear filter
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Summary cards (double as status tabs) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                        {tabs.map(tab => {
                            const meta = tabMeta[tab];
                            const Icon = meta.icon;
                            const isActive = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setCurrentPage(1);
                                    }}
                                    className={`ui-card text-left p-4 md:p-5 flex items-center gap-4 transition-all hover:shadow-md ${isActive ? 'ring-2 ring-secondary-900 border-transparent' : 'hover:border-slate-200'}`}
                                >
                                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.tint}`}>
                                        <Icon className="w-5 h-5" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-2xl font-bold text-ink leading-none tabular-nums">
                                            {isLoading ? '–' : tabCounts[tab]}
                                        </span>
                                        <span className="block text-[13px] font-medium text-muted mt-1.5 truncate">{meta.label}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* List */}
                    <div className="ui-card overflow-hidden mb-6">
                        <div className="px-5 py-4 flex items-center justify-between border-b border-line">
                            <h2 className="text-base font-bold text-ink">{tabMeta[activeTab].label}</h2>
                            <span className="text-sm text-muted tabular-nums">
                                {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}
                            </span>
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="ui-table w-full">
                                <thead>
                                    <tr>
                                        <th>Schedule</th>
                                        <th>Patient</th>
                                        <th>Reason</th>
                                        <th>Started</th>
                                        <th>Status</th>
                                        <th className="!text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="6"><AppLoader fullScreen={false} compact label="Loading" /></td></tr>
                                    ) : filteredAppointments.length === 0 ? (
                                        <tr>
                                            <td colSpan="6">{emptyState}</td>
                                        </tr>
                                    ) : (
                                        paginatedAppointments.map((appt) => (
                                            <motion.tr
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={appt._id}
                                            >
                                                <td className="whitespace-nowrap">
                                                    <p className="text-sm font-semibold text-ink tabular-nums">
                                                        {new Date(appt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[13px] text-muted tabular-nums mt-0.5 flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-subtle" />
                                                        {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </td>
                                                <td>{renderPatient(appt)}</td>
                                                <td>
                                                    <span className="inline-flex items-center gap-2 text-sm text-ink">
                                                        <Activity className="w-4 h-4 text-primary-600 shrink-0" />
                                                        {appt.reason || 'Symptomatic Review'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    {appt.sessionStartTime ? (
                                                        <span className="text-sm font-semibold text-emerald-700 tabular-nums">
                                                            {new Date(appt.sessionStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-subtle">–</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`ui-chip ${getStatusColor(appt.status)}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                        {appt.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center justify-end gap-2">
                                                        {renderActions(appt)}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-line">
                            {isLoading ? (
                                <AppLoader fullScreen={false} compact label="Loading" />
                            ) : filteredAppointments.length === 0 ? (
                                emptyState
                            ) : (
                                paginatedAppointments.map((appt) => (
                                    <div key={appt._id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            {renderPatient(appt)}
                                            <span className={`ui-chip shrink-0 ${getStatusColor(appt.status)}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {appt.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted tabular-nums">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-subtle" />
                                                {new Date(appt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-subtle" />
                                                {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {appt.sessionStartTime && (
                                                <span className="text-emerald-700 font-semibold">
                                                    Started {new Date(appt.sessionStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-ink flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-primary-600 shrink-0" />
                                            {appt.reason || 'Symptomatic Review'}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            {renderActions(appt)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {!isLoading && (
                            <TablePagination
                                currentPage={currentPage}
                                totalPages={totalPages || 1}
                                totalItems={filteredAppointments?.length || 0}
                                itemsPerPage={itemsPerPage}
                                onPageChange={handlePageChange}
                                onItemsPerPageChange={handleItemsPerPageChange}
                            />
                        )}
                    </div>
                </div>
            </DashboardLayout>

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

            {/* Prescription Viewer Modal - Outside layout for print safety */}
            <AnimatePresence>
                {viewingPrescription && (
                    <div className="prescription-modal-root">
                        <style dangerouslySetInnerHTML={{
                            __html: `
                                @media print {
                                    @page { size: A4; margin: 0; }
                                    body { margin: 0; padding: 0; background: white !important; }
                                    .no-print { display: none !important; }
                                    #root > div:not(.prescription-modal-root) { display: none !important; }
                                    .prescription-modal-root { position: static !important; display: block !important; width: 100% !important; }
                                }
                            ` }} />
                        <PrescriptionModal
                            appointmentId={viewingPrescription}
                            onClose={() => setViewingPrescription(null)}
                        />
                    </div>
                )}
            </AnimatePresence>

            <EmailShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                data={shareData}
                onShare={handleFinalShare}
                isPending={shareMutation.isPending}
                onChangeEmail={(email) => setShareData({ ...shareData, email })}
            />
        </>
    );
};


const PrescriptionModal = ({ appointmentId, onClose }) => {
    const { data: prescriptionData, isLoading } = useQuery({
        queryKey: ['prescription', appointmentId],
        queryFn: async () => {
            const res = await doctorApi.getPrescriptionByAppointment(appointmentId);
            return res.data;
        }
    });

    if (isLoading) return <AppLoader fullScreen={false} compact label="Loading prescription" />;

    const { prescription, clinicalDetails } = prescriptionData || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm no-print"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col no-print"
            >
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <iframe 
                        srcDoc={getUnifiedDocumentHTML({
                            ...prescriptionData,
                            image: prescriptionData.prescription?.image || prescriptionData.image,
                            appointmentId,
                            createdAt: prescriptionData.prescription?.createdAt
                        }, 'prescription', true)}
                        className="w-full h-full min-h-[600px] border-0"
                    />
                </div>

                <div className="px-6 py-4 bg-white border-t border-line flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="ui-btn-outline !h-10 !px-5"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => printDocument({
                            ...prescriptionData,
                            appointmentId,
                            createdAt: prescriptionData.prescription?.createdAt
                        }, 'prescription')}
                        className="ui-btn-dark !h-10 !px-5"
                    >
                        <Printer className="w-4 h-4" />
                        Print Record
                    </button>
                </div>
            </motion.div>
        </div>
    );
};


const EmailShareModal = ({ isOpen, onClose, data, onShare, isPending, onChangeEmail }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-2xl p-7 shadow-2xl overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-3">
                        <button onClick={onClose} className="ui-icon-btn">
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
                            <Mail className="w-7 h-7 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-bold text-ink mb-1.5">Share prescription</h2>
                        <p className="text-sm text-muted mb-7 max-w-[280px]">
                            Send a professional digital copy to the patient.
                        </p>

                        <div className="w-full space-y-4 text-left">
                            <div>
                                <label className="text-[13px] font-semibold text-ink mb-1.5 block">Patient email address</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => onChangeEmail(e.target.value)}
                                    className="ui-input !h-11"
                                    placeholder="Enter email..."
                                />
                            </div>

                            <button
                                onClick={onShare}
                                disabled={isPending}
                                className="ui-btn-primary !w-full !h-11 !text-sm"
                            >
                                {isPending ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Email Now
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

export default Appointments;
