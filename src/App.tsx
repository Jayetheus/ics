import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import NotificationContainer from './components/common/NotificationContainer';
import { useNotification } from './context/NotificationContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Helpdesk from './pages/Helpdesk';
import Profile from './pages/Profile';
import Results from './pages/Results';
import Timetable from './pages/Timetable';
import Finance from './pages/Finance';
import Documents from './pages/Documents';
import StudentManagement from './pages/StudentManagement';
import PaymentManagement from './pages/PaymentManagement';
import Applications from './pages/Applications';
import Courses from './pages/Courses';
import Schedule from './pages/Schedule';
import ResultsEntry from './pages/ResultsEntry';
import CourseManagement from './pages/CourseManagement';
import TimetableManagement from './pages/TimetableManagement';
import AssetManagement from './pages/AssetManagement';
import Reports from './pages/Reports';
import HelpdeskManagement from './pages/HelpdeskManagement';
import Settings from './pages/Settings';
import StudentFinance from './pages/StudentFinance';
import FinancialReports from './pages/FinancialReports';
import PaymentProofs from './pages/PaymentProofs';
import ApplicationsManagement from './pages/ApplicationsManagement';
import FinalizeRegistration from './pages/FinalizeRegistration';
import Subjects from './pages/Subjects';

const AppContent: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="helpdesk" element={<Helpdesk />} />

            {/* Student routes */}
            <Route path="profile" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="applications" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Applications />
              </ProtectedRoute>
            } />
            <Route path="finalize-registration" element={
              <ProtectedRoute allowedRoles={['student']}>
                <FinalizeRegistration />
              </ProtectedRoute>
            } />
            <Route path="subjects" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Subjects />
              </ProtectedRoute>
            } />
            <Route path="results" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Results />
              </ProtectedRoute>
            } />
            <Route path="timetable" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Timetable />
              </ProtectedRoute>
            } />
            <Route path="finance" element={
              <ProtectedRoute allowedRoles={['student', 'finance']}>
                <Finance />
              </ProtectedRoute>
            } />
            <Route path="documents" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Documents />
              </ProtectedRoute>
            } />

            {/* Staff/Admin routes */}
            <Route path="students" element={
              <ProtectedRoute allowedRoles={['lecturer']}>
                <StudentManagement />
              </ProtectedRoute>
            } />
            <Route path="courses" element={
              <ProtectedRoute allowedRoles={['lecturer']}>
                <Courses />
              </ProtectedRoute>
            } />
            <Route path="schedule" element={
              <ProtectedRoute allowedRoles={['lecturer']}>
                <Schedule />
              </ProtectedRoute>
            } />
            <Route path="results-entry" element={
              <ProtectedRoute allowedRoles={['lecturer']}>
                <ResultsEntry />
              </ProtectedRoute>
            } />
            <Route path="student-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StudentManagement />
              </ProtectedRoute>
            } />
            <Route path="course-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CourseManagement />
              </ProtectedRoute>
            } />
            <Route path="timetable-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TimetableManagement />
              </ProtectedRoute>
            } />
            <Route path="asset-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AssetManagement />
              </ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="helpdesk-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <HelpdeskManagement />
              </ProtectedRoute>
            } />
            <Route path="applications-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ApplicationsManagement />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Finance routes */}
            <Route path="payment-management" element={
              <ProtectedRoute allowedRoles={['finance']}>
                <PaymentManagement />
              </ProtectedRoute>
            } />
            <Route path="student-finance" element={
              <ProtectedRoute allowedRoles={['finance']}>
                <StudentFinance />
              </ProtectedRoute>
            } />
            <Route path="financial-reports" element={
              <ProtectedRoute allowedRoles={['finance']}>
                <FinancialReports />
              </ProtectedRoute>
            } />
            <Route path="payment-proofs" element={
              <ProtectedRoute allowedRoles={['finance']}>
                <PaymentProofs />
              </ProtectedRoute>
            } />
          </Route>

          {/* Unauthorized page */}
          <Route path="/unauthorized" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                <p className="text-gray-600">You don't have permission to access this page.</p>
              </div>
            </div>
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <NotificationContainer
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </>
  );
};

function App() {
  console.log("App component rendered");

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;