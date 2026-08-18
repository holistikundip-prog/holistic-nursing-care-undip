import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  UserPlus,
  LogIn,
  ShieldCheck,
  LogOut,
  Database,
  Check,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { UserProfile } from '../types';
import { generatePatientNumber } from '../utils/storage';
import { googleSignIn, emailSignUp, emailSignIn, logoutGoogle, getFriendlyErrorMessage } from '../services/firebaseAuth';
import { saveUserProfileToFirestore, getUserProfileFromFirestore } from '../services/firebaseFirestore';

interface PatientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onPatientAuthSuccess: (patient: UserProfile) => void;
  onGoogleAuthSuccess?: (googleUser: any, token: string) => void;
  onLogout?: () => void;
  authPromptReason?: string | null;
}

export const PatientAuthModal: React.FC<PatientAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPatientAuthSuccess,
  onGoogleAuthSuccess,
  onLogout,
  authPromptReason
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const isAlreadyLoggedIn = !currentUser.isGuest && Boolean(currentUser.email);

  const formatAuthErrorMessage = (err: any, defaultMsg: string): string => {
    return getFriendlyErrorMessage(err, defaultMsg);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorCode(null);
    setSuccessMessage('');
    setIsLoading(true);

    const email = loginEmail.trim().toLowerCase();
    const pass = loginPassword.trim();

    try {
      // 1. Authenticate 100% via Firebase Auth
      const { user: authUser } = await emailSignIn(email, pass);

      // 2. Fetch User Profile from Firestore database
      let userProfile = await getUserProfileFromFirestore(authUser.uid);

      if (!userProfile) {
        // Create initial profile in Firestore if not present
        userProfile = {
          id: authUser.uid,
          name: authUser.displayName || 'Pasien',
          patientNumber: generatePatientNumber(),
          phone: '',
          email: email,
          address: 'Semarang',
          emergencyContact: '-',
          medicalNotes: '',
          joinedDate: new Date().toISOString().split('T')[0],
          isGuest: false
        };
        await saveUserProfileToFirestore(userProfile);
      }

      onPatientAuthSuccess(userProfile);
      setSuccessMessage('Berhasil masuk! Akun terhubung ke database Firebase.');
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Firebase login error:', err);
      setIsLoading(false);
      const code = err?.code || '';
      setErrorCode(code);
      setErrorMessage(formatAuthErrorMessage(err, 'Email atau kata sandi tidak cocok. Silakan periksa kembali.'));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorCode(null);
    setSuccessMessage('');
    setIsLoading(true);

    const name = regName.trim();
    const email = regEmail.trim().toLowerCase();
    const pass = regPassword.trim();
    const phone = regPhone.trim();
    const address = regAddress.trim() || 'Semarang';

    if (pass.length < 6) {
      setIsLoading(false);
      setErrorMessage('Kata sandi minimal 6 karakter untuk keamanan akun.');
      return;
    }

    try {
      // 1. Create user account in Firebase Auth
      const { user: authUser, profile: newProfile } = await emailSignUp(
        name,
        email,
        pass,
        phone,
        address
      );

      // 2. Save User Profile permanently to Cloud Firestore
      await saveUserProfileToFirestore(newProfile);

      onPatientAuthSuccess(newProfile);
      setSuccessMessage('Pendaftaran berhasil! Akun tersimpan secara permanen di database Firebase.');
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 600);
    } catch (err: any) {
      console.error('Firebase registration error:', err);
      setIsLoading(false);
      const code = err?.code || '';
      setErrorCode(code);
      setErrorMessage(formatAuthErrorMessage(err, 'Gagal mendaftar akun. Silakan coba lagi.'));
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setErrorCode(null);
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await googleSignIn();
      if (res && res.user) {
        if (onGoogleAuthSuccess) {
          onGoogleAuthSuccess(res.user, res.accessToken);
        }

        const email = (res.user.email || '').toLowerCase();

        // Fetch or create profile in Cloud Firestore
        let userProfile = await getUserProfileFromFirestore(res.user.uid);

        if (!userProfile) {
          userProfile = {
            id: res.user.uid,
            name: res.user.displayName || 'Pasien Google',
            patientNumber: generatePatientNumber(),
            phone: res.user.phoneNumber || '',
            email: email,
            address: 'Semarang',
            emergencyContact: '-',
            medicalNotes: '',
            joinedDate: new Date().toISOString().split('T')[0],
            isGuest: false
          };
          await saveUserProfileToFirestore(userProfile);
        }

        onPatientAuthSuccess(userProfile);
        setSuccessMessage('Berhasil masuk dengan Google & Firebase Database!');
        setTimeout(() => {
          setIsLoading(false);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setIsLoading(false);
      const code = err?.code || '';
      setErrorCode(code);
      setErrorMessage(formatAuthErrorMessage(err, 'Gagal masuk dengan akun Google.'));
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutGoogle();
    } catch (e) {
      console.warn('Firebase signout warning:', e);
    }
    if (onLogout) {
      onLogout();
    }
    setSuccessMessage('Anda telah berhasil keluar dari akun.');
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-stone-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" />
                  <span>Cloud Database Firebase</span>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {mode === 'login' ? 'Masuk Akun Pasien' : 'Pendaftaran Akun Pasien Baru'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-stone-300 mt-1 font-light">
            Data rekam medis, jadwal terapi, dan identitas Anda tersimpan 100% aman di database cloud Firebase.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Baru</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5">
          {authPromptReason && (
            <div className="p-3.5 mb-3.5 bg-amber-50 border border-amber-300/80 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{authPromptReason}</span>
            </div>
          )}

          {/* Current Logged in Banner if user is active */}
          {isAlreadyLoggedIn && (
            <div className="p-3 mb-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="truncate">
                  <span className="text-[10px] text-stone-500 block">Akun Aktif:</span>
                  <span className="font-bold text-emerald-950 truncate block">{currentUser.name} ({currentUser.email})</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="shrink-0 px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>
          )}

          {errorMessage && (
            <div className={`p-3.5 mb-3.5 rounded-2xl text-xs space-y-2 animate-shake border ${
              errorMessage.includes('Koneksi internet atau server sedang bermasalah')
                ? 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-xs'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-start gap-2.5">
                {errorMessage.includes('Koneksi internet atau server sedang bermasalah') ? (
                  <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>

              {/* Action buttons based on error type */}
              {errorCode === 'auth/email-already-in-use' && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail(regEmail);
                      setMode('login');
                      setErrorMessage('');
                      setErrorCode(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <span>Beralih ke Tab Masuk</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {(errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found') && mode === 'login' && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setRegEmail(loginEmail);
                      setMode('register');
                      setErrorMessage('');
                      setErrorCode(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <span>Daftar Akun Baru dengan Email Ini</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {errorCode === 'auth/popup-blocked' && (
                <div className="pt-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-rose-700 font-medium">Buka app di tab utama browser:</span>
                  <button
                    type="button"
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white rounded-lg font-bold text-[11px] hover:bg-stone-800 transition cursor-pointer"
                  >
                    <span>Buka Tab Baru</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {(errorCode === 'auth/network-request-failed' || errorMessage.includes('Koneksi internet atau server sedang bermasalah')) && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setErrorCode(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-900 text-white rounded-lg font-bold text-[11px] hover:bg-amber-800 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Coba Ulang</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3 mb-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN (100% Firebase Auth) */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Email Pasien Terdaftar</span>
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="contoh: pasien@gmail.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Kata Sandi (Password)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 pr-10 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4 text-emerald-300" />
                  <span>{isLoading ? 'Memverifikasi ke Firebase...' : 'Masuk Akun Pasien'}</span>
                </button>

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-stone-200 w-full" />
                  <span className="bg-white px-2 text-[10px] text-stone-400 uppercase font-bold">Atau Masuk Cepat</span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-stone-50 border border-stone-300 font-bold text-xs py-2.5 rounded-xl text-stone-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Masuk dengan Akun Google (Firebase Auth)</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER (100% Firebase Auth + Firestore Database) */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-2.5 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Nama Lengkap Pasien *</span>
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nama sesuai KTP / Rekam Medis"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Email Aktif Pasien *</span>
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="contoh: pasien@gmail.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>No. WhatsApp / HP Pasien *</span>
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx (untuk konfirmasi jadwal)"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Kata Sandi (Password Akun) *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 pr-10 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Alamat Domisili (Opsional)</span>
                </label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Kota / Alamat tempat tinggal"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-4 h-4 text-emerald-300" />
                  <span>{isLoading ? 'Mendaftarkan ke Cloud Firebase...' : 'Daftar Akun Permanen di Firebase'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
