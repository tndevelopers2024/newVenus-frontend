import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { adminApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TablePagination from '../../components/shared/TablePagination';
import {
    Shield,
    Activity,
    User,
    Calendar,
    Globe,
    Info,
    Search,
    Filter,
    Download,
    Eye,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SystemLogs = () => {
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [viewingLog, setViewingLog] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get('search');
        if (query) {
            setSearchTerm(query);
            setCurrentPage(1);
        }
    }, [location.search]);

    const { data: logs, isLoading } = useQuery({
        queryKey: ['adminLogs'],
        queryFn: async () => {
            const res = await adminApi.getAuditLogs();
            return res.data;
        }
    });

    const matchesType = (log, type) =>
        type === 'All' ||
        (type === 'Security' && (log.action === 'Login' || log.action === 'Logout' || log.action === 'Login Failed')) ||
        (type === 'Clinical' && (log.action.includes('Prescription') || log.action.includes('Appointment'))) ||
        (type === 'System' && (log.action.includes('User') || log.action.includes('Doctor') || log.action.includes('Patient')));

    const filteredLogs = logs?.filter(log => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTypeFilter = matchesType(log, filterType);

        return matchesSearch && matchesTypeFilter;
    });

    // Pagination Logic
    const totalPages = Math.ceil((filteredLogs?.length || 0) / itemsPerPage);
    const paginatedLogs = filteredLogs?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (newSize) => {
        setItemsPerPage(newSize);
        setCurrentPage(1);
    };

    const handleExportCSV = () => {
        if (!filteredLogs?.length) return;

        const headers = ["Date", "Time", "User", "Role", "Activity Class", "Resource", "Details"];
        const rows = filteredLogs.map(log => [
            new Date(log.createdAt).toLocaleDateString('en-GB'),
            new Date(log.createdAt).toLocaleTimeString('en-GB'),
            log.user?.name || 'System Engine',
            log.user?.role || 'Service Instance',
            log.action,
            log.resource,
            log.details?.replace(/,/g, ';') || ''
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const tabs = ['All', 'Security', 'Clinical', 'System'];
    const tabCounts = Object.fromEntries(tabs.map(t => [t, (logs || []).filter(l => matchesType(l, t)).length]));

    const actionChipClass = (action) =>
        action.includes('Delete') || action.includes('Cancel') || action.includes('Failed') ? 'bg-rose-50 text-rose-600 border-rose-200' :
            action.includes('Create') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                action.includes('Login') || action.includes('Logout') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-primary-50 text-primary-700 border-primary-100';

    const roleDot = (role) =>
        role === 'superadmin' ? 'bg-rose-500' : role === 'admin' ? 'bg-amber-500' : role === 'doctor' ? 'bg-primary-500' : 'bg-emerald-500';

    const renderTime = (log) => (
        <div>
            <p className="text-sm font-semibold text-ink tabular-nums">
                {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[13px] text-muted tabular-nums mt-0.5">{new Date(log.createdAt).toLocaleDateString('en-GB')}</p>
        </div>
    );

    const renderUser = (log) => (
        <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-muted shrink-0">
                {log.user?.name?.slice(0, 2).toUpperCase() || 'SYS'}
            </div>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{log.user?.name || 'System Engine'}</p>
                <p className="text-[13px] text-muted flex items-center gap-1.5 capitalize">
                    <span className={`w-1.5 h-1.5 rounded-full ${roleDot(log.user?.role)}`} />
                    {log.user?.role || 'Service Instance'}
                </p>
            </div>
        </div>
    );

    const emptyState = (
        <div className="py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Info className="w-7 h-7 text-subtle" />
            </div>
            <p className="text-base font-semibold text-ink">No events found</p>
            <p className="text-sm text-muted mt-1">No security events match your current filter.</p>
            {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="ui-btn-outline mt-5">
                    Clear search
                </button>
            )}
        </div>
    );

    return (
        <DashboardLayout>
            <div className="w-full max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-secondary-900 rounded-xl flex items-center justify-center text-white shrink-0">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="page-title">Registry Audit</h1>
                            <p className="page-sub !mt-0.5 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                                Immutable system activity and security tracking
                            </p>
                        </div>
                    </div>
                    <button onClick={handleExportCSV} className="ui-btn-dark !h-10 !px-4 shrink-0 self-start md:self-auto">
                        <Download className="w-4 h-4" />
                        Export record
                    </button>
                </div>

                {/* Toolbar */}
                <div className="ui-card p-3 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto self-start max-w-full">
                        {tabs.map((type) => {
                            const active = filterType === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setFilterType(type);
                                        setCurrentPage(1);
                                    }}
                                    className={`h-8 px-3.5 rounded-md text-[13px] font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
                                >
                                    {type}
                                    <span className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center tabular-nums ${active ? 'bg-secondary-900 text-white' : 'bg-white text-muted'}`}>
                                        {isLoading ? '–' : tabCounts[type]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by user, action or record"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="ui-input pl-10 pr-9"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    setCurrentPage(1);
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-md text-subtle hover:text-ink transition-colors"
                                title="Clear search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="ui-card overflow-hidden mb-6">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="ui-table w-full">
                            <thead>
                                <tr>
                                    <th>Event time</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Resource</th>
                                    <th>Details</th>
                                    <th className="!text-right">Metadata</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td><div className="h-9 w-24 bg-slate-100 rounded-md"></div></td>
                                            <td><div className="flex items-center gap-3"><div className="h-9 w-9 bg-slate-100 rounded-full"></div><div className="h-9 w-32 bg-slate-100 rounded-md"></div></div></td>
                                            <td><div className="h-6 w-24 bg-slate-100 rounded-full"></div></td>
                                            <td><div className="h-5 w-24 bg-slate-100 rounded-md"></div></td>
                                            <td><div className="h-5 w-56 bg-slate-100 rounded-md"></div></td>
                                            <td><div className="h-9 w-20 bg-slate-100 rounded-lg ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : !paginatedLogs || paginatedLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6">{emptyState}</td>
                                    </tr>
                                ) : (
                                    paginatedLogs.map((log) => (
                                        <tr key={log._id}>
                                            <td className="whitespace-nowrap">{renderTime(log)}</td>
                                            <td>{renderUser(log)}</td>
                                            <td>
                                                <span className={`ui-chip ${actionChipClass(log.action)}`}>{log.action}</span>
                                            </td>
                                            <td>
                                                <span className="text-sm text-ink">{log.resource}</span>
                                            </td>
                                            <td>
                                                <p className="text-sm text-muted max-w-[340px] truncate" title={log.details}>{log.details || '–'}</p>
                                            </td>
                                            <td>
                                                <div className="flex justify-end">
                                                    <button onClick={() => setViewingLog(log)} className="ui-btn-outline !h-8 !px-3">
                                                        <Eye className="w-4 h-4" /> View
                                                    </button>
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
                            [1, 2, 3].map(i => (
                                <div key={i} className="p-4 animate-pulse space-y-3">
                                    <div className="h-9 w-48 bg-slate-100 rounded-md"></div>
                                    <div className="h-5 w-32 bg-slate-100 rounded-md"></div>
                                </div>
                            ))
                        ) : !paginatedLogs || paginatedLogs.length === 0 ? (
                            emptyState
                        ) : (
                            paginatedLogs.map((log) => (
                                <div key={log._id} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        {renderUser(log)}
                                        <span className={`ui-chip shrink-0 ${actionChipClass(log.action)}`}>{log.action}</span>
                                    </div>
                                    <p className="text-sm text-ink">{log.resource}{log.details ? <span className="text-muted"> · {log.details}</span> : null}</p>
                                    <div className="flex items-center justify-between gap-3">
                                        {renderTime(log)}
                                        <button onClick={() => setViewingLog(log)} className="ui-btn-outline !h-8 !px-3">
                                            <Eye className="w-4 h-4" /> View
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {!isLoading && <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredLogs?.length || 0}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />}
                </div>
            </div>

            <AnimatePresence>
                {viewingLog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingLog(null)}
                            className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 16 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-700">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-ink leading-tight">Event metadata</h3>
                                        <span className={`ui-chip !h-5 !text-[11px] mt-1 ${actionChipClass(viewingLog.action)}`}>{viewingLog.action}</span>
                                    </div>
                                </div>
                                <button onClick={() => setViewingLog(null)} className="ui-icon-btn">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-line">
                                    <p className="label-caps mb-1.5">Activity detail</p>
                                    <p className="text-sm text-ink leading-relaxed">{viewingLog.details || '–'}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3.5 border border-line rounded-xl">
                                        <p className="label-caps mb-1">User</p>
                                        <p className="text-sm font-semibold text-ink">{viewingLog.user?.name || 'System Engine'}</p>
                                    </div>
                                    <div className="p-3.5 border border-line rounded-xl">
                                        <p className="label-caps mb-1">Resource</p>
                                        <p className="text-sm font-semibold text-ink">{viewingLog.resource}</p>
                                    </div>
                                    <div className="p-3.5 border border-line rounded-xl col-span-2">
                                        <p className="label-caps mb-1">Timestamp</p>
                                        <p className="text-sm font-semibold text-ink tabular-nums">{new Date(viewingLog.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-line flex justify-end">
                                <button onClick={() => setViewingLog(null)} className="ui-btn-dark !h-10 !px-6">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </DashboardLayout>
    );
};

export default SystemLogs;
