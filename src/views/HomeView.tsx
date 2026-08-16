import React from 'react';
import {
  Sparkles,
  CalendarPlus,
  PlayCircle,
  ShieldCheck,
  Clock,
  ArrowRight,
  HeartHandshake,
  Activity,
  Footprints,
  Droplets,
  ShieldAlert,
  Wind,
  CalendarCheck,
  Video as VideoIcon,
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import { Therapy, ActiveTab, Appointment } from '../types';
import { formatIndonesianDate } from '../utils/storage';

interface HomeViewProps {
  therapies: Therapy[];
  onOpenDetail: (therapy: Therapy) => void;
  onOpenBooking: (therapy?: Therapy) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSafety: () => void;
  upcomingAppointments: Appointment[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  therapies,
  onOpenDetail,
  onOpenBooking,
  setActiveTab,
  onOpenSafety,
  upcomingAppointments
}) => {
  // Map icon names to Lucide components
  const getTherapyIcon = (id: string) => {
    switch (id) {
      case 'head-massage':
        return <Sparkles className="w-6 h-6 text-teal-600" />;
      case 'back-massage':
        return <Activity className="w-6 h-6 text-emerald-600" />;
      case 'foot-massage':
        return <Footprints className="w-6 h-6 text-emerald-700" />;
      case 'foot-spa':
        return <Droplets className="w-6 h-6 text-cyan-600" />;
      case 'dry-cupping':
        return <ShieldAlert className="w-6 h-6 text-amber-600" />;
      case 'tai-chi':
        return <Wind className="w-6 h-6 text-teal-700" />;
      case 'yoga':
        return <HeartHandshake className="w-6 h-6 text-emerald-600" />;
      default:
        return <Sparkles className="w-6 h-6 text-emerald-600" />;
    }
  };

  const nextAppointment = upcomingAppointments.find(
    (a) => a.status === 'Terjadwal' || a.status === 'Menunggu'
  );

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-stone-900 text-white p-6 sm:p-10 shadow-xl border border-emerald-800">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-teal-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-200 border border-emerald-700/60">
            <HeartHandshake className="w-4 h-4 text-emerald-300" />
            <span>Pelayanan Keperawatan Komplementer UNDIP & Bergas</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Selamat Datang di <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-200 to-amber-200">
              Holistic Nursing Care
            </span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-light">
            Temukan pilihan terapi holistik yang sesuai untuk mendukung kenyamanan, relaksasi, dan keseimbangan tubuh bersama perawat profesional.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenBooking()}
              className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center gap-2.5 transition transform hover:-translate-y-0.5 cursor-pointer text-sm sm:text-base"
            >
              <CalendarPlus className="w-5 h-5 text-emerald-950" />
              <span>Pilih Terapi & Jadwal</span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-3 rounded-2xl border border-white/20 backdrop-blur-md flex items-center gap-2 transition cursor-pointer text-sm"
            >
              <PlayCircle className="w-4 h-4 text-emerald-300" />
              <span>Video Edukasi</span>
            </button>
          </div>
        </div>
      </section>

      {/* ACTIVE SCHEDULE REMINDER BANNER (If any) */}
      {nextAppointment && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded">
                Jadwal Mendatang
              </span>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base mt-0.5">
                {nextAppointment.therapyName} – {nextAppointment.dayName}, {formatIndonesianDate(nextAppointment.date)} ({nextAppointment.timeSlot} WIB)
              </h3>
              <p className="text-xs text-stone-500 truncate max-w-md">
                📍 {nextAppointment.locationName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('appointments')}
            className="text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Lihat Tiket</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 9 MAIN MENU CARDS GRID */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
              Pilihan Layanan & Edukasi Holistik
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Kenali 7 terapi komplementer, video pembelajaran, dan sistem reservasi jadwal.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('therapies')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Semua Terapi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* 1 to 7: Holistic Therapies */}
          {therapies.map((therapy) => (
            <div
              key={therapy.id}
              className="bg-white rounded-3xl border border-stone-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 flex flex-col overflow-hidden group"
            >
              {/* Image & Tag */}
              <div className="relative h-40 w-full overflow-hidden bg-stone-100">
                <img
                  src={therapy.image}
                  alt={therapy.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap justify-end">
                  {therapy.scheduleNote && (
                    <span className="bg-amber-500 text-stone-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-md">
                      Jumat & Sabtu
                    </span>
                  )}
                  <div className="bg-stone-900/70 backdrop-blur-md text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    {therapy.durationText}
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-md">
                  {getTherapyIcon(therapy.id)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="font-extrabold text-stone-900 text-base group-hover:text-emerald-800 transition-colors">
                      {therapy.name}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                    {therapy.description}
                  </p>
                  {therapy.scheduleNote && (
                    <div className="mt-2 text-[11px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Sesi: Khusus <strong>Jumat & Sabtu</strong></span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onOpenDetail(therapy)}
                    className="flex-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-xs font-bold py-2.5 px-3 rounded-xl transition border border-stone-200 cursor-pointer text-center"
                  >
                    Lihat Detail
                  </button>
                  <button
                    onClick={() => onOpenBooking(therapy)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1"
                    title="Jadwalkan Tindakan"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>Jadwal</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* 8. Menu Card: Video Pembelajaran */}
          <div
            onClick={() => setActiveTab('videos')}
            className="bg-gradient-to-br from-teal-900 to-emerald-950 text-white rounded-3xl p-6 shadow-md border border-teal-800 flex flex-col justify-between hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-teal-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-teal-300 shadow-inner">
                <VideoIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300">
                  Media Edukasi
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  8. Video Pembelajaran
                </h3>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Tonton video demonstrasi teknik foot massage, head massage, back massage, dry cupping, dan akupresur.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between text-xs font-bold text-teal-200 group-hover:text-white transition">
              <span>Buka Galeri Video</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* 9. Menu Card: Jadwal Tindakan */}
          <div
            onClick={() => onOpenBooking()}
            className="bg-gradient-to-br from-emerald-800 to-stone-900 text-white rounded-3xl p-6 shadow-md border border-emerald-700 flex flex-col justify-between hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                  Pemesanan Cepat
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  9. Jadwal Tindakan
                </h3>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Pilih hari (Senin–Sabtu), slot waktu (08.00–19.30), dan lokasi layanan keperawatan holistik terdekat.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between text-xs font-bold text-amber-300 group-hover:text-white transition">
              <span>Pesan Jadwal Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY & EDUCATION CALLOUT */}
      <section className="bg-stone-100 rounded-3xl p-6 sm:p-8 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
              Prinsip Keselamatan Terapi Holistik
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl leading-relaxed">
              Pelajari indikasi, kontraindikasi, serta protokol keselamatan sebelum melakukan tindakan keperawatan komplementer bersama kami.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSafety}
          className="w-full sm:w-auto bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl transition shrink-0 cursor-pointer shadow-md"
        >
          Baca Panduan Lengkap
        </button>
      </section>
    </div>
  );
};
