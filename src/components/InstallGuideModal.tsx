import React, { useState } from 'react';
import {
  Smartphone,
  Apple,
  Laptop,
  CheckCircle2,
  Share,
  MoreVertical,
  PlusSquare,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
  ShieldCheck,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-h5wsrhljrbx7cd6oknykiq-385876411755.asia-east1.run.app';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-8 border border-stone-200 animate-scaleUp relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          title="Tutup Panduan"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Section */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              <span>Akses Cepat di Layar Utama HP</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-stone-900 leading-tight">
              Cara Pasang Aplikasi ke Perangkat
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Pasang aplikasi langsung ke layar utama (*Home Screen*) HP Anda tanpa perlu Google Play Store atau App Store.
            </p>
          </div>
        </div>

        {/* Platform Tabs Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
          <button
            onClick={() => setActivePlatform('android')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activePlatform === 'android'
                ? 'bg-white text-emerald-900 shadow-xs border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android (Chrome)</span>
          </button>

          <button
            onClick={() => setActivePlatform('ios')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activePlatform === 'ios'
                ? 'bg-white text-emerald-900 shadow-xs border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Apple className="w-4 h-4 text-stone-900" />
            <span>iPhone / iPad (Safari)</span>
          </button>

          <button
            onClick={() => setActivePlatform('desktop')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activePlatform === 'desktop'
                ? 'bg-white text-emerald-900 shadow-xs border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Laptop className="w-4 h-4 text-teal-600" />
            <span>Laptop (Chrome/Edge)</span>
          </button>
        </div>

        {/* Dynamic Platform Step-by-Step Instructions */}
        <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-4">
          {activePlatform === 'android' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Panduan untuk Smartphone Android via Google Chrome:</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Step 1 */}
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block">Buka Aplikasi di Google Chrome</span>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Pastikan Anda membuka tautan web aplikasi ini di peramban Google Chrome pada ponsel Anda.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 flex items-center gap-1">
                      Tekan Menu Titik Tiga
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-stone-100 rounded border border-stone-300 font-mono text-[10px] text-stone-700">
                        <MoreVertical className="w-3 h-3 inline" />
                      </span>
                    </span>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Ikon ini terletak di pojok kanan atas layar peramban Chrome Anda.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block">
                      Pilih &quot;Instal aplikasi&quot; atau &quot;Tambahkan ke Layar Utama&quot;
                    </span>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Klik opsi menu <em>&quot;Install app&quot;</em> / <em>&quot;Add to Home screen&quot;</em>.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <span className="font-bold text-emerald-900 block">Selesai! Buka dari Layar HP</span>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Ikon <strong>Holistic Nursing Care</strong> akan langsung muncul di beranda HP Anda dan dapat diakses dengan mode layar penuh layaknya aplikasi native.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === 'ios' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-stone-900"></span>
                <span>Panduan untuk iPhone & iPad via Apple Safari:</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Step 1 */}
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block">Buka Aplikasi di Safari</span>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Buka tautan web aplikasi menggunakan browser bawaan Apple Safari di iPhone atau iPad Anda.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 flex items-center gap-1">
                      Tekan Tombol Bagikan / Share
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-stone-100 rounded border border-stone-300 font-mono text-[10px] text-stone-700">
                        <Share className="w-3 h-3 inline text-blue-600" />
                      </span>
                    </span>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Ikon kotak dengan panah mengarah ke atas di bilah navigasi bagian bawah Safari.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 flex items-center gap-1">
                      Pilih &quot;Add to Home Screen&quot;
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-stone-100 rounded border border-stone-300 font-mono text-[10px] text-stone-700">
                        <PlusSquare className="w-3 h-3 inline" />
                      </span>
                    </span>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Gulir daftar opsi menu ke bawah dan klik <em>&quot;Tambah ke Layar Utama&quot;</em>.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <span className="font-bold text-emerald-900 block">Tekan &quot;Add&quot; di Pojok Kanan Atas</span>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Aplikasi akan langsung terpasang di Home Screen iPhone/iPad Anda dan siap dibuka dalam 1-klik!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === 'desktop' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                <span>Panduan untuk Laptop & PC via Google Chrome / Edge:</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Step 1 */}
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-teal-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block">Buka di Browser Komputer</span>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Buka tautan aplikasi di browser Google Chrome atau Microsoft Edge pada laptop Anda.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-teal-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block">
                      Klik Ikon Komputer / Install di Kolom URL
                    </span>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Di ujung kanan bilah alamat web (*address bar*), akan muncul ikon komputer kecil dengan teks <em>&quot;Install Holistic Nursing Care&quot;</em>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-teal-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-emerald-900 block">Klik &quot;Install&quot;</span>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      Aplikasi akan terbuka dalam jendela tersendiri tanpa bilah browser dan memiliki ikon di Desktop / Start Menu.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/70 flex items-start gap-2">
            <Zap className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-950 block">Akses Instan 1-Klik</span>
              <span className="text-stone-600">Langsung terbuka tanpa perlu ketik alamat URL lagi.</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/70 flex items-start gap-2">
            <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-950 block">Tampilan Layar Penuh</span>
              <span className="text-stone-600">Bebas dari kolom pencarian browser yang mengganggu.</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/70 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950 block">Rekam Medis Tersimpan</span>
              <span className="text-stone-600">Data rekam kontrol dan jadwal terapi tersinkron otomatis.</span>
            </div>
          </div>
        </div>

        {/* Action Footer: Copy Link & Close */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tautan Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-stone-500" />
                <span>Salin Tautan Aplikasi</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md hover:shadow-lg cursor-pointer"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
