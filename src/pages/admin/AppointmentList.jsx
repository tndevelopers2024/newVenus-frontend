import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, doctorApi } from '../../services/api';
import { getLocalDateString, formatDateDisplay } from '../../utils/documentUtils';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AppLoader from '../../components/shared/AppLoader';
import TablePagination from '../../components/shared/TablePagination';
import {
    Calendar,
    User,
    Stethoscope,
    Clock,
    AlertCircle,
    Search,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    X,
    Printer,
    Mail,
    Share2,
    Send,
    UploadCloud,
    Edit2,
    Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../../components/shared/ConfirmationModal';
import { getUnifiedDocumentHTML } from '../../utils/documentGenerator';
import { printDocument } from '../../utils/printHelper';

const AppointmentList = () => {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const filterParam = searchParams.get('filter');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareData, setShareData] = useState({ id: '', email: '' });
    const [editingDateId, setEditingDateId] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [editViewDate, setEditViewDate] = useState(new Date());
    const [isEditDatePickerOpen, setIsEditDatePickerOpen] = useState(false);
    const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        setDateRange({ start: '', end: '' });
        setCurrentPage(1);
    }, [filterParam]);

    const { data: appointments, isLoading } = useQuery({
        queryKey: ['adminAppointmentsFullList'],
        queryFn: () => adminApi.getAppointments().then(res => res.data)
    });

    const deleteMutation = useMutation({
        mutationFn: adminApi.deleteAppointment,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminAppointmentsFullList']);
            queryClient.invalidateQueries(['adminAppointmentsAll']);
            setConfirmModal({ isOpen: false, id: null, name: '' });
            toast.success('Assignment removed successfully', {
                style: {
                    borderRadius: '20px',
                    background: '#1e293b',
                    color: '#fff',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    letterSpacing: '1px'
                }
            });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to remove assignment');
        }
    });

    const updateDateMutation = useMutation({
        mutationFn: ({ id, date }) => adminApi.updateAppointmentDate(id, date),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminAppointmentsFullList']);
            queryClient.invalidateQueries(['adminAppointmentsAll']);
            setEditingDateId(null);
            toast.success('Appointment date updated');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to update date');
        }
    });

    const handleDateUpdate = (id) => {
        if (!newDate) return toast.error('Please select a date');
        updateDateMutation.mutate({ id, date: newDate });
    };

    const uploadPrescriptionMutation = useMutation({
        mutationFn: doctorApi.createPrescription,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminAppointmentsFullList']);
            queryClient.invalidateQueries(['adminAppointmentsAll']);
            toast.success('Handwritten prescription uploaded successfully');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to upload prescription');
        }
    });

    const handleFileUpload = async (e, appt) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('appointmentId', appt._id);
        formData.append('patientId', appt.patient?._id);
        if (appt.doctor?._id) formData.append('doctorId', appt.doctor._id);

        const toastId = toast.loading('Uploading prescription...');
        try {
            await uploadPrescriptionMutation.mutateAsync(formData);
            toast.dismiss(toastId);
        } catch (error) {
            toast.dismiss(toastId);
        }
    };

    const handlePrint = async (appt) => {
        try {
            const toastId = toast.loading('Fetching prescription...');
            const res = await adminApi.getPrescriptionByAppointment(appt._id);
            const { prescription, clinicalDetails } = res.data;

            if (!prescription) {
                toast.dismiss(toastId);
                toast.error('No prescription found for this appointment');
                return;
            }

            const printData = {
                createdAt: new Date(),
                appointmentId: appt._id,
                prescription: {
                    doctor: appt.doctor,
                    patient: prescription.patient || appt.patient,
                    medications: prescription.medications,
                    notes: prescription.notes,
                    image: prescription.image,
                    followUpDate: prescription.followUpDate
                },
                clinicalDetails: {
                    vitals: clinicalDetails?.vitals || prescription.vitals, // Handle both structures just in case
                    diagnosis: clinicalDetails?.diagnosis || prescription.diagnosis,
                    clinicalNotes: clinicalDetails?.clinicalNotes || prescription.clinicalNotes
                }
            };

            printDocument(printData, 'prescription');
            toast.dismiss(toastId);
        } catch (error) {
            console.error(error);
            toast.error('Failed to print prescription');
        }
    };

    const shareMutation = useMutation({
        mutationFn: ({ id, email }) => adminApi.sharePrescription(id, email),
        onSuccess: () => {
            toast.success('Prescription shared with patient');
            setShowShareModal(false);
        },
        onError: () => toast.error('Failed to share prescription')
    });

    const handleShareClick = async (appt) => {
        try {
            const toastId = toast.loading('Checking prescription...');
            const res = await adminApi.getPrescriptionByAppointment(appt._id);
            toast.dismiss(toastId);

            if (!res.data.prescription) {
                toast.error('No prescription found for this appointment');
                return;
            }

            setShareData({
                id: res.data.prescription._id,
                email: appt.patient?.email || ''
            });
            setShowShareModal(true);
        } catch (error) {
            toast.error('Failed to check prescription status');
        }
    };

    const handleFinalShare = () => {
        if (!shareData.email) return toast.error('Enter recipient email');
        shareMutation.mutate({ id: shareData.id, email: shareData.email });
    };

    const filteredAppointments = appointments?.filter(appt => {
        const matchesSearch = 
            (appt.patient?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (appt.doctor?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (appt.reason?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const apptDateStr = appt.date || appt.createdAt;
        const apptDate = getLocalDateString(apptDateStr);
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
    });

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

    const todayStr = getLocalDateString(new Date());
    const dateCounts = (appointments || []).reduce((acc, a) => {
        const d = getLocalDateString(a.date || a.createdAt);
        acc.all += 1;
        if (d === todayStr) acc.today += 1;
        else if (d > todayStr) acc.upcoming += 1;
        else acc.previous += 1;
        return acc;
    }, { all: 0, today: 0, upcoming: 0, previous: 0 });

    const pageTabs = [
        { key: null, label: 'All', to: '/admin/appointments/list', count: dateCounts.all },
        { key: 'today', label: 'Today', to: '/admin/appointments/list?filter=today', count: dateCounts.today },
        { key: 'upcoming', label: 'Upcoming', to: '/admin/appointments/list?filter=upcoming', count: dateCounts.upcoming },
        { key: 'previous', label: 'Previous', to: '/admin/appointments/list?filter=previous', count: dateCounts.previous }
    ];

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

    const initialsOf = (name) =>
        (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    const renderPatient = (appt) => (
        <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                {initialsOf(appt.patient?.name)}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{appt.patient?.name}</p>
                <p className="text-[13px] text-muted truncate mt-0.5">{appt.patient?.email || appt.patient?.phone || '–'}</p>
            </div>
        </div>
    );

    const renderDoctor = (appt) => (
        <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                {initialsOf(appt.doctor?.name)}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{appt.doctor?.name}</p>
                <p className="text-[13px] text-muted truncate mt-0.5">{appt.doctor?.specialization || 'Specialist'}</p>
            </div>
        </div>
    );

    const renderDate = (appt) => {
        if (editingDateId === appt._id) {
            return (
                <div className="relative inline-flex items-center gap-1.5 bg-white p-1 rounded-lg border border-line shadow-sm">
                    <button
                        type="button"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopupPos({ top: rect.bottom + 8, left: rect.left });
                            setIsEditDatePickerOpen(!isEditDatePickerOpen);
                        }}
                        className="h-8 px-2.5 text-[13px] font-semibold text-ink bg-slate-50 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-2"
                    >
                        <Calendar className="w-3.5 h-3.5 text-primary-600" />
                        {newDate ? formatDateDisplay(newDate, { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select date'}
                    </button>

                    {createPortal(
                        <AnimatePresence>
                            {isEditDatePickerOpen && (
                                <>
                                    <div className="fixed inset-0 z-[90]" onClick={() => setIsEditDatePickerOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                        style={{ top: popupPos.top, left: popupPos.left }}
                                        className="fixed z-[100] bg-white rounded-2xl shadow-2xl border border-line p-5 w-[300px]"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-ink">
                                                {editViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            </h4>
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => setEditViewDate(new Date(editViewDate.getFullYear(), editViewDate.getMonth() - 1, 1))} className="ui-icon-btn !w-8 !h-8">
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <button type="button" onClick={() => setEditViewDate(new Date(editViewDate.getFullYear(), editViewDate.getMonth() + 1, 1))} className="ui-icon-btn !w-8 !h-8">
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
                                            {Array.from({ length: new Date(editViewDate.getFullYear(), editViewDate.getMonth(), 1).getDay() }).map((_, i) => <div key={`e-${i}`} />)}
                                            {Array.from({ length: new Date(editViewDate.getFullYear(), editViewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                                                const day = i + 1;
                                                const dateStr = `${editViewDate.getFullYear()}-${String(editViewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                const isSelected = newDate === dateStr;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={day}
                                                        onClick={() => {
                                                            setNewDate(dateStr);
                                                            setIsEditDatePickerOpen(false);
                                                        }}
                                                        className={`h-9 flex items-center justify-center rounded-lg text-[13px] font-medium transition-all ${isSelected ? 'bg-secondary-900 text-white font-bold shadow-md' : 'hover:bg-slate-100 text-ink'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>,
                        document.body
                    )}
                    <button
                        type="button"
                        onClick={() => handleDateUpdate(appt._id)}
                        disabled={updateDateMutation.isPending}
                        className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 transition-colors"
                        title="Save date"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setEditingDateId(null)}
                        className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100 transition-colors"
                        title="Cancel"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        const dt = new Date(appt.date || appt.createdAt);
        const editable = appt.status !== 'Completed';
        return (
            <div
                className={`group/date inline-flex items-center gap-2 ${editable ? 'cursor-pointer' : ''}`}
                onClick={() => {
                    if (editable) {
                        setEditingDateId(appt._id);
                        setNewDate(getLocalDateString(appt.date || appt.createdAt));
                        setEditViewDate(new Date(appt.date || appt.createdAt));
                        setIsEditDatePickerOpen(true);
                    }
                }}
                title={editable ? 'Click to change date' : undefined}
            >
                <div>
                    <p className="text-sm font-semibold text-ink tabular-nums">
                        {dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[13px] text-muted mt-0.5">{dt.toLocaleDateString('en-GB', { weekday: 'long' })}</p>
                </div>
                {editable && (
                    <Edit2 className="w-3.5 h-3.5 text-subtle opacity-60 group-hover/date:opacity-100 group-hover/date:text-primary-600 transition-all" />
                )}
            </div>
        );
    };

    const renderActions = (appt) => (
        appt.status !== 'Completed' ? (
            <>
                <label className={`ui-icon-btn cursor-pointer hover:!text-emerald-700 hover:!bg-emerald-50 ${uploadPrescriptionMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`} title="Upload Handwritten Prescription">
                    <UploadCloud className="w-[18px] h-[18px]" />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, appt)} />
                </label>
                <button
                    onClick={() => setConfirmModal({ isOpen: true, id: appt._id, name: appt.patient?.name })}
                    disabled={deleteMutation.isPending}
                    className="ui-icon-btn-danger"
                    title="Remove Assignment"
                >
                    <XCircle className="w-[18px] h-[18px]" />
                </button>
            </>
        ) : (
            <>
                <button onClick={() => handleShareClick(appt)} className="ui-icon-btn" title="Share to Email">
                    <Mail className="w-[18px] h-[18px]" />
                </button>
                <button onClick={() => handlePrint(appt)} className="ui-btn-soft" title="Print Prescription">
                    <Printer className="w-4 h-4" />
                    Print Prescription
                </button>
            </>
        )
    );

    const statusChip = (status) => (
        <span className={`ui-chip ${getStatusColor(status)}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status}
        </span>
    );

    const emptyState = (
        <div className="py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7 text-subtle" />
            </div>
            <p className="text-base font-semibold text-ink">No appointments found</p>
            <p className="text-sm text-muted mt-1">Try another tab, date range or search term.</p>
            {(searchTerm || dateRange.start) && (
                <button
                    onClick={() => {
                        setSearchTerm('');
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
        <DashboardLayout>
            <div className="w-full max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="page-title">
                            {filterParam === 'today' ? 'Today\'s Appointments' : filterParam === 'previous' ? 'Previous Appointments' : filterParam === 'upcoming' ? 'Upcoming Appointments' : 'Active Appointments'}
                        </h1>
                        <p className="page-sub">Monitor and manage all patient-doctor links</p>
                    </div>
                    <Link to="/admin/appointments" className="ui-btn-dark !h-10 !px-4 shrink-0">
                        <Plus className="w-4 h-4" /> New Appointment
                    </Link>
                </div>

                {/* Toolbar: tabs + search + date */}
                <div className="ui-card p-3 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto self-start">
                        {pageTabs.map(t => {
                            const active = (filterParam || null) === t.key;
                            return (
                                <Link
                                    key={t.label}
                                    to={t.to}
                                    className={`h-8 px-3.5 rounded-md text-[13px] font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
                                >
                                    {t.label}
                                    <span className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center tabular-nums ${active ? 'bg-secondary-900 text-white' : 'bg-white text-muted'}`}>
                                        {isLoading ? '–' : t.count}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search patient, doctor or reason"
                                className="ui-input pl-10 pr-9"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
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
                                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
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
                                {isCalendarOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsCalendarOpen(false)}
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
                                                    const isToday = todayStr === dateStr;

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
                                                        setDateRange({ start: todayStr, end: '' });
                                                        setCurrentPage(1);
                                                        setIsCalendarOpen(false);
                                                    }}
                                                    className="text-[13px] font-semibold text-primary-700 hover:underline"
                                                >
                                                    Today
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setDateRange({ start: '', end: '' });
                                                        setCurrentPage(1);
                                                        setIsCalendarOpen(false);
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

                {/* List */}
                <div className="ui-card overflow-hidden mb-6">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="ui-table w-full">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th className="!text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="6"><AppLoader fullScreen={false} compact label="Loading" /></td></tr>
                                ) : !filteredAppointments || filteredAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6">{emptyState}</td>
                                    </tr>
                                ) : (
                                    paginatedAppointments.map((appt) => (
                                        <tr key={appt._id}>
                                            <td className="whitespace-nowrap">{renderDate(appt)}</td>
                                            <td>{renderPatient(appt)}</td>
                                            <td>{renderDoctor(appt)}</td>
                                            <td>
                                                <p className="text-sm text-ink max-w-[220px] truncate" title={appt.reason}>{appt.reason}</p>
                                            </td>
                                            <td>{statusChip(appt.status)}</td>
                                            <td>
                                                <div className="flex items-center justify-end gap-2">
                                                    {renderActions(appt)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-line">
                        {isLoading ? (
                            <AppLoader fullScreen={false} compact label="Loading" />
                        ) : !filteredAppointments || filteredAppointments.length === 0 ? (
                            emptyState
                        ) : (
                            paginatedAppointments.map((appt) => (
                                <div key={appt._id} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        {renderPatient(appt)}
                                        {statusChip(appt.status)}
                                    </div>
                                    {renderDoctor(appt)}
                                    <p className="text-sm text-ink">{appt.reason}</p>
                                    <div className="flex items-center justify-between gap-3 pt-1">
                                        {renderDate(appt)}
                                        <div className="flex items-center gap-2">
                                            {renderActions(appt)}
                                        </div>
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

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null, name: '' })}
                onConfirm={() => deleteMutation.mutate(confirmModal.id)}
                title="Remove Assignment?"
                message={`Are you sure you want to remove the assignment for ${confirmModal.name}? This action cannot be undone.`}
                confirmText="Yes, Remove"
                cancelText="No, Keep It"
                type="danger"
                isLoading={deleteMutation.isPending}
            />

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-2xl p-7 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3">
                                <button onClick={() => setShowShareModal(false)} className="ui-icon-btn">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5">
                                    <Mail className="w-7 h-7 text-primary-600" />
                                </div>
                                <h2 className="text-xl font-bold text-ink mb-1.5">Resend prescription</h2>
                                <p className="text-sm text-muted mb-7 max-w-[280px]">
                                    Send a digital copy to the patient's registered email.
                                </p>

                                <div className="w-full space-y-4 text-left">
                                    <div>
                                        <label className="text-[13px] font-semibold text-ink mb-1.5 block">Patient email</label>
                                        <input
                                            type="email"
                                            value={shareData.email}
                                            onChange={(e) => setShareData({ ...shareData, email: e.target.value })}
                                            className="ui-input !h-11"
                                            placeholder="patient@email.com"
                                        />
                                    </div>

                                    <button
                                        onClick={handleFinalShare}
                                        disabled={shareMutation.isPending}
                                        className="ui-btn-primary !w-full !h-11 !text-sm"
                                    >
                                        {shareMutation.isPending ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Send Now
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout >
    );
};

export default AppointmentList;
