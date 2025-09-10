import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Helpdesk from './pages/Helpdesk';

function App() {
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
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Student Profile</h1>
                  <p className="text-gray-600">Student profile management coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="results" element={
              <ProtectedRoute allowedRoles={['student']}>
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Academic Results</h1>
                  <p className="text-gray-600">Student results view coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="timetable" element={
              <ProtectedRoute allowedRoles={['student']}>
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Class Timetable</h1>
                  <p className="text-gray-600">Student timetable view coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="finance" element={
              <ProtectedRoute allowedRoles={['student', 'finance']}>
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Finance & Payments</h1>
                  <p className="text-gray-600">Student finance view coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="documents" element={
              <ProtectedRoute allowedRoles={['student']}>
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Document Management</h1>
                  <p className="text-gray-600">Document upload and management coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            
            {/* Staff/Admin routes */}
            <Route path="students" element={
              <ProtectedRoute allowedRoles={['lecturer']}>
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">My Students</h1>
                  <p className="text-gray-600">Student management for lecturers coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="student-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Student Management</h1>
                  <p className="text-gray-600">Admin student management coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            
            {/* Finance routes */}
            <Route path="payment-management" element={
              <ProtectedRoute allowedRoles={['finance']}>
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Management</h1>
                  <p className="text-gray-600">Payment management system coming soon...</p>
                </div>
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