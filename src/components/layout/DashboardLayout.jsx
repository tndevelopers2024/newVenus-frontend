import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LogOut,
    LayoutDashboard,
    User,
    Calendar,
    FileText,
    Settings,
    Bell,
    Search,
    X,
    Plus,
    Check,
    UserCircle,
    Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { socket } from '../../services/socket';
import toast from 'react-hot-toast';

import { getLinksByRole } from '../../config/navigation';

const Sidebar = ({ links: propLinks }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('sidebarOpen', JSON.stringify(isOpen));
    }, [isOpen]);

    const links = propLinks || getLinksByRole(user?.role);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={`h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${isOpen ? 'w-64' : 'w-20'}`}>
            <div className="p-6 flex items-center justify-between border-b border-slate-50">
                <div className={`flex items-center gap-3 ${!isOpen && 'hidden'}`}>
                    <div className="flex items-center">
                        <img
                            src="/images/venus-logo.webp"
                            alt="Venus Logo"
                            className="w-100 object-contain rounded-lg"
                        />
                    </div>
                </div>
                {/* <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    {isOpen ? <X className="w-5 h-5 text-slate-400" /> : <Menu className="w-5 h-5 text-slate-400" />}
                </button> */}
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {links.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <button
                            key={link.label}
                            onClick={() => navigate(link.path)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? 'bg-secondary-900 text-white shadow-lg shadow-secondary-200'
                                : 'text-slate-600 hover:bg-primary-50 hover:text-primary-600'
                                }`}
                        >
                            <link.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                            {isOpen && <span className={`font-bold text-sm ${isActive ? 'text-white' : 'font-medium'}`}>{link.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 ">
                <div className={`p-3 bg-slate-50 rounded-2xl flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold shrink-0">
                        {user?.name?.charAt(0)}
                    </div>
                    {isOpen && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full mt-4 flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    {isOpen && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </div>
    );
};

const NotificationPanel = ({ onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [realtimeNotifications, setRealtimeNotifications] = useState([]);

    useEffect(() => {
        // Connect socket
        if (!socket.connected) {
            socket.on('connect', () => {
                console.log('Socket connected:', socket.id);
            });
            socket.connect();
        }

        // Listen for notifications
        const onNotification = (data) => {
            // Filter logic: Only show if tailored for this user/role
            let shouldShow = false;

            if (user?.role === 'doctor' && data.doctorId == user._id) {
                shouldShow = true;
            } else if (user?.role === 'superadmin' && !data.doctorId) {
                // System wide or admin specific events
                shouldShow = true;
            }

            if (shouldShow) {
                const newNotification = {
                    id: Date.now(),
                    title: data.action === 'ASSIGN_APPOINTMENT' ? 'New Patient Assigned' : 'System Alert',
                    message: data.message,
                    time: 'Just now',
                    unread: true
                };

                setRealtimeNotifications(prev => [newNotification, ...prev]);

                // Show toast
                toast(newNotification.title, {
                    icon: '🔔',
                    style: {
                        borderRadius: '12px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            }
        };

        socket.on('notification', onNotification);

        return () => {
            socket.off('notification', onNotification);
        };
    }, [user]);

    // Role-based notification logic
    const getNotifications = () => {
        return realtimeNotifications;
    };

    const notifications = getNotifications();

    const handleViewAll = () => {
        if (user?.role === 'superadmin') {
            navigate('/admin/logs');
        } else if (user?.role === 'doctor') {
            navigate('/doctor/patients');
        }
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-4 w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
            >
                <div className="absolute top-3 right-3 z-10">
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-secondary-900"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 uppercase tracking-tight text-xs">
                        {user?.role === 'doctor' ? 'Clinical Alerts' : 'System Notifications'}
                    </h3>
                    <button className="text-[10px] text-primary-600 font-black uppercase tracking-wider hover:text-primary-700 mr-6">Mark all read</button>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map(n => (
                            <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${n.unread ? 'bg-primary-50/30' : ''}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-black uppercase tracking-tight ${n.unread ? 'text-secondary-900' : 'text-slate-500'}`}>{n.title}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{n.time}</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.message}</p>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No new alerts</p>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                        onClick={handleViewAll}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-secondary-900 w-full hover:bg-slate-100 py-2 rounded-lg transition-all"
                    >
                        View All Activity
                    </button>
                </div>
            </motion.div>
        </>
    );
};

const ProfileDropdown = ({ onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-4 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
            >
                <div className="absolute top-2 right-2 z-10">
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-secondary-900"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-lg font-black text-primary-600 shadow-sm border border-primary-100">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="pr-4">
                            <h3 className="font-bold text-slate-900 leading-tight truncate">{user?.name}</h3>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">{user?.role}</p>
                        </div>
                    </div>
                    <div className="mt-3 px-3 py-2 bg-slate-50 rounded-lg text-xs font-medium text-slate-500 truncate">
                        {user?.email}
                    </div>
                </div>

                <div className="p-2">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                    >
                        <div className="p-1.5 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-wider">Sign Out</span>
                    </button>
                </div>
            </motion.div>
        </>
    );
};

const Header = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const { user } = useAuth();

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20">
            <div className="flex-1"></div>
            <div className="flex items-center gap-3 relative">
                {user?.role !== 'patient' && (
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowAccount(false);
                            }}
                            className={`p-2.5 rounded-xl relative transition-all ${showNotifications ? 'bg-primary-50 text-primary-600' : 'bg-white hover:bg-slate-50 text-slate-400 border border-slate-200/50 shadow-sm'}`}
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                        </button>

                        <AnimatePresence>
                            {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
                        </AnimatePresence>
                    </div>
                )}

                <button
                    onClick={() => {
                        setShowAccount(true);
                        setShowNotifications(false);
                    }}
                    className={`p-2.5 rounded-xl transition-all ${showAccount ? 'bg-primary-50 text-primary-600' : 'bg-white hover:bg-slate-50 text-slate-400 border border-slate-200/50 shadow-sm'}`}
                >
                    <UserCircle className="w-5 h-5" />
                </button>

                <AnimatePresence>
                    {showAccount && <ProfileDropdown onClose={() => setShowAccount(false)} />}
                </AnimatePresence>
            </div>
        </header>
    );
};

const DashboardLayout = ({ children, links }) => {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar links={links} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
