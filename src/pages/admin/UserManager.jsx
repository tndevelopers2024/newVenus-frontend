import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Trash2, Shield, UserPlus, Search, Mail, Phone, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TablePagination from '../../components/shared/TablePagination';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const UserManager = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });

    const { data: users, isLoading } = useQuery({
        queryKey: ['adminUsersList'],
        queryFn: async () => {
            const res = await adminApi.getUsers();
            return res.data;
        }
    });

    const filteredUsers = users?.filter(user => {
        if (filter === 'archived') {
            return user.isDeleted;
        }
        // For other tabs (all, doctor, patient), exclude deleted users
        const isNotDeleted = !user.isDeleted;
        const matchesRole = filter === 'all' || user.role === filter;
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return isNotDeleted && matchesRole && matchesSearch;
    });

    // Pagination logic
    const totalPages = Math.ceil((filteredUsers?.length || 0) / itemsPerPage);
    const paginatedUsers = filteredUsers?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (newSize) => {
        setItemsPerPage(newSize);
        setCurrentPage(1);
    };

    const deleteMutation = useMutation({
        mutationFn: (id) => adminApi.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsersList']);
            setConfirmModal({ isOpen: false, id: null, name: '' });
        }
    });

    const restoreMutation = useMutation({
        mutationFn: (id) => adminApi.restoreUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsersList']);
        }
    });


    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 ">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 uppercase">User Management</h1>
                        <p className="text-slate-500 mt-1">Control access levels and manage profiles</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/patients/register')}
                            className="btn-secondary flex items-center justify-center gap-2 border-2 border-slate-200 px-6 py-3 rounded-2xl font-bold text-sm tracking-tight hover:bg-slate-50 transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                            Onboard Patient
                        </button>
                        <button
                            onClick={() => navigate('/admin/doctors/register')}
                            className="bg-secondary-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-secondary-900/10 flex items-center gap-3"
                        >
                            <UserPlus className="w-5 h-5 text-primary-400" />
                            Add Professional
                        </button>
                    </div>
                </div>

                <div className="glass-card overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="relative w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="input-field pl-11 py-2 text-sm"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div className="flex gap-2">
                            {['all', 'doctor', 'patient', 'archived'].map(role => (
                                <button
                                    key={role}
                                    onClick={() => {
                                        setFilter(role);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2 text-xs font-bold capitalize rounded-xl border transition-all ${filter === role
                                        ? 'bg-secondary-900 text-white border-secondary-900'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {role === 'all' ? role : role === 'archived' ? 'Archived' : `${role}s`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">User Details</th>
                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-20"></tr>)
                                ) : (
                                    paginatedUsers?.map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${user.isDeleted ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-primary-600 border-slate-200'}`}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold ${user.isDeleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{user.name}</p>
                                                        <p className="text-xs text-slate-400">ID: {user._id.slice(-8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        {user.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {user.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${user.isDeleted ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                                    user.role === 'superadmin' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        user.role === 'doctor' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                    {user.isDeleted ? 'Deleted' : user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                {user.isDeleted ? (
                                                    <button
                                                        onClick={() => restoreMutation.mutate(user._id)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Restore User"
                                                    >
                                                        <RotateCcw className="w-5 h-5" />
                                                    </button>
                                                ) : user.role !== 'superadmin' && (
                                                    <button
                                                        onClick={() => setConfirmModal({ isOpen: true, id: user._id, name: user.name })}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
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
                            totalPages={totalPages}
                            totalItems={filteredUsers?.length || 0}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null, name: '' })}
                onConfirm={() => deleteMutation.mutate(confirmModal.id)}
                title="Delete User?"
                message={`Are you sure you want to delete ${confirmModal.name}? This action cannot be undone and will remove all their data.`}
                confirmText="Yes, Delete"
                cancelText="No, Cancel"
                type="danger"
                isLoading={deleteMutation.isPending}
            />
        </DashboardLayout>
    );
};

export default UserManager;
