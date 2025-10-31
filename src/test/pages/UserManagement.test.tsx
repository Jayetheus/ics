import { render, screen, waitFor } from '@testing-library/react';
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
vi.mock('../../services/database', () => {
  return {
    getUsers: vi.fn().mockResolvedValue([]),
    getColleges: vi.fn().mockResolvedValue([]),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn().mockResolvedValue({}),
    createLecturer: vi.fn(),
    getAssetsByUploader: vi.fn().mockResolvedValue([]),
    createAsset: vi.fn(),
    deleteAsset: vi.fn(),
  };
});

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user management page', async () => {
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Manage users and their roles')).toBeInTheDocument();
    });
  });

  it('should display users in table', async () => {
  const db = await import('../../services/database');
  (db.getUsers as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockUsers);
  (db.getColleges as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockColleges);
  renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      // Table cells: use getAllByText to avoid option/tag duplicates
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('jane@example.com').length).toBeGreaterThan(0);
      expect(screen.getAllByText('student').length).toBeGreaterThan(0);
      expect(screen.getAllByText('lecturer').length).toBeGreaterThan(0);
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
      // Heading uses same text as button; ensure form is present by checking form fields
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
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
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
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
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('should show user details when view button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const viewButtons = screen.getAllByRole('button', { name: /view details/i });
      user.click(viewButtons[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(screen.getAllByText(/John\s+Doe/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText('john@example.com').length).toBeGreaterThan(0);
    });
  });

  it('should show edit form when edit button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /edit user/i });
      user.click(editButtons[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Edit User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    });
  });

  it('should delete user when delete button is clicked', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => true);
  const db = await import('../../services/database');
  (db.deleteUser as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({});

    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete user/i });
      user.click(deleteButtons[0]);
    });
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Delete this user?');
      expect(db.deleteUser).toHaveBeenCalledWith('user-1');
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
    
  const db = await import('../../services/database');
  (db.getAssetsByUploader as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockDocuments);
    
    const user = userEvent.setup();
    renderWithRouter(<UserManagement />);
    
    await waitFor(() => {
      const viewButtons = screen.getAllByRole('button', { name: /view details/i });
      user.click(viewButtons[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('ID_Document.pdf')).toBeInTheDocument();
    });
  });
});
