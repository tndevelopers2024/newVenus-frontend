import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor for JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Patient API
export const patientApi = {
    getHistory: () => api.get('/patient/history'),
    getDoctors: () => api.get('/patient/doctors'),
    getDepartments: () => api.get('/patient/departments'),
    getAppointments: () => api.get('/patient/appointments'),
    // bookAppointment: (data) => api.post('/patient/appointments', data), // Disabled
    uploadReport: (formData) => api.post('/patient/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// Doctor API
export const doctorApi = {
    getAppointments: () => api.get('/doctor/appointments'),
    updateAppointment: (id, data) => api.put(`/doctor/appointments/${id}`, data),
    getPatients: () => api.get('/doctor/patients'),
    getPatientHistory: (id) => api.get(`/doctor/patients/${id}/history`),
    createPrescription: (data) => api.post('/doctor/prescriptions', data),
    searchMedications: (query) => api.get(`/doctor/medications/search?query=${query}`),
    getPrescriptionByAppointment: (id) => api.get(`/doctor/appointments/${id}/prescription`),
    updatePaymentStatus: (id, status) => api.patch(`/doctor/appointments/${id}/payment`, { status }),
};

// Admin API
export const adminApi = {
    getUsers: () => api.get('/admin/users'),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    restoreUser: (id) => api.put(`/admin/users/${id}/restore`),
    createDoctor: (data) => api.post('/admin/doctors', data),
    createPatient: (data) => api.post('/admin/patients', data),
    getDepartments: () => api.get('/admin/departments'),
    createDepartment: (data) => api.post('/admin/departments', data),
    getInvoices: () => api.get('/admin/invoices'),
    getAuditLogs: () => api.get('/admin/logs'),
    getAppointments: () => api.get('/admin/appointments'),
    assignAppointment: (data) => api.post('/admin/appointments', data),
    deleteAppointment: (id) => api.delete(`/admin/appointments/${id}`),
    updateInvoiceStatus: (id, status) => api.patch(`/admin/invoices/${id}/status`, { status }),
};

// Auth API
export const authApi = {
    login: (data) => api.post('/auth/login', data),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    verifyOTP: (data) => api.post('/auth/verify-otp', data),
};

export default api;
