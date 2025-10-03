import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import StudentAttendance from '../../pages/StudentAttendance';

// Mock the auth context
const mockCurrentUser = {
  uid: 'test-student-id',
  email: 'student@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'student'
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser
  })
}));

// Mock the notification context
const mockAddNotification = vi.fn();
vi.mock('../../context/NotificationContext', () => ({
  useNotification: () => ({
    addNotification: mockAddNotification
  })
}));

// Mock the database functions (named mocks so tests can reference them)
const mockGetAttendanceRecordsByStudent = vi.fn();
const mockCreateAttendanceRecord = vi.fn();
const mockCheckStudentAttendance = vi.fn();

vi.mock('../../services/database', () => ({
  getAttendanceRecordsByStudent: mockGetAttendanceRecordsByStudent,
  createAttendanceRecord: mockCreateAttendanceRecord,
  checkStudentAttendance: mockCheckStudentAttendance
}));

// Mock QR code utilities
vi.mock('../../utils/qrCodeUtils', () => ({
  parseQRCode: vi.fn(),
  isQRCodeExpired: vi.fn()
}));

// Mock the QR scanner
vi.mock('@yudiel/react-qr-scanner', () => ({
  Scanner: ({ onScan, onError }: any) => (
    <div data-testid="qr-scanner" onClick={() => onScan([{ rawValue: 'test-qr-data' }])}>
      QR Scanner
    </div>
  )
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('StudentAttendance Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render attendance page', () => {
    renderWithRouter(<StudentAttendance />);
    
    expect(screen.getByText('Student Attendance')).toBeInTheDocument();
    expect(screen.getByText('Mark Your Attendance')).toBeInTheDocument();
  });

  it('should show scan QR code button', () => {
    renderWithRouter(<StudentAttendance />);
    
    const scanButton = screen.getByRole('button', { name: /scan qr code/i });
    expect(scanButton).toBeInTheDocument();
  });

  it('should open QR scanner modal when scan button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<StudentAttendance />);
    
    const scanButton = screen.getByRole('button', { name: /scan qr code/i });
    await user.click(scanButton);
    
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
  });

  it('should close QR scanner modal when close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<StudentAttendance />);
    
    const scanButton = screen.getByRole('button', { name: /scan qr code/i });
    await user.click(scanButton);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(screen.queryByText('Scan QR Code')).not.toBeInTheDocument();
  });

  it('should display attendance records', async () => {
    const mockRecords = [
      {
        id: '1',
        studentId: 'test-student-id',
        sessionId: 'session-1',
        timestamp: '2025-01-15T10:00:00Z',
        status: 'present'
      }
    ];
    
    mockGetAttendanceRecordsByStudent.mockResolvedValue(mockRecords);
    
    renderWithRouter(<StudentAttendance />);
    
    await waitFor(() => {
      expect(screen.getByText('Attendance Records')).toBeInTheDocument();
    });
  });

  it('should show empty state when no attendance records', async () => {
    mockGetAttendanceRecordsByStudent.mockResolvedValue([]);
    
    renderWithRouter(<StudentAttendance />);
    
    await waitFor(() => {
      expect(screen.getByText('No attendance records found')).toBeInTheDocument();
    });
  });

  it('should handle QR code scan', async () => {
    const user = userEvent.setup();
    const { parseQRCode, isQRCodeExpired } = await import('../../utils/qrCodeUtils');
    
    (parseQRCode as Mock).mockReturnValue({
      sessionId: 'session-123',
      timestamp: Date.now(),
      type: 'attendance'
    });
    (isQRCodeExpired as Mock).mockReturnValue(false);
    mockCheckStudentAttendance.mockResolvedValue(false);
    mockCreateAttendanceRecord.mockResolvedValue({});
    
    renderWithRouter(<StudentAttendance />);
    
    const scanButton = screen.getByRole('button', { name: /scan qr code/i });
    await user.click(scanButton);
    
    const qrScanner = screen.getByTestId('qr-scanner');
    await user.click(qrScanner);
    
    await waitFor(() => {
      expect(parseQRCode).toHaveBeenCalledWith('test-qr-data');
      expect(mockCheckStudentAttendance).toHaveBeenCalledWith('session-123', 'test-student-id');
    });
  });

  it('should show error for invalid QR code', async () => {
    const user = userEvent.setup();
    const { parseQRCode } = await import('../../utils/qrCodeUtils');
    
    (parseQRCode as Mock).mockReturnValue(null);
    
    renderWithRouter(<StudentAttendance />);
    
    const scanButton = screen.getByRole('button', { name: /scan qr code/i });
    await user.click(scanButton);
    
    const qrScanner = screen.getByTestId('qr-scanner');
    await user.click(qrScanner);
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Invalid QR Code',
        message: 'The scanned QR code is not valid'
      });
    });
  });

  it('should show error for expired QR code', async () => {
    const user = userEvent.setup();
    const { parseQRCode, isQRCodeExpired } = await import('../../utils/qrCodeUtils');
    
    (parseQRCode as Mock).mockReturnValue({
      sessionId: 'session-123',
      timestamp: Date.now(),
      type: 'attendance'
    });
    (isQRCodeExpired as Mock).mockReturnValue(true);
    
    renderWithRouter(<StudentAttendance />);
    
    const scanButton = screen.getByRole('button', { name: /scan qr code/i });
    await user.click(scanButton);
    
    const qrScanner = screen.getByTestId('qr-scanner');
    await user.click(qrScanner);
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'QR Code Expired',
        message: 'This attendance QR code has expired'
      });
    });
  });
});
