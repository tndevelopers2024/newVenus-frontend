import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PatientDashboard from './pages/patient/PatientDashboard';
// import BookAppointment from './pages/patient/BookAppointment'; // Removed
import MedicalHistory from './pages/patient/MedicalHistory';
import TestReports from './pages/patient/TestReports';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import Appointments from './pages/doctor/Appointments';
import Patients from './pages/doctor/Patients';
import ClinicalSession from './pages/doctor/ClinicalSession';
import AdminDashboard from './pages/admin/AdminDashboard';
import AppointmentAssignment from './pages/admin/AppointmentAssignment';
import PatientRegistration from './pages/admin/PatientRegistration';
import AppointmentList from './pages/admin/AppointmentList';
import UserManager from './pages/admin/UserManager';
import BillingManager from './pages/admin/BillingManager';
import SystemLogs from './pages/admin/SystemLogs';
import DoctorRegistration from './pages/admin/DoctorRegistration';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import { Toaster } from 'react-hot-toast';

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 ">Loading New Venus Clinic...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* <Route path="/register" element={<Register />} /> */}
            <Route path="/" element={<Navigate to="/login" />} />

            {/* Patient Portal */}
            <Route path="/patient" element={
              <PrivateRoute role="patient"><PatientDashboard /></PrivateRoute>
            } />
            {/* <Route path="/patient/book" element={
              <PrivateRoute role="patient"><BookAppointment /></PrivateRoute>
            } /> */}
            <Route path="/patient/history" element={
              <PrivateRoute role="patient"><MedicalHistory /></PrivateRoute>
            } />
            <Route path="/patient/reports" element={
              <PrivateRoute role="patient"><TestReports /></PrivateRoute>
            } />

            {/* Doctor Portal */}
            <Route path="/doctor" element={
              <PrivateRoute role="doctor"><DoctorDashboard /></PrivateRoute>
            } />
            <Route path="/doctor/appointments" element={
              <PrivateRoute role="doctor"><Appointments /></PrivateRoute>
            } />
            <Route path="/doctor/patients" element={
              <PrivateRoute role="doctor"><Patients /></PrivateRoute>
            } />
            <Route path="/doctor/session/:appointmentId" element={
              <PrivateRoute role="doctor"><ClinicalSession /></PrivateRoute>
            } />

            {/* Admin Portal */}
            <Route path="/admin" element={
              <PrivateRoute role="superadmin"><AdminDashboard /></PrivateRoute>
            } />
            <Route path="/admin/users" element={
              <PrivateRoute role="superadmin"><UserManager /></PrivateRoute>
            } />
            <Route path="/admin/patients/register" element={
              <PrivateRoute role="superadmin"><PatientRegistration /></PrivateRoute>
            } />
            <Route path="/admin/appointments" element={
              <PrivateRoute role="superadmin"><AppointmentAssignment /></PrivateRoute>
            } />
            <Route path="/admin/appointments/list" element={
              <PrivateRoute role="superadmin"><AppointmentList /></PrivateRoute>
            } />
            <Route path="/admin/billing" element={
              <PrivateRoute role="superadmin"><BillingManager /></PrivateRoute>
            } />
            <Route path="/admin/logs" element={
              <PrivateRoute role="superadmin"><SystemLogs /></PrivateRoute>
            } />
            <Route path="/admin/doctors/register" element={
              <PrivateRoute role="superadmin"><DoctorRegistration /></PrivateRoute>
            } />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
