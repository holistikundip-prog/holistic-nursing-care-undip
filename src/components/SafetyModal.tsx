import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Stethoscope, HeartHandshake, Info } from 'lucide-react';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-emerald-100 relative">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between bg-emerald-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-emerald-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                KESELAMATAN TERAPI HOLISTIK
              </h2>
              <p className="text-xs text-emerald-200">
                Panduan Edukasi Keperawatan Komplementer Berbasis Keselamatan Pasien
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-stone-700">
          {/* Important Notice Callout */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex gap-3 text-amber-900">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <span className="font-bold">Prinsip Terapi Komplementer:</span> Seluruh modalitas dalam Holistic Nursing Care bersifat melengkapi (komplementer) dan tidak bertujuan menggantikan penanganan medis primer dari dokter penanggung jawab pasien.
            </div>
          </div>

          {/* 6 Essential Guidelines */}
          <div>
            <h3 className="text-base font-bold text-stone-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              6 Langkah Keselamatan Pasien
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">1</span>
                  Keterbukaan Riwayat Medis
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Selalu informasikan kondisi kesehatan terbaru, riwayat penyakit kardiovaskular, tekanan darah, atau kehamilan kepada perawat sebelum tindakan.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">2</span>
                  Informasi Alergi & Sensitivitas
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Beri tahu perawat bila memiliki riwayat alergi minyak aromaterapi, garam herbal, atau kulit yang hipersensitif terhadap gesekan.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">3</span>
                  Ikuti Arahan Perawat
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Patuhi petunjuk posisi tubuh, teknik pernapasan, dan durasi istirahat yang direkomendasikan selama dan setelah sesi terapi.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">4</span>
                  Hindari Tindakan Mandiri Berisiko
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Tidak disarankan mencoba tindakan invasif atau manipulasi fisik bertekanan tinggi tanpa pengawasan dan panduan tenaga terlatih.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">5</span>
                  Hentikan Bila Ada Keluhan
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Segera sampaikan jika merasakan pusing tiba-tiba, nyeri menusuk, sensasi terbakar, atau rasa mual selama prosedur berlangsung.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">6</span>
                  Konsultasi Sebelum Memilih
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Diskusikan pilihan terapi dengan perawat jika memiliki keraguan terkait kecocokan terapi dengan kondisi tubuh saat ini.
                </p>
              </div>
            </div>
          </div>

          {/* Specific Warning for Dry Cupping and Physical Manipulations */}
          <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4">
            <h4 className="font-bold text-red-900 text-xs sm:text-sm flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              Perhatian Khusus: Terapi Dry Cupping & Manipulasi Fisik
            </h4>
            <ul className="text-xs text-red-800 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Dry Cupping (Bekam Kering)</strong> wajib dikerjakan oleh perawat/terapis bersertifikat dengan protokol kebersihan desinfeksi steril.
              </li>
              <li>
                Bekas memar hisap melingkar (ekimosis) adalah respon wajar dan umumnya memudar dalam 3-7 hari.
              </li>
              <li>
                Dilarang keras pada pasien dengan konsumsi obat antikoagulan (pengencer darah), trombositopenia, luka kulit terbuka, fraktur tulang, atau kehamilan lanjut pada area perut dan punggung bawah.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 rounded-b-3xl flex justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition cursor-pointer"
          >
            Saya Mengerti & Siap
          </button>
        </div>
      </div>
    </div>
  );
};
