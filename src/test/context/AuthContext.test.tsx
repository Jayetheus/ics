import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the database functions
vi.mock('../../services/database', () => ({
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

// Mock Firebase
vi.mock('../../services/firebase', () => {
  return {
    auth: {
      onAuthStateChanged: (cb: (user: any) => void) => { cb(null); return () => {}; },
    },
    db: {},
  };
});

// Mock firebase/auth named functions used (signInWithEmailAndPassword etc.)
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: 'test-uid' } })),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: 'new-uid' } })),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn((_auth: unknown, cb: (user: unknown) => void) => { cb(null); return () => {}; })
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
    // Removed unused mockUser; login flow just needs function to resolve

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
