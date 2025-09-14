import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Users, BookOpen, CreditCard, TrendingUp, Calendar, FileText } from 'lucide-react';
import { getStudents, getCourses, getAllPayments, getAllTickets } from '../services/database';
import { useNotification } from '../context/NotificationContext';
import { Student, Course, Payment, Ticket } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Reports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsData, coursesData, paymentsData, ticketsData] = await Promise.all([
        getStudents(),
        getCourses(),
        getAllPayments(),
        getAllTickets()
      ]);
      
      setStudents(studentsData);
      setCourses(coursesData);
      setPayments(paymentsData);
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load report data'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = (type: string) => {
    addNotification({
      type: 'info',
      title: 'Report Generation',
      message: `Generating ${type} report...`
    });
    
    // Simulate report generation
    setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'Report Ready',
        message: `${type} report has been generated and downloaded.`
      });
    }, 2000);
  };

  // Calculate statistics
  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    totalCourses: courses.length,
    totalRevenue: payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
  };

  // Course enrollment data
  const courseEnrollment = courses.map(course => ({
    name: course.name,
    code: course.code,
    enrolled: students.filter(s => s.course === course.name).length,
    credits: course.credits
  }));

  // Payment status breakdown
  const paymentStats = {
    approved: payments.filter(p => p.status === 'approved').length,
    pending: payments.filter(p => p.status === 'pending').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
  };

  // Monthly revenue (simulated)
  const monthlyRevenue = [
    { month: 'Jan', revenue: 890000 },
    { month: 'Feb', revenue: 920000 },
    { month: 'Mar', revenue: 875000 },
    { month: 'Apr', revenue: 940000 },
    { month: 'May', revenue: 980000 },
    { month: 'Jun', revenue: 1020000 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">View administrative reports and analytics</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="students">Student Reports</option>
              <option value="financial">Financial Reports</option>
              <option value="academic">Academic Reports</option>
            </select>
            <button
              onClick={() => generateReport(selectedReport)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
              <p className="text-xs text-green-600">
                {stats.activeStudents} active ({Math.round((stats.activeStudents / stats.totalStudents) * 100)}%)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCourses}</p>
              <p className="text-xs text-gray-500">
                {courses.reduce((sum, c) => sum + c.credits, 0)} total credits
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                R{(stats.totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-purple-600">{stats.pendingPayments} pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Support Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.openTickets}</p>
              <p className="text-xs text-green-600">{stats.resolvedTickets} resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Enrollment */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Course Enrollment
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {courseEnrollment.slice(0, 5).map((course, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{course.code}</span>
                      <span className="text-sm text-gray-600">{course.enrolled} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min((course.enrolled / stats.totalStudents) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-green-600" />
              Payment Status
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{paymentStats.approved}</p>
                </div>
                <div className="text-green-600">
                  <CreditCard className="h-8 w-8" />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-yellow-900">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{paymentStats.pending}</p>
                </div>
                <div className="text-yellow-600">
                  <Calendar className="h-8 w-8" />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-red-900">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{paymentStats.rejected}</p>
                </div>
                <div className="text-red-600">
                  <FileText className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Revenue Trend (Last 6 Months)
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-6 gap-4">
            {monthlyRevenue.map((month, index) => (
              <div key={index} className="text-center">
                <div className="mb-2">
                  <div 
                    className="bg-blue-600 rounded-t"
                    style={{ 
                      height: `${(month.revenue / 1200000) * 100}px`,
                      minHeight: '20px'
                    }}
                  ></div>
                </div>
                <p className="text-xs font-medium text-gray-600">{month.month}</p>
                <p className="text-xs text-gray-500">R{(month.revenue / 1000).toFixed(0)}K</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Reports</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => generateReport('Student Enrollment')}
              className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Student Enrollment</span>
            </button>
            
            <button
              onClick={() => generateReport('Financial Summary')}
              className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <CreditCard className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">Financial Summary</span>
            </button>
            
            <button
              onClick={() => generateReport('Course Performance')}
              className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <BookOpen className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">Course Performance</span>
            </button>
            
            <button
              onClick={() => generateReport('Support Analytics')}
              className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <FileText className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">Support Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;