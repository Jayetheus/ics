import React from 'react';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LecturerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Sample data
  const subjects = [
    { code: 'CS101', name: 'Introduction to Programming', students: 45, nextClass: '09:00 - Monday' },
    { code: 'CS201', name: 'Object-Oriented Programming', students: 32, nextClass: '11:00 - Tuesday' },
    { code: 'CS301', name: 'Software Engineering', students: 28, nextClass: '14:00 - Wednesday' },
  ];

  const todaysSchedule = [
    { time: '09:00-10:30', subject: 'CS101', type: 'Lecture', room: 'Room 101', students: 45 },
    { time: '11:00-12:30', subject: 'CS201', type: 'Practical', room: 'Lab A', students: 32 },
    { time: '14:00-15:30', subject: 'CS301', type: 'Tutorial', room: 'Room 203', students: 28 },
  ];

  const pendingTasks = [
    { task: 'Grade CS101 assignments', count: 45, dueDate: 'Tomorrow' },
    { task: 'Upload CS201 lecture notes', count: 1, dueDate: 'Today' },
    { task: 'Review project proposals', count: 15, dueDate: 'Friday' },
    { task: 'Prepare exam questions', count: 3, dueDate: 'Next week' },
  ];

  const stats = {
    totalStudents: 105,
    activeSubjects: 3,
    pendingGrades: 63,
    avgAttendance: 87,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome, Dr. {currentUser?.profile?.lastName || 'Lecturer'}
        </h1>
        <p className="mt-2 opacity-90">Lecturer Dashboard</p>
        <p className="text-sm opacity-75">
          Staff Number: {currentUser?.profile?.staffNumber}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{stats.activeSubjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Grades</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingGrades}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.avgAttendance}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Subjects */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-green-600" />
              My Subjects
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {subjects.map((subject, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{subject.code}</h3>
                      <p className="text-sm text-gray-600">{subject.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{subject.students} students enrolled</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">{subject.nextClass}</p>
                      <p className="text-xs text-gray-500">Next class</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Today's Schedule
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {todaysSchedule.map((class_, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                      {class_.time}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{class_.subject}</p>
                      <p className="text-sm text-gray-600">{class_.room} • {class_.type}</p>
                      <p className="text-xs text-gray-500">{class_.students} students</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            Pending Tasks
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTasks.map((task, index) => (
              <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{task.task}</p>
                    <p className="text-sm text-gray-600">{task.count} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">{task.dueDate}</p>
                    <button className="mt-1 px-3 py-1 bg-orange-600 text-white text-xs rounded-full hover:bg-orange-700 transition-colors">
                      Start
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <FileText className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">Enter Grades</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">View Students</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <Calendar className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">Update Schedule</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <CheckCircle className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">Take Attendance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;