import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import UserManagement from '../../pages/UserManagement';

// Mock the auth context
const mockCurrentUser = {
  uid: 'admin-id',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin'
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
  getUsers: vi.fn(),
  getColleges: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  createLecturer: vi.fn(),
  generateStaffNumber: vi.fn()
}));

// Mock the appwrite database functions
vi.mock('../../services/appwriteDatabase', () => ({
  getAssetsByUploader: vi.fn(),
  createAsset: vi.fn(),
  deleteAsset: vi.fn()
}));

// Mock the storage functions
vi.mock('../../services/storage', () => ({
  getFileViewUrl: vi.fn(() => 'https://example.com/view'),
  getFileDownloadUrl: vi.fn(() => 'https://example.com/download')
}));

// Mock the email service
vi.mock('../../services/emailService', () => ({
  emailService: {
    sendEmail: vi.fn()
  }
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('UserManagement Page', () => {
  const mockUsers = [
    {
      uid: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'student',
      status: 'active'
    },
    {
      uid: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      role: 'lecturer',
      status: 'active',
      department: 'Computer Science',
      staffNumber: 'STF001'
    }
  ];

  const mockColleges = [
    { id: 'college-1', name: 'College of Engineering' },
    { id: 'college-2', name: 'College of Science' }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    // Set up default mock implementations
    const { getUsers, getColleges, generateStaffNumber } = await import('../../services/database');
    vi.mocked(getUsers).mockResolvedValue(mockUsers);
    vi.mocked(getColleges).mockResolvedValue(mockColleges);
    vi.mocked(generateStaffNumber).mockResolvedValue('STF001');
  });

  it('should render user management page', async () => {
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Manage users and their roles')).toBeInTheDocument();
    });
  });

  it('should display users in table', async () => {
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // In table
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getAllByText('student')).toHaveLength(2); // One in select, one in table
      expect(screen.getAllByText('lecturer')).toHaveLength(2); // One in select, one in table
    });
  });

  it('should show add user form when add button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add user/i });
      user.click(addButton);
    });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });
  });

  it('should filter users by role', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const roleFilter = screen.getByDisplayValue('All Roles');
      user.selectOptions(roleFilter, 'student');
    });
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('should search users by name or email', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search users/i);
      user.type(searchInput, 'john');
    });
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('should show user details when view button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const viewButtons = screen.getAllByTitle('View Details');
      user.click(viewButtons[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(screen.getAllByText('John Doe')).toHaveLength(2); // One in table, one in modal
      expect(screen.getAllByText('john@example.com')).toHaveLength(2); // One in table, one in modal
    });
  });

  it('should show edit form when edit button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByTitle('Edit User');
      user.click(editButtons[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    });
  });

  it('should delete user when delete button is clicked', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => true);
    const { deleteUser } = await import('../../services/database');
    vi.mocked(deleteUser).mockResolvedValue({});
    
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('Delete User');
      user.click(deleteButtons[0]);
    });
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Delete this user?');
      expect(vi.mocked(deleteUser)).toHaveBeenCalledWith('user-1');
    });
  });

  it('should show lecturer-specific fields when creating lecturer', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add user/i });
      user.click(addButton);
    });
    
    await waitFor(() => {
      const roleSelect = screen.getByDisplayValue('Select Role');
      user.selectOptions(roleSelect, 'lecturer');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Select Department')).toBeInTheDocument();
      expect(screen.getByText('Select College')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/phone/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/address/i)).toBeInTheDocument();
    });
  });

  it('should display user documents in details modal', async () => {
    const mockDocuments = [
      {
        id: 'doc-1',
        name: 'ID_Document.pdf',
        type: 'application/pdf',
        url: 'https://example.com/doc.pdf',
        size: 1024,
        category: 'document',
        uploadedAt: '2025-01-15T10:00:00Z'
      }
    ];
    
    const { getAssetsByUploader } = await import('../../services/appwriteDatabase');
    vi.mocked(getAssetsByUploader).mockResolvedValue(mockDocuments);
    
    const user = userEvent.setup();
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const viewButtons = screen.getAllByTitle('View Details');
      user.click(viewButtons[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('ID_Document.pdf')).toBeInTheDocument();
    });
  });
});
