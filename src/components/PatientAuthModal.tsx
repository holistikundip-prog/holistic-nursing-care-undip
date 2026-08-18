import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Trash2 } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Sesuaikan path config Anda

interface PatientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patientData: any) => void;
}

export const PatientAuthModal: React.FC<PatientAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'manage'>('login');
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

  // Ambil hanya akun yang TIDAK/BELUM di-soft delete
  const getActivePatients = () => {
    const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
    return existingPatients.filter((p: any) => !p.isDeleted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');

      if (activeTab === 'login') {
        // 1. Cari pasien berdasarkan email saja
        const index = existingPatients.findIndex(
          (p: any) => p.email.toLowerCase() === email.toLowerCase()
        );

        if (index === -1) {
          throw new Error('Email belum terdaftar. Silakan pilih "Daftar Baru".');
        }

        const patient = existingPatients[index];

        // 2. Cek kesesuaian password
        if (patient.password !== password) {
          throw new Error('Password salah. Silakan coba lagi.');
        }

        // 3. Restore akun jika sebelumnya di-soft delete
        if (patient.isDeleted) {
          existingPatients[index].isDeleted = false;
          localStorage.setItem('patients', JSON.stringify(existingPatients));
        }

        onSuccess(existingPatients[index]);
        handleClose();
      } else if (activeTab === 'register') {
        // Alur Registrasi
        const exists = existingPatients.some(
          (p: any) => p.email.toLowerCase() === email.toLowerCase() && !p.isDeleted
        );

        if (exists) {
          throw new Error('Email sudah terdaftar. Silakan login.');
        }

        const newPatient = {
          id: Date.now().toString(),
          name,
          email,
          password,
          isDeleted: false,
          createdAt: new Date().toISOString()
        };

        const updatedPatients = [...existingPatients, newPatient];
        localStorage.setItem('patients', JSON.stringify(updatedPatients));

        onSuccess(newPatient);
        handleClose();
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = (targetEmail: string) => {
    const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
    
    // Tandai akun sebagai isDeleted: true (Soft Delete)
    const updatedPatients = existingPatients.map((p: any) => {
      if (p.email.toLowerCase() === targetEmail.toLowerCase()) {
        return { ...p, isDeleted: true };
      }
      return p;
    });

    localStorage.setItem('patients', JSON.stringify(updatedPatients));
    // Re-render tab kelola akun
    setEmail('');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
      let index = existingPatients.findIndex((p: any) => p.email === user.email);

      let patient;
      if (index === -1) {
        patient = {
          id: user.uid,
          name: user.displayName || 'Pasien Google',
          email: user.email,
          isDeleted: false,
          createdAt: new Date().toISOString()
        };
        existingPatients.push(patient);
      } else {
        patient = existingPatients[index];
        patient.isDeleted = false; // Restore jika sebelumnya terhapus
      }

      localStorage.setItem('patients', JSON.stringify(existingPatients));
      onSuccess(patient);
      handleClose();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Gagal login dengan Google. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const activePatients = getActivePatients();

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
          <button
            onClick={() => { setActiveTab('manage'); setError(''); }}
            className={`flex-1 pb-3 text-center transition ${
              activeTab === 'manage'
                ? 'border-b-2 border-emerald-600 font-bold text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Kelola Akun ({activePatients.length})
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Login & Register */}
        {(activeTab === 'login' || activeTab === 'register') && (
          <>
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
                      placeholder="John Doe"
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
                className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {loading
                  ? 'Memproses...'
                  : activeTab === 'login'
                  ? 'Masuk ke Jadwal Saya'
                  : 'Daftar Sekarang'}
              </button>
            </form>

            <div className="relative my-6 text-center text-xs text-gray-400">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <span className="relative bg-white px-2">ATAU</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Masuk dengan Google
            </button>
          </>
        )}

        {/* Tab Kelola Akun */}
        {activeTab === 'manage' && (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {activePatients.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">Belum ada akun tersimpan di perangkat ini.</p>
            ) : (
              activePatients.map((patient: any) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onSuccess(patient);
                        handleClose();
                      }}
                      className="rounded bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                    >
                      Pilih
                    </button>
                    <button
                      onClick={() => handleSoftDelete(patient.email)}
                      className="rounded bg-red-100 p-1 text-red-600 hover:bg-red-200"
                      title="Hapus dari Perangkat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
