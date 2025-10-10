import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FileUpload from '../../../components/common/FileUpload';

// Mock the storage service
vi.mock('../../../services/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue({
    id: 'test-file-id',
    name: 'test-file.pdf',
    url: 'https://example.com/test-file.pdf',
    size: 1024,
    type: 'application/pdf'
  })
}));

// Mock the database createAsset used by the component via shared object
const dbMocks: any = {};
vi.mock('../../../services/database', () => {
  dbMocks.createAsset = vi.fn().mockResolvedValue('test-file-id');
  return dbMocks;
});

// Mock the notification context
const mockAddNotification = vi.fn();
vi.mock('../../../context/NotificationContext', () => ({
  useNotification: () => ({
    addNotification: mockAddNotification
  })
}));

describe('FileUpload', () => {
  const mockOnUpload = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload area', () => {
    render(<FileUpload onUpload={mockOnUpload} />);
    
    expect(screen.getByText(/Drop files here or/)).toBeInTheDocument();
    expect(screen.getByText(/browse/)).toBeInTheDocument();
    expect(screen.getByText(/Maximum file size: 10MB/i)).toBeInTheDocument();
  });

  it('should accept file selection', async () => {
    render(<FileUpload onUpload={mockOnUpload} />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    // Simulate file selection by triggering the hidden input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith({
        id: 'test-file-id',
        name: 'test-file.pdf',
        url: 'https://example.com/test-file.pdf',
        size: 1024,
        type: 'application/pdf'
      });
    });
  });

  it('should handle drag and drop', async () => {
    render(<FileUpload onUpload={mockOnUpload} />);
    
    const dropZone = screen.getByText(/Drop files here or/).closest('div');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.dragOver(dropZone!);
    fireEvent.drop(dropZone!, { dataTransfer: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled();
    });
  });

  it('should reject files that are too large', async () => {
    render(<FileUpload onUpload={mockOnUpload} maxSize={1} />);
    
    const file = new File(['x'.repeat(2 * 1024 * 1024)], 'large-file.pdf', { 
      type: 'application/pdf' 
    });
    // Simulate file selection by triggering the hidden input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'File Too Large',
        message: 'File large-file.pdf is too large. Maximum size is 1MB.'
      });
    });
    
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('should show loading state during upload', async () => {
    render(<FileUpload onUpload={mockOnUpload} />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    // Simulate file selection by triggering the hidden input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('should handle multiple files', async () => {
    render(<FileUpload onUpload={mockOnUpload} multiple />);
    
    const file1 = new File(['content1'], 'file1.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'file2.pdf', { type: 'application/pdf' });
    // Simulate file selection by triggering the hidden input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file1, file2],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledTimes(2);
    });
  });
});
