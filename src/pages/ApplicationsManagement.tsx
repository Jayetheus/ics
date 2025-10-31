import React, { useEffect, useState, useRef } from 'react';
import { getAllApplications, updateApplicationStatus, getCourses, getStudents, getAssets } from '../services/database';
import { emailService } from '../services/emailService';
import { Application, Course, User,Asset } from '../types';
import { CheckCircle, X, Search, Filter, User as UserIcon, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ApplicationsManagement: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Asset[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | Application['status']>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [notes, setNotes] = useState('');
  const { addNotification } = useNotification();
  const location = useLocation();
  const highlightId = (location.state as { highlightId?: string } | null | undefined)?.highlightId;
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [apps, crs, studentData, docs] = await Promise.all([
          getAllApplications(),
          getCourses(),
          getStudents(),
          getAssets(),
        ]);

        console.log(studentData)
        setApplications(apps);
        setCourses(crs);
        setStudents(studentData);
        setDocuments(docs.filter(doc => apps.find(app => doc.uploadedBy === app.studentId) ? true : false))
      } catch (error) {
        console.error('Error loading data:', error);
        addNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load applications data'
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addNotification]);

  const courseName = (code: string) => courses.find(c => c.code === code)?.name || code;

  const filtered = applications.filter(a => {
    const student = students.find(std => std.uid === a.studentId);
    const matchS = status === 'all' || a.status === status;
    const matchQ = a.courseCode.toLowerCase().includes(search.toLowerCase()) ||
      (student && `${student.firstName} ${student.lastName}`.toLowerCase().includes(search.toLowerCase()));
    return matchS && matchQ;
  });

  useEffect(() => {
    if (highlightId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Brief pulse animation removal after animation ends
      const timer = setTimeout(() => {
        if (highlightedRowRef.current) {
          highlightedRowRef.current.classList.remove('ring-2', 'ring-orange-400');
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [highlightId, applications]);

  const handleViewDocument = (document: Asset) => {
    setSelectedDocument(document);
  };

  const handleAction = async (id: string, newStatus: Application['status'], reviewNotes?: string) => {
    try {
      // Update application status in database
      await updateApplicationStatus(id, newStatus);
      setApplications(applications.map(a =>
        a.id === id ? { ...a, status: newStatus, notes: reviewNotes } : a
      ));

      // Send email notification to student
      const application = applications.find(a => a.id === id);
      if (application) {
        const student = students.find(std => std.uid === application.studentId);
        const course = courses.find(c => c.code === application.courseCode);

        if (student && course) {
          try {
            let emailSent = false;

            if (newStatus === 'approved') {
              emailSent = await emailService.sendApplicationApprovedNotification(
                student.email,
                `${student.firstName} ${student.lastName}`,
                course.name,
                application.id
              );
            } else if (newStatus === 'rejected') {
              emailSent = await emailService.sendApplicationRejectedNotification(
                student.email,
                `${student.firstName} ${student.lastName}`,
                course.name,
                application.id,
                reviewNotes
              );
            }

            if (emailSent) {
              addNotification({
                type: 'success',
                title: 'Application Updated',
                message: `Application has been ${newStatus} and student has been notified via email.`
              });
            } else {
              addNotification({
                type: 'warning',
                title: 'Application Updated',
                message: `Application has been ${newStatus}, but email notification failed to send.`
              });
            }
          } catch (emailError) {
            console.error('Email notification error:', emailError);
            addNotification({
              type: 'warning',
              title: 'Application Updated',
              message: `Application has been ${newStatus}, but email notification failed to send.`
            });
          }
        } else {
          addNotification({
            type: 'success',
            title: 'Application Updated',
            message: `Application has been ${newStatus}.`
          });
        }
      }

      setSelectedApp(null);
      setNotes('');
    } catch (err) {
      console.error('Application status update failed', err);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update application status'
      });
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

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Applications Management</h1>
            <p className="text-gray-600 mt-1">Review and process student course applications</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-semibold text-green-600">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-semibold text-red-600">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name or course code"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Application['status'] | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(a => {
                const student = students.find(std => std.uid === a.studentId);
                return (
                  <tr
                    key={a.id}
                    ref={highlightId === a.id ? highlightedRowRef : null}
                    className={`hover:bg-gray-50 transition-colors ${highlightId === a.id ? 'ring-2 ring-orange-400 animate-pulse' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <UserIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student?.email || a.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{a.courseCode}</div>
                      <div className="text-sm text-gray-500">{courseName(a.courseCode)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {a.createdAt.toDate().toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {a.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedApp(a)}
                            className="text-blue-600 hover:text-blue-900 flex items-center px-3 py-1 bg-blue-50 rounded-md transition-colors"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Review
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">
                          {a.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">
              {search || status !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No applications have been submitted yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Review Application</h3>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="p-6 space-y-6">
                {/* Application Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Student</label>
                      <p className="text-gray-900">
                        {students.find(std => std.uid === selectedApp.studentId)
                          ? `${students.find(std => std.uid === selectedApp.studentId)?.firstName} ${students.find(std => std.uid === selectedApp.studentId)?.lastName}`
                          : 'Unknown Student'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">
                        {students.find(std => std.uid === selectedApp.studentId)?.email || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Course Applied For</label>
                      <p className="text-gray-900">{selectedApp.courseCode} - {courseName(selectedApp.courseCode)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Application Date</label>
                      <p className="text-gray-900">{selectedApp.createdAt.toDate().toLocaleDateString()}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Qualification Check</label>
                      <p className="text-gray-900">
                        {(() => {
                          const student = students.find(std => selectedApp.studentId === std.uid);
                          const course = courses.find(c => c.code === selectedApp.courseCode);
                          if (!student || !course) return 'Unavailable';
                          const aps = parseInt(course.apsRequired, 10);
                          const marks = Array.isArray(student.results) ? student.results.map(r => r.mark ?? 0) : [];
                          if (!marks.length || Number.isNaN(aps)) return 'N/A';
                          const avg = Math.round(marks.reduce((s, m) => s + m, 0) / marks.length);
                          return avg >= aps ? `Yes (Avg ${avg} ≥ APS ${aps})` : `No (Avg ${avg} < APS ${aps})`;
                        })()}
                      </p>
                    </div>
                  </div>

                  {selectedApp.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Previous Notes</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedApp.notes}</p>
                    </div>
                  )}
                </div>

                {/* Documents Section */}
                { documents.filter(doc => doc.uploadedBy === selectedApp.studentId) && documents.filter(doc => doc.uploadedBy === selectedApp.studentId).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Supporting Documents</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      { documents.filter(doc => doc.uploadedBy === selectedApp.studentId).map((doc, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {doc.originalName || `Document ${index + 1}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {doc.type || 'Document'} • {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleViewDocument(doc)}
                              className="ml-2 flex-shrink-0 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Viewer Modal */}
                {selectedDocument && (
                  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-60">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                      <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedDocument.name || 'Document Viewer'}
                        </h3>
                        <button
                          onClick={() => setSelectedDocument(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                        {selectedDocument.type?.includes('image') ? (
                          <img
                            src={selectedDocument.url}
                            alt={selectedDocument.name || 'Document'}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : selectedDocument.type?.includes('pdf') ? (
                          <iframe
                            src={selectedDocument.url}
                            className="w-full h-96 border-0"
                            title={selectedDocument.name || 'PDF Document'}
                          />
                        ) : (
                          <div className="text-center p-8">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500 mb-4">Preview not available for this file type</p>
                            <a
                              href={selectedDocument.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Download File
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {selectedDocument.type} • {selectedDocument.size ? `${(selectedDocument.size / 1024 / 1024).toFixed(2)} MB` : ''}
                        </span>
                        <a
                          href={selectedDocument.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this application review..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Email Notification:</strong> The student will automatically receive an email notification about the application status update.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => handleAction(selectedApp.id, 'approved', notes)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Application
                </button>
                <button
                  onClick={() => handleAction(selectedApp.id, 'rejected', notes)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Application
                </button>
                <button
                  onClick={() => {
                    setSelectedApp(null);
                    setNotes('');
                    setSelectedDocument(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        
      )}

      {selectedDocument && (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-60">
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedDocument.name || 'Document Viewer'}
        </h3>
        <button
          onClick={() => setSelectedDocument(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100">
        <div className="w-full h-full flex flex-col items-center justify-center">
          {selectedDocument.type?.includes('pdf') ? (
            <iframe
              src={selectedDocument.url}
              className="w-full h-96 border-0 rounded-lg"
              title={selectedDocument.name || 'PDF Document'}
            />
          ) : selectedDocument.type?.includes('image') ? (
            <img 
              src={selectedDocument.url} 
              alt={selectedDocument.name || 'Document'} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">Preview not available for this file type</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{selectedDocument.name || 'Document'}</p>
          <p className="text-sm text-gray-600">
            {selectedDocument.type} • 
            {selectedDocument.size ? ` ${(selectedDocument.size / 1024 / 1024).toFixed(2)} MB` : ' Size unknown'}
          </p>
        </div>
        <a
          href={selectedDocument.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Download
        </a>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default ApplicationsManagement;