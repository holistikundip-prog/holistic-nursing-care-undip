import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, QrCode, Phone, AlertTriangle, CheckCircle, Trash2, ShieldCheck, User } from 'lucide-react';
import { Appointment, UserProfile } from '../types';
import { formatIndonesianDate, isAppointmentForUser } from '../utils/storage';

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelAppointment: (id: string, reason: string) => void;
  currentUser?: UserProfile;
  isAdmin?: boolean;
  googleAccessToken?: string | null;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onCancelAppointment,
  currentUser,
  isAdmin = false
}) => {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ada keperluan mendadak');

  if (!isOpen || !appointment) return null;

  // Security & Privacy Barrier: Ensure e-ticket belongs to active patient if not in Nakes/Admin mode
  const isAuthorized = isAdmin || (currentUser && isAppointmentForUser(appointment, currentUser));

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-stone-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">Akses E-Tiket Dibatasi</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              E-tiket ini terdaftar atas akun pasien lain. Silakan beralih atau masuk menggunakan akun yang bersangkutan untuk melihat detail reservasi.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'Terjadwal':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-1 rounded-full font-bold">Terjadwal</span>;
      case 'Menunggu':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded-full font-bold">Menunggu Konfirmasi</span>;
      case 'Selesai':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 text-xs px-2.5 py-1 rounded-full font-bold">Selesai</span>;
      case 'Dibatalkan':
        return <span className="bg-stone-100 text-stone-600 border border-stone-300 text-xs px-2.5 py-1 rounded-full font-bold">Dibatalkan</span>;
    }
  };

  const handleCancel = () => {
    onCancelAppointment(appointment.id, cancelReason);
    setIsConfirmingCancel(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden text-stone-800">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              E-Tiket Pelayanan Keperawatan
            </span>
            <h3 className="text-lg font-black tracking-tight text-white">
              {appointment.therapyName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Status & Code */}
          <div className="flex items-center justify-between bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-semibold">Kode Booking</span>
              <span className="text-base font-black text-emerald-800 tracking-wider">
                {appointment.bookingCode}
              </span>
            </div>
            <div>{getStatusBadge(appointment.status)}</div>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 text-stone-700">
            <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl">
              <Calendar className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">Hari & Tanggal</span>
                <span className="font-bold text-stone-900">
                  {appointment.dayName}, {formatIndonesianDate(appointment.date)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">Jam Pelayanan</span>
                <span className="font-bold text-emerald-800">
                  {appointment.timeSlot} WIB
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">Lokasi Tindakan</span>
                <span className="font-semibold text-stone-900">
                  {appointment.locationName}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl">
              <User className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold">Nama Pasien & Kontak</span>
                <span className="font-semibold text-stone-900">{appointment.userName}</span>
                <span className="text-stone-500 block text-xs">{appointment.userPhone}</span>
              </div>
            </div>

            {appointment.notes && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-amber-800 block font-semibold">Catatan / Keluhan:</span>
                <span className="text-xs text-amber-950 italic">{appointment.notes}</span>
              </div>
            )}

            {appointment.cancelledReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
                <strong>Alasan Pembatalan:</strong> {appointment.cancelledReason}
              </div>
            )}
          </div>

          {/* Cancellation Confirmation View */}
          {isConfirmingCancel ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Konfirmasi Pembatalan Jadwal</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Apakah Anda yakin ingin membatalkan jadwal terapi ini? Slot akan dibuka kembali untuk pasien lain.
              </p>
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  Pilih Alasan:
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs text-stone-800"
                >
                  <option value="Ada keperluan mendadak">Ada keperluan mendadak</option>
                  <option value="Ingin mengganti jadwal / terapi lain">Ingin mengganti jadwal / terapi lain</option>
                  <option value="Kondisi kesehatan sudah membaik">Kondisi kesehatan sudah membaik</option>
                  <option value="Kendala transportasi">Kendala transportasi</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => setIsConfirmingCancel(false)}
                  className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Ya, Batalkan Jadwal
                </button>
              </div>
            </div>
          ) : (
            appointment.status !== 'Dibatalkan' && appointment.status !== 'Selesai' && (
              <div className="pt-2">
                <button
                  onClick={() => setIsConfirmingCancel(true)}
                  className="w-full py-2.5 px-4 text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Batalkan Jadwal Ini</span>
                </button>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold px-5 py-2 rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
