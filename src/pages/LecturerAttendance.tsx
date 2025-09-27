import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Clock, 
  MapPin, 
  Users, 
  Play, 
  Stop, 
  Download,
  Calendar,
  BookOpen,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  getSubjectsByCourse, 
  getCourses, 
  createAttendanceSession, 
  getAttendanceSessionsByLecturer,
  updateAttendanceSession,
  getAttendanceRecordsBySession,
  getUserById
} from '../services/database';
import { generateQRCode, generateQRCodeData } from '../utils/qrCodeUtils';
import { AttendanceSession, Subject, Course } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LecturerAttendance: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');

  const [newSession, setNewSession] = useState({
    subjectCode: '',
    courseCode: '',
    venue: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '09:00'
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        const [coursesData] = await Promise.all([
          getCourses()
        ]);
        setCourses(coursesData);

        // Load lecturer's attendance sessions
        const sessionsData = await getAttendanceSessionsByLecturer(currentUser.uid);
        setSessions(sessionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        addNotification({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load attendance data'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, addNotification]);

  useEffect(() => {
    if (newSession.courseCode) {
      fetchSubjects();
    }
  }, [newSession.courseCode]);

  const fetchSubjects = async () => {
    try {
      const subjectsData = await getSubjectsByCourse(newSession.courseCode);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const selectedSubject = subjects.find(s => s.code === newSession.subjectCode);
      const selectedCourse = courses.find(c => c.code === newSession.courseCode);

      if (!selectedSubject || !selectedCourse) {
        addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please select valid subject and course'
        });
        return;
      }

      // Generate QR code data
      const qrData = generateQRCodeData(
        '', // Will be set after session creation
        currentUser.uid,
        newSession.subjectCode,
        newSession.courseCode,
        newSession.venue,
        newSession.date,
        newSession.startTime,
        newSession.endTime
      );

      // Create attendance session
      const sessionId = await createAttendanceSession({
        lecturerId: currentUser.uid,
        lecturerName: `${currentUser.firstName} ${currentUser.lastName}`,
        subjectCode: newSession.subjectCode,
        subjectName: selectedSubject.name,
        courseCode: newSession.courseCode,
        venue: newSession.venue,
        date: newSession.date,
        startTime: newSession.startTime,
        endTime: newSession.endTime,
        qrCode: JSON.stringify(qrData),
        isActive: true
      });

      // Generate QR code with session ID
      const updatedQrData = { ...qrData, sessionId };
      const qrCodeURL = await generateQRCode(updatedQrData);

      // Update session with QR code
      await updateAttendanceSession(sessionId, {
        qrCode: JSON.stringify(updatedQrData)
      });

      // Add to local state
      const newSessionData: AttendanceSession = {
        id: sessionId,
        lecturerId: currentUser.uid,
        lecturerName: `${currentUser.firstName} ${currentUser.lastName}`,
        subjectCode: newSession.subjectCode,
        subjectName: selectedSubject.name,
        courseCode: newSession.courseCode,
        venue: newSession.venue,
        date: newSession.date,
        startTime: newSession.startTime,
        endTime: newSession.endTime,
        qrCode: JSON.stringify(updatedQrData),
        isActive: true,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        expiresAt: { seconds: (Date.now() + 2 * 60 * 60 * 1000) / 1000, nanoseconds: 0 } as any
      };

      setSessions([newSessionData, ...sessions]);
      setCurrentSession(newSessionData);
      setQrCodeDataURL(qrCodeURL);
      setShowQRCode(true);

      addNotification({
        type: 'success',
        title: 'Session Created',
        message: 'Attendance session created successfully'
      });

      // Reset form
      setNewSession({
        subjectCode: '',
        courseCode: '',
        venue: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '09:00'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create attendance session'
      });
    }
  };

  const handleStopSession = async (sessionId: string) => {
    try {
      await updateAttendanceSession(sessionId, { isActive: false });
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, isActive: false } : s));
      
      if (currentSession?.id === sessionId) {
        setShowQRCode(false);
        setCurrentSession(null);
      }

      addNotification({
        type: 'success',
        title: 'Session Stopped',
        message: 'Attendance session has been stopped'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Stop Failed',
        message: 'Failed to stop attendance session'
      });
    }
  };

  const handleShowQRCode = async (session: AttendanceSession) => {
    try {
      const qrData = JSON.parse(session.qrCode);
      const qrCodeURL = await generateQRCode(qrData);
      setQrCodeDataURL(qrCodeURL);
      setCurrentSession(session);
      setShowQRCode(true);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'QR Code Error',
        message: 'Failed to generate QR code'
      });
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataURL) {
      const link = document.createElement('a');
      link.download = `attendance-qr-${currentSession?.subjectCode}-${currentSession?.date}.png`;
      link.href = qrCodeDataURL;
      link.click();
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600 mt-1">Generate QR codes for student attendance</p>
          </div>
          <div className="flex items-center space-x-2">
            <QrCode className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Create New Session */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Attendance Session</h2>
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select
                required
                value={newSession.courseCode}
                onChange={(e) => setNewSession({ ...newSession, courseCode: e.target.value, subjectCode: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.code}>{course.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                required
                value={newSession.subjectCode}
                onChange={(e) => setNewSession({ ...newSession, subjectCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={!newSession.courseCode}
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.code}>{subject.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                required
                value={newSession.date}
                onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                required
                value={newSession.startTime}
                onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                required
                value={newSession.endTime}
                onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
            <input
              type="text"
              required
              placeholder="Enter venue (e.g., A101, Lab 1)"
              value={newSession.venue}
              onChange={(e) => setNewSession({ ...newSession, venue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Session & Generate QR Code
          </button>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h2>
        <div className="space-y-4">
          {sessions.filter(s => s.isActive).map(session => (
            <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{session.subjectName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{session.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{session.startTime} - {session.endTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{session.venue}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleShowQRCode(session)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Show QR Code
                </button>
                <button
                  onClick={() => handleStopSession(session.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Stop Session
                </button>
              </div>
            </div>
          ))}
          {sessions.filter(s => s.isActive).length === 0 && (
            <p className="text-gray-500 text-center py-8">No active sessions</p>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && currentSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Attendance QR Code</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900">{currentSession.subjectName}</h4>
                <p className="text-sm text-gray-600">{currentSession.date} • {currentSession.startTime} - {currentSession.endTime}</p>
                <p className="text-sm text-gray-600">{currentSession.venue}</p>
              </div>

              {qrCodeDataURL && (
                <div className="mb-4">
                  <img src={qrCodeDataURL} alt="Attendance QR Code" className="mx-auto border rounded-lg" />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </button>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Students should scan this QR code to mark their attendance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerAttendance;
