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
    DollarSign
} from 'lucide-react';
import { UnifiedDocument } from '../../components/shared/UnifiedDocument';
import { printDocument } from '../../utils/printHelper';
import { useAuth } from '../../contexts/AuthContext';
import { doctorApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import TablePagination from '../../components/shared/TablePagination';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const Appointments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Add location hook
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingPrescription, setViewingPrescription] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

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



    const filteredAppointments = appointments?.filter(appt => {
        let matchesStatus = false;
        if (activeTab === 'All') {
            matchesStatus = true;
        } else if (activeTab === 'Upcoming') {
            matchesStatus = ['Accepted', 'Rescheduled'].includes(appt.status);
        } else {
            matchesStatus = appt.status === activeTab;
        }

        const matchesSearch = appt.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            appt.patient?._id?.includes(searchQuery);
        return matchesStatus && matchesSearch;
    }).reverse() || [];

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

    const tabs = ['All', 'Upcoming', 'Completed', 'Cancelled'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'Accepted': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'Completed': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-600 border-rose-200';
            case 'Rescheduled': return 'bg-purple-100 text-purple-600 border-purple-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Unpaid': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <>
            <DashboardLayout>
                <div className="max-w-7xl mx-auto py-10 px-4 print:hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 ">
                        <div>
                            <h1 className="text-4xl font-black text-secondary-900 uppercase tracking-tighter">Appointment Manager</h1>
                            <p className="text-slate-500 mt-1 font-medium">Coordinate patient consultations and schedule logistics</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-8">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setCurrentPage(1);
                                }}
                                className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-secondary-900 text-white shadow-xl shadow-secondary-200 scale-105'
                                    : 'bg-white text-slate-400 border border-slate-100 hover:border-primary-200 hover:text-primary-600'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="glass-card mb-8">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by patient name or ID..."
                                    className="input-field pl-11 py-2 text-sm shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                                <Filter className="w-4 h-4" />
                                Showing {filteredAppointments.length} Appointments
                            </div>
                        </div>

                        <div className="divide-y divide-slate-50">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="p-8 animate-pulse flex items-center gap-6">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl"></div>
                                        <div className="flex-1 space-y-3">
                                            <div className="h-4 bg-slate-50 rounded-full w-1/4"></div>
                                            <div className="h-3 bg-slate-50 rounded-full w-1/2"></div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredAppointments.length === 0 ? (
                                <div className="p-20 text-center">
                                    <Calendar className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No {activeTab.toLowerCase()} appointments found</p>
                                </div>
                            ) : (
                                paginatedAppointments.map((appt) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={appt._id}
                                        className="p-8 flex flex-col md:flex-row md:items-center gap-8 group hover:bg-slate-50/30 transition-all"
                                    >
                                        <div className="w-20 h-20 bg-white rounded-[24px] flex flex-col items-center justify-center shadow-sm border border-slate-100 shrink-0 group-hover:border-primary-200 transition-colors">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                {new Date(appt.date).toLocaleString('default', { month: 'short' })}
                                            </span>
                                            <span className="text-2xl font-black text-secondary-900 leading-none">
                                                {new Date(appt.date).getDate()}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                                {new Date(appt.date).toLocaleDateString('en-GB').split('/')[2]}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-tight ${getStatusColor(appt.status)}`}>
                                                    {appt.status}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h4 className="text-xl font-black text-secondary-900 uppercase tracking-tighter mb-1 truncate">
                                                {appt.patient?.name}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-500 font-medium">
                                                <span className="flex items-center gap-1.5 uppercase text-[10px] font-bold tracking-widest text-slate-400">
                                                    ID: {appt.patient?._id?.slice(-8)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Activity className="w-3.5 h-3.5 text-primary-500" />
                                                    {appt.reason || 'Symptomatic Review'}
                                                </span>
                                                {/* <div className="flex items-center gap-2">
                                                    <div className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-tight flex items-center gap-1.5 ${getPaymentStatusColor(appt.paymentStatus)}`}>
                                                        <CreditCard className="w-3 h-3" />
                                                        {appt.paymentStatus || 'Unpaid'}
                                                    </div>
                                                </div> */}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {(appt.status === 'Pending' || appt.status === 'Cancelled') && (
                                                <>
                                                    <button
                                                        onClick={() => setConfirmModal({ isOpen: true, id: appt._id })}
                                                        className="p-3 bg-white border border-slate-100 text-rose-500 rounded-2xl hover:border-rose-100 hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Cancel Appointment"
                                                        disabled={appt.status === 'Cancelled'}
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'Accepted' })}
                                                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        {appt.status === 'Cancelled' ? 'Re-Accept' : 'Accept'}
                                                    </button>
                                                </>
                                            )}
                                            {(appt.status === 'Accepted' || appt.status === 'Rescheduled') && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => navigate(`/doctor/session/${appt._id}`)}
                                                        className="px-8 py-3 bg-secondary-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-secondary-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                                                    >
                                                        <Activity className="w-4 h-4" />
                                                        Start Session
                                                    </button>
                                                </div>
                                            )}
                                            {appt.status === 'Completed' && (
                                                <button
                                                    onClick={() => setViewingPrescription(appt._id)}
                                                    className="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                                                >
                                                    <ClipboardList className="w-4 h-4" />
                                                    View Prescription
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
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

    if (isLoading) return null;

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

export default Appointments;
