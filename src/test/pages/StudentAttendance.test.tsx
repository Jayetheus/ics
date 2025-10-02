import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock the database functions
vi.mock('../../services/database', () => ({
  getAttendanceRecordsByStudent: vi.fn(),
  createAttendanceRecord: vi.fn(),
  checkStudentAttendance: vi.fn()
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
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Set up default mock implementations
    const { getAttendanceRecordsByStudent, createAttendanceRecord, checkStudentAttendance } = await import('../../services/database');
    const { parseQRCode, isQRCodeExpired } = await import('../../utils/qrCodeUtils');
    
    vi.mocked(getAttendanceRecordsByStudent).mockResolvedValue([]);
    vi.mocked(createAttendanceRecord).mockResolvedValue({});
    vi.mocked(checkStudentAttendance).mockResolvedValue(false);
    vi.mocked(parseQRCode).mockReturnValue({ studentId: 'test-student-id', classId: 'test-class-id' });
    vi.mocked(isQRCodeExpired).mockReturnValue(false);
  });

  it('should render attendance page', async () => {
    renderWithRouter(<StudentAttendance />);
    
    await waitFor(() => {
      expect(screen.getByText('Attendance')).toBeInTheDocument();
      expect(screen.getByText('Scan QR codes to mark your attendance')).toBeInTheDocument();
    });
  });

  it('should show scan QR code button', async () => {
    renderWithRouter(<StudentAttendance />);
    
    await waitFor(() => {
      const scanButton = screen.getByRole('button', { name: /scan qr code/i });
      expect(scanButton).toBeInTheDocument();
    });
  });

  it('should open QR scanner modal when scan button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<StudentAttendance />);
    
    await waitFor(() => {
      const scanButton = screen.getByRole('button', { name: /scan qr code/i });
      user.click(scanButton);
    });
    
    await waitFor(() => {
      expect(screen.getAllByText('Scan QR Code')).toHaveLength(2); // Button and modal title
      expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
    });
  });

  it('should close QR scanner modal when close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<StudentAttendance />);
    
    await waitFor(() => {
      const scanButton = screen.getByRole('button', { name: /scan qr code/i });
      user.click(scanButton);
    });
    
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close/i });
      user.click(closeButton);
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('qr-scanner')).not.toBeInTheDocument();
    });
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
    
    const { getAttendanceRecordsByStudent } = await import('../../services/database');
    vi.mocked(getAttendanceRecordsByStudent).mockResolvedValue(mockRecords);
    
    renderWithRouter(<StudentAttendance />);
    
    await waitFor(() => {
      expect(screen.getByText('Your Attendance Records')).toBeInTheDocument();
    });
  });

  it('should show empty state when no attendance records', async () => {
    const { getAttendanceRecordsByStudent } = await import('../../services/database');
    vi.mocked(getAttendanceRecordsByStudent).mockResolvedValue([]);
    
    renderWithRouter(<StudentAttendance />);
    
    await waitFor(() => {
      expect(screen.getByText('No attendance records found')).toBeInTheDocument();
    });
  });

  it('should handle QR code scan', async () => {
    const user = userEvent.setup();
    const { parseQRCode, isQRCodeExpired } = await import('../../utils/qrCodeUtils');
    
    parseQRCode.mockReturnValue({
      sessionId: 'session-123',
      timestamp: Date.now(),
      type: 'attendance'
    });
    isQRCodeExpired.mockReturnValue(false);
    const { checkStudentAttendance, createAttendanceRecord } = await import('../../services/database');
    vi.mocked(checkStudentAttendance).mockResolvedValue(false);
    vi.mocked(createAttendanceRecord).mockResolvedValue({});
    
    renderWithRouter(<StudentAttendance />);
    
    await waitFor(() => {
      const scanButton = screen.getByRole('button', { name: /scan qr code/i });
      user.click(scanButton);
    });
    
    await waitFor(() => {
      const qrScanner = screen.getByTestId('qr-scanner');
      user.click(qrScanner);
    });
    
    await waitFor(() => {
      expect(parseQRCode).toHaveBeenCalledWith('test-qr-data');
      expect(vi.mocked(checkStudentAttendance)).toHaveBeenCalledWith('session-123', 'test-student-id');
    });
  });

  it('should show error for invalid QR code', async () => {
    const user = userEvent.setup();
    const { parseQRCode } = await import('../../utils/qrCodeUtils');
    
    vi.mocked(parseQRCode).mockReturnValue(null);
    
    renderWithRouter(<StudentAttendance />);
    
    await waitFor(() => {
      const scanButton = screen.getByRole('button', { name: /scan qr code/i });
      user.click(scanButton);
    });
    
    await waitFor(() => {
      const qrScanner = screen.getByTestId('qr-scanner');
      user.click(qrScanner);
    });
    
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
    
    vi.mocked(parseQRCode).mockReturnValue({
      sessionId: 'session-123',
      timestamp: Date.now(),
      type: 'attendance'
    });
    vi.mocked(isQRCodeExpired).mockReturnValue(true);
    
    renderWithRouter(<StudentAttendance />);
    
    await waitFor(() => {
      const scanButton = screen.getByRole('button', { name: /scan qr code/i });
      user.click(scanButton);
    });
    
    await waitFor(() => {
      const qrScanner = screen.getByTestId('qr-scanner');
      user.click(qrScanner);
    });
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'QR Code Expired',
        message: 'This attendance QR code has expired'
      });
    });
  });
});
