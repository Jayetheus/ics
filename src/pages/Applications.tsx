import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, CheckCircle, X, AlertTriangle, FileText, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getApplicationsByStudent, createApplication } from '../services/database';
import { getCourses } from '../services/database';
import { Application, Course } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Applications: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const [apps, crs] = await Promise.all([
          getApplicationsByStudent(currentUser.uid),
          getCourses(),
        ]);
        setApplications(apps);
        setCourses(crs);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedCourse) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a course before submitting.',
      });
      return;
    }

    // Check if already applied for this course
    const existingApp = applications.find(app => app.courseCode === selectedCourse);
    if (existingApp) {
      addNotification({
        type: 'warning',
        title: 'Already Applied',
        message: 'You have already applied for this course.',
      });
      return;
    }

    try {
      setSubmitting(true);
      await createApplication({ 
        studentId: currentUser.uid, 
        courseCode: selectedCourse, 
        status: 'pending' as any 
      } as any);
      
      const apps = await getApplicationsByStudent(currentUser.uid);
      setApplications(apps);
      setSelectedCourse('');
      setShowApplicationForm(false);
      
      addNotification({
        type: 'success',
        title: 'Application Submitted',
        message: 'Your course application has been submitted successfully!',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: 'Failed to submit application. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleNextStep = () => {
    const approvedApp = applications.find(app => app.status === 'approved');
    if (approvedApp) {
      navigate('/finalize-registration');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const approvedApplication = applications.find(app => app.status === 'approved');
  const hasApplications = applications.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Applications</h1>
            <p className="text-gray-600 mt-1">Apply for courses and track your application status</p>
          </div>
          {!approvedApplication && (
            <button
              onClick={() => setShowApplicationForm(!showApplicationForm)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </button>
          )}
        </div>
      </div>

      {/* Application Status Alert */}
      {approvedApplication && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">Application Approved!</h3>
              <p className="text-green-700 mt-1">
                Your application for {approvedApplication.courseCode} has been approved. 
                You can now proceed to finalize your registration.
              </p>
            </div>
            <button
              onClick={handleNextStep}
              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Finalize Registration
            </button>
          </div>
        </div>
      )}

      {/* Application Form */}
      {showApplicationForm && !approvedApplication && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit New Application</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Select a course --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting || !selectedCourse}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowApplicationForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Applications List */}
      {hasApplications ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Applications</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {applications.map((app) => (
              <div key={app.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{app.courseCode}</h3>
                      <p className="text-sm text-gray-600">
                        Applied on {app.createdAt && typeof app.createdAt.toDate === 'function'
                          ? app.createdAt.toDate().toLocaleDateString()
                          : new Date(app.createdAt as any).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                      {getStatusIcon(app.status)}
                      <span className="ml-1 capitalize">{app.status}</span>
                    </span>
                  </div>
                </div>
                {app.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{app.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
          <p className="text-gray-600 mb-6">
            Start your academic journey by applying for a course.
          </p>
          <button
            onClick={() => setShowApplicationForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit Your First Application
          </button>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start">
          <AlertTriangle className="h-6 w-6 text-blue-600 mt-1 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Application Process</h3>
            <div className="mt-2 text-sm text-blue-800 space-y-1">
              <p>1. Submit your course application</p>
              <p>2. Wait for admin approval (usually 2-3 business days)</p>
              <p>3. Once approved, finalize your registration and select subjects</p>
              <p>4. Complete payment to activate your student account</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Applications;


