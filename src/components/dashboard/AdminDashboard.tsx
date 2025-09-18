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
import { Application, Student, Subject } from '../../types';
import { getAllApplications, getAllSubjects, getStudents } from '../../services/database';
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
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [studentsData, subjectData, applicationsData] = await Promise.all([
          getStudents(),
          getAllSubjects(),
          getAllApplications()
        ]);

        setStudents(studentsData);
        setSubjects(subjectData);
        setApplications(applicationsData.filter(app => app.status == 'pending'));
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || 'Failed to load dashboard data');
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
  }, [currentUser, navigate])

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
        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              Pending Approvals
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {applications.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{students.filter(student => student.id === item.studentId)[0]?.firstName}</p>
                    <p className="text-sm text-gray-600">
                      {item.courseCode} - {students.filter(student => student.id === item.studentId)[0]?.firstName} {students.filter(student => student.id === item.studentId)[0]?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{item.createdAt.toDate().toLocaleDateString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 transition-colors">
                      Approve
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
};

export default AdminDashboard;