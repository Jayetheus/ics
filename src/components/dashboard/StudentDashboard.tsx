import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  CreditCard, 
  FileText, 
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  User,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getResultsByStudent, getTimetableByCourse, getPaymentsByStudent, getApplicationsByStudent, getStudentRegistration, getSubjectsByCourse, getFinancesByStudentId, getUserById, getAttendanceRecordsByStudent } from '../../services/database';
import { Result, Timetable, Payment, Application, AttendanceRecord } from '../../types';
import { SkeletonDashboard } from '../common/Skeleton';

const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [results, setResults] = useState<Result[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [registration, setRegistration] = useState<any>();
  const [subjectsNumber, setSubjectsNumber] = useState<number>(0);
  const [studentData, setStudentData] = useState<any>(null);
  const [finances, setFinances] = useState<any>({ records: [], total: 0 });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      

      console.log(currentUser.uid)
      try {
        setError(null);
        const [resultsData, paymentsData, applicationsData, regs, studentInfo, financesData, attendanceData] = await Promise.all([
          getResultsByStudent(currentUser.uid),
          getPaymentsByStudent(currentUser.uid),
          getApplicationsByStudent(currentUser.uid),
          getStudentRegistration(currentUser.uid),
          getUserById(currentUser.uid),
          getFinancesByStudentId(currentUser.uid),
          getAttendanceRecordsByStudent(currentUser.uid)
        ]);
        
        // Get timetable for the student's course if registered
        let timetableData: Timetable[] = [];
        if (regs?.courseCode) {
          timetableData = await getTimetableByCourse(regs.courseCode);
        }
        
        setResults(resultsData);
        setTimetable(timetableData);
        setPayments(paymentsData);
        setApplications(applicationsData);
        setRegistration(regs);
        setStudentData(studentInfo);
        setFinances(financesData);
        setAttendanceRecords(attendanceData);
        
        // Get subjects count if registration exists
        if (regs?.courseCode) {
          const subjects = await getSubjectsByCourse(regs.courseCode);
          setSubjectsNumber(subjects.length);
        }
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
    };

    fetchData();
  }, [currentUser, navigate, addNotification]);

  // Get today's classes
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysClasses = timetable.filter(item => item.day === today).slice(0, 3);

  // Get recent results (last 3)
  const recentResults = results.slice(0, 3);

  // Check registration status
  const hasApprovedApplication = applications.some(app => app.status === 'approved');
  const hasPendingApplication = applications.some(app => app.status === 'pending');
  const hasRejectedApplication = applications.some(app => app.status === 'rejected');
  const hasActiveRegistration = registration && registration.year;
  const needsApplication = !hasApprovedApplication && !hasActiveRegistration;
  const canRegister = hasApprovedApplication && !hasActiveRegistration;

  // Calculate finance status
  const totalPaid = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
  const totalFees = finances.total || 0; // Get from database
  const outstandingAmount = totalFees - totalPaid;
  const financeStatus = {
    totalFees,
    paidAmount: totalPaid,
    outstandingAmount,
    status: outstandingAmount > 0 ? 'partial' : 'paid'
  };

  // Calculate attendance statistics
  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  if (loading) {
    return <SkeletonDashboard />;
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

  // Show application prompt if needed
  if (needsApplication) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white text-center">
          <User className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Welcome to EduTech!</h1>
          <p className="opacity-90">Let's get you started with your academic journey</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Apply for a Course</h2>
          <p className="text-gray-600 mb-6">
            To access your student dashboard and all features, you need to apply for a course first.
          </p>
          <button
            onClick={() => navigate('/applications')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {applications.length > 0? "Register Course" : "Apply Now" }
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Need help?</p>
              <p>Contact our support team if you have any questions about the application process.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {studentData?.firstName || currentUser?.firstName || 'Student'}!
        </h1>
        <p className="mt-2 opacity-90">
          {registration?.courseCode} - Year {registration?.year}
        </p>
        <p className="text-sm opacity-75">
          Student Number: {studentData?.studentNumber || 'N/A'}
        </p>
      </div>

      {/* Registration Status Alerts */}
      {hasApprovedApplication && !hasActiveRegistration && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-green-900">Application Approved!</h3>
                <p className="text-sm text-green-700">Complete your registration to access all features.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/finalize-registration')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Complete Registration
            </button>
          </div>
        </div>
      )}

      {hasPendingApplication && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="font-medium text-yellow-900">Application Under Review</h3>
              <p className="text-sm text-yellow-700">
                Your application is being reviewed. You will receive an email notification once a decision is made.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasRejectedApplication && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h3 className="font-medium text-red-900">Application Not Approved</h3>
              <p className="text-sm text-red-700">
                Your application was not approved. Please check your email for details and consider applying again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Current Subjects</p>
              <p className="text-2xl font-semibold text-gray-900">{subjectsNumber}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Average Grade</p>
              <p className="text-2xl font-semibold text-gray-900">
                {results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.mark, 0) / results.length) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Next Class</p>
              <p className="text-2xl font-semibold text-gray-900">
                {todaysClasses.length > 0 ? todaysClasses[0].startTime : 'None'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              financeStatus.status === 'paid' ? 'bg-green-100' : 
              financeStatus.status === 'partial' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <CreditCard className={`h-6 w-6 ${
                financeStatus.status === 'paid' ? 'text-green-600' : 
                financeStatus.status === 'partial' ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Finance Status</p>
              <p className="text-sm font-semibold capitalize text-gray-900">
                R{financeStatus.outstandingAmount.toLocaleString()} Outstanding
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              attendanceRate >= 80 ? 'bg-green-100' : 
              attendanceRate >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <QrCode className={`h-6 w-6 ${
                attendanceRate >= 80 ? 'text-green-600' : 
                attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{attendanceRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              {todaysClasses.map((class_, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                      {class_.startTime}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{class_.courseName}</p>
                      <p className="text-sm text-gray-600">{class_.venue} • {class_.type}</p>
                    </div>
                  </div>
                </div>
              ))}
              {todaysClasses.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No classes scheduled for today</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-600" />
              Recent Results
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${
                      result.mark >= 90 ? 'bg-green-100' :
                      result.mark >= 80 ? 'bg-blue-100' :
                      result.mark >= 70 ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <CheckCircle className={`h-4 w-4 ${
                        result.mark >= 90 ? 'text-green-600' :
                        result.mark >= 80 ? 'text-blue-600' :
                        result.mark >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{result.subjectName}</p>
                      <p className="text-sm text-gray-600">Grade: {result.grade}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{result.mark}%</p>
                  </div>
                </div>
              ))}
              {recentResults.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No results available yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Finance Summary */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            Finance Summary
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Fees</p>
              <p className="text-2xl font-bold text-gray-900">
                R{financeStatus.totalFees.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">
                R{financeStatus.paidAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                R{financeStatus.outstandingAmount.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full"
                style={{ width: `${(financeStatus.paidAmount / financeStatus.totalFees) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {Math.round((financeStatus.paidAmount / financeStatus.totalFees) * 100)}% paid
            </p>
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
            <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              onClick={() => navigate('/documents')}
            >
              <Upload className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Upload Document</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              onClick={() => navigate('/finance')}
            >
              <CreditCard className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">Make Payment</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              onClick={() => navigate('/results')}
            >
              <FileText className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">View Results</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              onClick={() => navigate('/attendance')}            
            >
              <QrCode className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">Mark Attendance</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => navigate('/helpdesk')}            
            >
              <HelpCircle className="h-8 w-8 text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Get Help</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;