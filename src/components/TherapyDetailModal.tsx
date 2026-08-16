import React from 'react';
import { X, Clock, CheckCircle, AlertOctagon, HelpCircle, ShieldCheck, CalendarPlus, HeartHandshake, ListOrdered, AlertTriangle } from 'lucide-react';
import { Therapy } from '../types';

interface TherapyDetailModalProps {
  therapy: Therapy | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSchedule: (therapy: Therapy) => void;
}

export const TherapyDetailModal: React.FC<TherapyDetailModalProps> = ({
  therapy,
  isOpen,
  onClose,
  onSelectSchedule
}) => {
  if (!isOpen || !therapy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 relative overflow-hidden">
        {/* Header Hero Image */}
        <div className="relative h-48 sm:h-56 w-full bg-stone-800 shrink-0">
          <img
            src={therapy.image}
            alt={therapy.name}
            className="w-full h-full object-cover opacity-85"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title and Tagline on top of image */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md uppercase tracking-wider">
                Terapi Komplementer
              </span>
              <span className="bg-stone-900/80 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md">
                <Clock className="w-3 h-3 text-emerald-300" />
                Durasi: {therapy.durationText}
              </span>
              {therapy.scheduleNote && (
                <span className="bg-amber-500/95 text-stone-950 font-extrabold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md shadow-sm">
                  🗓️ Khusus Jumat & Sabtu
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {therapy.name}
            </h2>
            <p className="text-xs sm:text-sm text-stone-200/90 line-clamp-1 font-light">
              {therapy.tagline}
            </p>
          </div>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-stone-700 text-sm">
          {/* Schedule availability banner for Tai Chi & Yoga */}
          {therapy.scheduleNote && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl flex items-start gap-3 text-amber-950 shadow-xs">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-amber-900 uppercase tracking-wide">
                  Jadwal Pelaksanaan Sesi Terapi
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed text-amber-900 font-medium">
                  Pelaksanaan sesi <strong>{therapy.name}</strong> hanya tersedia dan dilaksanakan pada hari <strong>Jumat dan Sabtu</strong>. Mohon pastikan pemilihan tanggal janji temu Anda jatuh pada hari Jumat atau Sabtu.
                </p>
              </div>
            </div>
          )}

          {/* Special warning if any (e.g. Dry Cupping) */}
          {therapy.specialWarning && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl flex gap-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm leading-relaxed font-medium">
                {therapy.specialWarning}
              </p>
            </div>
          )}

          {/* Pengertian (Definition) */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-900">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              Pengertian Terapi
            </h3>
            <p className="text-stone-600 text-sm leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200/60">
              {therapy.definition}
            </p>
          </div>

          {/* Tujuan & Manfaat (Benefits) */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-900">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              Tujuan & Manfaat Terapi
            </h3>
            <div className="grid gap-2 sm:grid-cols-1">
              {therapy.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    ✓
                  </div>
                  <span className="text-xs sm:text-sm text-stone-800 leading-snug">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Indikasi Umum */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 text-teal-900">
              <HeartHandshake className="w-4 h-4 text-teal-700" />
              Indikasi Umum
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {therapy.indications.map((ind, idx) => (
                <li key={idx} className="bg-stone-50 p-3 rounded-xl border border-stone-200/70 text-xs text-stone-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                  <span>{ind}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Teknik / Langkah Terapi if available */}
          {therapy.techniquesOrSteps && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-900">
                <ListOrdered className="w-4 h-4 text-emerald-700" />
                Alur & Teknik Tindakan
              </h3>
              <div className="space-y-2">
                {therapy.techniquesOrSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-stone-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hal yang Perlu Diperhatikan (Precautions) */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Hal yang Perlu Diperhatikan
            </h3>
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-2">
              {therapy.precautions.map((prec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-amber-950">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{prec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kontraindikasi / Peringatan (Contraindications) */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 text-rose-900">
              <AlertOctagon className="w-4 h-4 text-rose-700" />
              Kontraindikasi & Peringatan Medis
            </h3>
            <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200/80 space-y-2">
              {therapy.contraindications.map((contra, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-rose-900">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span>{contra}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safe Non-claiming Educational Note */}
          <p className="text-[11px] text-stone-500 italic text-center px-4">
            * Terapi ini merupakan bagian dari Holistic Nursing Care sebagai asuhan keperawatan komplementer untuk mendukung kenyamanan dan proses penyembuhan alami tubuh.
          </p>
        </div>

        {/* Modal Footer with "Pilih Jadwal" CTA */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50 rounded-b-3xl flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="text-stone-600 hover:text-stone-800 text-sm font-medium px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={() => {
              onClose();
              onSelectSchedule(therapy);
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-md shadow-emerald-700/20 flex items-center gap-2 transition cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Pilih Jadwal Tindakan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
