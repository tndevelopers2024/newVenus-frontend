import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History, Users, Trash2, Shield, UserPlus, Search, Mail, Phone, RotateCcw, LayoutDashboard, Pencil, X, Lock, Unlock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';
import { matchesPatientQuery } from '../../utils/searchUtils';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AppLoader from '../../components/shared/AppLoader';
import TablePagination from '../../components/shared/TablePagination';
import ConfirmationModal from '../../components/shared/ConfirmationModal';
import PatientHistoryDrawer from '../../components/shared/PatientHistoryDrawer';

const UserManager = ({ defaultFilter = 'all' }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState(defaultFilter);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });
    const [editModal, setEditModal] = useState({ isOpen: false, user: null });
    const [historyPatientId, setHistoryPatientId] = useState(null);

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
        const matchesSearch = matchesPatientQuery(user, searchTerm);

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


    const activeUsers = (users || []).filter(u => !u.isDeleted);
    const counts = {
        all: activeUsers.length,
        doctor: activeUsers.filter(u => u.role === 'doctor').length,
        patient: activeUsers.filter(u => u.role === 'patient').length,
        pharmacy: activeUsers.filter(u => u.role === 'pharmacy').length,
        archived: (users || []).filter(u => u.isDeleted).length
    };
    const tabLabels = { all: 'All', doctor: 'Doctors', patient: 'Patients', pharmacy: 'Pharmacy', archived: 'Archived' };
    const showRole = ['all', 'archived'].includes(filter);
    const colCount = showRole ? 5 : 4;

    const initialsOf = (name) =>
        (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    const roleChipClass = (user) =>
        user.isDeleted ? 'bg-slate-100 text-muted border-line' :
            user.role === 'superadmin' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                user.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    user.role === 'doctor' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        user.role === 'pharmacy' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200';

    const avatarClass = (user) =>
        user.isDeleted ? 'bg-rose-50 text-rose-600' :
            user.role === 'doctor' ? 'bg-indigo-50 text-indigo-700' :
                user.role === 'patient' ? 'bg-primary-50 text-primary-700' :
                    'bg-secondary-50 text-secondary-700';

    const renderUser = (user) => (
        <div
            className={`flex items-center gap-3 min-w-0 ${user.role === 'patient' && !user.isDeleted ? 'cursor-pointer group' : ''}`}
            onClick={user.role === 'patient' && !user.isDeleted ? () => setHistoryPatientId(user._id) : undefined}
            title={user.role === 'patient' && !user.isDeleted ? 'View visit history' : undefined}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarClass(user)}`}>
                {initialsOf(user.name)}
            </div>
            <div className="min-w-0">
                <p className={`text-sm font-semibold truncate flex items-center gap-2 group-hover:text-primary-700 ${user.isDeleted ? 'text-muted line-through' : 'text-ink'}`}>
                    {user.name}
                    {user.isLocked && !user.isDeleted && (
                        <span className="no-underline inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 h-5">
                            <Lock className="w-3 h-3" /> Locked
                        </span>
                    )}
                </p>
                <p className="text-[13px] text-muted mt-0.5">#{getDisplayId(user)}</p>
            </div>
        </div>
    );

    const renderContact = (user) => (
        <div className="space-y-1 min-w-0">
            <p className="flex items-center gap-2 text-sm text-ink truncate">
                <Mail className="w-3.5 h-3.5 text-subtle shrink-0" />
                <span className="truncate">{user.email || <span className="text-subtle">–</span>}</span>
            </p>
            <p className="flex items-center gap-2 text-sm text-ink tabular-nums">
                <Phone className="w-3.5 h-3.5 text-subtle shrink-0" />
                {user.phone || <span className="text-subtle">–</span>}
            </p>
        </div>
    );

    const renderDetails = (user) => (
        <div>
            <p className="text-sm text-ink">
                {user.age ? `${user.age} yrs` : 'Age N/A'}
                <span className="text-subtle"> · </span>
                {user.gender || 'N/A'}
            </p>
            <p className="text-[13px] text-muted mt-0.5 truncate max-w-[220px]">
                <span className="text-subtle">{user.role === 'doctor' ? 'Specialization: ' : 'Occupation: '}</span>
                {user.role === 'doctor' ? (user.specialization || 'N/A') : (user.occupation || 'N/A')}
            </p>
        </div>
    );

    const renderRole = (user) => (
        <span className={`ui-chip capitalize ${roleChipClass(user)}`}>
            {user.isDeleted ? `Deleted ${user.role}` : user.isLocked ? `Locked ${user.role}` : user.role}
        </span>
    );

    const renderActions = (user) => (
        <>
            {user.role === 'patient' && !user.isDeleted && (
                <button
                    onClick={() => setHistoryPatientId(user._id)}
                    className="ui-icon-btn"
                    title="View visit history"
                >
                    <History className="w-4 h-4" />
                </button>
            )}
            {user.role === 'doctor' && !user.isDeleted && (
                <button
                    onClick={() => {
                        localStorage.setItem('viewAsDoctorId', user._id);
                        navigate('/doctor');
                    }}
                    className="ui-icon-btn hover:!text-primary-700 hover:!bg-primary-50"
                    title="View Doctor Dashboard"
                >
                    <LayoutDashboard className="w-[18px] h-[18px]" />
                </button>
            )}
            {user.isDeleted ? (
                <button
                    onClick={() => restoreMutation.mutate(user._id)}
                    className="ui-btn-soft"
                    title="Restore User"
                >
                    <RotateCcw className="w-4 h-4" /> Restore
                </button>
            ) : user.role !== 'superadmin' && (
                <>
                    {user.role !== 'patient' && (
                        <button
                            onClick={() => toggleLockMutation.mutate(user._id)}
                            className={`ui-icon-btn hover:!text-amber-600 hover:!bg-amber-50 ${user.isLocked ? '!text-amber-600 !bg-amber-50' : ''}`}
                            title={user.isLocked ? 'Unlock User' : 'Lock User'}
                        >
                            {user.isLocked ? <Unlock className="w-[18px] h-[18px]" /> : <Lock className="w-[18px] h-[18px]" />}
                        </button>
                    )}
                    <button
                        onClick={() => setEditModal({ isOpen: true, user })}
                        className="ui-icon-btn hover:!text-sky-700 hover:!bg-sky-50"
                        title="Edit User"
                    >
                        <Pencil className="w-[18px] h-[18px]" />
                    </button>
                    <button
                        onClick={() => setConfirmModal({ isOpen: true, id: user._id, name: user.name })}
                        className="ui-icon-btn-danger"
                        title="Delete User"
                    >
                        <Trash2 className="w-[18px] h-[18px]" />
                    </button>
                </>
            )}
        </>
    );

    const emptyState = (
        <div className="py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-subtle" />
            </div>
            <p className="text-base font-semibold text-ink">
                {filter === 'all' ? 'No users found' :
                    filter === 'doctor' ? 'No doctors found' :
                        filter === 'patient' ? 'No patients found' :
                            filter === 'pharmacy' ? 'No pharmacy users found' :
                                'No archived records found'}
            </p>
            <p className="text-sm text-muted mt-1">{searchTerm ? 'Try a different name, ID or phone number.' : 'Nothing to show here yet.'}</p>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div>
                        <h1 className="page-title">
                            {filter === 'doctor' ? 'Doctors Directory' : filter === 'patient' ? 'Patients Directory' : 'User Management'}
                        </h1>
                        <p className="page-sub">
                            {filter === 'doctor' ? 'Manage medical professionals and access their dashboards' : filter === 'patient' ? 'Manage registered patients and active profiles' : 'Control access levels and manage profiles'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => navigate('/admin/patients/register')}
                            className={`${filter === 'doctor' ? 'ui-btn-outline' : 'ui-btn-dark'} !h-10 !px-4`}
                        >
                            <UserPlus className="w-4 h-4" />
                            Add New Patient
                        </button>
                        <button
                            onClick={() => navigate('/admin/doctors/register')}
                            className={`${filter === 'doctor' ? 'ui-btn-dark' : 'ui-btn-outline'} !h-10 !px-4`}
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Doctor
                        </button>
                    </div>
                </div>

                {/* Toolbar: tabs / count + search */}
                <div className="ui-card p-3 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {defaultFilter === 'all' ? (
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto self-start max-w-full">
                            {['all', 'doctor', 'patient', 'pharmacy', 'archived'].map(role => {
                                const active = filter === role;
                                return (
                                    <button
                                        key={role}
                                        onClick={() => {
                                            setFilter(role);
                                            setCurrentPage(1);
                                        }}
                                        className={`h-8 px-3.5 rounded-md text-[13px] font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
                                    >
                                        {tabLabels[role]}
                                        <span className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center tabular-nums ${active ? 'bg-secondary-900 text-white' : 'bg-white text-muted'}`}>
                                            {isLoading ? '–' : counts[role]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-1">
                            <span className="text-2xl font-bold text-ink tabular-nums leading-none">{isLoading ? '–' : counts[filter]}</span>
                            <span className="text-sm text-muted">{filter === 'doctor' ? 'doctors' : 'patients'} registered</span>
                        </div>
                    )}

                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name, ID or phone"
                            className="ui-input pl-10 pr-9"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
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
                                    <th>User</th>
                                    <th>Contact</th>
                                    <th>Details</th>
                                    {showRole && <th>Role</th>}
                                    <th className="!text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={colCount}><AppLoader fullScreen={false} compact label="Loading" /></td></tr>
                                ) : !paginatedUsers || paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={colCount}>{emptyState}</td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <tr key={user._id}>
                                            <td>{renderUser(user)}</td>
                                            <td>{renderContact(user)}</td>
                                            <td>{renderDetails(user)}</td>
                                            {showRole && <td>{renderRole(user)}</td>}
                                            <td>
                                                <div className="flex items-center justify-end gap-1">
                                                    {renderActions(user)}
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
                            <AppLoader fullScreen={false} compact label="Loading" />
                        ) : !paginatedUsers || paginatedUsers.length === 0 ? (
                            emptyState
                        ) : (
                            paginatedUsers.map((user) => (
                                <div key={user._id} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        {renderUser(user)}
                                        {showRole && renderRole(user)}
                                    </div>
                                    {renderContact(user)}
                                    {renderDetails(user)}
                                    <div className="flex items-center justify-end gap-1 pt-1">
                                        {renderActions(user)}
                                    </div>
                                </div>
                            ))
                        )}
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

            {historyPatientId && (
                <PatientHistoryDrawer patientId={historyPatientId} onClose={() => setHistoryPatientId(null)} />
            )}

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
                <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-line flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-sm font-bold">{initialsOf(editModal.user.name)}</span>
                                <div>
                                    <h3 className="text-lg font-bold text-ink leading-tight">Edit user details</h3>
                                    <p className="text-xs text-muted capitalize">{editModal.user.role} · #{getDisplayId(editModal.user)}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditModal({ isOpen: false, user: null })} className="ui-icon-btn shrink-0">
                                <X className="w-5 h-5" />
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
                        }} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-semibold text-ink block">Name</label>
                                    <input type="text" name="name" defaultValue={editModal.user.name} className="ui-input" required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-semibold text-ink block">Phone</label>
                                    <input type="text" name="phone" defaultValue={editModal.user.phone} className="ui-input" required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-semibold text-ink block">Email</label>
                                    <input type="email" name="email" defaultValue={editModal.user.email} className="ui-input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-semibold text-ink block">Age</label>
                                    <input type="number" name="age" defaultValue={editModal.user.age} className="ui-input" required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-semibold text-ink block">Gender</label>
                                    <select name="gender" defaultValue={editModal.user.gender} className="ui-input" required>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                {editModal.user.role === 'patient' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-semibold text-ink block">Occupation</label>
                                        <input type="text" name="occupation" defaultValue={editModal.user.occupation} className="ui-input" />
                                    </div>
                                )}
                                {editModal.user.role === 'doctor' && (
                                    <>
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[13px] font-semibold text-ink block">Specialization</label>
                                            <input type="text" name="specialization" defaultValue={editModal.user.specialization} className="ui-input" />
                                        </div>
                                        <div className="col-span-2 mt-2 pt-4 border-t border-line">
                                            <h4 className="text-sm font-bold text-ink mb-3">Prescription header details</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[13px] font-semibold text-ink block">Qualification</label>
                                                    <input type="text" name="doctorDetails.qualification" defaultValue={editModal.user.doctorDetails?.qualification} className="ui-input" placeholder="e.g. M.B.B.S., M.D." />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[13px] font-semibold text-ink block">Name in Tamil</label>
                                                    <input type="text" name="doctorDetails.nameTamil" defaultValue={editModal.user.doctorDetails?.nameTamil} className="ui-input" placeholder="டாக்டர். ..." />
                                                </div>
                                                <div className="space-y-1.5 col-span-2">
                                                    <label className="text-[13px] font-semibold text-ink block">Additional Qualifications</label>
                                                    <input type="text" name="doctorDetails.additionalQualifications" defaultValue={editModal.user.doctorDetails?.additionalQualifications} className="ui-input" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[13px] font-semibold text-ink block">Role Title</label>
                                                    <input type="text" name="doctorDetails.roleTitle" defaultValue={editModal.user.doctorDetails?.roleTitle} className="ui-input" placeholder="SENIOR CONSULTANT..." />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[13px] font-semibold text-ink block">Registration Number</label>
                                                    <input type="text" name="doctorDetails.regdNo" defaultValue={editModal.user.doctorDetails?.regdNo} className="ui-input" placeholder="Regd. No. 65502" />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white z-10 pb-1 border-t border-line -mx-6 px-6">
                                <button type="button" onClick={() => setEditModal({ isOpen: false, user: null })} className="ui-btn-outline !h-10 !px-5">
                                    Cancel
                                </button>
                                <button type="submit" disabled={updateMutation.isPending} className="ui-btn-dark !h-10 !px-6">
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
