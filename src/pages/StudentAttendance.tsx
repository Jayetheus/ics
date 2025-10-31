import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  BookOpen,
  AlertTriangle,
  Smartphone,
  RotateCcw,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  createAttendanceRecord,
  checkStudentAttendance,
  getAttendanceRecordsByStudent
} from '../services/database';
import { parseQRCode, isQRCodeExpired, QRCodeData } from '../utils/qrCodeUtils';
import { AttendanceRecord } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface DetectedCode { rawValue: string }
type CameraScannerProps = {
  onScan: (detectedCodes: DetectedCode[]) => void;
  onError: (err: Error) => void;
  constraints?: MediaStreamConstraints;
  setCameraLoading?: (v: boolean) => void;
  initialStream?: MediaStream | null;
};

const CameraScanner: React.FC<CameraScannerProps> = ({ 
  onScan, 
  onError, 
  constraints = { video: { facingMode: 'environment' } }, 
  setCameraLoading, 
  initialStream 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const scanCooldownRef = useRef(false);

  const startDetectionLoop = async (detector: BarcodeDetector) => {
    const detectLoop = async () => {
      try {
        if (!videoRef.current || !detector || scanCooldownRef.current) {
          rafRef.current = requestAnimationFrame(detectLoop);
          return;
        }

        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
          rafRef.current = requestAnimationFrame(detectLoop);
          return;
        }

  const barcodes = await detector.detect(videoRef.current);
        
        if (barcodes && barcodes.length > 0) {
          scanCooldownRef.current = true;
          const results: DetectedCode[] = barcodes.map((b: any) => ({
            rawValue: b.rawValue || b.raw_value || b.rawData
          }));
          onScan(results);
          
          setTimeout(() => {
            scanCooldownRef.current = false;
          }, 2000);
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
      rafRef.current = requestAnimationFrame(detectLoop);
    };

    rafRef.current = requestAnimationFrame(detectLoop);
  };

  const initializeBarcodeDetector = async () => {
    const BarcodeDetectorCtor = (window as any).BarcodeDetector;
    if (BarcodeDetectorCtor) {
      try {
        const supported = await BarcodeDetectorCtor.getSupportedFormats();
        if (supported.includes('qr_code')) {
          const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
          detectorRef.current = detector;
          await startDetectionLoop(detector);
          return true;
        }
      } catch (err) {
        console.warn('BarcodeDetector initialization failed:', err);
      }
    }
    return false;
  };

  const setupVideoStream = async (stream: MediaStream) => {
    if (!videoRef.current) return;

    streamRef.current = stream;
    videoRef.current.srcObject = stream;

    await new Promise<void>((resolve, reject) => {
      if (videoRef.current!.readyState >= 3) {
        resolve();
        return;
      }

      const onLoadedData = () => {
        videoRef.current!.removeEventListener('loadeddata', onLoadedData);
        resolve();
      };

      const onError = () => {
        videoRef.current!.removeEventListener('error', onError);
        reject(new Error('Video loading failed'));
      };

      videoRef.current!.addEventListener('loadeddata', onLoadedData);
      videoRef.current!.addEventListener('error', onError);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Video loading timeout'));
      }, 5000);
    });

    try {
      await videoRef.current.play();
    } catch (err) {
      console.warn('Video play failed:', err);
      throw new Error('Failed to start video playback');
    }
  };

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        setCameraLoading?.(true);
        
        let stream: MediaStream;
        if (initialStream) {
          stream = initialStream;
        } else {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        await setupVideoStream(stream);
        await initializeBarcodeDetector();

      } catch (err: any) {
        if (mounted) {
          console.error('Camera setup error:', err);
          onError(err);
        }
      } finally {
        if (mounted) {
          setCameraLoading?.(false);
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      if (streamRef.current && !initialStream) {
        try {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
          });
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [onScan, onError, constraints, setCameraLoading, initialStream]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover"
        playsInline 
        muted
        autoPlay
      />
      
      {/* Scanning overlay */}
      <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400"></div>
      </div>
    </div>
  );
};

const StudentAttendance: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<QRCodeData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [sharedStream, setSharedStream] = useState<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraSupport, setHasCameraSupport] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Check camera support on component mount
  useEffect(() => {
    const checkCameraSupport = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraSupport(false);
        setCameraError('Camera not supported in this browser');
        return;
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length === 0) {
          setHasCameraSupport(false);
          setCameraError('No camera found on this device');
        }
      } catch (err) {
        console.warn('Could not enumerate devices:', err);
      }
    };

    checkCameraSupport();
  }, []);

  const getCameraConstraints = (facingMode: 'environment' | 'user') => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Start with basic constraints and gradually relax them if needed
    const baseConstraints = {
      video: { 
        facingMode,
        // Start with lower resolution for better compatibility
        width: { ideal: 640 },
        height: { ideal: 480 }
      } 
    };

    // For desktop, try higher resolution
    if (!isMobile) {
      baseConstraints.video = {
        ...baseConstraints.video,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };
    }

    return baseConstraints;
  };

  const handleNotReadableError = async (): Promise<MediaStream | null> => {
    console.log('Attempting to recover from NotReadableError...');
    
    // Strategy 1: Try with different constraints
    const constraintsToTry = [
      { video: true }, // Most basic
      { video: { facingMode: 'user' } },
      { video: { facingMode: 'environment' } },
      { video: { width: { ideal: 320 }, height: { ideal: 240 } } }, // Very low resolution
    ];

    for (const constraint of constraintsToTry) {
      try {
        console.log('Trying constraint:', constraint);
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        return stream;
      } catch (err) {
        console.log('Constraint failed:', constraint, err);
        continue;
      }
    }

    // Strategy 2: Wait and retry (camera might be temporarily busy)
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      return stream;
    } catch (err) {
      console.log('Retry after delay also failed');
    }

    return null;
  };

  const handleOpenScanner = async () => {
    if (!hasCameraSupport) {
      addNotification({
        type: 'error',
        title: 'Camera Not Supported',
        message: 'Your device or browser does not support camera access'
      });
      return;
    }

    setCameraError(null);
    setCameraLoading(true);

    try {
      // Clean up any existing stream
      if (sharedStream) {
        sharedStream.getTracks().forEach(track => track.stop());
        setSharedStream(null);
      }

      const constraints = getCameraConstraints(cameraFacingMode);
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        if (err.name === 'NotReadableError') {
          console.log('NotReadableError caught, attempting recovery...');
          const recoveredStream = await handleNotReadableError();
          if (!recoveredStream) {
            throw new Error('CAMERA_BUSY');
          }
          stream = recoveredStream;
        } else if (err.name === 'OverconstrainedError') {
          // Try opposite camera
          const fallbackConstraints = getCameraConstraints(
            cameraFacingMode === 'environment' ? 'user' : 'environment'
          );
          stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          setCameraFacingMode(cameraFacingMode === 'environment' ? 'user' : 'environment');
        } else {
          throw err;
        }
      }

      setSharedStream(stream);
      setShowScanner(true);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error('Camera access error:', err);
      handleCameraError(err);
    } finally {
      setCameraLoading(false);
    }
  };

  const handleCameraError = (err: any) => {
    let errorMessage = 'Camera access failed';
    let detailedMessage = 'Please try again or check your camera settings.';
    
    if (err.message === 'CAMERA_BUSY') {
      errorMessage = 'Camera is busy or unavailable';
      detailedMessage = 'The camera is currently in use by another application. Please close other apps using the camera and try again.';
    } else if (err.name === 'NotAllowedError') {
      errorMessage = 'Camera access denied';
      detailedMessage = 'Please allow camera permission in your browser settings to scan QR codes.';
    } else if (err.name === 'NotFoundError') {
      errorMessage = 'No camera found';
      detailedMessage = 'No camera device was found on your device.';
    } else if (err.name === 'NotReadableError') {
      errorMessage = 'Camera not accessible';
      detailedMessage = 'The camera is currently in use by another application or there is a hardware issue. Please close other apps using the camera and try again.';
    } else if (err.name === 'OverconstrainedError') {
      errorMessage = 'Camera configuration not supported';
      detailedMessage = 'The requested camera configuration is not available. Trying alternative settings...';
    }

    setCameraError(`${errorMessage}. ${detailedMessage}`);
    
    addNotification({
      type: 'error',
      title: 'Camera Error',
      message: errorMessage
    });
  };

  const switchCamera = async () => {
    if (!sharedStream) return;

    setCameraLoading(true);
    
    try {
      sharedStream.getTracks().forEach(track => track.stop());
      
      const newFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
      setCameraFacingMode(newFacingMode);
      
      const constraints = getCameraConstraints(newFacingMode);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setSharedStream(newStream);
    } catch (err: any) {
      console.error('Camera switch error:', err);
      handleCameraError(err);
    } finally {
      setCameraLoading(false);
    }
  };

  const forceRetryCamera = async () => {
    setRetryCount(prev => prev + 1);
    
    if (retryCount >= maxRetries) {
      setCameraError('Too many retries. Please refresh the page and try again.');
      return;
    }

    // Force close any existing streams
    if (sharedStream) {
      sharedStream.getTracks().forEach(track => {
        track.stop();
      });
      setSharedStream(null);
    }

    // Wait a bit for resources to be freed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCameraError(null);
    await handleOpenScanner();
  };

  const getTroubleshootingSteps = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const steps = [
      'Close other applications that might be using the camera',
      'Check if your camera is physically covered or blocked',
      'Restart your browser',
    ];

    if (isMobile) {
      steps.unshift('Force close other camera apps (like Instagram, Snapchat)');
      steps.push('Restart your device if the issue persists');
    } else {
      steps.unshift('Close video conferencing apps (Zoom, Teams, Skype)');
      steps.push('Check your antivirus/firewall settings');
    }

    return steps;
  };

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

  interface DetectedCodeScan { rawValue: string }
  const handleScan = async (detectedCodes: DetectedCodeScan[]) => {
    if (detectedCodes.length === 0 || isProcessing) return;

    const result = detectedCodes[0].rawValue;
    setIsProcessing(true);
    
    try {
      const qrData = parseQRCode(result) as QRCodeData | null;
      
      if (!qrData) {
        addNotification({
          type: 'error',
          title: 'Invalid QR Code',
          message: 'The scanned QR code is not valid'
        });
        return;
      }

      if (qrData.type !== 'attendance') {
        addNotification({
          type: 'error',
          title: 'Invalid QR Type',
          message: 'This QR code is not an attendance code'
        });
        return;
      }

      // Basic shape validation
      const requiredFields: (keyof QRCodeData)[] = ['sessionId','lecturerId','subjectCode','courseCode','venue','date','startTime','endTime','timestamp'];
  const qrRecord = qrData as unknown as Record<string, unknown>;
  const missing = requiredFields.filter(f => qrRecord[f] === undefined || qrRecord[f] === '');
      if (missing.length) {
        addNotification({
          type: 'error',
          title: 'Corrupt QR Code',
          message: 'Missing fields: ' + missing.join(', ')
        });
        return;
      }

      if (isQRCodeExpired(qrData.timestamp)) {
        addNotification({
          type: 'error',
          title: 'QR Code Expired',
          message: 'This attendance QR code has expired'
        });
        return;
      }

  const alreadyMarked = await checkStudentAttendance(qrData.sessionId, currentUser?.uid || "");
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
      
      if (sharedStream) {
        sharedStream.getTracks().forEach(track => track.stop());
        setSharedStream(null);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Scan Error',
        message: 'Failed to process QR code'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScannerError = (error: Error) => {
    console.error('QR Scanner Error:', error);
    handleCameraError(error);
  };

  const handleConfirmAttendance = async () => {
    if (!scannedData || !currentUser) return;

    try {
      setIsProcessing(true);

      const now = new Date();
      const sessionStartTime = new Date(`${scannedData.date}T${scannedData.startTime}`);
      const isLate = now > new Date(sessionStartTime.getTime() + 15 * 60 * 1000);

      await createAttendanceRecord({
        sessionId: scannedData.sessionId,
        studentId: currentUser.uid,
        studentName: `${currentUser.firstName} ${currentUser.lastName}`,
        studentNumber: currentUser.studentNumber || 'N/A',
        status: isLate ? 'late' : 'present',
        notes: isLate ? 'Marked attendance after grace period' : undefined
      });

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
            onClick={handleOpenScanner}
            disabled={cameraLoading || !hasCameraSupport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="h-4 w-4 mr-2" />
            {cameraLoading ? 'Loading...' : 'Scan QR Code'}
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
              {!hasCameraSupport && (
                <li className="text-red-600 font-medium">Your browser or device does not support camera access</li>
              )}
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={switchCamera}
                  disabled={cameraLoading}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  title="Switch Camera"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setShowScanner(false);
                    setCameraError(null);
                    if (sharedStream) {
                      sharedStream.getTracks().forEach(track => track.stop());
                      setSharedStream(null);
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-center">
              {cameraError ? (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-800 mb-2">{cameraError}</p>
                  
                  {/* Troubleshooting Steps */}
                  <div className="mt-3 text-left">
                    <div className="flex items-center mb-2">
                      <HelpCircle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-800">Troubleshooting steps:</span>
                    </div>
                    <ul className="text-xs text-red-700 space-y-1 ml-6 list-disc">
                      {getTroubleshootingSteps().map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-red-600 mt-2">
                    Retry attempt: {retryCount + 1} of {maxRetries}
                  </p>
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
                    <CameraScanner
                      onScan={handleScan}
                      onError={handleScannerError}
                      constraints={getCameraConstraints(cameraFacingMode)}
                      setCameraLoading={setCameraLoading}
                      initialStream={sharedStream}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {isProcessing ? 'Processing QR code...' : 
                     cameraLoading ? 'Initializing camera...' : 
                     'Point your camera at the QR code'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Using {cameraFacingMode === 'environment' ? 'rear' : 'front'} camera
                  </p>
                </div>
              )}

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowScanner(false);
                    setCameraError(null);
                    if (sharedStream) {
                      sharedStream.getTracks().forEach(track => track.stop());
                      setSharedStream(null);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {cameraError ? (
                  <>
                    <button
                      onClick={forceRetryCamera}
                      disabled={retryCount >= maxRetries}
                      className="flex items-center justify-center flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {retryCount >= maxRetries ? 'Max Retries' : 'Try Again'}
                    </button>
                  </>
                ) : null}
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