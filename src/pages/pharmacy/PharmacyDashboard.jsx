import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Pill,
    Plus,
    Upload,
    Download,
    Trash2,
    Edit3,
    Search,
    RefreshCw,
    CheckCircle2,
    FileSpreadsheet,
    Layers,
    Tag,
    X,
    Check,
    FileText,
    Sparkles,
    Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { pharmacyApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TablePagination from '../../components/shared/TablePagination';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const DOSAGE_FORMS = [
    'Tablet',
    'Capsule',
    'Syrup',
    'Injection',
    'Ointment',
    'Cream',
    'Drops',
    'Inhaler',
    'Suspension',
    'Gel',
    'Lotion',
    'Powder',
    'Other'
];

const COMMON_CATEGORIES = [
    'General',
    'Analgesics & Antipyretics',
    'Antibiotics',
    'Antacids & PPIs',
    'Antihistamines & Allergy',
    'Antidiabetics',
    'Cardiovascular & Hypertension',
    'Respiratory & Cough',
    'Dermatology & Skin',
    'Vitamins & Supplements',
    'Gastrointestinal',
    'Neurological',
    'Ophthalmic (Eye/Ear)'
];

const PharmacyDashboard = () => {
    const queryClient = useQueryClient();

    // Table filters & pagination state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDosageForm, setSelectedDosageForm] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedSource, setSelectedSource] = useState('all'); // 'all', 'doctor', 'pharmacy'
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Selection for bulk operations
    const [selectedDrugIds, setSelectedDrugIds] = useState([]);

    // Modals state
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingDrug, setEditingDrug] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, drug: null });
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    // Form state for Single Add / Edit
    const [formData, setFormData] = useState({
        name: '',
        category: 'General',
        dosageForm: 'Tablet',
        strength: '',
        manufacturer: '',
        notes: '',
        isActive: true
    });

    // Form state for Bulk Upload Modal
    const [uploadTab, setUploadTab] = useState('file'); // 'file' or 'paste'
    const [selectedFile, setSelectedFile] = useState(null);
    const [pastedText, setPastedText] = useState('');
    const [bulkDefaultCategory, setBulkDefaultCategory] = useState('General');
    const [bulkDefaultDosageForm, setBulkDefaultDosageForm] = useState('Tablet');
    const [isUploading, setIsUploading] = useState(false);

    // Query stats
    const { data: stats, refetch: refetchStats } = useQuery({
        queryKey: ['pharmacyStats'],
        queryFn: async () => {
            const res = await pharmacyApi.getStats();
            return res.data;
        }
    });

    // Query drugs list
    const { data: drugsData, isLoading, isFetching, refetch: refetchDrugs } = useQuery({
        queryKey: ['pharmacyDrugs', {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
            category: selectedCategory,
            dosageForm: selectedDosageForm,
            status: selectedStatus,
            source: selectedSource,
            sortBy,
            sortOrder
        }],
        queryFn: async () => {
            const res = await pharmacyApi.getDrugs({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                category: selectedCategory,
                dosageForm: selectedDosageForm,
                status: selectedStatus,
                source: selectedSource,
                sortBy,
                sortOrder
            });
            return res.data;
        }
    });

    // Sync Doctor Drugs Mutation
    const syncDoctorDrugsMutation = useMutation({
        mutationFn: async () => {
            const res = await pharmacyApi.syncDoctorDrugs();
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['pharmacyDrugs']);
            queryClient.invalidateQueries(['pharmacyStats']);
            if (data?.insertedCount > 0) {
                toast.success(`Synced ${data.insertedCount} new medications from doctor prescriptions!`);
            } else {
                toast.success(`Formulary synced! (${data?.totalDrugsInDb || 0} drugs in database)`);
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to sync doctor medications');
        }
    });

    const drugs = useMemo(() => drugsData?.drugs || [], [drugsData]);
    const totalDrugs = drugsData?.total || 0;
    const totalPages = drugsData?.totalPages || 1;

    // Refresh all
    const handleRefresh = () => {
        refetchDrugs();
        refetchStats();
        toast.success('Formulary refreshed');
    };

    // Single Add/Edit Mutation
    const saveDrugMutation = useMutation({
        mutationFn: async (payload) => {
            if (editingDrug) {
                return await pharmacyApi.updateDrug(editingDrug._id, payload);
            }
            return await pharmacyApi.addDrug(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['pharmacyDrugs']);
            queryClient.invalidateQueries(['pharmacyStats']);
            toast.success(editingDrug ? 'Drug updated successfully' : 'New drug added to formulary');
            closeAddEditModal();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to save drug');
        }
    });

    // Toggle Status Mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async (id) => {
            return await pharmacyApi.toggleStatus(id);
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries(['pharmacyDrugs']);
            queryClient.invalidateQueries(['pharmacyStats']);
            toast.success(res.data?.message || 'Status updated');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to toggle status');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return await pharmacyApi.deleteDrug(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['pharmacyDrugs']);
            queryClient.invalidateQueries(['pharmacyStats']);
            toast.success('Drug removed from formulary');
            setDeleteModal({ isOpen: false, drug: null });
            setSelectedDrugIds(prev => prev.filter(id => id !== deleteModal.drug?._id));
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to delete drug');
        }
    });

    // Bulk Delete Mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids) => {
            return await pharmacyApi.bulkDelete(ids);
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries(['pharmacyDrugs']);
            queryClient.invalidateQueries(['pharmacyStats']);
            toast.success(res.data?.message || 'Selected drugs deleted');
            setSelectedDrugIds([]);
            setIsBulkDeleteModalOpen(false);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to delete selected drugs');
        }
    });

    // Handle Open Add Modal
    const openAddModal = () => {
        setEditingDrug(null);
        setFormData({
            name: '',
            category: 'General',
            dosageForm: 'Tablet',
            strength: '',
            manufacturer: '',
            notes: '',
            isActive: true
        });
        setIsAddEditModalOpen(true);
    };

    // Handle Open Edit Modal
    const openEditModal = (drug) => {
        setEditingDrug(drug);
        setFormData({
            name: drug.name || '',
            category: drug.category || 'General',
            dosageForm: drug.dosageForm || 'Tablet',
            strength: drug.strength || '',
            manufacturer: drug.manufacturer || '',
            notes: drug.notes || '',
            isActive: drug.isActive !== false
        });
        setIsAddEditModalOpen(true);
    };

    const closeAddEditModal = () => {
        setIsAddEditModalOpen(false);
        setEditingDrug(null);
    };

    // Handle Submit Single Drug
    const handleSaveDrug = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Please enter a drug name');
            return;
        }
        saveDrugMutation.mutate(formData);
    };

    // Handle Bulk Upload Form Submit
    const handleBulkUploadSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            if (uploadTab === 'file') {
                if (!selectedFile) {
                    toast.error('Please select a CSV or TXT file to upload');
                    setIsUploading(false);
                    return;
                }
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedFile);

                const res = await pharmacyApi.bulkUpload(uploadFormData, true);
                toast.success(res.data?.message || 'Drugs uploaded successfully');
            } else {
                if (!pastedText.trim()) {
                    toast.error('Please paste or type drug names');
                    setIsUploading(false);
                    return;
                }

                // Split lines
                const lines = pastedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                const drugsList = lines.map(line => {
                    if (line.includes(',')) {
                        const parts = line.split(',').map(p => p.trim());
                        return {
                            name: parts[0],
                            category: parts[1] || bulkDefaultCategory,
                            dosageForm: parts[2] || bulkDefaultDosageForm,
                            strength: parts[3] || '',
                            manufacturer: parts[4] || '',
                            notes: parts[5] || ''
                        };
                    }
                    return {
                        name: line,
                        category: bulkDefaultCategory,
                        dosageForm: bulkDefaultDosageForm,
                        strength: '',
                        manufacturer: '',
                        notes: ''
                    };
                });

                const res = await pharmacyApi.bulkUpload({ drugs: drugsList }, false);
                toast.success(res.data?.message || 'Drugs imported successfully');
            }

            queryClient.invalidateQueries(['pharmacyDrugs']);
            queryClient.invalidateQueries(['pharmacyStats']);
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            setPastedText('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to upload drugs');
        } finally {
            setIsUploading(false);
        }
    };

    // Download Sample CSV template
    const handleDownloadSample = async () => {
        try {
            const res = await pharmacyApi.downloadSampleCsv();
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'venus_drugs_sample_template.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Sample template downloaded');
        } catch (err) {
            console.error('Download sample error:', err);
            toast.error('Failed to download template');
        }
    };

    // Export current formulary to CSV
    const handleExportFormulary = async () => {
        try {
            toast.loading('Exporting formulary...', { id: 'export-toast' });
            const res = await pharmacyApi.getDrugs({ limit: 'all', search: searchTerm, category: selectedCategory });
            const allDrugs = res.data?.drugs || [];

            if (allDrugs.length === 0) {
                toast.error('No drugs to export', { id: 'export-toast' });
                return;
            }

            const headers = ['Drug Name', 'Category', 'Dosage Form', 'Strength', 'Manufacturer', 'Status', 'Notes'];
            const rows = allDrugs.map(d => [
                `"${(d.name || '').replace(/"/g, '""')}"`,
                `"${(d.category || '').replace(/"/g, '""')}"`,
                `"${(d.dosageForm || '').replace(/"/g, '""')}"`,
                `"${(d.strength || '').replace(/"/g, '""')}"`,
                `"${(d.manufacturer || '').replace(/"/g, '""')}"`,
                d.isActive ? 'Active' : 'Inactive',
                `"${(d.notes || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `venus_formulary_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`Exported ${allDrugs.length} drugs`, { id: 'export-toast' });
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Export failed', { id: 'export-toast' });
        }
    };

    // Selection handlers
    const isAllSelected = useMemo(() => {
        if (drugs.length === 0) return false;
        return drugs.every(d => selectedDrugIds.includes(d._id));
    }, [drugs, selectedDrugIds]);

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedDrugIds(prev => prev.filter(id => !drugs.some(d => d._id === id)));
        } else {
            const currentIds = drugs.map(d => d._id);
            setSelectedDrugIds(prev => Array.from(new Set([...prev, ...currentIds])));
        }
    };

    const handleSelectDrug = (id) => {
        setSelectedDrugIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Calculate detected count in textarea
    const detectedPasteCount = useMemo(() => {
        if (!pastedText.trim()) return 0;
        return pastedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean).length;
    }, [pastedText]);

    return (
        <DashboardLayout>
            <div className="max-w-8xl mx-auto space-y-6">
                {/* Header Area */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <Pill className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-secondary-900 tracking-tight uppercase">
                                    Pharmacy Formulary
                                </h1>
                                <p className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <span>Maintain clinic medication database & bulk upload drugs</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={isFetching}
                            className="p-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-secondary-900 rounded-2xl shadow-sm hover:shadow transition-all"
                            title="Refresh Formulary"
                        >
                            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
                        </button>

                        <button
                            onClick={handleExportFormulary}
                            className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm hover:shadow transition-all"
                        >
                            <Download className="w-4 h-4 text-slate-500" />
                            <span>Export CSV</span>
                        </button>

                        <button
                            onClick={() => syncDoctorDrugsMutation.mutate()}
                            disabled={syncDoctorDrugsMutation.isPending}
                            className="flex items-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-wider rounded-2xl border border-indigo-200/80 transition-all shadow-sm"
                            title="Scan prescriptions and pull doctor-prescribed medications into this table"
                        >
                            <Stethoscope className={`w-4 h-4 text-indigo-600 ${syncDoctorDrugsMutation.isPending ? 'animate-spin' : ''}`} />
                            <span>{syncDoctorDrugsMutation.isPending ? 'Syncing...' : 'Sync Doctor Prescriptions'}</span>
                        </button>

                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs uppercase tracking-wider rounded-2xl border border-emerald-200/80 transition-all shadow-sm"
                        >
                            <Upload className="w-4 h-4 text-emerald-600" />
                            <span>Upload Drugs (CSV / Text)</span>
                        </button>

                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-6 py-3 bg-secondary-900 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-secondary-900/10 hover:shadow-emerald-700/20 transition-all"
                        >
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span>Add New Drug</span>
                        </button>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-card p-5 border border-slate-100 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:scale-125 transition-all" />
                        <div className="flex items-center justify-between relative z-10 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Registered</span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Pill className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-secondary-900 tracking-tight relative z-10">
                            {stats?.totalDrugs ?? totalDrugs ?? 0}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1 relative z-10">
                            Unique medications in database
                        </p>
                    </div>

                    <div className="glass-card p-5 border border-slate-100 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:scale-125 transition-all" />
                        <div className="flex items-center justify-between relative z-10 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uploaded by Doctors</span>
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                <Stethoscope className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-indigo-700 tracking-tight relative z-10">
                            {stats?.doctorDrugs ?? 0}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1 relative z-10">
                            From patient prescriptions & templates
                        </p>
                    </div>

                    <div className="glass-card p-5 border border-slate-100 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full blur-2xl group-hover:scale-125 transition-all" />
                        <div className="flex items-center justify-between relative z-10 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Prescribable</span>
                            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-teal-700 tracking-tight relative z-10">
                            {stats?.activeDrugs ?? 0}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1 relative z-10">
                            Suggested in prescription form
                        </p>
                    </div>

                    <div className="glass-card p-5 border border-slate-100 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl group-hover:scale-125 transition-all" />
                        <div className="flex items-center justify-between relative z-10 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categories</span>
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                <Layers className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-secondary-900 tracking-tight relative z-10">
                            {stats?.categoryCount ?? stats?.categories?.length ?? 0}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1 relative z-10">
                            Therapeutic groups configured
                        </p>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    {/* Source Filter Tabs: All, Doctor Uploaded, Pharmacy */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                        {[
                            { id: 'all', label: 'All Medications', count: stats?.totalDrugs ?? totalDrugs ?? 0, icon: Pill },
                            { id: 'doctor', label: 'Uploaded by Doctors', count: stats?.doctorDrugs ?? 0, icon: Stethoscope },
                            { id: 'pharmacy', label: 'Pharmacy Added', count: Math.max(0, (stats?.totalDrugs ?? totalDrugs ?? 0) - (stats?.doctorDrugs ?? 0)), icon: Tag },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setSelectedSource(tab.id);
                                    setCurrentPage(1);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    selectedSource === tab.id
                                        ? 'bg-secondary-900 text-white shadow-sm'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                                }`}
                            >
                                <tab.icon className={`w-3.5 h-3.5 ${selectedSource === tab.id ? 'text-emerald-400' : 'text-slate-400'}`} />
                                <span>{tab.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    selectedSource === tab.id
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by drug name, category, dosage, manufacturer..."
                                className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl pl-11 pr-10 py-2.5 text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setCurrentPage(1);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Filters Dropdown Group */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Category Filter */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl px-3 py-2.5 outline-none focus:border-emerald-500 cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                {COMMON_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            {/* Dosage Form Filter */}
                            <select
                                value={selectedDosageForm}
                                onChange={(e) => {
                                    setSelectedDosageForm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl px-3 py-2.5 outline-none focus:border-emerald-500 cursor-pointer"
                            >
                                <option value="all">All Forms</option>
                                {DOSAGE_FORMS.map(form => (
                                    <option key={form} value={form}>{form}</option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-2xl px-3 py-2.5 outline-none focus:border-emerald-500 cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>

                            {/* Reset Filters */}
                            {(searchTerm || selectedCategory !== 'all' || selectedDosageForm !== 'all' || selectedStatus !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                        setSelectedDosageForm('all');
                                        setSelectedStatus('all');
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Bulk Selection Banner */}
                    <AnimatePresence>
                        {selectedDrugIds.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 bg-secondary-900 text-white rounded-2xl flex items-center justify-between gap-4 shadow-md"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white text-xs font-black flex items-center justify-center">
                                        {selectedDrugIds.length}
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                        {selectedDrugIds.length === 1 ? '1 drug selected' : `${selectedDrugIds.length} drugs selected`}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedDrugIds([])}
                                        className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                                    >
                                        Deselect All
                                    </button>
                                    <button
                                        onClick={() => setIsBulkDeleteModalOpen(true)}
                                        className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-4 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete Selected</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Drugs Directory Table */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 border-b border-slate-100">
                                    <th className="px-4 py-3.5 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                        />
                                    </th>
                                    <th
                                        onClick={() => {
                                            setSortBy('name');
                                            setSortOrder(prev => (sortBy === 'name' && prev === 'asc' ? 'desc' : 'asc'));
                                        }}
                                        className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-emerald-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>Drug Name</span>
                                            {sortBy === 'name' && (
                                                <span className="text-emerald-600 font-extrabold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Dosage Form & Strength
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Category
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Manufacturer
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                                        Prescription Status
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm">
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className="animate-pulse h-16">
                                            <td colSpan="7" className="px-6 py-4">
                                                <div className="h-4 bg-slate-100 rounded-lg w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : drugs.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
                                                    <Pill className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-base font-black text-secondary-900 uppercase tracking-tight">
                                                    No Drugs Found
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-1 mb-6">
                                                    {searchTerm || selectedCategory !== 'all' || selectedDosageForm !== 'all'
                                                        ? 'No medication matches your current search filter criteria.'
                                                        : 'Your pharmacy database is currently empty. Add your first drug or upload a CSV file.'}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setIsUploadModalOpen(true)}
                                                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-all"
                                                    >
                                                        Upload CSV
                                                    </button>
                                                    <button
                                                        onClick={openAddModal}
                                                        className="px-4 py-2 bg-secondary-900 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
                                                    >
                                                        + Add Drug
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    drugs.map((drug) => {
                                        const isSelected = selectedDrugIds.includes(drug._id);
                                        return (
                                            <tr
                                                key={drug._id}
                                                className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}
                                            >
                                                {/* Checkbox */}
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectDrug(drug._id)}
                                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                                    />
                                                </td>

                                                {/* Drug Name with Doctor Upload badge */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                            drug.uploadedByDoctor ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100/70 text-emerald-700'
                                                        }`}>
                                                            {drug.uploadedByDoctor ? <Stethoscope className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-bold text-secondary-900 block leading-tight">
                                                                    {drug.name}
                                                                </span>
                                                                {drug.uploadedByDoctor ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                                        <Stethoscope className="w-2.5 h-2.5" />
                                                                        <span>Doctor Uploaded</span>
                                                                        {drug.doctorName && <span className="opacity-80">({drug.doctorName})</span>}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                                                                        <span>Pharmacy</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {drug.notes && (
                                                                <span className="text-[11px] text-slate-400 truncate max-w-xs block mt-0.5">
                                                                    {drug.notes}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Dosage Form & Strength */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                            {drug.dosageForm || 'Tablet'}
                                                        </span>
                                                        {drug.strength && (
                                                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                                {drug.strength}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Category */}
                                                <td className="px-4 py-3">
                                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 inline-block">
                                                        {drug.category || 'General'}
                                                    </span>
                                                </td>

                                                {/* Manufacturer */}
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-medium text-slate-600">
                                                        {drug.manufacturer || '—'}
                                                    </span>
                                                </td>

                                                {/* Prescription Status Toggle */}
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => toggleStatusMutation.mutate(drug._id)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border ${drug.isActive
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                                            }`}
                                                        title="Click to toggle status"
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${drug.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                        {drug.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => openEditModal(drug)}
                                                            className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                                                            title="Edit Drug"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteModal({ isOpen: true, drug })}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                            title="Delete Drug"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {totalDrugs > 0 && (
                        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-medium">Show</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
                                >
                                    {[10, 25, 50, 100].map(sz => (
                                        <option key={sz} value={sz}>{sz} rows</option>
                                    ))}
                                </select>
                                <span className="text-xs text-slate-500 font-medium">
                                    of <span className="font-bold text-secondary-900">{totalDrugs}</span> total drugs
                                </span>
                            </div>

                            <TablePagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        </div>
                    )}
                </div>

                {/* Add / Edit Drug Modal */}
                <AnimatePresence>
                    {isAddEditModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <Pill className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-secondary-900 uppercase tracking-tight">
                                                {editingDrug ? 'Edit Drug Details' : 'Add Drug to Formulary'}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {editingDrug ? 'Update medication specifications' : 'Enter medication specifications to make it available for prescriptions'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeAddEditModal}
                                        className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveDrug} className="p-6 space-y-4">
                                    {/* Drug Name */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                            Drug Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Paracetamol 650mg, Amoxicillin 500mg"
                                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    {/* Dosage Form & Strength Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                                Dosage Form
                                            </label>
                                            <select
                                                value={formData.dosageForm}
                                                onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-2xl px-3 py-3 text-sm font-semibold outline-none transition-all cursor-pointer"
                                            >
                                                {DOSAGE_FORMS.map(form => (
                                                    <option key={form} value={form}>{form}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                                Strength / Dose
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 500mg, 100ml"
                                                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                                                value={formData.strength}
                                                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                            Therapeutic Category
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-2xl px-3 py-3 text-sm font-semibold outline-none transition-all cursor-pointer"
                                        >
                                            {COMMON_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Manufacturer */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                            Manufacturer / Brand Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Cipla, Sun Pharma, Abbott, GSK"
                                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                                            value={formData.manufacturer}
                                            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                            Instructions / Notes (Optional)
                                        </label>
                                        <textarea
                                            rows="2"
                                            placeholder="e.g. Take after food, complete full course, avoid in pregnancy"
                                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-2xl px-4 py-2.5 text-sm font-semibold outline-none transition-all placeholder:text-slate-400 resize-none"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>

                                    {/* Active Status */}
                                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                                        <div>
                                            <p className="text-xs font-bold text-secondary-900">Active in Prescription Form</p>
                                            <p className="text-[11px] text-slate-500">Allow doctors to view and auto-suggest this drug</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={closeAddEditModal}
                                            className="px-5 py-2.5 text-slate-600 hover:text-secondary-900 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saveDrugMutation.isPending}
                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                                        >
                                            {saveDrugMutation.isPending ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                            <span>{editingDrug ? 'Update Drug' : 'Save Drug'}</span>
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Bulk Upload Modal */}
                <AnimatePresence>
                    {isUploadModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-secondary-900 uppercase tracking-tight">
                                                Bulk Upload Drugs
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Import multiple medications via CSV file or paste list directly
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsUploadModalOpen(false)}
                                        className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-slate-100 bg-slate-50/30">
                                    <button
                                        onClick={() => setUploadTab('file')}
                                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 ${uploadTab === 'file'
                                            ? 'border-emerald-600 text-emerald-700 bg-white'
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        <span>Upload CSV / TXT File</span>
                                    </button>
                                    <button
                                        onClick={() => setUploadTab('paste')}
                                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 ${uploadTab === 'paste'
                                            ? 'border-emerald-600 text-emerald-700 bg-white'
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span>Paste List Directly</span>
                                    </button>
                                </div>

                                <form onSubmit={handleBulkUploadSubmit} className="p-6 space-y-4">
                                    {uploadTab === 'file' ? (
                                        <div className="space-y-4">
                                            {/* Drag & Drop Zone */}
                                            <div
                                                className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer relative"
                                                onClick={() => document.getElementById('csvFileInput').click()}
                                            >
                                                <input
                                                    id="csvFileInput"
                                                    type="file"
                                                    accept=".csv,.txt"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            setSelectedFile(e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                                                    <FileSpreadsheet className="w-6 h-6" />
                                                </div>
                                                {selectedFile ? (
                                                    <div>
                                                        <p className="text-sm font-bold text-secondary-900">{selectedFile.name}</p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {(selectedFile.size / 1024).toFixed(1)} KB • Click to change file
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-sm font-bold text-secondary-900">
                                                            Click or drag & drop CSV or TXT file here
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            Supports .csv and .txt formats with header columns: Drug Name, Category, Dosage Form, Strength, Manufacturer
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Download Sample Template Bar */}
                                            <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                                                <div className="flex items-center gap-2.5">
                                                    <Sparkles className="w-4 h-4 text-emerald-600" />
                                                    <span className="text-xs font-semibold text-emerald-800">
                                                        Need standard format? Download sample CSV template
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleDownloadSample}
                                                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    <span>Download Template</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                                        Paste Drug Names (One per line or Comma Separated)
                                                    </label>
                                                    <span className="text-xs font-bold text-emerald-700">
                                                        {detectedPasteCount} {detectedPasteCount === 1 ? 'item' : 'items'} detected
                                                    </span>
                                                </div>
                                                <textarea
                                                    rows="6"
                                                    placeholder={`Paracetamol 650mg\nAmoxicillin 500mg\nCetirizine 10mg\nPantoprazole 40mg\nAzithromycin 500mg\nMetformin 500mg`}
                                                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-2xl p-4 text-xs font-mono font-medium outline-none transition-all placeholder:text-slate-400 resize-none"
                                                    value={pastedText}
                                                    onChange={(e) => setPastedText(e.target.value)}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                                        Default Category for pasted items
                                                    </label>
                                                    <select
                                                        value={bulkDefaultCategory}
                                                        onChange={(e) => setBulkDefaultCategory(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-2 outline-none focus:border-emerald-500 cursor-pointer"
                                                    >
                                                        {COMMON_CATEGORIES.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                                        Default Dosage Form
                                                    </label>
                                                    <select
                                                        value={bulkDefaultDosageForm}
                                                        onChange={(e) => setBulkDefaultDosageForm(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-2 outline-none focus:border-emerald-500 cursor-pointer"
                                                    >
                                                        {DOSAGE_FORMS.map(form => (
                                                            <option key={form} value={form}>{form}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setIsUploadModalOpen(false)}
                                            className="px-5 py-2.5 text-slate-600 hover:text-secondary-900 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                                        >
                                            {isUploading ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Upload className="w-4 h-4" />
                                            )}
                                            <span>{isUploading ? 'Uploading & Processing...' : 'Start Upload'}</span>
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Single Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ isOpen: false, drug: null })}
                    onConfirm={() => deleteMutation.mutate(deleteModal.drug?._id)}
                    title="Remove Drug from Formulary"
                    message={`Are you sure you want to remove "${deleteModal.drug?.name}" from the formulary database? This will prevent it from appearing in future prescription autocomplete.`}
                    confirmText="Delete Drug"
                    isDestructive={true}
                />

                {/* Bulk Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={isBulkDeleteModalOpen}
                    onClose={() => setIsBulkDeleteModalOpen(false)}
                    onConfirm={() => bulkDeleteMutation.mutate(selectedDrugIds)}
                    title="Delete Multiple Drugs"
                    message={`Are you sure you want to delete ${selectedDrugIds.length} selected drugs from the formulary? This action cannot be undone.`}
                    confirmText={`Delete ${selectedDrugIds.length} Drugs`}
                    isDestructive={true}
                />
            </div>
        </DashboardLayout>
    );
};

export default PharmacyDashboard;
