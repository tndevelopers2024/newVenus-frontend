import {
    Activity,
    Users,
    UserSquare2,
    MapPin,
    CalendarCheck2,
    BarChart3,
    History,
    ClipboardList,
    Calendar,
    FileEdit,
    History as HistoryIcon,
    Upload
} from 'lucide-react';

export const ADMIN_LINKS = [
    { label: 'Overview', path: '/admin', icon: Activity },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Onboard Patient', path: '/admin/patients/register', icon: UserSquare2 },
    { label: 'Add Doctor', path: '/admin/doctors/register', icon: UserSquare2 },
    { label: 'New Assignment', path: '/admin/appointments', icon: CalendarCheck2 },
    { label: 'Active Assignments', path: '/admin/appointments/list', icon: ClipboardList },
    { label: 'Finance Hub', path: '/admin/billing', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/logs', icon: History },
];

export const DOCTOR_LINKS = [
    { label: 'Dashboard', path: '/doctor', icon: ClipboardList },
    { label: 'Appointments', path: '/doctor/appointments', icon: Calendar },
    { label: 'My Patients', path: '/doctor/patients', icon: Users },
];

export const PATIENT_LINKS = [
    { label: 'Dashboard', path: '/patient', icon: ClipboardList },
    { label: 'Medical History', path: '/patient/history', icon: HistoryIcon },
    { label: 'Test Reports', path: '/patient/reports', icon: Upload },
];

export const getLinksByRole = (role) => {
    switch (role) {
        case 'superadmin':
            return ADMIN_LINKS;
        case 'doctor':
            return DOCTOR_LINKS;
        case 'patient':
            return PATIENT_LINKS;
        default:
            return [];
    }
};
