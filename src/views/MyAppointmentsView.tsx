import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Clock,
  MapPin,
  CalendarPlus,
  QrCode,
  AlertCircle,
  CheckCircle2,
  CalendarX2,
  ChevronRight,
  Eye,
  Filter,
  User,
  Users
} from 'lucide-react';
import { Appointment, AppointmentStatus, UserProfile } from '../types';
import { formatIndonesianDate, filterUserAppointments } from '../utils/storage';

interface MyAppointmentsViewProps {
  appointments: Appointment[];
  currentUser: UserProfile;
  onOpenBooking: () => void;
  onViewDetail: (appointment: Appointment) => void;
  onCancelAppointment: (id: string, reason: string) => void;
  onOpenPatientAuth?: () => void;
}

export const MyAppointmentsView: React.FC<MyAppointmentsViewProps> = ({
  appointments,
  currentUser,
  onOpenBooking,
  onViewDetail,
  onCancelAppointment,
  onOpenPatientAuth
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  const statusFilters = ['Semua', 'Terjadwal', 'Menunggu', 'Selesai', 'Dibatalkan'];

  // Scope appointments strictly to current active patient
  const userScopedAppointments = useMemo(() => {
    return filterUserAppointments(appointments, currentUser);
  }, [appointments, currentUser]);

  const filteredAppointments = useMemo(() => {
    return userScopedAppointments.filter((app) => {
      if (selectedStatus === 'Semua') return true;
      return app.status === selectedStatus;
    });
  }, [userScopedAppointments, selectedStatus]);

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Terjadwal':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Terjadwal
          </span>
        );
      case 'Menunggu':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Menunggu
          </span>
        );
      case 'Selesai':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Selesai
          </span>
        );
      case 'Dibatalkan':
        return (
          <span className="bg-stone-100 text-stone-600 border border-stone-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
            Dibatalkan
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-800/80 px-3 py-1 rounded-full border border-emerald-600/50">
            Jadwal Saya
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">
            Riwayat & Reservasi Terapi
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-light">
            Kelola jadwal tindakan keperawatan holistik, pantau status reservasi, dan unduh e-tiket.
          </p>
        </div>
        <button
          onClick={onOpenBooking}
          className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold px-5 py-2.5 rounded-2xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm shrink-0 cursor-pointer"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* Patient Profile Scope Box */}
      <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-stone-900">{currentUser.name}</span>
              <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {currentUser.patientNumber}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Email: {currentUser.email || '-'} • Reservasi: {userScopedAppointments.length} jadwal
            </p>
          </div>
        </div>

        {onOpenPatientAuth && (
          <button
            onClick={onOpenPatientAuth}
            className="w-full sm:w-auto bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 font-bold px-3.5 py-2 rounded-xl border border-stone-200 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Ganti / Masuk Akun Pasien</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {statusFilters.map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedStatus === st
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-white text-stone-600 hover:bg-emerald-50 border border-stone-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Appointment Cards List */}
      <div className="space-y-4">
        {filteredAppointments.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-lg border border-stone-200">
                  {app.bookingCode}
                </span>
                {getStatusBadge(app.status)}
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900">
                  {app.therapyName}
                </h3>
                <p className="text-xs text-stone-600 flex items-center gap-1.5 mt-0.5">
                  <span className="font-semibold text-emerald-800">{app.dayName}, {formatIndonesianDate(app.date)}</span>
                  <span>•</span>
                  <span className="bg-emerald-50 text-emerald-900 font-bold px-1.5 py-0.2 rounded">
                    {app.timeSlot} WIB
                  </span>
                </p>
              </div>

              <p className="text-xs text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate max-w-md">{app.locationName}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
              <button
                onClick={() => onViewDetail(app)}
                className="bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-stone-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Detail</span>
              </button>

              {app.status !== 'Dibatalkan' && app.status !== 'Selesai' && (
                <button
                  onClick={() => onViewDetail(app)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold py-2.5 px-3 rounded-xl transition cursor-pointer"
                >
                  Batalkan
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-6 space-y-3">
            <div className="w-14 h-14 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
              <CalendarX2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-base">Belum Ada Jadwal</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Pasien <strong>{currentUser.name}</strong> belum memiliki reservasi dengan status "{selectedStatus}".
              </p>
            </div>
            <button
              onClick={onOpenBooking}
              className="mt-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Buat Jadwal Baru</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

