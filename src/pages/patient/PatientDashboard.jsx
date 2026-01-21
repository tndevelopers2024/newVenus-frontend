import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Calendar,
    History as HistoryIcon,
    Upload,
    ClipboardList,
    Clock,
    ChevronRight,
    Plus,
    CreditCard,
    Activity as ActivityIcon,
    Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { patientApi } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';

const PatientDashboard = () => {
    const { user } = useAuth();

    const { data: historyData, isLoading } = useQuery({
        queryKey: ['patientHistory'],
        queryFn: async () => {
            const res = await patientApi.getHistory();
            return res.data;
        }
    });


    // Derived stats
    const nextAppointment = historyData?.appointments?.find(a => new Date(a.date) > new Date() && a.status !== 'Cancelled');
    const lastPrescription = historyData?.prescriptions?.[0];
    const unpaidInvoices = historyData?.invoices?.filter(inv => inv.status === 'Unpaid') || [];
    const totalPendingAmount = unpaidInvoices.reduce((acc, current) => acc + current.totalAmount, 0);

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-start mb-6 md:mb-10">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tighter uppercase">NEW VENUS CLINIC</h1>
                        <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">Healthcare Excellence • {user?.name}</p>
                    </div>
                </div>

                {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="glass-card p-6 border-l-4 border-l-primary-500 overflow-hidden relative group">
                        <div className="relative z-10 ">
                            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-4">
                                <Clock className="w-5 h-5" />
                            </div>
                            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Next Visit</h3>
                            <p className="text-xl font-black text-secondary-900">
                                {nextAppointment ? new Date(nextAppointment.date).toLocaleDateString('en-GB') : 'No upcoming'}
                            </p>
                            <p className="text-xs font-bold text-primary-600 mt-1 truncate">
                                {nextAppointment ? `Dr. ${nextAppointment.doctor?.name}` : 'Await assignment'}
                            </p>
                        </div>
                        <Activity className="absolute bottom-[-10px] right-[-10px] w-24 h-24 text-primary-100/50 group-hover:scale-110 transition-transform" />
                    </div>

                    <div className="glass-card p-6 border-l-4 border-l-emerald-500 overflow-hidden relative group">
                        <div className="relative z-10 ">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                                <HistoryIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Health Records</h3>
                            <p className="text-xl font-black text-secondary-900">
                                {lastPrescription ? 'View Rx' : 'Initialize'}
                            </p>
                            <p className="text-xs font-bold text-emerald-600 mt-1">
                                {lastPrescription ? `Ref: ${new Date(lastPrescription.createdAt).toLocaleDateString('en-GB')}` : 'Latest prescription'}
                            </p>
                        </div>
                        <FileTextIcon className="absolute bottom-[-10px] right-[-10px] w-24 h-24 text-emerald-100/50 group-hover:scale-110 transition-transform" />
                    </div>

                    <Link to="/patient/reports" className="glass-card p-6 border-l-4 border-l-amber-500 overflow-hidden relative group cursor-pointer transition-all hover:shadow-xl hover:shadow-amber-500/5">
                        <div className="relative z-10 ">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:rotate-12 transition-transform">
                                <Upload className="w-5 h-5" />
                            </div>
                            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Test Reports</h3>
                            <p className="text-xl font-black text-secondary-900">{historyData?.reports?.length || 0} Records</p>
                            <p className="text-xs font-bold text-amber-600 mt-1">Secure Digital Storage</p>
                        </div>
                        <ClipboardList className="absolute bottom-[-10px] right-[-10px] w-24 h-24 text-amber-100/50 group-hover:scale-110 transition-transform" />
                    </Link>

                    <Link to="/patient/history" className="glass-card p-6 border-l-4 border-l-rose-500 overflow-hidden relative group flex flex-col justify-between">
                        <div className="relative z-10 ">
                            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 mb-4">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Pending Dues</h3>
                            <p className="text-xl font-black text-secondary-900 ">₹{totalPendingAmount}</p>
                            <p className="text-xs font-bold text-rose-600 mt-1 underline decoration-rose-200">
                                {unpaidInvoices.length} Bills to pay
                            </p>
                        </div>
                        <ChevronRight className="self-end text-rose-300 group-hover:text-rose-600 transition-all" />
                    </Link>
                </div> */}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="lg:col-span-2 glass-card p-4 md:p-8">
                        <div className="flex items-center justify-between mb-8 md:mb-10">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-secondary-900 uppercase tracking-tighter">Treatment Timeline</h3>
                                <p className="text-slate-400 text-xs md:text-sm font-bold">Premium Comprehensive Health Tracking</p>
                            </div>
                            <Link to="/patient/history" className="text-primary-600 text-[10px] md:text-xs font-black uppercase tracking-widest hover:underline decoration-primary-200">Full Archive</Link>
                        </div>

                        {isLoading ? (
                            <div className="animate-pulse space-y-6">
                                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 rounded-3xl"></div>)}
                            </div>
                        ) : (
                            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100">
                                {historyData?.appointments?.length === 0 && (
                                    <div className="text-center py-20">
                                        <ActivityIcon className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No entries in your health ledger</p>
                                    </div>
                                )}
                                {historyData?.appointments?.slice(0, 5).map((appt, i) => (
                                    <div key={appt._id} className="relative pl-10 md:pl-12 group">
                                        <div className="absolute left-0 top-6 w-8 h-8 rounded-full bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center group-hover:border-primary-200 transition-all z-10">
                                            <div className={`w-2.5 h-2.5 rounded-full ${appt.status === 'Completed' ? 'bg-emerald-500' : 'bg-primary-400'} shadow-sm`}></div>
                                        </div>
                                        <div className="p-4 md:p-6 bg-white border border-slate-50 rounded-3xl group-hover:shadow-2xl group-hover:shadow-primary-500/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 border-b-4 border-b-slate-50 hover:border-b-primary-100">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                        {new Date(appt.date).toLocaleDateString('en-GB')}
                                                    </span>
                                                </div>
                                                <h4 className="text-lg md:text-xl font-black text-secondary-900 uppercase tracking-tighter mb-1">{appt.reason || 'General Checkup'}</h4>
                                                <p className="text-xs md:text-sm font-bold text-slate-500">
                                                    Attended by <span className="text-secondary-900">Dr. {appt.doctor?.name}</span>
                                                </p>
                                            </div>
                                            <div className="flex gap-4">
                                                <Link to="/patient/history" className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-tighter transition-all">Details</Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass-card p-4 md:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg md:text-xl font-black text-secondary-900 uppercase tracking-tighter">Recent Reports</h3>
                            <Link to="/patient/reports" className="text-amber-600 text-[10px] font-black uppercase tracking-widest hover:underline">View Vault</Link>
                        </div>

                        <div className="space-y-4">
                            {isLoading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-2xl" />)
                            ) : historyData?.reports?.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-100">
                                    <FileTextIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No reports yet</p>
                                </div>
                            ) : (
                                historyData?.reports?.slice(-4).reverse().map((report) => (
                                    <div key={report._id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all group flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500 group-hover:rotate-6 transition-transform shrink-0">
                                            <FileTextIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-xs font-black text-secondary-900 uppercase truncate">{report.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(report.uploadedAt).toLocaleDateString('en-GB')}</p>
                                        </div>
                                        <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-300 hover:text-amber-600 transition-colors">
                                            <Eye className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>

                        <Link to="/patient/reports" className="w-full mt-8 py-4 bg-secondary-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-secondary-200">
                            <Upload className="w-4 h-4" />
                            Upload Laboratory Data
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

// Supporting Icons for background
const Activity = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const FileTextIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

export default PatientDashboard;
