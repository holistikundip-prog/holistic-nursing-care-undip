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

export class FirebaseAuthError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'FirebaseAuthError';
    this.code = code;
  }
}

export function parseFirebaseAuthError(error: any, fallbackMessage: string): FirebaseAuthError {
  const code = error?.code || '';
  let message = fallbackMessage;

  switch (code) {
    case 'auth/popup-blocked':
      message = 'Jendela pop-up Google diblokir oleh peramban (browser). Harap izinkan pop-up untuk situs ini atau buka aplikasi di tab baru jika Anda menggunakan pratinjau.';
      break;
    case 'auth/popup-closed-by-user':
      message = 'Jendela masuk Google ditutup sebelum proses selesai. Silakan coba kembali.';
      break;
    case 'auth/cancelled-popup-request':
      message = 'Permintaan masuk Google sebelumnya dibatalkan karena ada permintaan baru.';
      break;
    case 'auth/network-request-failed':
      message = 'Koneksi jaringan ke Firebase terputus (auth/network-request-failed). Pastikan koneksi internet aktif atau coba beberapa saat lagi.';
      break;
    case 'auth/email-already-in-use':
      message = 'Email ini sudah terdaftar. Silakan pilih tab "Masuk" untuk melanjutkan.';
      break;
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      message = 'Email atau kata sandi tidak cocok. Jika Anda belum memiliki akun, silakan pilih tab "Daftar Baru".';
      break;
    case 'auth/invalid-email':
      message = 'Format alamat email tidak valid. Pastikan penulisan email sudah benar.';
      break;
    case 'auth/weak-password':
      message = 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
      break;
    case 'auth/unauthorized-domain':
      message = 'Domain aplikasi ini belum diizinkan di Firebase Authentication. Anda dapat menggunakan login Email & Kata Sandi atau menambahkan domain di konsol Firebase.';
      break;
    case 'auth/too-many-requests':
      message = 'Terlalu banyak percobaan gagal. Akses sementara dibatasi demi keamanan, silakan coba lagi beberapa saat.';
      break;
    case 'auth/user-disabled':
      message = 'Akun ini telah dinonaktifkan oleh administrator.';
      break;
    case 'auth/operation-not-allowed':
      message = 'Metode otentikasi ini belum diaktifkan di Firebase Console.';
      break;
    default:
      if (error?.message) {
        message = error.message;
      }
      break;
  }

  return new FirebaseAuthError(message, code);
}

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
    throw parseFirebaseAuthError(error, 'Gagal masuk dengan akun Google.');
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
    try {
      await updateProfile(user, {
        displayName: name.trim()
      });
    } catch (profErr) {
      console.warn('Could not update displayName profile:', profErr);
    }

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
    throw parseFirebaseAuthError(error, 'Gagal mendaftarkan akun. Silakan periksa kembali data Anda.');
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
    throw parseFirebaseAuthError(error, 'Email atau kata sandi tidak cocok. Silakan coba lagi.');
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
