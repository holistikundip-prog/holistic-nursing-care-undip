import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';
import { generatePatientNumber } from '../utils/storage';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('hnc_google_access_token') : null;

export const initAuth = (
  onAuthSuccess?: (user: User, token?: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || localStorage.getItem('hnc_google_access_token') || '';
      if (token) {
        cachedAccessToken = token;
      }
      if (onAuthSuccess) onAuthSuccess(user, token || undefined);
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('hnc_google_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || '';
    if (accessToken) {
      cachedAccessToken = accessToken;
      localStorage.setItem('hnc_google_access_token', accessToken);
    }
    return { user: result.user, accessToken };
  } catch (error: any) {
    console.error('Google Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const emailSignUp = async (
  name: string,
  email: string,
  password: string,
  phone?: string,
  address?: string
): Promise<{ user: User; profile: UserProfile }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    // Update display name in Firebase Auth
    await updateProfile(user, {
      displayName: name.trim()
    });

    const profile: UserProfile = {
      id: user.uid,
      name: name.trim(),
      patientNumber: generatePatientNumber(),
      phone: phone?.trim() || '',
      email: email.trim().toLowerCase(),
      address: address?.trim() || 'Semarang',
      emergencyContact: '-',
      medicalNotes: '',
      joinedDate: new Date().toISOString().split('T')[0],
      isGuest: false
    };

    return { user, profile };
  } catch (error: any) {
    console.error('Email sign up error:', error);
    let errorMsg = 'Gagal mendaftarkan akun. Silakan periksa kembali data Anda.';
    if (error.code === 'auth/email-already-in-use') {
      errorMsg = 'Email ini sudah terdaftar. Silakan pilih tab "Masuk".';
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = 'Format email tidak valid.';
    } else if (error.code === 'auth/weak-password') {
      errorMsg = 'Kata sandi terlalu lemah (minimal 6 karakter).';
    }
    throw new Error(errorMsg);
  }
};

export const emailSignIn = async (
  email: string,
  password: string
): Promise<{ user: User }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { user: userCredential.user };
  } catch (error: any) {
    console.error('Email sign in error:', error);
    let errorMsg = 'Email atau kata sandi tidak cocok. Silakan coba lagi.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      errorMsg = 'Akun dengan email atau kata sandi ini tidak ditemukan.';
    } else if (error.code === 'auth/wrong-password') {
      errorMsg = 'Kata sandi tidak sesuai untuk akun ini.';
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = 'Format email tidak valid.';
    }
    throw new Error(errorMsg);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem('hnc_google_access_token') : null);
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hnc_google_access_token');
  }
};
