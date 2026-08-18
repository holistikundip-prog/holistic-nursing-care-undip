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
  'https://www.googleapis.com/auth/spreadsheets'
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

export function getFriendlyErrorMessage(error: any, fallbackMessage?: string): string {
  if (!error) {
    return fallbackMessage || 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.';
  }

  let rawMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const code = (error?.code || '').toLowerCase();

  // If rawMessage is a stringified JSON object (e.g. from Firestore error info)
  if (typeof rawMessage === 'string' && rawMessage.trim().startsWith('{') && rawMessage.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(rawMessage);
      if (parsed.error) {
        rawMessage = parsed.error;
      }
    } catch {
      // ignore parse failure
    }
  }

  const lower = (rawMessage + ' ' + code).toLowerCase();

  if (
    lower.includes('offline') ||
    lower.includes('client is offline') ||
    lower.includes('failed to get document') ||
    lower.includes('unavailable') ||
    lower.includes('deadline-exceeded') ||
    lower.includes('network') ||
    code === 'auth/network-request-failed'
  ) {
    return 'Koneksi internet atau server sedang bermasalah. Silakan periksa kembali koneksi Anda atau coba beberapa saat lagi.';
  }

  switch (code) {
    case 'auth/popup-blocked':
      return 'Jendela pop-up Google diblokir oleh peramban (browser). Harap izinkan pop-up untuk situs ini atau buka aplikasi di tab baru jika Anda menggunakan pratinjau.';
    case 'auth/popup-closed-by-user':
      return 'Jendela masuk Google ditutup sebelum proses selesai. Silakan coba kembali.';
    case 'auth/cancelled-popup-request':
      return 'Permintaan masuk Google sebelumnya dibatalkan karena ada permintaan baru.';
    case 'auth/network-request-failed':
      return 'Koneksi internet atau server sedang bermasalah. Silakan periksa kembali koneksi Anda atau coba beberapa saat lagi.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan pilih tab "Masuk" untuk melanjutkan.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email atau kata sandi tidak cocok. Jika Anda belum memiliki akun, silakan pilih tab "Daftar Baru".';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid. Pastikan penulisan email sudah benar.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/unauthorized-domain':
      return 'Domain aplikasi ini belum diizinkan di Firebase Authentication. Anda dapat menggunakan login Email & Kata Sandi atau menambahkan domain di konsol Firebase.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Akses sementara dibatasi demi keamanan, silakan coba lagi beberapa saat.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan oleh administrator.';
    case 'auth/operation-not-allowed':
      return 'Metode otentikasi ini belum diaktifkan di Firebase Console.';
    case 'permission-denied':
      return 'Akses data tidak diizinkan atau sesi telah berakhir. Silakan masuk kembali ke akun Anda.';
    default:
      break;
  }

  // Check if rawMessage itself looks like raw code or json
  if (rawMessage.includes('{') || rawMessage.includes('}') || rawMessage.includes('authInfo') || rawMessage.includes('operationType')) {
    return 'Koneksi internet atau server sedang bermasalah. Silakan periksa kembali koneksi Anda atau coba beberapa saat lagi.';
  }

  if (rawMessage && !rawMessage.startsWith('Firebase:')) {
    return rawMessage;
  }

  return fallbackMessage || 'Koneksi internet atau server sedang bermasalah. Silakan periksa kembali koneksi Anda atau coba beberapa saat lagi.';
}

export function parseFirebaseAuthError(error: any, fallbackMessage: string): FirebaseAuthError {
  const code = error?.code || '';
  const message = getFriendlyErrorMessage(error, fallbackMessage);
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
