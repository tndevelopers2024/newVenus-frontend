import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, doctorApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
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
    Edit2
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
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareData, setShareData] = useState({ id: '', email: '' });
    const [editingDateId, setEditingDateId] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [editViewDate, setEditViewDate] = useState(new Date());
    const [isEditDatePickerOpen, setIsEditDatePickerOpen] = useState(false);
    const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

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
        const apptDate = new Date(apptDateStr).toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];

        let matchesDate = true;
        if (filterParam === 'today') {
            matchesDate = apptDate === todayStr;
        } else if (filterParam === 'previous') {
            matchesDate = apptDate < todayStr;
        } else if (filterParam === 'upcoming') {
            matchesDate = apptDate > todayStr;
        } else {
            if (dateRange.start && dateRange.end) {
                matchesDate = apptDate >= dateRange.start && apptDate <= dateRange.end;
            } else if (dateRange.start) {
                matchesDate = apptDate === dateRange.start;
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

    return (
        <DashboardLayout>
            <div className="max-w-8xl mx-auto py-0 px-4">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-primary-500" />
                            {filterParam === 'today' ? 'Today Appointments' : filterParam === 'previous' ? 'Previous Appointments' : filterParam === 'upcoming' ? 'Upcoming Appointments' : 'Active Appointments'}
                        </h1>
                        <p className="text-slate-500 mt-1 font-bold">Monitor and manage all patient-doctor links</p>
                    </div>
                    <Link to="/admin/appointments" className="px-6 py-3 bg-secondary-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-primary-600 transition-all flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> New Appointment
                    </Link>
                </div>

                <div className="glass-card shadow-2xl">
                    <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/30 rounded-t-[2.5rem]">
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                            <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 flex items-center gap-3 w-full sm:w-auto">
                                <Search className="w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search assignments..."
                                    className="bg-transparent border-none outline-none text-xs font-bold w-full sm:w-48"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                    className="px-4 py-2 bg-white rounded-xl border border-slate-100 flex items-center gap-3 w-full sm:w-auto hover:border-primary-200 transition-all cursor-pointer group"
                                >
                                    <Calendar className={`w-4 h-4 ${dateRange.start ? 'text-primary-500' : 'text-slate-400 group-hover:text-primary-400'}`} />
                                    <span className={`text-xs font-bold ${dateRange.start ? 'text-secondary-900' : 'text-slate-400'}`}>
                                        {dateRange.start && dateRange.end ? (
                                            `${new Date(dateRange.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${new Date(dateRange.end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                                        ) : dateRange.start ? (
                                            new Date(dateRange.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                        ) : 'Filter by Date'}
                                    </span>
                                    {dateRange.start && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDateRange({ start: '', end: '' });
                                                setCurrentPage(1);
                                            }}
                                            className="ml-1 p-0.5 hover:bg-slate-100 rounded-md transition-colors"
                                        >
                                            <X className="w-3 h-3 text-slate-400" />
                                        </button>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isCalendarOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsCalendarOpen(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute top-full left-0 mt-3 z-50 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 min-w-[320px]"
                                            >
                                                <div className="flex items-center justify-between mb-6">
                                                    <h4 className="text-[10px] font-black text-secondary-900 uppercase tracking-widest">
                                                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                                            className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-secondary-900"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                                            className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-secondary-900"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-7 gap-1 mb-2">
                                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                                        <div key={day} className="text-center text-[9px] font-black text-slate-300 uppercase py-2">
                                                            {day}
                                                        </div>
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
                                                        const isToday = new Date().toISOString().split('T')[0] === dateStr;

                                                        return (
                                                            <button
                                                                key={day}
                                                                onClick={() => handleDateClick(dateStr)}
                                                                className={`
                                                                    aspect-square flex items-center justify-center rounded-xl text-[10px] font-black transition-all relative
                                                                    ${isStart || isEnd
                                                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 z-10'
                                                                        : isInRange
                                                                            ? 'bg-primary-50 text-primary-600 rounded-none first:rounded-l-xl last:rounded-r-xl'
                                                                            : isToday
                                                                                ? 'bg-slate-50 text-primary-600 border border-primary-100'
                                                                                : 'hover:bg-slate-50 text-secondary-900'
                                                                    }
                                                                `}
                                                            >
                                                                {day}
                                                                {isInRange && (
                                                                    <div className="absolute inset-x-[-2px] h-full bg-primary-50 -z-1" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                    <button
                                                        onClick={() => {
                                                            const today = new Date().toISOString().split('T')[0];
                                                            setDateRange({ start: today, end: '' });
                                                            setCurrentPage(1);
                                                            setIsCalendarOpen(false);
                                                        }}
                                                        className="text-[9px] font-black text-primary-600 uppercase tracking-widest hover:underline"
                                                    >
                                                        Today
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDateRange({ start: '', end: '' });
                                                            setCurrentPage(1);
                                                            setIsCalendarOpen(false);
                                                        }}
                                                        className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                                                    >
                                                        Clear Filter
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5">Patient</th>
                                    <th className="px-8 py-5">Assigned Doctor</th>
                                    <th className="px-8 py-5 w-48">Reason</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5">Date Assigned</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="6" className="px-8 py-6 h-16 bg-white/50"></td>
                                        </tr>
                                    ))
                                ) : !filteredAppointments || filteredAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-20 text-center">
                                            <AlertCircle className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest ">No active assignments found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAppointments.map((appt) => (
                                        <tr key={appt._id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-[10px] font-black text-primary-600">
                                                        {appt.patient?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-secondary-900 uppercase">{appt.patient?.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{appt.patient?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-[10px] font-black text-emerald-600">
                                                        DR
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-secondary-900 uppercase">{appt.doctor?.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">Specialist</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-xs text-slate-600 font-bold max-w-48 truncate" title={appt.reason}>{appt.reason}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${appt.status === 'Accepted' ? 'bg-emerald-100 text-emerald-600' :
                                                    appt.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {appt.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                {editingDateId === appt._id ? (
                                                    <div className="relative flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                                                        <button
                                                            onClick={(e) => {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setPopupPos({ top: rect.bottom + 8, left: rect.left });
                                                                setIsEditDatePickerOpen(!isEditDatePickerOpen);
                                                            }}
                                                            className="px-3 py-1.5 text-xs font-bold text-secondary-900 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl outline-none transition-all cursor-pointer hover:bg-slate-100 flex items-center gap-2"
                                                        >
                                                            <Calendar className="w-3.5 h-3.5 text-primary-500" />
                                                            {newDate ? new Date(newDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}
                                                        </button>
                                                        
                                                        {createPortal(
                                                            <AnimatePresence>
                                                                {isEditDatePickerOpen && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-[90]" onClick={() => setIsEditDatePickerOpen(false)} />
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                            style={{ top: popupPos.top, left: popupPos.left }}
                                                                            className="fixed z-[100] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 w-[280px]"
                                                                        >
                                                                            <div className="flex items-center justify-between mb-4">
                                                                                <h4 className="text-[10px] font-black text-secondary-900 uppercase tracking-widest">
                                                                                    {editViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                                                </h4>
                                                                                <div className="flex gap-2">
                                                                                    <button onClick={() => setEditViewDate(new Date(editViewDate.getFullYear(), editViewDate.getMonth() - 1, 1))} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400">
                                                                                        <ChevronLeft className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button onClick={() => setEditViewDate(new Date(editViewDate.getFullYear(), editViewDate.getMonth() + 1, 1))} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400">
                                                                                        <ChevronRight className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <div className="grid grid-cols-7 gap-1 mb-2">
                                                                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                                                                    <div key={day} className="text-center text-[9px] font-black text-slate-300 uppercase py-1">{day}</div>
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
                                                                                            key={day}
                                                                                            onClick={() => {
                                                                                                setNewDate(dateStr);
                                                                                                setIsEditDatePickerOpen(false);
                                                                                            }}
                                                                                            className={`aspect-square flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${isSelected ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-slate-50 text-secondary-900'}`}
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
                                                            onClick={() => handleDateUpdate(appt._id)}
                                                            disabled={updateDateMutation.isPending}
                                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm"
                                                            title="Save Date"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingDateId(null)}
                                                            className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors shadow-sm"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 group/date cursor-pointer" onClick={() => {
                                                        if(appt.status !== 'Completed') {
                                                            setEditingDateId(appt._id);
                                                            setNewDate(appt.date ? new Date(appt.date).toISOString().split('T')[0] : new Date(appt.createdAt).toISOString().split('T')[0]);
                                                            setEditViewDate(new Date(appt.date || appt.createdAt));
                                                            setIsEditDatePickerOpen(true);
                                                        }
                                                    }}>
                                                        <p className="text-xs font-bold text-slate-500">
                                                            {appt.date ? new Date(appt.date).toLocaleDateString('en-GB') : new Date(appt.createdAt).toLocaleDateString('en-GB')}
                                                        </p>
                                                        {appt.status !== 'Completed' && (
                                                            <Edit2 className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover/date:opacity-100 transition-opacity hover:text-primary-500" />
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {appt.status !== 'Completed' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <label className={`p-2 text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer ${uploadPrescriptionMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`} title="Upload Handwritten Prescription">
                                                            <UploadCloud className="w-5 h-5" />
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, appt)} />
                                                        </label>
                                                        <button
                                                            onClick={() => setConfirmModal({ isOpen: true, id: appt._id, name: appt.patient?.name })}
                                                            disabled={deleteMutation.isPending}
                                                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors disabled:opacity-50"
                                                            title="Remove Assignment"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleShareClick(appt)}
                                                            className="w-9 h-9 flex items-center justify-center text-secondary-400 bg-secondary-50 hover:bg-primary-100 hover:text-primary-600 transition-colors rounded-xl"
                                                            title="Share to Email"
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePrint(appt)}
                                                            className="p-2 text-[14px] flex items-center justify-center text-primary-900 bg-primary-100 hover:bg-primary-50 hover:text-primary-700 transition-colors rounded-xl"
                                                            title="Print Prescription"
                                                        >
                                                            {/* <Printer className="w-4 h-4" /> */}
                                                            Print Prescription
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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
                            className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-primary-50 rounded-[22px] flex items-center justify-center mb-6">
                                    <Mail className="w-8 h-8 text-primary-600" />
                                </div>
                                <h2 className="text-xl font-black text-secondary-900 uppercase tracking-tight mb-2">Resend Prescription</h2>
                                <p className="text-sm text-slate-500 mb-8 max-w-[280px]">
                                    Send a digital copy to the patient's registered email.
                                </p>

                                <div className="w-full space-y-4 text-left">
                                    <div>
                                        <label className="text-[10px] font-black text-secondary-900 uppercase tracking-widest mb-1.5 ml-1 block">Patient Email</label>
                                        <input
                                            type="email"
                                            value={shareData.email}
                                            onChange={(e) => setShareData({ ...shareData, email: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-secondary-900"
                                            placeholder="patient@email.com"
                                        />
                                    </div>

                                    <button
                                        onClick={handleFinalShare}
                                        disabled={shareMutation.isPending}
                                        className="w-full py-5 bg-primary-600 text-white rounded-[20px] font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
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
