import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, User, ArrowLeft } from 'lucide-react';
import { adminApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';

const DepartmentManager = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showAdd, setShowAdd] = useState(false);
    const [newDept, setNewDept] = useState({ name: '', description: '', headId: '' });

    const { data: departments, isLoading } = useQuery({
        queryKey: ['adminDepartments'],
        queryFn: async () => {
            const res = await adminApi.getDepartments();
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (data) => adminApi.createDepartment(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminDepartments']);
            setShowAdd(false);
        }
    });

    const adminLinks = [
        { label: 'Dashboard', path: '/admin', icon: MapPin },
        { label: 'Departments', path: '/admin/departments', icon: MapPin },
    ];

    return (
        <DashboardLayout links={adminLinks}>
            <div className="max-w-7xl mx-auto py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 ">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Departments</h1>
                        <p className="text-slate-500 mt-1">Manage hospital specialized divisions</p>
                    </div>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="btn-primary flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        New Division
                    </button>
                </div>

                {showAdd && (
                    <div className="glass-card p-8 mb-10 border-2 border-primary-100 bg-primary-50/10">
                        <h3 className="text-xl font-bold mb-6 ">Initialize New Department</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <input
                                placeholder="Department Name (e.g. Cardiology)"
                                className="input-field"
                                onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                            />
                            <input
                                placeholder="Department Head ID (optional)"
                                className="input-field"
                                onChange={e => setNewDept({ ...newDept, headId: e.target.value })}
                            />
                            <textarea
                                placeholder="Brief description of the department's focus..."
                                className="input-field md:col-span-2 h-24"
                                onChange={e => setNewDept({ ...newDept, description: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowAdd(false)} className="btn-secondary px-8">Cancel</button>
                            <button
                                onClick={() => createMutation.mutate(newDept)}
                                className="btn-primary px-10"
                            >
                                {createMutation.isPending ? 'Saving...' : 'Create Department'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-2xl" />)
                    ) : (
                        departments?.map((dept) => (
                            <div key={dept._id} className="glass-card p-6 hover:shadow-xl transition-all group">
                                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-12">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{dept.name}</h3>
                                <p className="text-sm text-slate-500 mb-6 line-clamp-2">{dept.description || 'No description available for this division.'}</p>
                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-bold border border-white">
                                            {dept.head?.name?.charAt(0) || <User className="w-4 h-4" />}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">{dept.head?.name || 'No Head Assigned'}</span>
                                    </div>
                                    <button className="text-primary-600 text-xs font-bold hover:underline">View Staff</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DepartmentManager;
