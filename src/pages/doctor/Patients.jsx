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
import AppLoader from '../../components/shared/AppLoader';
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

    const todayStr = getLocalDateString(new Date());

    const initialsOf = (name) =>
        (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    const renderPatient = (patient) => (
        <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                {initialsOf(patient.name)}
            </div>
            <div className="min-w-0">
                <h4 className="text-sm font-semibold text-ink truncate group-hover:text-primary-700 transition-colors">
                    {patient.name}
                </h4>
                <p className="text-[13px] text-muted mt-0.5 truncate">
                    #{patient.displayId || patient._id?.slice(-8)}
                    {(patient.age || patient.gender) && (
                        <span className="text-subtle">
                            {' · '}
                            {[
                                patient.age ? `${patient.age} Y` : null,
                                patient.gender
                            ].filter(Boolean).join(' / ')}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );

    const renderContact = (patient) => (
        <div className="space-y-1 min-w-0">
            <p className="flex items-center gap-2 text-sm text-ink truncate">
                <Mail className="w-3.5 h-3.5 text-subtle shrink-0" />
                <span className="truncate">{patient.email || <span className="text-subtle">–</span>}</span>
            </p>
            <p className="flex items-center gap-2 text-sm text-ink tabular-nums">
                <Phone className="w-3.5 h-3.5 text-subtle shrink-0" />
                {patient.phone || <span className="text-subtle">–</span>}
            </p>
        </div>
    );

    const lastVisitChip = (patient) => (
        <span className={`ui-chip ${patient.lastVisit ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-muted border-line'}`}>
            <Clock className="w-3 h-3" />
            {formatDate(patient.lastVisit)}
        </span>
    );

    const emptyState = (
        <div className="py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-subtle" />
            </div>
            <p className="text-base font-semibold text-ink">No patients found in your records</p>
            <p className="text-sm text-muted mt-1">Try a different search term or date range.</p>
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
        <DashboardLayout>
            <div className="w-full max-w-[1600px] mx-auto">
                <div className="mb-5">
                    <h1 className="page-title">My Patients</h1>
                    <p className="page-sub">Directory of patients under your clinical care</p>
                </div>

                {/* Toolbar */}
                <div className="ui-card p-3 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 px-1">
                        <span className="text-2xl font-bold text-ink tabular-nums leading-none">{isLoading ? '–' : filteredPatients.length}</span>
                        <span className="text-sm text-muted">{filteredPatients.length === 1 ? 'patient' : 'patients'}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, email or ID"
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

                <div className="ui-card overflow-hidden mb-6">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="ui-table w-full">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Contact</th>
                                    <th>Registered</th>
                                    <th>Last visit</th>
                                    <th className="!text-right">Record</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="5"><AppLoader fullScreen={false} compact label="Loading" /></td></tr>
                                ) : filteredPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">{emptyState}</td>
                                    </tr>
                                ) : (
                                    paginatedPatients.map((patient) => (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            key={patient._id}
                                            onClick={() => handleViewHistory(patient)}
                                            className="group cursor-pointer"
                                        >
                                            <td>{renderPatient(patient)}</td>
                                            <td>{renderContact(patient)}</td>
                                            <td className="whitespace-nowrap">
                                                <p className="text-sm text-ink tabular-nums">{formatDate(patient.createdAt)}</p>
                                            </td>
                                            <td>{lastVisitChip(patient)}</td>
                                            <td>
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewHistory(patient);
                                                        }}
                                                        className="ui-btn-soft"
                                                        title="View Prescriptions & Clinical Record"
                                                    >
                                                        View record <ArrowRight className="w-4 h-4" />
                                                    </button>
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
                        ) : filteredPatients.length === 0 ? (
                            emptyState
                        ) : (
                            paginatedPatients.map((patient) => (
                                <div key={patient._id} onClick={() => handleViewHistory(patient)} className="p-4 space-y-3 group cursor-pointer active:bg-slate-50">
                                    <div className="flex items-start justify-between gap-3">
                                        {renderPatient(patient)}
                                        {lastVisitChip(patient)}
                                    </div>
                                    {renderContact(patient)}
                                    <p className="text-[13px] text-muted">Registered {formatDate(patient.createdAt)}</p>
                                </div>
                            ))
                        )}
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
