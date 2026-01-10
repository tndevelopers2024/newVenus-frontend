import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Calendar,
    History as HistoryIcon,
    Upload,
    ClipboardList,
    Search,
    Activity as ActivityIcon,
    Download,
    Eye,
    X,
    Printer,
    FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { patientApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { printDocument } from '../../utils/printHelper';
import TablePagination from '../../components/shared/TablePagination';

const MedicalHistory = () => {
    const { user } = useAuth();
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const { data: historyData, isLoading } = useQuery({
        queryKey: ['patientHistoryDetailed'],
        queryFn: async () => {
            const res = await patientApi.getHistory();
            return res.data;
        }
    });

    const patientLinks = [
        { label: 'Dashboard', path: '/patient', icon: ClipboardList },
        { label: 'Medical History', path: '/patient/history', icon: HistoryIcon },
        { label: 'Test Reports', path: '/patient/reports', icon: Upload },
    ];

    const completedAppointments = historyData?.appointments?.filter(a => a.status === 'Completed').reverse() || [];

    const filteredAppointments = completedAppointments.filter(appt =>
        appt.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(appt.date).toLocaleDateString('en-GB').includes(searchTerm)
    );

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

    const getPrescriptionForAppointment = (appointmentId) => {
        return historyData?.prescriptions?.find(p => p.appointment === appointmentId);
    };

    const handleViewDetails = (appt) => {
        const prescription = getPrescriptionForAppointment(appt._id);
        setSelectedAppointment({ ...appt, prescription });
        setIsViewModalOpen(true);
    };

    const handlePrint = (appt) => {
        const prescription = getPrescriptionForAppointment(appt._id);
        const printData = {
            prescription: prescription,
            clinicalDetails: {
                vitals: appt.vitals,
                diagnosis: appt.diagnosis
            },
            doctor: appt.doctor,
            patient: user,
            appointmentId: appt._id,
            createdAt: appt.date
        };
        printDocument(printData, 'prescription');
    };

    return (
        <DashboardLayout links={patientLinks}>
            <div className="max-w-7xl mx-auto py-10 px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 ">
                    <div>
                        <h1 className="text-4xl font-black text-secondary-900 uppercase tracking-tighter">Medical Archive</h1>
                        <p className="text-slate-500 mt-1 font-medium">Structured Health Registry • {user?.name}</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="input-field pl-11 py-3 text-sm  shadow-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="glass-card overflow-hidden  shadow-2xl border-t-4 border-t-primary-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6">Consultation Date</th>
                                    <th className="px-8 py-6">Medical Provider</th>
                                    <th className="px-8 py-6">Diagnosis / Reason</th>
                                    <th className="px-8 py-6">Vitals Summary</th>
                                    <th className="px-8 py-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-8 py-6">
                                                <div className="h-4 bg-slate-50 rounded-full w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <ActivityIcon className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found in your health ledger</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAppointments.map((appt) => (
                                        <tr key={appt._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 shadow-sm group-hover:rotate-12 transition-transform">
                                                        <Calendar className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-black text-secondary-900 block">
                                                            {new Date(appt.date).toLocaleDateString('en-GB')}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                                            Verified Visit
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-secondary-900 flex items-center justify-center text-white text-xs font-black shadow-inner">
                                                        {appt.doctor?.name?.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">Dr. {appt.doctor?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="max-w-xs">
                                                    <span className="text-sm font-black text-secondary-900 block truncate uppercase tracking-tight">
                                                        {appt.diagnosis || appt.reason || 'General Checkup'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 line-clamp-1 ">
                                                        {appt.clinicalNotes || 'No additional notes provided'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {appt.vitals ? (
                                                    <div className="flex gap-2">
                                                        {appt.vitals.bloodPressure && (
                                                            <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black border border-emerald-100/50">
                                                                BP: {appt.vitals.bloodPressure}
                                                            </div>
                                                        )}
                                                        {appt.vitals.weight && (
                                                            <div className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-[10px] font-black border border-indigo-100/50">
                                                                {appt.vitals.weight}KG
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase ">Not Recorded</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(appt)}
                                                        className="p-2.5 bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-primary-600 hover:border-primary-100 hover:shadow-lg transition-all active:scale-95 group/btn"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrint(appt)}
                                                        className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
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
                            totalItems={filteredAppointments?.length || 0}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />
                    )}
                </div>

                {/* View Details Modal */}
                <AnimatePresence>
                    {isViewModalOpen && selectedAppointment && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsViewModalOpen(false)}
                                className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
                            >
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                                            <ClipboardList className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-secondary-900 uppercase tracking-tighter">Case Summary</h2>
                                            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest leading-none">Ref: {selectedAppointment._id.slice(-8)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsViewModalOpen(false)}
                                        className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-8 mb-10">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Medical Provider</label>
                                            <p className="font-black text-secondary-900 ">Dr. {selectedAppointment.doctor?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Visit Date</label>
                                            <p className="font-black text-secondary-900 ">{new Date(selectedAppointment.date).toLocaleDateString('en-GB')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100/50">
                                            <h4 className="text-xs font-black text-primary-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <ActivityIcon className="w-3 h-3" /> Clinical Findings
                                            </h4>
                                            <p className="text-sm font-bold text-secondary-900 mb-2 uppercase tracking-tight">{selectedAppointment.diagnosis || 'General Consultation'}</p>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedAppointment.clinicalNotes || 'No additional clinical findings documented.'}</p>
                                        </div>

                                        {selectedAppointment.vitals && (
                                            <div>
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Patient Vitals</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {Object.entries(selectedAppointment.vitals).map(([key, value]) => value && (
                                                        <div key={key} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                                                            <span className="text-[12px] font-black text-[#2c333d] uppercase block tracking-tighter mb-1">{key}</span>
                                                            <span className="text-[18px] font-black text-secondary-900">{value}{key === 'temperature' ? '°C' : key === 'weight' ? 'KG' : ''}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <FileText className="w-3 h-3" /> Prescribed Medication
                                            </h4>
                                            {selectedAppointment.prescription?.medications?.length > 0 ? (
                                                <div className="space-y-3">
                                                    {selectedAppointment.prescription.medications.map((med, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary-100 transition-colors">
                                                            <div>
                                                                <p className="text-sm font-black text-secondary-900">{med.name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{med.dosage} • {med.frequency}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-black text-primary-600 ">{med.duration}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 ">No medications linked to this record.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 border-t border-slate-50 flex gap-4 bg-slate-50/30">
                                    <button
                                        onClick={() => setIsViewModalOpen(false)}
                                        className="flex-1 py-4 border border-slate-200 rounded-2xl text-sm font-black text-slate-400 uppercase tracking-widest hover:bg-white transition-all"
                                    >
                                        Close Summary
                                    </button>
                                    <button
                                        onClick={() => handlePrint(selectedAppointment)}
                                        className="flex-[2] py-4 bg-secondary-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-secondary-200 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Printer className="w-4 h-4" /> Generate Prescription
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default MedicalHistory;
