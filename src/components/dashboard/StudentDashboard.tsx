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
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getResultsByStudent, getTimetable, getPaymentsByStudent, getApplicationsByStudent, getStudentRegistration, getSubjectsByCourse } from '../../services/database';
import { Result, Timetable, Payment, Application} from '../../types';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setError(null);
        const [resultsData, timetableData, paymentsData, applicationsData, regs, subjectsNumber] = await Promise.all([
          getResultsByStudent(currentUser.uid),
          getTimetable(),
          getPaymentsByStudent(currentUser.uid),
          getApplicationsByStudent(currentUser.uid),
          getStudentRegistration(currentUser.uid),
          getSubjectsByCourse(await getStudentRegistration(currentUser.uid).then(r => r?.courseCode || ''))
        ]);
        
        setResults(resultsData);
        setTimetable(timetableData);
        setPayments(paymentsData);
        setApplications(applicationsData);
        setRegistration(regs);
        setSubjectsNumber(subjectsNumber.length);
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
  const hasActiveRegistration = registration && registration.year;
  const needsApplication = !hasApprovedApplication && !hasActiveRegistration;

  // Calculate finance status
  const totalPaid = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
  const totalFees = 45000; // This could be fetched from a fees structure
  const outstandingAmount = totalFees - totalPaid;
  const financeStatus = {
    totalFees,
    paidAmount: totalPaid,
    outstandingAmount,
    status: outstandingAmount > 0 ? 'partial' : 'paid'
  };

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
          <h1 className="text-2xl font-bold mb-2">Welcome to ICS!</h1>
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
          Welcome back, {currentUser?.profile?.firstName || 'Student'}!
        </h1>
        <p className="mt-2 opacity-90">
          {registration?.courseCode} - Year {registration?.year}
        </p>
        <p className="text-sm opacity-75">
          Student Number: {currentUser?.profile?.studentNumber}
        </p>
      </div>

      {/* Registration Status Alert */}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              onClick={() => navigate('/helpdesk')}            
            >
              <HelpCircle className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">Get Help</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;