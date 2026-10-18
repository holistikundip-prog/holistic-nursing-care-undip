import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface PatientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patientData: any) => void;
  onPatientAuthSuccess?: (patientData: any) => void;
  currentUser?: any;
  onGoogleAuthSuccess?: (user: any, token: string) => void;
  onLogout?: () => void;
  authPromptReason?: string | null;
}

export const PatientAuthModal: React.FC<PatientAuthModalProps> = (props) => {
  const { isOpen, onClose, onSuccess, onPatientAuthSuccess } = props;

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const safeSuccess = (data: any) => {
    if (typeof onSuccess === 'function') {
      onSuccess(data);
    } else if (typeof onPatientAuthSuccess === 'function') {
      onPatientAuthSuccess(data);
    } else if (typeof (props as any).onAuthSuccess === 'function') {
      (props as any).onAuthSuccess(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (activeTab === 'login') {
      // 1. Cek Akun di Supabase
      try {
        const { data: patient, error: spErr } = await supabase
          .from('patients')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (spErr) {
          console.error('Login Supabase Error:', spErr);
          setError('Terjadi kendala koneksi saat login.');
          setLoading(false);
          return;
        }

        if (!patient) {
          setError('Email belum terdaftar. Silakan pilih "Daftar Baru".');
          setLoading(false);
          return;
        }

        if (patient.password !== password) {
          setError('Password salah. Silakan coba lagi.');
          setLoading(false);
          return;
        }

        const patientData = {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          isGuest: false
        };

        setLoading(false);
        safeSuccess(patientData);
        handleClose();
      } catch (err: any) {
        console.error('CATCH LOGIN ERROR:', err);
        setError('Gagal terhubung ke database.');
        setLoading(false);
      }

    } else if (activeTab === 'register') {
      // 2. Registrasi Akun Baru ke Supabase
      try {
        // Cek dulu apakah email sudah dipakai
        const { data: existing } = await supabase
          .from('patients')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existing) {
          setError('Email sudah terdaftar. Silakan login.');
          setLoading(false);
          return;
        }

        const newId = 'pat-' + Date.now();
        const newPatient = {
          id: newId,
          name: name.trim(),
          email: cleanEmail,
          password: password,
          created_at: new Date().toISOString()
        };

        const { error: insertErr } = await supabase
          .from('patients')
          .insert([newPatient]);

        if (insertErr) {
          console.error('Register Supabase Error:', insertErr);
          setError('Gagal mendaftarkan akun. Coba lagi.');
          setLoading(false);
          return;
        }

        const patientData = {
          id: newId,
          name: name.trim(),
          email: cleanEmail,
          isGuest: false
        };

        setLoading(false);
        safeSuccess(patientData);
        handleClose();
      } catch (err: any) {
        console.error('CATCH REGISTER ERROR:', err);
        setError('Gagal mendaftar ke database.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Navigation Tabs */}
        <div className="mb-6 flex border-b border-gray-200 text-sm font-medium">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 pb-3 text-center transition ${
              activeTab === 'login'
                ? 'border-b-2 border-emerald-600 font-bold text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`flex-1 pb-3 text-center transition ${
              activeTab === 'register'
                ? 'border-b-2 border-emerald-600 font-bold text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Login & Register */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'register' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap Pasien"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Email Pasien</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Kata Sandi (Password)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? 'Memproses...'
              : activeTab === 'login'
              ? 'Masuk ke Jadwal Saya'
              : 'Daftar Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
};
