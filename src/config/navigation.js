import {
    LayoutDashboard,
    Users,
    UserRoundPlus,
    CalendarPlus,
    CalendarClock,
    CalendarRange,
    History as HistoryIcon,
    Stethoscope,
    Shield,
    ScrollText,
    Pill
} from 'lucide-react';

export const ADMIN_LINKS = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, group: 'Overview' },
    { label: 'Add New Patient', path: '/admin/patients/register', icon: UserRoundPlus, group: 'Register' },
    { label: 'Add New Doctor', path: '/admin/doctors/register', icon: Stethoscope, group: 'Register' },
    { label: 'New Appointment', path: '/admin/appointments', icon: CalendarPlus, group: 'Appointments' },
    { label: 'Today Appointments', path: '/admin/appointments/list?filter=today', icon: CalendarClock, group: 'Appointments' },
    { label: 'Upcoming Appointments', path: '/admin/appointments/list?filter=upcoming', icon: CalendarRange, group: 'Appointments' },
    { label: 'Previous Appointments', path: '/admin/appointments/list?filter=previous', icon: HistoryIcon, group: 'Appointments' },
    { label: 'User Management', path: '/admin/users', icon: Shield, group: 'Manage' },
    { label: 'Patients List', path: '/admin/patients', icon: Users, group: 'Manage' },
    { label: 'Doctors List', path: '/admin/doctors', icon: Stethoscope, group: 'Manage' },
    // { label: 'Finance Hub', path: '/admin/billing', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/logs', icon: ScrollText, group: 'Manage' },
];


export const DOCTOR_LINKS = [
    { label: 'Dashboard', path: '/doctor', icon: LayoutDashboard, group: 'Overview' },
    { label: 'Today Appointments', path: '/doctor/appointments?filter=today', icon: CalendarClock, group: 'Appointments' },
    { label: 'Upcoming Appointments', path: '/doctor/appointments?filter=upcoming', icon: CalendarRange, group: 'Appointments' },
    { label: 'Previous Appointments', path: '/doctor/appointments?filter=previous', icon: HistoryIcon, group: 'Appointments' },
    { label: 'My Patients', path: '/doctor/patients', icon: Users, group: 'Patients' },
];

export const PHARMACY_LINKS = [
    { label: 'Drug Formulary', path: '/pharmacy', icon: Pill },
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
        case 'pharmacy':
            return PHARMACY_LINKS;
        // case 'patient':
        //     return PATIENT_LINKS;
        default:
            return [];
    }
};
