import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Trash2, Shield, UserPlus, Search, Mail, Phone, RotateCcw, LayoutDashboard, Pencil, X, Lock, Unlock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TablePagination from '../../components/shared/TablePagination';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const UserManager = ({ defaultFilter = 'all' }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState(defaultFilter);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });
    const [editModal, setEditModal] = useState({ isOpen: false, user: null });

    useEffect(() => {
        setFilter(defaultFilter);
        setCurrentPage(1);
    }, [defaultFilter]);

    const { data: users, isLoading } = useQuery({
        queryKey: ['adminUsersList'],
        queryFn: async () => {
            const res = await adminApi.getUsers();
            return res.data;
        }
    });

    const filteredUsers = users?.filter(user => {
        const matchesSearch = 
            (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        if (filter === 'archived') {
            return user.isDeleted && matchesSearch;
        }
        // For other tabs (all, doctor, patient), exclude deleted users
        const isNotDeleted = !user.isDeleted;
        const matchesRole = filter === 'all' || user.role === filter;
        
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

    const getDisplayId = (user) => {
        if (!user) return 'XXX-000';
        if (user.displayId) return user.displayId;
        if (!user.name || !user._id) return 'XXX-000';
        const prefix = user.name.slice(0, 3).toUpperCase();
        const decimal = parseInt(user._id.slice(-4), 16);
        const suffix = (decimal % 1000).toString().padStart(3, '0');
        return `${prefix}-${suffix}`;
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

    const updateMutation = useMutation({
        mutationFn: (data) => adminApi.updateUser(data._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsersList']);
            setEditModal({ isOpen: false, user: null });
            toast.success('User updated successfully');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error updating user');
        }
    });

    const toggleLockMutation = useMutation({
        mutationFn: (id) => adminApi.toggleUserLock(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsersList']);
            toast.success('User lock status updated');
        }
    });


    return (
        <DashboardLayout>
            <div className="max-w-8xl mx-auto py-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 ">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 uppercase">
                            {filter === 'doctor' ? 'Doctors Directory' : filter === 'patient' ? 'Patients Directory' : 'User Management'}
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {filter === 'doctor' ? 'Manage medical professionals and access their dashboards' : filter === 'patient' ? 'Manage registered patients and active profiles' : 'Control access levels and manage profiles'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/patients/register')}
                            className="btn-secondary flex items-center justify-center gap-2 border-2 border-slate-200 px-6 py-3 rounded-2xl font-bold text-sm tracking-tight hover:bg-slate-50 transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add New Patient
                        </button>
                        <button
                            onClick={() => navigate('/admin/doctors/register')}
                            className="bg-secondary-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-secondary-900/10 flex items-center gap-3"
                        >
                            <UserPlus className="w-5 h-5 text-primary-400" />
                            Add Doctor
                        </button>
                    </div>
                </div>

                <div className="glass-card overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 gap-2">
                        <div className="relative w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email or phone..."
                                className="input-field pl-11 py-2 text-sm"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        {defaultFilter === 'all' && (
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
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">User Details</th>
                                    <th className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                                    <th className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Basic Details</th>
                                    {['all', 'archived'].includes(filter) && (
                                        <th className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                    )}
                                    <th className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-20"></tr>)
                                ) : !paginatedUsers || paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={['all', 'archived'].includes(filter) ? "5" : "4"} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center grayscale opacity-30">
                                                <Users className="w-12 h-12 mb-4" />
                                                <p className="text-xs font-black uppercase tracking-widest">
                                                    {filter === 'all' ? 'No users found' :
                                                        filter === 'doctor' ? 'No doctors found' :
                                                            filter === 'patient' ? 'No patients found' :
                                                                'No archived records found'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers?.map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border text-sm ${user.isDeleted ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-primary-600 border-slate-200'}`}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold ${user.isDeleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{user.name}</p>
                                                        <p className="text-xs text-slate-400">#{getDisplayId(user)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
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
                                            <td className="px-3 py-2">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="font-bold text-slate-600 uppercase tracking-wider">Age:</span> {user.age || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="font-bold text-slate-600 uppercase tracking-wider">Gender:</span> {user.gender || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="font-bold text-slate-600 uppercase tracking-wider">{user.role === 'doctor' ? 'Spec:' : 'Job:'}</span> {user.role === 'doctor' ? (user.specialization || 'N/A') : (user.occupation || 'N/A')}
                                                    </div>
                                                </div>
                                            </td>
                                            {['all', 'archived'].includes(filter) && (
                                                <td className="px-3 py-2">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border whitespace-nowrap inline-block ${user.isDeleted ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                                        user.role === 'superadmin' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        user.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            user.role === 'doctor' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        }`}>
                                                        {user.isDeleted ? `Deleted ${user.role}` : user.isLocked ? `Locked ${user.role}` : user.role}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    {user.role === 'doctor' && !user.isDeleted && (
                                                        <button
                                                            onClick={() => {
                                                                localStorage.setItem('viewAsDoctorId', user._id);
                                                                navigate('/doctor');
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                                            title="View Doctor Dashboard"
                                                        >
                                                            <LayoutDashboard className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {user.isDeleted ? (
                                                        <button
                                                            onClick={() => restoreMutation.mutate(user._id)}
                                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                                            title="Restore User"
                                                        >
                                                            <RotateCcw className="w-5 h-5" />
                                                        </button>
                                                    ) : user.role !== 'superadmin' && (
                                                        <>
                                                            {user.role !== 'patient' && (
                                                                <button
                                                                    onClick={() => toggleLockMutation.mutate(user._id)}
                                                                    className={`p-2 rounded-xl transition-all ${user.isLocked ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                                                    title={user.isLocked ? "Unlock User" : "Lock User"}
                                                                >
                                                                    {user.isLocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setEditModal({ isOpen: true, user })}
                                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                                title="Edit User"
                                                            >
                                                                <Pencil className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmModal({ isOpen: true, id: user._id, name: user.name })}
                                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
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

            {editModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-bold text-slate-900">Edit User Details</h3>
                            <button onClick={() => setEditModal({ isOpen: false, user: null })} className="p-2 hover:bg-slate-50 rounded-xl transition-colors shrink-0">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData);
                            
                            if (editModal.user.role === 'doctor') {
                                data.doctorDetails = {
                                    qualification: data['doctorDetails.qualification'],
                                    nameTamil: data['doctorDetails.nameTamil'],
                                    additionalQualifications: data['doctorDetails.additionalQualifications'],
                                    roleTitle: data['doctorDetails.roleTitle'],
                                    regdNo: data['doctorDetails.regdNo']
                                };
                                delete data['doctorDetails.qualification'];
                                delete data['doctorDetails.nameTamil'];
                                delete data['doctorDetails.additionalQualifications'];
                                delete data['doctorDetails.roleTitle'];
                                delete data['doctorDetails.regdNo'];
                            }

                            data._id = editModal.user._id;
                            updateMutation.mutate(data);
                        }} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                                    <input type="text" name="name" defaultValue={editModal.user.name} className="input-field w-full" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                                    <input type="text" name="phone" defaultValue={editModal.user.phone} className="input-field w-full" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                    <input type="email" name="email" defaultValue={editModal.user.email} className="input-field w-full" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                                    <input type="number" name="age" defaultValue={editModal.user.age} className="input-field w-full" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                                    <select name="gender" defaultValue={editModal.user.gender} className="input-field w-full" required>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                {editModal.user.role === 'patient' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Occupation</label>
                                        <input type="text" name="occupation" defaultValue={editModal.user.occupation} className="input-field w-full" />
                                    </div>
                                )}
                                {editModal.user.role === 'doctor' && (
                                    <>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Specialization</label>
                                            <input type="text" name="specialization" defaultValue={editModal.user.specialization} className="input-field w-full" />
                                        </div>
                                        <div className="col-span-2 mt-4 pt-4 border-t border-slate-100">
                                            <h4 className="text-sm font-bold text-slate-900 mb-4">Prescription Header Details</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Qualification</label>
                                                    <input type="text" name="doctorDetails.qualification" defaultValue={editModal.user.doctorDetails?.qualification} className="input-field w-full" placeholder="e.g. M.B.B.S., M.D." />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Name in Tamil</label>
                                                    <input type="text" name="doctorDetails.nameTamil" defaultValue={editModal.user.doctorDetails?.nameTamil} className="input-field w-full" placeholder="டாக்டர். ..." />
                                                </div>
                                                <div className="space-y-2 col-span-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Additional Qualifications</label>
                                                    <input type="text" name="doctorDetails.additionalQualifications" defaultValue={editModal.user.doctorDetails?.additionalQualifications} className="input-field w-full" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Role Title</label>
                                                    <input type="text" name="doctorDetails.roleTitle" defaultValue={editModal.user.doctorDetails?.roleTitle} className="input-field w-full" placeholder="SENIOR CONSULTANT..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Registration Number</label>
                                                    <input type="text" name="doctorDetails.regdNo" defaultValue={editModal.user.doctorDetails?.regdNo} className="input-field w-full" placeholder="Regd. No. 65502" />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white z-10 pb-2">
                                <button type="button" onClick={() => setEditModal({ isOpen: false, user: null })} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={updateMutation.isPending} className="bg-secondary-900 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-600 transition-all">
                                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default UserManager;
