import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { printDocument } from '../../utils/printHelper';
import TablePagination from '../../components/shared/TablePagination';
import {
    CreditCard,
    FileText,
    Download,
    Filter,
    TrendingUp,
    DollarSign,
    Clock,
    CheckCircle
} from 'lucide-react';

const BillingManager = () => {
    const queryClient = useQueryClient();
    const [filterText, setFilterText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const { data: invoices, isLoading } = useQuery({
        queryKey: ['adminInvoices'],
        queryFn: async () => {
            const res = await adminApi.getInvoices();
            return res.data;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => adminApi.updateInvoiceStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminInvoices']);
            toast.success('Invoice status updated');
        },
        onError: () => toast.error('Failed to update status')
    });

    const filteredInvoices = invoices?.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(filterText.toLowerCase()) ||
        inv.patient?.name?.toLowerCase().includes(filterText.toLowerCase())
    ) || [];

    // Pagination Logic
    const totalPages = Math.ceil((filteredInvoices?.length || 0) / itemsPerPage);
    const paginatedInvoices = filteredInvoices?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (newSize) => {
        setItemsPerPage(newSize);
        setCurrentPage(1);
    };

    const handleExportCSV = () => {
        if (!invoices || invoices.length === 0) return;

        const headers = ['Invoice Number', 'Patient', 'Date', 'Amount', 'Status'];
        const csvRows = [
            headers.join(','),
            ...invoices.map(inv => [
                inv.invoiceNumber,
                inv.patient?.name,
                new Date(inv.appointment?.date).toLocaleDateString(),
                inv.totalAmount,
                inv.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvRows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `Revenue_Report_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const generateInvoicePDF = (inv) => {
        printDocument(inv, 'invoice');
    };

    const handleUpdateStatus = (id, currentStatus) => {
        const nextStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
        updateStatusMutation.mutate({ id, status: nextStatus });
    };

    // Filter out cancelled appointments from revenue calculations
    const activeInvoices = invoices?.filter(inv => inv.appointment?.status !== 'Cancelled') || [];

    const totalRevenue = activeInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0) || 0;
    const pendingAmount = activeInvoices.filter(i => i.status === 'Unpaid').reduce((acc, inv) => acc + inv.totalAmount, 0) || 0;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto py-10">
                <div className="mb-10 lg:flex items-end justify-between ">
                    <div>
                        <h1 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter">Finance Hub</h1>
                        <p className="text-slate-500 mt-1 font-bold">Hospital-wide Revenue & Billing Management</p>
                    </div>
                    <div className="flex gap-4 mt-6 lg:mt-0">
                        <button
                            onClick={handleExportCSV}
                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black  flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl uppercase tracking-tighter text-xs"
                        >
                            <TrendingUp className="w-4 h-4 text-primary-400" />
                            Revenue Report
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="glass-card p-8 border-l-4 border-l-emerald-500  relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:rotate-12 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Revenue Generated</p>
                            <h2 className="text-3xl font-black text-secondary-900 tracking-tighter">₹{totalRevenue.toLocaleString()}</h2>
                        </div>
                        <DollarSign className="absolute bottom-[-20px] right-[-20px] w-32 h-32 text-emerald-100/50" />
                    </div>

                    <div className="glass-card p-8 border-l-4 border-l-rose-500  relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:rotate-12 transition-transform">
                                <Clock className="w-6 h-6" />
                            </div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Pending Collections</p>
                            <h2 className="text-3xl font-black text-secondary-900 tracking-tighter">₹{pendingAmount.toLocaleString()}</h2>
                        </div>
                        <CreditCard className="absolute bottom-[-20px] right-[-20px] w-32 h-32 text-rose-100/50" />
                    </div>

                    <div className="glass-card p-8 border-l-4 border-l-primary-500  relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 mb-6 group-hover:rotate-12 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Invoice Velocity</p>
                            <h2 className="text-3xl font-black text-secondary-900 tracking-tighter">{invoices?.length || 0} Issues</h2>
                        </div>
                        <CheckCircle className="absolute bottom-[-20px] right-[-20px] w-32 h-32 text-primary-100/50" />
                    </div>
                </div>

                <div className="glass-card overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between ">
                        <h3 className="text-xl font-black text-secondary-900 uppercase tracking-tighter">Master Billing Ledger</h3>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filter by name or invoice..."
                                    className="input-field py-2 pl-10 text-xs w-64"
                                    value={filterText}
                                    onChange={(e) => {
                                        setFilterText(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest  border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5">Invoice Number</th>
                                    <th className="px-8 py-5">Patient Name</th>
                                    <th className="px-8 py-5">Consultation Date</th>
                                    <th className="px-8 py-5">Amount</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 ">
                                {isLoading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="6" className="px-8 py-5 h-20 bg-slate-50/50"></td>
                                        </tr>
                                    ))
                                ) : (
                                    paginatedInvoices.map((inv) => (
                                        <tr key={inv._id} className="hover:bg-slate-50 transition-colors group text-sm">
                                            <td className="px-8 py-6 font-black text-secondary-900 uppercase tracking-tighter">{inv.invoiceNumber}</td>
                                            <td className="px-8 py-6 font-bold text-slate-600">{inv.patient?.name}</td>
                                            <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                                                {new Date(inv.appointment?.date).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="px-8 py-6 font-black text-secondary-900 ">₹{inv.totalAmount}</td>
                                            <td className="px-8 py-6">
                                                <button
                                                    onClick={() => handleUpdateStatus(inv._id, inv.status)}
                                                    disabled={updateStatusMutation.isPending}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                                                        }`}
                                                >
                                                    {inv.status}
                                                </button>
                                            </td>
                                            <td className="px-8 py-6">
                                                <button
                                                    onClick={() => generateInvoicePDF(inv)}
                                                    className="p-2 text-gray-700 hover:text-primary-600 transition-all group-hover:opacity-100"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
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
                            totalItems={filteredInvoices?.length || 0}
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

export default BillingManager;
