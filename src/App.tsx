import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { initializeDatabase } from './services/dataLoader';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
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

function App() {
  useEffect(() => {
    // Initialize database with mock data in development
    if (import.meta.env.DEV) {
      const shouldInitialize = localStorage.getItem('ics-db-initialized');
      if (!shouldInitialize) {
        initializeDatabase().then(() => {
          localStorage.setItem('ics-db-initialized', 'true');
          console.log('Database initialized with mock data');
        }).catch(error => {
          console.error('Failed to initialize database:', error);
        });
      }
    }
  }, []);

  return (
    <AuthProvider>
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
            <Route path="student-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StudentManagement />
              </ProtectedRoute>
            } />
            
            {/* Finance routes */}
            <Route path="payment-management" element={
              <ProtectedRoute allowedRoles={['finance']}>
                <PaymentManagement />
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
    </AuthProvider>
  );
}

export default App;