import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ReactNode } from 'react';

// Mock the database functions
vi.mock('../../services/database', () => ({
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

// Mock Firebase
vi.mock('../../services/firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  },
  db: {},
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial auth state', () => {
    const { result } = renderHook(() => {
      const { currentUser, loading } = useAuth();
      return { currentUser, loading };
    }, { wrapper });

    expect(result.current.currentUser).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('should handle login', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    const { result } = renderHook(() => {
      const { login } = useAuth();
      return { login };
    }, { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    // Add assertions based on your login implementation
  });

  it('should handle logout', async () => {
    const { result } = renderHook(() => {
      const { logout } = useAuth();
      return { logout };
    }, { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    // Add assertions based on your logout implementation
  });
});
