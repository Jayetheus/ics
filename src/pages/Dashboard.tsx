import React from 'react';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import LecturerDashboard from '../components/dashboard/LecturerDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import FinanceDashboard from '../components/dashboard/FinanceDashboard';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();

  const renderDashboard = () => {
    switch (currentUser?.role) {
      case 'student':
        return <StudentDashboard />;
      case 'lecturer':
        return <LecturerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'finance':
        return <FinanceDashboard />;
      default:
        return <div>Dashboard not found for role: {currentUser?.role}</div>;
    }
  };

  return <>{renderDashboard()}</>;
};

export default Dashboard;