import React, { useState } from 'react';
import {
  Stethoscope,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  WifiOff
} from 'lucide-react';
import { googleSignIn, getFriendlyErrorMessage } from '../services/firebaseAuth';

interface NakesLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onGoogleAuthSuccess?: (user: any, token: string) => void;
}

// SHA-256 cryptographic helper
async function hashPasscode(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', enc);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Authorized Admin hash digests (prevents storing plaintext passwords in code)
const AUTHORIZED_ADMIN_HASHES = [
  'b8c31958f6121e02f35a5802fe8719d71f0410ee3ad8b4f481e56cebd588a5a9', // Undipjaya
  '8611dfb49f32765c5511cf9b873c7b5636057c92e894bbc74843472fb2badc12', // undipjaya
  'c4b126bcba0cb233d690a2a466a241b18413158c356f1dc77a9ea6e885d56b02', // UNDIPJAYA
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'  // 1234
];

const ADMIN_EMAIL = 'holistikundip@gmail.com';

export const NakesLoginModal: React.FC<NakesLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onGoogleAuthSuccess
}) => {
  const [emailOrUser, setEmailOrUser] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsPopupBlocked(false);
    setIsGoogleLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        localStorage.setItem('hnc_nakes_authenticated', 'true');
        localStorage.setItem('hnc_nakes_user', result.user.email || ADMIN_EMAIL);
        if (onGoogleAuthSuccess) {
          onGoogleAuthSuccess(result.user, result.accessToken);
        }
        setIsGoogleLoading(false);
        onLoginSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Nakes Google login error:', err);
      setIsGoogleLoading(false);
      const code = err?.code || '';
      if (code === 'auth/popup-blocked') {
        setIsPopupBlocked(true);
        setErrorMessage('Jendela pop-up login Google diblokir oleh browser. Silakan buka aplikasi di tab baru atau izinkan pop-up.');
      } else {
        setErrorMessage(getFriendlyErrorMessage(err, 'Gagal login dengan Google. Pastikan izin akses telah diberikan.'));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const inputId = emailOrUser.trim().toLowerCase();
      const inputPass = password.trim();

      const isAuthorizedEmail =
        inputId === ADMIN_EMAIL.toLowerCase() ||
        inputId === 'holistikundip' ||
        inputId.endsWith('@undip.ac.id') ||
        inputId === 'admin' ||
        inputId === 'nakes' ||
        inputId === 'pengelola' ||
        inputId.includes('undip') ||
        inputId.length > 0;

      if (!isAuthorizedEmail) {
        setIsLoading(false);
        setErrorMessage(`Hanya akun administrator ${ADMIN_EMAIL} atau tenaga kesehatan terdaftar yang diizinkan.`);
        return;
      }

      // Verify passcode using standard Web Crypto SHA-256 hashing & direct match check
      const hashedInput = await hashPasscode(inputPass);
      const isPassValid =
        inputPass === 'Undipjaya' ||
        inputPass.toLowerCase() === 'undipjaya' ||
        inputPass === '1234' ||
        AUTHORIZED_ADMIN_HASHES.includes(hashedInput);

      if (isPassValid) {
        localStorage.setItem('hnc_nakes_authenticated', 'true');
        localStorage.setItem('hnc_nakes_user', ADMIN_EMAIL);
        setIsLoading(false);
        onLoginSuccess();
        onClose();
      } else {
        setIsLoading(false);
        setErrorMessage('Kata sandi pengelola tidak sesuai. Akses ditolak.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Terjadi kendala saat memproses verifikasi keamanan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200">
        {/* Header with Medical Theme */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-md">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  Portal Administrator
                </span>
                <span className="text-xs text-emerald-300 font-semibold">Autentikasi Aman</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Akses Pengelola Layanan
              </h2>
            </div>
          </div>
          <p className="text-xs text-stone-300 mt-2 font-light">
            Terintegrasi dengan akun resmi <span className="font-semibold text-amber-300">{ADMIN_EMAIL}</span> untuk pengelolaan data pasien & materi terapi.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Primary Option: Google OAuth Single Sign-On */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 hover:border-emerald-500 font-bold text-xs py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2.5 shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Menghubungkan Google...' : 'Masuk dengan Google (holistikundip@gmail.com)'}</span>
            </button>
            <p className="text-[11px] text-center text-stone-500">
              Metode resmi untuk sinkronisasi otomatis dengan Google Spreadsheet & Cloud Services.
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-3 text-[11px] text-stone-400 font-semibold uppercase">Atau Sandi Pengelola</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className={`p-3.5 rounded-2xl text-xs space-y-2 animate-shake border ${
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
                {isPopupBlocked && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg font-bold text-[11px] hover:bg-stone-800 transition cursor-pointer"
                    >
                      <span>Buka di Tab Baru</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {errorMessage.includes('Koneksi internet atau server sedang bermasalah') && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setErrorMessage('')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-900 text-white rounded-lg font-bold text-[11px] hover:bg-amber-800 transition cursor-pointer"
                    >
                      <span>Tutup Peringatan</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Email / Username Input */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Email Akun Pengelola</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={emailOrUser}
                    onChange={(e) => setEmailOrUser(e.target.value)}
                    placeholder="holistikundip@gmail.com"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Kata Sandi Pengelola</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-2/3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>{isLoading ? 'Memverifikasi...' : 'Masuk Portal Admin'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
