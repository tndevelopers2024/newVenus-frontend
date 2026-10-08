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
    Upload,
    Stethoscope,
    Shield
} from 'lucide-react';

export const ADMIN_LINKS = [
    { label: 'Dashboard', path: '/admin', icon: Activity },
    { label: 'Add New Patient', path: '/admin/patients/register', icon: UserSquare2 },
    { label: 'Add New Doctor', path: '/admin/doctors/register', icon: UserSquare2 },
    { label: 'New Appointment', path: '/admin/appointments', icon: CalendarCheck2 },
    { label: 'Today Appointments', path: '/admin/appointments/list?filter=today', icon: ClipboardList },
    { label: 'Upcoming Appointments', path: '/admin/appointments/list?filter=upcoming', icon: Calendar },
    { label: 'Previous Appointments', path: '/admin/appointments/list?filter=previous', icon: HistoryIcon },
    { label: 'User Management', path: '/admin/users', icon: Shield },
    { label: 'Patients List', path: '/admin/patients', icon: Users },
    { label: 'Doctors List', path: '/admin/doctors', icon: Stethoscope },
    // { label: 'Finance Hub', path: '/admin/billing', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/logs', icon: History },
];


export const DOCTOR_LINKS = [
    { label: 'Dashboard', path: '/doctor', icon: ClipboardList },
    { label: 'Today Appointments', path: '/doctor/appointments?filter=today', icon: Calendar },
    { label: 'Upcoming Appointments', path: '/doctor/appointments?filter=upcoming', icon: CalendarCheck2 },
    { label: 'Previous Appointments', path: '/doctor/appointments?filter=previous', icon: HistoryIcon },
    { label: 'My Patients', path: '/doctor/patients', icon: Users },
];

// Removed PATIENT_LINKS

export const getLinksByRole = (role) => {
    switch (role) {
        case 'superadmin':
            return ADMIN_LINKS;
        case 'admin':
            return ADMIN_LINKS.filter(link => 
                ['/admin', '/admin/patients/register', '/admin/appointments', '/admin/appointments/list?filter=today', '/admin/appointments/list?filter=upcoming', '/admin/appointments/list?filter=previous'].includes(link.path)
            );
        case 'doctor':
            return DOCTOR_LINKS;
        // case 'patient':
        //     return PATIENT_LINKS;
        default:
            return [];
    }
};
