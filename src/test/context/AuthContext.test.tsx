import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ReactNode } from 'react';

// Mock Firebase
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
  }
}));

// Mock Firebase services
vi.mock('../../services/firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
  },
  db: {},
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Set up default mock implementations
    const { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } = await import('firebase/auth');
    const { getDoc, setDoc, doc } = await import('firebase/firestore');
    
    vi.mocked(onAuthStateChanged).mockImplementation((callback) => {
      // Simulate no user initially - call callback asynchronously
      if (typeof callback === 'function') {
        setTimeout(() => callback(null), 0);
      }
      return () => {}; // unsubscribe function
    });
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({ user: { uid: 'test-uid' } } as any);
    vi.mocked(signOut).mockResolvedValue(undefined);
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({ user: { uid: 'test-uid' } } as any);
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({ uid: 'test-uid', email: 'test@example.com' }) } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(doc).mockReturnValue('test-doc-ref' as any);
  });

  it('should provide initial auth state', async () => {
    const { result } = renderHook(() => {
      const { currentUser, loading } = useAuth();
      return { currentUser, loading };
    }, { wrapper });

    await waitFor(() => {
      expect(result.current.currentUser).toBeNull();
      expect(result.current.loading).toBe(false); // Should be false after auth state change
    });
  });

  it('should handle login', async () => {
    const { result } = renderHook(() => {
      const { login } = useAuth();
      return { login };
    }, { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    const { signInWithEmailAndPassword } = await import('firebase/auth');
    expect(vi.mocked(signInWithEmailAndPassword)).toHaveBeenCalledWith(expect.any(Object), 'test@example.com', 'password');
  });

  it('should handle logout', async () => {
    const { result } = renderHook(() => {
      const { logout } = useAuth();
      return { logout };
    }, { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    const { signOut } = await import('firebase/auth');
    expect(vi.mocked(signOut)).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should handle register', async () => {
    const { result } = renderHook(() => {
      const { register } = useAuth();
      return { register };
    }, { wrapper });

    await act(async () => {
      await result.current.register('test@example.com', 'password', 'student', { firstName: 'Test', lastName: 'User' });
    });

    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const { setDoc } = await import('firebase/firestore');
    expect(vi.mocked(createUserWithEmailAndPassword)).toHaveBeenCalledWith(expect.any(Object), 'test@example.com', 'password');
    expect(vi.mocked(setDoc)).toHaveBeenCalled();
  });
});
