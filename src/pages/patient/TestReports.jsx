import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    History as HistoryIcon,
    Upload,
    ClipboardList,
    Search,
    FileText,
    Download,
    Eye,
    X,
    Plus,
    Activity,
    BrainCircuit,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { patientApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TablePagination from '../../components/shared/TablePagination';

const TestReports = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadData, setUploadData] = useState({ title: '', file: null });
    const fileInputRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const { data: historyData, isLoading } = useQuery({
        queryKey: ['patientHistoryReports'],
        queryFn: async () => {
            const res = await patientApi.getHistory();
            return res.data;
        }
    });

    const uploadMutation = useMutation({
        mutationFn: (data) => patientApi.uploadReport(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['patientHistoryReports']);
            setIsUploadModalOpen(false);
            setUploadData({ title: '', file: null });
        }
    });

    const patientLinks = [
        { label: 'Dashboard', path: '/patient', icon: ClipboardList },
        { label: 'Medical History', path: '/patient/history', icon: HistoryIcon },
        { label: 'Test Reports', path: '/patient/reports', icon: Upload },
    ];

    const filteredReports = historyData?.reports?.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).reverse() || [];

    // Pagination Logic
    const totalPages = Math.ceil((filteredReports?.length || 0) / itemsPerPage);
    const paginatedReports = filteredReports?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (newSize) => {
        setItemsPerPage(newSize);
        setCurrentPage(1);
    };

    const handleUpload = (e) => {
        e.preventDefault();
        if (!uploadData.title || !uploadData.file) return;

        const formData = new FormData();
        formData.append('title', uploadData.title);
        formData.append('report', uploadData.file);

        uploadMutation.mutate(formData);
    };

    return (
        <DashboardLayout links={patientLinks}>
            <div className="max-w-7xl mx-auto py-10 px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 ">
                    <div>
                        <h1 className="text-4xl font-black text-secondary-900 uppercase tracking-tighter">Diagnostic Vault</h1>
                        <p className="text-slate-500 mt-1 font-medium">Secure Digital Repository for Laboratory Results</p>
                    </div>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="btn-primary flex items-center justify-center gap-2 px-8 py-4 shadow-xl shadow-primary-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Upload New Report
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-8 mb-12">
                    <div className="w-full">
                        <div className="glass-card overflow-hidden shadow-2xl border-t-4 border-t-amber-500">
                            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search reports by title..."
                                        className="input-field pl-11 py-2 text-sm shadow-sm"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                    {filteredReports.length} Digital Records
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-6">Report Title / Type</th>
                                            <th className="px-8 py-6">Upload Date</th>
                                            <th className="px-8 py-6">AI processing</th>
                                            <th className="px-8 py-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {isLoading ? (
                                            [1, 2, 3].map(i => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan="4" className="px-8 py-6"><div className="h-4 bg-slate-50 rounded-full w-full"></div></td>
                                                </tr>
                                            ))
                                        ) : filteredReports.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-20 text-center">
                                                    <FileText className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No diagnostic reports found</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedReports.map((report) => (
                                                <tr key={report._id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm group-hover:rotate-12 transition-transform">
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-black text-secondary-900 block truncate uppercase tracking-tight">
                                                                    {report.title}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                    System Index: #{report._id.slice(-6)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="text-sm font-bold text-slate-600">
                                                            {new Date(report.uploadedAt).toLocaleDateString('en-GB')}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase tracking-tighter">
                                                                Complete
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={report.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2.5 bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-primary-600 hover:border-primary-100 hover:shadow-lg transition-all active:scale-95"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </a>
                                                            {/* <button className="p-2.5 bg-secondary-900 text-white rounded-xl hover:bg-slate-800 shadow-lg shadow-secondary-500/10 transition-all active:scale-95">
                                                                <Download className="w-4 h-4" />
                                                            </button> */}
                                                        </div>
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
                                    totalItems={filteredReports?.length || 0}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={handlePageChange}
                                    onItemsPerPageChange={handleItemsPerPageChange}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Upload Modal */}
                <AnimatePresence>
                    {isUploadModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsUploadModalOpen(false)}
                                className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
                            >
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-secondary-900 uppercase tracking-tighter">Upload Report</h2>
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-none underline decoration-amber-200">Secure File Intake</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsUploadModalOpen(false)}
                                        className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleUpload} className="p-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Report Title</label>
                                            <input
                                                type="text"
                                                className="input-field py-3 text-sm"
                                                placeholder="e.g. Blood Work Q4 2025"
                                                value={uploadData.title}
                                                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed ${uploadData.file ? 'border-emerald-400 bg-emerald-50/10' : 'border-slate-200'} rounded-3xl p-10 text-center hover:border-primary-400 transition-colors cursor-pointer group`}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                                            />
                                            <div className={`w-12 h-12 ${uploadData.file ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:text-primary-500 group-hover:bg-primary-50 transition-all`}>
                                                {uploadData.file ? <CheckCircle2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                            </div>
                                            <p className={`text-xs font-black ${uploadData.file ? 'text-emerald-700' : 'text-slate-400'} uppercase tracking-widest group-hover:text-primary-600 transition-all`}>
                                                {uploadData.file ? uploadData.file.name : 'Select PDF / JPEG / PNG'}
                                            </p>
                                            <p className="text-[10px] text-slate-300 mt-2">Max file size: 10MB</p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={uploadMutation.isPending}
                                            className="w-full py-4 bg-secondary-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-secondary-200 transition-all flex items-center justify-center gap-3"
                                        >
                                            {uploadMutation.isPending ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Syncing with Vault...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Finalize Upload
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default TestReports;
