import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  BookOpen,
  AlertTriangle,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  createAttendanceRecord,
  checkStudentAttendance,
  getAttendanceRecordsByStudent
} from '../services/database';
import { parseQRCode, isQRCodeExpired } from '../utils/qrCodeUtils';
import { AttendanceRecord } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Scanner } from '@yudiel/react-qr-scanner';

const StudentAttendance: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      if (!currentUser) return;

      try {
        const records = await getAttendanceRecordsByStudent(currentUser.uid);
        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error fetching attendance records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceRecords();
  }, [currentUser]);

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0 && !isProcessing) {
      const result = detectedCodes[0].rawValue;
      setIsProcessing(true);
      try {
        const qrData = parseQRCode(result);
        
        if (!qrData) {
          addNotification({
            type: 'error',
            title: 'Invalid QR Code',
            message: 'The scanned QR code is not valid'
          });
          return;
        }

        // Check if QR code is expired
        if (isQRCodeExpired(qrData.timestamp)) {
          addNotification({
            type: 'error',
            title: 'QR Code Expired',
            message: 'This attendance QR code has expired'
          });
          return;
        }

        // Check if student already marked attendance for this session
        checkStudentAttendance(qrData.sessionId, currentUser?.uid || "").then(async (alreadyMarked) => {
          if (alreadyMarked) {
            addNotification({
              type: 'warning',
              title: 'Already Marked',
              message: 'You have already marked attendance for this session'
            });
            return;
          }

          setScannedData(qrData);
          setShowScanner(false);
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Scan Error',
          message: 'Failed to process QR code'
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner Error:', error);
    setCameraError('Camera access denied or not available');
    setCameraLoading(false);
  };



  const handleConfirmAttendance = async () => {
    if (!scannedData || !currentUser) return;

    try {
      setIsProcessing(true);

      // Determine if student is late
      const now = new Date();
      const sessionStartTime = new Date(`${scannedData.date}T${scannedData.startTime}`);
      const isLate = now > new Date(sessionStartTime.getTime() + 15 * 60 * 1000); // 15 minutes grace period

      // Create attendance record
      await createAttendanceRecord({
        sessionId: scannedData.sessionId,
        studentId: currentUser.uid,
        studentName: `${currentUser.firstName} ${currentUser.lastName}`,
        studentNumber: currentUser.studentNumber || 'N/A',
        status: isLate ? 'late' : 'present',
        notes: isLate ? 'Marked attendance after grace period' : undefined
      });

      // Refresh attendance records
      const records = await getAttendanceRecordsByStudent(currentUser.uid);
      setAttendanceRecords(records);

      addNotification({
        type: 'success',
        title: 'Attendance Marked',
        message: `Attendance marked successfully${isLate ? ' (Late)' : ''}`
      });

      setScannedData(null);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Marking Failed',
        message: 'Failed to mark attendance'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
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
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600 mt-1">Scan QR codes to mark your attendance</p>
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Camera className="h-4 w-4 mr-2" />
            Scan QR Code
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">How to mark attendance:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Click "Scan QR Code" button above</li>
              <li>2. Allow camera access when prompted</li>
              <li>3. Point your camera at the QR code displayed by your lecturer</li>
              <li>4. Confirm your attendance when prompted</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Attendance Records</h2>
        <div className="space-y-3">
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance records found</p>
              <p className="text-sm text-gray-500">Scan a QR code to mark your first attendance</p>
            </div>
          ) : (
            attendanceRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(record.status)}
                  <div>
                    <p className="font-medium text-gray-900">{record.studentName}</p>
                    <p className="text-sm text-gray-600">
                      {record.timestamp && typeof record.timestamp.toDate === 'function'
                        ? record.timestamp.toDate().toLocaleString()
                        : new Date(record.timestamp as any).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
              <button
                onClick={() => {
                  setShowScanner(false);
                  setCameraError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center">
              {cameraError ? (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-800 mb-2">{cameraError}</p>
                  <p className="text-xs text-red-600">Please ensure camera access is allowed and try again</p>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                    {cameraLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Initializing camera...</p>
                        </div>
                      </div>
                    )}
                    <Scanner
                      onScan={handleScan}
                      onError={handleError}
                      constraints={{ facingMode: 'environment' }}
                      styles={{
                        container: { width: '100%', height: '100%' }
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {isProcessing ? 'Processing QR code...' : 
                     cameraLoading ? 'Initializing camera...' : 
                     'Point your camera at the QR code'}
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowScanner(false);
                    setCameraError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {cameraError && (
                  <button
                    onClick={() => {
                      setCameraError(null);
                      setShowScanner(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Confirmation Modal */}
      {scannedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Attendance</h3>
              <button
                onClick={() => setScannedData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 mb-2">Attendance Session Details</h4>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-900">{scannedData.subjectCode}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-900">{scannedData.date} • {scannedData.startTime} - {scannedData.endTime}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-900">{scannedData.venue}</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Are you sure you want to mark attendance for this session?
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setScannedData(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAttendance}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Marking...' : 'Mark Attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
