import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import Dashboard from './pages/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentTranscripts from './pages/student/Transcripts';
import InstitutionProfile from './pages/institution/Profile';
import InstitutionStudents from './pages/institution/Students';
import InstitutionRequests from './pages/institution/Requests';
import InstitutionStudentProgress from './pages/institution/StudentProgress';
import AdminDashboard from './pages/admin/Dashboard';
import AdminInstitutions from './pages/admin/Institutions';
import ApprovedProgressTable from './pages/admin/ApprovedProgressTable';
import AdminStudents from './pages/admin/Students';
import AdminRequests from './pages/admin/Requests';
import AdminTranscripts from './pages/admin/Transcripts';
import StudentProgress from './pages/admin/StudentProgress';
import StudentRequestForm from './pages/institution/StudentRequestForm';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ToastContainer position="top-center" autoClose={5000} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          
          {/* Student routes */}
          <Route path="/student" element={<PrivateRoute role="student" />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="transcripts" element={<StudentTranscripts />} />
          </Route>
          
          {/* Institution routes */}
          <Route path="/institution" element={<PrivateRoute role="institution" />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<InstitutionProfile />} />
            <Route path="students" element={<InstitutionStudents />} />
            <Route path="/institution/request-progress/:studentId" element={<StudentRequestForm />} />
            <Route path="student-progress/:studentId" element={<InstitutionStudentProgress />} />
            <Route path="requests" element={<InstitutionRequests />} />
          </Route>
          
          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="institutions" element={<AdminInstitutions />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path='approved' element={<ApprovedProgressTable />} />
            <Route path="students/:studentId/progress" element={<StudentProgress />} />
            <Route path="transcripts" element={<AdminTranscripts />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;