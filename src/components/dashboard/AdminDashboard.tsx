import React, { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  AlertTriangle,
  Clock,
  FileText,
  Settings,
  Calendar
} from 'lucide-react';
import { Application, User, Subject } from '../../types';
import EmailTestPanel from '../admin/EmailTestPanel';
import { getAllApplications, getAllSubjects, getUsers } from '../../services/database';
import { useAuth } from '../../context/AuthContext';
import { SkeletonDashboard } from '../common/Skeleton';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [usersData, subjectData, applicationsData] = await Promise.all([
          getUsers(),
          getAllSubjects(),
          getAllApplications()
        ]);

        // Filter students from all users
        const studentsData = usersData.filter(user => user.role === 'student');
        setStudents(studentsData);
        setSubjects(subjectData);
        setApplications(applicationsData.filter(app => app.status == 'pending'));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(message);
        addNotification({
          type: 'error',
          title: 'Dashboard Error',
          message: 'Failed to load dashboard data. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [currentUser, navigate, addNotification])

  if(loading){
    return <SkeletonDashboard/>
  }

  if (error) {
      return (
        <div className="min-h-64 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }


  const stats = {
    totalStudents: students.length,
    totalSubjects: subjects.length,
    pendingApplications: applications.length,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 opacity-90">System Overview & Management</p>
        <p className="text-sm opacity-75">Last login: Today at 08:30 AM</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
              <p className="text-xs text-green-600">+5.2% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Subjects</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalSubjects}</p>
              <p className="text-xs text-gray-500">Across 8 departments</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingApplications}</p>
              <p className="text-xs text-orange-600">Requires attention</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals (click-through to Applications Management) */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Pending Applications
            </h2>
            <button
              onClick={() => navigate('/applications-management')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              aria-label="View all pending applications"
            >
              View All
            </button>
          </div>
          <div className="p-6">
            {applications.length === 0 && (
              <p className="text-sm text-gray-500">No pending applications.</p>
            )}
            <ul className="space-y-3">
              {applications.slice(0, 5).map(app => {
                const student = students.find(s => s.uid === app.studentId);
                return (
                  <li key={app.id}>
                    <button
                      onClick={() => navigate('/applications-management', { state: { highlightId: app.id } })}
                      className="w-full text-left p-4 bg-orange-50 hover:bg-orange-100 transition-colors rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 group"
                      aria-label={`Open application for ${student ? student.firstName + ' ' + student.lastName : 'Unknown'} in ${app.courseCode}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            Course: <span className="font-medium">{app.courseCode}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted: {app.createdAt.toDate().toLocaleDateString()} • Status: <span className="text-orange-700 font-medium">Pending</span>
                          </p>
                        </div>
                        <span className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-full h-fit group-hover:bg-orange-200">
                          Review
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* System Management */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-gray-600" />
            System Management
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              onClick={()=>navigate('/user-management')}
            >
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">User Management</span>
            </button>

            <button className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              onClick={()=>navigate('/college-management')}
            >
              <BookOpen className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">College Management</span>
            </button>

            <button className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              onClick={()=>navigate('/course-management')}
            >
              <BookOpen className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">Course Management</span>
            </button>

            <button className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              onClick={()=>navigate('/subject-management')}
            >
              <BookOpen className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">Subject Management</span>
            </button>


            <button className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
              onClick={()=>navigate('/applications-management')}
            >
              <FileText className="h-8 w-8 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-yellow-900">Applications</span>
            </button>

            <button className="flex flex-col items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              onClick={()=>navigate('/timetable-management')}
            >
              <Calendar className="h-8 w-8 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-indigo-900">Timetable Management</span>
            </button>
          </div>
        </div>
      </div>

      {/* Email Service Test Panel */}
      <div className="mt-6">
        <EmailTestPanel />
      </div>
    </div>
  );
};

export default AdminDashboard;