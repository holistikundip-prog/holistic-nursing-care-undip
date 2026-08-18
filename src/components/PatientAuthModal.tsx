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
  Users,
  ShieldCheck,
  Trash2,
  LogOut,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  getRegisteredPatients,
  saveRegisteredPatient,
  saveUser,
  generatePatientNumber,
  removeRegisteredPatient,
  verifyPatientPassword,
  createGuestPatient
} from '../utils/storage';
import { googleSignIn, logoutGoogle } from '../services/firebaseAuth';

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
  const [mode, setMode] = useState<'login' | 'register' | 'switch'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  
  // Switch & Verify fields
  const [patientToVerify, setPatientToVerify] = useState<UserProfile | null>(null);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [patientToDelete, setPatientToDelete] = useState<UserProfile | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const registeredPatients = getRegisteredPatients();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const email = loginEmail.trim().toLowerCase();
      const pass = loginPassword.trim();

      const found = registeredPatients.find(
        p => p.email && p.email.toLowerCase() === email
      );

      if (found) {
        if (!verifyPatientPassword(found, pass)) {
          setIsLoading(false);
          setErrorMessage('Kata sandi tidak sesuai untuk email pasien ini.');
          return;
        }
        
        saveUser(found);
        onPatientAuthSuccess(found);
        setIsLoading(false);
        onClose();
      } else {
        setIsLoading(false);
        setErrorMessage('Akun pasien dengan email ini belum terdaftar di perangkat. Silakan pilih "Daftar Baru".');
      }
    }, 300);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const email = regEmail.trim().toLowerCase();
      
      const alreadyExists = registeredPatients.some(
        p => p.email && p.email.toLowerCase() === email
      );

      if (alreadyExists) {
        setIsLoading(false);
        setErrorMessage('Email ini sudah terdaftar. Silakan gunakan tab "Masuk".');
        return;
      }

      const newPatient: UserProfile = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: regName.trim(),
        patientNumber: generatePatientNumber(),
        phone: regPhone.trim() || '08xxxxxxxxxx',
        email: email,
        password: regPassword.trim(),
        address: regAddress.trim() || 'Semarang',
        joinedDate: new Date().toISOString().split('T')[0],
        medicalNotes: '',
        isGuest: false
      };

      saveRegisteredPatient(newPatient);
      saveUser(newPatient);
      onPatientAuthSuccess(newPatient);
      setIsLoading(false);
      setSuccessMessage('Pendaftaran akun pasien berhasil!');
      setTimeout(() => {
        onClose();
      }, 500);
    }, 300);
  };

  const handleStartSwitch = (patient: UserProfile) => {
    setErrorMessage('');
    setVerifyPassword('');
    setPatientToVerify(patient);
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientToVerify) return;

    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      if (!verifyPatientPassword(patientToVerify, verifyPassword)) {
        setIsLoading(false);
        setErrorMessage('Kata sandi atau PIN tidak sesuai. Akses ke akun ini dilindungi demi privasi pasien.');
        return;
      }

      saveUser(patientToVerify);
      onPatientAuthSuccess(patientToVerify);
      setIsLoading(false);
      setPatientToVerify(null);
      onClose();
    }, 300);
  };

  const handleDeletePatient = (patient: UserProfile) => {
    removeRegisteredPatient(patient.id || patient.email);
    setPatientToDelete(null);
    
    // If the deleted account was the currently active user, switch to guest / another account
    if (currentUser.id === patient.id || currentUser.email === patient.email) {
      const guest = createGuestPatient();
      saveUser(guest);
      onPatientAuthSuccess(guest);
    }
    setSuccessMessage(`Akun "${patient.name}" berhasil dihapus dari perangkat ini.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleLogout = async () => {
    try {
      await logoutGoogle();
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    if (onLogout) {
      onLogout();
    } else {
      const guest = createGuestPatient();
      saveUser(guest);
      onPatientAuthSuccess(guest);
    }
    setSuccessMessage('Anda telah keluar dari sesi akun.');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res && res.user) {
        if (onGoogleAuthSuccess) {
          onGoogleAuthSuccess(res.user, res.accessToken);
        }

        const email = (res.user.email || '').toLowerCase();
        const existing = registeredPatients.find(p => p.email && p.email.toLowerCase() === email);

        let patientObj: UserProfile;
        if (existing) {
          patientObj = existing;
        } else {
          patientObj = {
            id: `usr_g_${res.user.uid || Date.now()}`,
            name: res.user.displayName || 'Pasien Google',
            patientNumber: generatePatientNumber(),
            phone: res.user.phoneNumber || '08xxxxxxxxxx',
            email: email,
            password: '1234',
            address: 'Semarang',
            joinedDate: new Date().toISOString().split('T')[0],
            isGuest: false
          };
          saveRegisteredPatient(patientObj);
        }

        saveUser(patientObj);
        onPatientAuthSuccess(patientObj);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal masuk dengan Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-stone-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white p-5 relative">
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
              <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                Keamanan & Privasi Pasien
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {patientToVerify
                  ? 'Verifikasi Sandi Akun'
                  : mode === 'login'
                  ? 'Masuk Akun Pasien'
                  : mode === 'register'
                  ? 'Daftar Pasien Baru'
                  : 'Pilih & Kelola Akun Pasien'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-stone-300 mt-1 font-light">
            Setiap data jadwal, catatan keluhan, dan e-tiket tersimpan aman & terisolasi.
          </p>
        </div>

        {/* Tab Buttons (Hidden when verifying specific account) */}
        {!patientToVerify && (
          <div className="flex border-b border-stone-200 bg-stone-50">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); setPatientToVerify(null); }}
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
              onClick={() => { setMode('register'); setErrorMessage(''); setPatientToVerify(null); }}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'border-emerald-700 text-emerald-800 bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Baru</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('switch'); setErrorMessage(''); setPatientToVerify(null); }}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'switch'
                  ? 'border-emerald-700 text-emerald-800 bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Kelola Akun ({registeredPatients.length})</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-5">
          {authPromptReason && (
            <div className="p-3.5 mb-3.5 bg-amber-50 border border-amber-300/80 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{authPromptReason}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SUB-VIEW: VERIFY PASSWORD BEFORE SWITCHING */}
          {patientToVerify ? (
            <form onSubmit={handleConfirmSwitch} className="space-y-3.5 text-xs animate-fadeIn">
              <button
                type="button"
                onClick={() => { setPatientToVerify(null); setErrorMessage(''); }}
                className="text-stone-500 hover:text-stone-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke daftar akun</span>
              </button>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-sm">
                  {patientToVerify.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{patientToVerify.name}</h4>
                  <p className="text-[10px] text-stone-500">{patientToVerify.patientNumber} • {patientToVerify.email}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Demi menjaga privasi riwayat kesehatan, masukkan kata sandi akun ini untuk melanjutkan.
                </span>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Kata Sandi (Password) Akun</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 pr-10 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    required
                    autoFocus
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

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPatientToVerify(null)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{isLoading ? 'Memverifikasi...' : 'Buka Akun Ini'}</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* MODE 1: LOGIN */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Email Pasien</span>
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
                        placeholder="Masukkan kata sandi..."
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

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-emerald-300" />
                      <span>{isLoading ? 'Memeriksa...' : 'Masuk ke Jadwal Saya'}</span>
                    </button>

                    <div className="relative flex items-center justify-center my-3">
                      <div className="border-t border-stone-200 w-full" />
                      <span className="bg-white px-2 text-[10px] text-stone-400 uppercase font-bold">Atau</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full bg-white hover:bg-stone-50 border border-stone-300 font-bold text-xs py-2.5 rounded-xl text-stone-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Masuk dengan Google</span>
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 2: REGISTER */}
              {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-2.5 text-xs max-h-[60vh] overflow-y-auto pr-1">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Nama Lengkap Pasien *</label>
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
                    <label className="font-bold text-stone-700 block mb-1">Email Aktif *</label>
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
                    <label className="font-bold text-stone-700 block mb-1">No. WhatsApp / HP *</label>
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
                    <label className="font-bold text-stone-700 block mb-1">Kata Sandi (Password) *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimal 4 karakter"
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
                    <label className="font-bold text-stone-700 block mb-1">Alamat Domisili (Opsional)</label>
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="Kota / Alamat singkat"
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-emerald-300" />
                      <span>{isLoading ? 'Mendaftarkan...' : 'Buat Akun & Dapatkan No. Pasien'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 3: SWITCH & MANAGE ACCOUNTS */}
              {mode === 'switch' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-stone-500 text-[11px]">
                    <span>Daftar profil tersimpan di perangkat:</span>
                    <span className="font-semibold text-emerald-800">Perlu Kata Sandi</span>
                  </div>

                  <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                    {registeredPatients.map((patient) => {
                      const isCurrent = (currentUser.id && patient.id === currentUser.id) ||
                        (currentUser.email && patient.email && patient.email.toLowerCase() === currentUser.email.toLowerCase());
                      return (
                        <div
                          key={patient.id || patient.email}
                          className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2 ${
                            isCurrent
                              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20'
                              : 'bg-stone-50 hover:bg-stone-100/90 border-stone-200'
                          }`}
                        >
                          <div
                            onClick={() => !isCurrent && handleStartSwitch(patient)}
                            className="flex items-center gap-2.5 flex-1 cursor-pointer overflow-hidden"
                          >
                            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {patient.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-stone-800 flex items-center gap-1.5 truncate">
                                <span className="truncate">{patient.name}</span>
                                {isCurrent && (
                                  <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded-full font-bold shrink-0">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-500 truncate">
                                {patient.patientNumber} • {patient.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleStartSwitch(patient)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Gunakan</span>
                              </button>
                            )}

                            {/* Option to Delete/Clear this profile from public/shared device */}
                            <button
                              type="button"
                              onClick={() => setPatientToDelete(patient)}
                              title="Hapus profil dari perangkat ini"
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Confirmation for deleting patient profile from device */}
                  {patientToDelete && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-2 animate-fadeIn">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs">Hapus akun "{patientToDelete.name}" dari perangkat?</p>
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            Data profil ini tidak akan lagi tersimpan di HP/browser ini. Anda tetap dapat masuk kembali kapan saja.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPatientToDelete(null)}
                          className="px-3 py-1 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePatient(patientToDelete)}
                          className="px-3 py-1 bg-rose-700 text-white rounded-lg text-xs font-bold hover:bg-rose-800 cursor-pointer"
                        >
                          Ya, Hapus
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Log Out & Clear Session Button */}
                  {!currentUser.isGuest && (
                    <div className="pt-2 border-t border-stone-200">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-2.5 px-3 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 border border-stone-200 hover:border-rose-300 text-stone-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar / Selesai Sesi di Perangkat Ini</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
