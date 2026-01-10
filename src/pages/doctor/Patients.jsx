import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    Search,
    Calendar,
    Mail,
    Phone,
    ArrowRight,
    ClipboardList,
    FileEdit,
    User,
    Clock,
    Filter,
    Activity,
    Printer,
    Download
} from 'lucide-react';
import { UnifiedDocument } from '../../components/shared/UnifiedDocument';
import { printDocument } from '../../utils/printHelper';
import { doctorApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Plus, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import TablePagination from '../../components/shared/TablePagination';
import { Link } from 'react-router-dom';

const Patients = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [viewDate, setViewDate] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [viewingNote, setViewingNote] = useState(null);
    const [searchParams] = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const { data: patients, isLoading } = useQuery({
        queryKey: ['doctorPatients'],
        queryFn: async () => {
            const res = await doctorApi.getPatients();
            return res.data;
        }
    });

    useEffect(() => {
        const patientId = searchParams.get('id');
        if (patientId && patients) {
            const patient = patients.find(p => p._id === patientId);
            if (patient) {
                setSelectedPatient(patient);
                setIsHistoryModalOpen(true);
            }
        }
    }, [searchParams, patients]);

    useEffect(() => {
        const query = searchParams.get('search');
        if (query) {
            setSearchQuery(query);
        }
    }, [searchParams]);

    const { data: historyData, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['patientHistory', selectedPatient?._id],
        queryFn: async () => {
            const res = await doctorApi.getPatientHistory(selectedPatient._id);
            return res.data;
        },
        enabled: !!selectedPatient && isHistoryModalOpen
    });

    const handleViewHistory = (patient) => {
        setSelectedPatient(patient);
        setIsHistoryModalOpen(true);
    };

    const filteredPatients = patients?.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p._id?.includes(searchQuery);

        if (!dateRange.start) return matchesSearch;

        const patientDate = new Date(p.createdAt).toISOString().split('T')[0];
        let matchesDate = true;

        if (dateRange.start && dateRange.end) {
            matchesDate = patientDate >= dateRange.start && patientDate <= dateRange.end;
        } else if (dateRange.start) {
            matchesDate = patientDate === dateRange.start;
        }

        return matchesSearch && matchesDate;
    }) || [];

    // Pagination Logic
    const totalPages = Math.ceil((filteredPatients?.length || 0) / itemsPerPage);
    const paginatedPatients = filteredPatients?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

    const formatDate = (date) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-GB');
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto py-10 px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 ">
                    <div>
                        <h1 className="text-4xl font-black text-secondary-900 uppercase tracking-tighter">My Patients</h1>
                        <p className="text-slate-500 mt-1 font-medium">Directory of patients under your clinical care</p>
                    </div>
                </div>

                <div className="glass-card mb-8">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-4">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email or ID..."
                                    className="input-field pl-11 py-2 text-sm shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto relative">
                                <button
                                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                    className="px-4 py-2 bg-white rounded-xl border border-slate-100 flex items-center gap-3 w-full sm:w-auto hover:border-primary-200 transition-all cursor-pointer group shadow-sm text-slate-600"
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
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDateRange({ start: '', end: '' });
                                                setCurrentPage(1);
                                            }}
                                            className="ml-1 p-0.5 hover:bg-slate-100 rounded-md transition-colors"
                                        >
                                            <X className="w-3 h-3 text-slate-400" />
                                        </div>
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
                                                        }}
                                                        className="text-[9px] font-black text-slate-400 hover:text-primary-600 uppercase tracking-widest transition-colors"
                                                    >
                                                        Today
                                                    </button>
                                                    <button
                                                        onClick={() => setIsCalendarOpen(false)}
                                                        className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                                                    >
                                                        Done
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                            <Filter className="w-4 h-4" />
                            Total {filteredPatients.length} Patients
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Last Visit</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-8 py-6"><div className="h-4 bg-slate-50 rounded w-32"></div></td>
                                            <td className="px-8 py-6"><div className="h-4 bg-slate-50 rounded w-48"></div></td>
                                            <td className="px-8 py-6"><div className="h-4 bg-slate-50 rounded w-24"></div></td>
                                            <td className="px-8 py-6"><div className="h-4 bg-slate-50 rounded w-20 mx-auto"></div></td>
                                            <td className="px-8 py-6"><div className="h-8 bg-slate-50 rounded w-8 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : filteredPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <Users className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No patients found in your records</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPatients.map((patient) => (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            key={patient._id}
                                            className="hover:bg-slate-50/30 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 font-black text-lg border-2 border-white shadow-sm shrink-0">
                                                        {patient.name?.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <h4 className="text-sm font-black text-secondary-900 uppercase tracking-tight truncate">
                                                            {patient.name}
                                                        </h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            ID: {patient._id?.slice(-8)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                                        <Mail className="w-3.5 h-3.5 text-slate-300" />
                                                        {patient.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                                        <Phone className="w-3.5 h-3.5 text-slate-300" />
                                                        {patient.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-bold text-slate-500">
                                                    {formatDate(patient.createdAt)}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-tighter ${patient.lastVisit
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDate(patient.lastVisit)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <button
                                                    onClick={() => handleViewHistory(patient)}
                                                    className="p-3 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:border-primary-100 hover:text-primary-600 transition-all group-hover:opacity-100 active:scale-95"
                                                >
                                                    <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!isLoading && (
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages || 1}
                            totalItems={filteredPatients?.length || 0}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isHistoryModalOpen && selectedPatient && (
                    <HistoryModal
                        patient={selectedPatient}
                        data={historyData}
                        isLoading={isLoadingHistory}
                        onClose={() => setIsHistoryModalOpen(false)}
                        onViewNote={(apptId) => setViewingNote(apptId)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {viewingNote && (
                    <div className="prescription-modal-root no-print">
                        <PrescriptionModal
                            appointmentId={viewingNote}
                            onClose={() => setViewingNote(null)}
                        />
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

const HistoryModal = ({ patient, data, isLoading, onClose, onViewNote }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary-600 text-2xl font-black">
                            {patient.name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">Clinical Record: {patient.name}</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Full Medical History & Diagnostic Timeline</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-rose-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                            <Activity className="w-12 h-12 text-primary-500 animate-pulse mb-4" />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Syncing Clinical Data...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <section>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-1.5 h-6 bg-primary-500 rounded-full"></div>
                                        <h3 className="text-sm font-black text-secondary-900 uppercase tracking-tighter">Consultation Timeline</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {data?.appointments?.length === 0 ? (
                                            <p className="text-slate-400 text-sm italic py-4">No consultation records found.</p>
                                        ) : (
                                            data?.appointments?.map((appt, i) => (
                                                <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-primary-200 transition-colors">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-black text-secondary-900">{new Date(appt.date).toLocaleDateString('en-GB')}</span>
                                                            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-[8px] font-black uppercase text-slate-400 tracking-tighter">{appt.status}</span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-600">{appt.reason || 'General Symptomatic Review'}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">Physician: Dr. {appt.doctor?.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div
                                                            onClick={() => onViewNote(appt._id)}
                                                            className="flex items-center gap-1.5 text-primary-600 font-bold text-xs uppercase cursor-pointer hover:underline"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />
                                                            View Detailed Note
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                        <h3 className="text-sm font-black text-secondary-900 uppercase tracking-tighter">Prescription History</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {data?.prescriptions?.length === 0 ? (
                                            <p className="text-slate-400 text-sm italic col-span-2">No prescriptions issued.</p>
                                        ) : (
                                            data?.prescriptions?.map((p, i) => (
                                                <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400">{new Date(p.createdAt).toLocaleDateString('en-GB')}</span>
                                                    </div>
                                                    <p className="text-xs font-black text-secondary-900 uppercase mb-1">Total {p.medications?.length} Medications</p>
                                                    <p className="text-[10px] text-slate-500 line-clamp-1">{p.medications?.map(m => m.name).join(', ')}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-8">
                                <section>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-1.5 h-6 bg-secondary-900 rounded-full"></div>
                                        <h3 className="text-sm font-black text-secondary-900 uppercase tracking-tighter">Laboratory Vault</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {data?.reports?.length === 0 ? (
                                            <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No laboratory reports uploaded by patient</p>
                                            </div>
                                        ) : (
                                            data?.reports?.map((r, i) => (
                                                <a
                                                    href={r.fileUrl}
                                                    target="_blank"
                                                    key={i}
                                                    className="block p-4 bg-secondary-900 rounded-2xl text-white group relative overflow-hidden active:scale-95 transition-all"
                                                >
                                                    <div className="relative z-10 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Report File</p>
                                                            <h4 className="text-sm font-black uppercase tracking-tighter leading-tight">{r.title}</h4>
                                                            <p className="text-[12px] font-bold text-slate-500 tracking-widest mt-1 uppercase">{new Date(r.uploadedAt).toLocaleDateString('en-GB')}</p>
                                                        </div>
                                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-secondary-600 to-secondary-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </a>
                                            ))
                                        )}
                                    </div>
                                </section>

                                {/* <div className="p-8 bg-primary-600 rounded-[32px] text-white shadow-xl shadow-primary-500/20 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Next Consultation</h3>
                                        <p className="text-xs text-primary-100 font-medium mb-6">Start a new clinical session with this patient immediately.</p>
                                        <button className="w-full py-4 bg-white text-primary-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg">
                                            Initiate Session
                                        </button>
                                    </div>
                                    <Calendar className="absolute bottom-[-20px] right-[-20px] w-32 h-32 text-white/5 opacity-10 group-hover:rotate-12 transition-transform" />
                                </div> */}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
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

    if (isLoading) return null;

    const { prescription, clinicalDetails } = prescriptionData || {};

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
                className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col no-print"
            >
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <UnifiedDocument
                        data={{
                            ...prescriptionData,
                            appointmentId,
                            createdAt: prescriptionData.prescription?.createdAt
                        }}
                        type="prescription"
                    />
                </div>

                <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-between shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 border border-slate-200 rounded-[20px] text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Close Registry
                    </button>
                    <button
                        onClick={() => printDocument({
                            ...prescriptionData,
                            appointmentId,
                            createdAt: prescriptionData.prescription?.createdAt
                        }, 'prescription')}
                        className="px-10 py-4 bg-secondary-900 text-white rounded-[20px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-secondary-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3"
                    >
                        <Printer className="w-4 h-4 text-primary-400" />
                        Print Record
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Patients;
