import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import { getUnifiedDocumentHTML } from '../../utils/documentGenerator';
import { printDocument } from '../../utils/printHelper';
import { matchesPatientQuery } from '../../utils/searchUtils';
import { doctorApi } from '../../services/api';
import { getLocalDateString, formatDateDisplay } from '../../utils/documentUtils';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Plus, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import TablePagination from '../../components/shared/TablePagination';
import { Link } from 'react-router-dom';

const Patients = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [viewDate, setViewDate] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [searchParams] = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

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
            const patient = patients.find(p => p._id === patientId || p.displayId?.toLowerCase() === patientId.toLowerCase());
            if (patient) {
                navigate(`/doctor/patients/${patient._id}`, { replace: true });
            }
        }
    }, [searchParams, patients, navigate]);

    useEffect(() => {
        const query = searchParams.get('search');
        if (query) {
            setSearchQuery(query);
        }
    }, [searchParams]);

    const handleViewHistory = (patient) => {
        navigate(`/doctor/patients/${patient._id}`);
    };

    const filteredPatients = patients?.filter(p => {
        const matchesSearch = matchesPatientQuery(p, searchQuery);

        if (!dateRange.start) return matchesSearch;

        let matchesDate = false;
        try {
            const checkInRange = (dateVal) => {
                if (!dateVal) return false;
                const dateStr = getLocalDateString(dateVal);
                if (!dateStr) return false;
                if (dateRange.start && dateRange.end) {
                    return dateStr >= dateRange.start && dateStr <= dateRange.end;
                } else if (dateRange.start) {
                    return dateStr === dateRange.start;
                }
                return false;
            };

            matchesDate = checkInRange(p.createdAt) || checkInRange(p.lastVisit);
        } catch {
            matchesDate = false;
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                    <div>
                        <h1 className="text-4xl font-black text-secondary-900 uppercase tracking-tighter">My Patients</h1>
                        <p className="text-slate-500 mt-1 font-medium">Directory of patients under your clinical care</p>
                    </div>

                    {/* Search and Date Filter at right end */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, email or ID..."
                                className="input-field pl-11 pr-10 py-2 text-xs shadow-sm w-full bg-white"
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Clear search"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto relative">
                            <button
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                className="px-4 py-2 bg-white rounded-xl border border-slate-100 flex items-center gap-3 w-full sm:w-auto hover:border-primary-200 transition-all cursor-pointer group shadow-sm text-slate-600"
                            >
                                <Calendar className={`w-4 h-4 ${dateRange.start ? 'text-primary-500' : 'text-slate-400 group-hover:text-primary-400'}`} />
                                <span className={`text-xs font-bold ${dateRange.start ? 'text-secondary-900' : 'text-slate-400'}`}>
                                    {dateRange.start && dateRange.end ? (
                                        `${formatDateDisplay(dateRange.start, { day: '2-digit', month: 'short' })} - ${formatDateDisplay(dateRange.end, { day: '2-digit', month: 'short' })}`
                                    ) : dateRange.start ? (
                                        formatDateDisplay(dateRange.start, { day: '2-digit', month: 'short', year: 'numeric' })
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
                                            className="absolute top-full right-0 mt-3 z-50 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 min-w-[320px]"
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
                                                    const isToday = getLocalDateString(new Date()) === dateStr;

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
                                                        const today = getLocalDateString(new Date());
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

                <div className="flex items-center justify-end mb-4 px-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                        <Filter className="w-4 h-4" />
                        Total {filteredPatients.length} Patients
                    </div>
                </div>

                <div className="glass-card mb-8 overflow-hidden">
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
                                            onClick={() => handleViewHistory(patient)}
                                            className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 font-black text-lg border-2 border-white shadow-sm shrink-0">
                                                        {patient.name?.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <h4 className="text-sm font-black text-secondary-900 uppercase tracking-tight truncate group-hover:text-primary-600 transition-colors">
                                                            {patient.name}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                            <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                                                                #{patient.displayId || patient._id?.slice(-8)}
                                                            </p>
                                                            {(patient.age || patient.gender) && (
                                                                <>
                                                                    <span className="text-slate-300 text-[10px]">•</span>
                                                                    <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded-md border border-primary-100/60 uppercase">
                                                                        {[
                                                                            patient.age ? `${patient.age} Y` : null,
                                                                            patient.gender
                                                                        ].filter(Boolean).join(' / ')}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewHistory(patient);
                                                    }}
                                                    className="p-3 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:border-primary-200 hover:text-primary-600 hover:shadow-sm transition-all group-hover:opacity-100 active:scale-95"
                                                    title="View Prescriptions & Clinical Record"
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
        </DashboardLayout>
    );
};

export default Patients;
