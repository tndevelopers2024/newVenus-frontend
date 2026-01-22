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
    XCircle,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SystemLogs = () => {
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
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

    const filteredLogs = logs?.filter(log => {
        const matchesSearch =
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'All' ||
            (filterType === 'Security' && (log.action === 'Login' || log.action === 'Logout' || log.action === 'Login Failed')) ||
            (filterType === 'Clinical' && (log.action.includes('Prescription') || log.action.includes('Appointment'))) ||
            (filterType === 'System' && (log.action.includes('User') || log.action.includes('Doctor') || log.action.includes('Patient')));

        return matchesSearch && matchesType;
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

    return (
        <DashboardLayout>
            <div className="max-w-8xl mx-auto py-2 px-4">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
                                <Shield className="w-6 h-6" />
                            </div>
                            Registry Audit
                        </h1>
                        <p className="text-slate-500 mt-2 font-bold flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            Immutable system activity and security tracking
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
                            {['All', 'Security', 'Clinical', 'System'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setFilterType(type);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type
                                        ? 'bg-white text-secondary-900 shadow-md'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="glass-card overflow-hidden shadow-2xl border border-slate-100/50">
                    <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/50 backdrop-blur-md">
                        <div className="flex flex-1 items-center gap-4">
                            <div className="flex-1 max-w-md px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 group focus-within:bg-white focus-within:border-primary-400 transition-all">
                                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-primary-500" />
                                <input
                                    type="text"
                                    placeholder="Search by user, action, or clinical records..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent border-none outline-none text-xs font-bold w-full text-secondary-900 placeholder:text-slate-300"
                                />
                                {searchTerm && (
                                    <button onClick={() => {
                                        setSearchTerm('');
                                        setCurrentPage(1);
                                    }}>
                                        <XCircle className="w-4 h-4 text-slate-300 hover:text-rose-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExportCSV}
                                className="px-8 py-3 bg-secondary-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-secondary-200 active:scale-95"
                            >
                                <Download className="w-4 h-4 text-primary-400" />
                                Export Intelligence
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5">Event Time</th>
                                    <th className="px-8 py-5">Principal Agent</th>
                                    <th className="px-8 py-5">Activity Class</th>
                                    <th className="px-8 py-5">Target Resource</th>
                                    <th className="px-8 py-5 text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-8 py-10">
                                                <div className="h-4 bg-slate-100 rounded-full w-full opacity-50"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredLogs?.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-32 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-6 text-slate-200">
                                                <Info className="w-10 h-10" />
                                            </div>
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest ">Cipher Stream Empty</p>
                                            <p className="text-xs text-slate-300 mt-1 font-bold">No security events match your current filter parameters</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedLogs?.map((log, index) => (
                                        <tr key={log._id} className="hover:bg-slate-50/80 transition-all group border-l-4 border-l-transparent hover:border-l-primary-500">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-secondary-900">
                                                        {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {new Date(log.createdAt).toLocaleDateString('en-GB')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:border-primary-200 group-hover:text-primary-600 transition-all shadow-sm">
                                                        {log.user?.name?.slice(0, 2).toUpperCase() || 'SYS'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-secondary-900 uppercase tracking-tight">{log.user?.name || 'System Engine'}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${log.user?.role === 'superadmin' ? 'bg-rose-500' :
                                                                log.user?.role === 'doctor' ? 'bg-primary-500' : 'bg-emerald-500'
                                                                }`} />
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.user?.role || 'Service Instance'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider w-fit shadow-sm ${log.action.includes('Delete') || log.action.includes('Cancel') ? 'bg-rose-100 text-rose-700' :
                                                        log.action.includes('Create') ? 'bg-emerald-100 text-emerald-700' :
                                                            log.action.includes('Login') ? 'bg-amber-100 text-amber-700' :
                                                                'bg-primary-100 text-primary-700'
                                                        }`}>
                                                        {log.action}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <Activity className="w-3.5 h-3.5 text-slate-300" />
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{log.resource}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <button
                                                    onClick={() => setViewingLog(log)}
                                                    className="flex items-center gap-2 justify-end text-slate-300 hover:text-primary-500 transition-colors group/metadata ml-auto"
                                                >
                                                    <Info className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Metadata</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                                            <Shield className="w-6 h-6 text-primary-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-secondary-900 uppercase tracking-tighter">Event Metadata</h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setViewingLog(null)}
                                        className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-secondary-900 transition-all active:scale-95"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Activity Detail</div>
                                        <p className="text-sm font-bold text-secondary-900 leading-relaxed">
                                            {viewingLog.details}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Principal</div>
                                            <p className="text-xs font-black text-secondary-900">{viewingLog.user?.name || 'System Engine'}</p>
                                        </div>
                                        <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Activity Class</div>
                                            <p className="text-xs font-black text-secondary-900 uppercase tracking-tighter">{viewingLog.action}</p>
                                        </div>
                                        <div className="p-4 bg-white border border-slate-100 rounded-2xl col-span-2 text-center">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timestamp</div>
                                            <p className="text-xs font-black text-secondary-900">{new Date(viewingLog.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => setViewingLog(null)}
                                        className="px-8 py-3 bg-secondary-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-secondary-100 active:scale-95"
                                    >
                                        Close Record
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </DashboardLayout>
    );
};

export default SystemLogs;
