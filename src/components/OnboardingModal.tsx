import React from 'react';
import { HeartHandshake, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, CalendarClock } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-100/70 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-100/70 rounded-full blur-2xl pointer-events-none" />

        {/* Icon & Badge */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-5">
          <HeartHandshake className="w-10 h-10" />
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-stone-900 p-1.5 rounded-full shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mb-2">
          HOLISTIC NURSING CARE
        </h1>
        <p className="text-sm font-semibold text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-full inline-block mb-4 border border-emerald-200/60">
          “Perawatan Holistik untuk Keseimbangan Tubuh dan Pikiran”
        </p>

        <p className="text-stone-600 text-sm leading-relaxed mb-6">
          Kenali, pilih, dan jadwalkan terapi holistik untuk mendukung kenyamanan, relaksasi, dan keseimbangan diri Anda bersama tenaga keperawatan profesional.
        </p>

        {/* Key Features Pill */}
        <div className="bg-stone-50 rounded-2xl p-4 mb-6 border border-stone-200/80 text-left space-y-2.5 text-xs text-stone-700">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Edukasi lengkap 7+ terapi komplementer terstandar</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CalendarClock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pemesanan jadwal fleksibel (Senin – Sabtu, 08.00–19.30)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Standar keselamatan & pengawasan perawat terlatih</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onClose}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2 text-base cursor-pointer hover:gap-3"
        >
          <span>Mulai Sekarang</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
