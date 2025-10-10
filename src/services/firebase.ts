import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser as firebaseDeleteUser, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

// Secondary app for creating users without logging out the current user
let secondaryApp: ReturnType<typeof initializeApp> | undefined = undefined;
if (!secondaryApp) {
  secondaryApp = initializeApp(firebaseConfig, 'Secondary');
}
export const secondaryAuth = getAuth(secondaryApp);

/**
 * requestAuthDeletion
 * Client helper that requests a secure server-side endpoint to delete a
 * Firebase Auth user. Deleting users from Firebase Auth requires admin
 * privileges and must be performed server-side (Cloud Function / API).
 *
 * To enable this from the client, set `VITE_DELETE_USER_ENDPOINT` to a
 * secure endpoint that accepts a POST { uid } and performs admin deletion.
 */
export const requestAuthDeletion = async (uid: string) => {
  const endpoint = import.meta.env.VITE_DELETE_USER_ENDPOINT;
  if (!endpoint) {
    throw new Error('Auth deletion endpoint is not configured. Set VITE_DELETE_USER_ENDPOINT to a secure admin endpoint.');
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Auth deletion request failed: ${resp.status} ${resp.statusText} ${text}`);
  }
};

/**
 * deleteUserByCredentials
 * Insecure client-side helper: signs in to the given user's account using
 * email+password on the secondaryAuth instance and deletes that user.
 * This allows an admin (who knows the user's password) to delete the auth
 * account from the client without using an admin SDK. This is insecure and
 * should only be used in trusted environments.
 */
export const deleteUserByCredentials = async (email: string, password: string) => {
  // Sign in on the secondary app so we don't clobber the main auth session
  const cred = await signInWithEmailAndPassword(secondaryAuth, email, password);
  try {
    const user = cred.user;
    await firebaseDeleteUser(user);
  } finally {
    // Ensure we sign out the secondary auth to clean up any session
    try { await firebaseSignOut(secondaryAuth); } catch (e) { /* ignore */ }
  }
};

