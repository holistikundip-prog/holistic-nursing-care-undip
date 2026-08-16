import React, { useState, useMemo } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  CalendarCheck,
  ShieldCheck,
  Stethoscope,
  HeartHandshake,
  Edit3,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Lock,
  Users,
  UserPlus,
  LogIn,
  LogOut,
  ClipboardList,
  Activity,
  HeartPulse,
  ChevronRight,
  Printer
} from 'lucide-react';
import { UserProfile, Appointment, ActiveTab, ClinicalProgressNote } from '../types';
import { formatIndonesianDate, filterUserAppointments, filterProgressNotesForUser } from '../utils/storage';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  appointments: Appointment[];
  progressNotes?: ClinicalProgressNote[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSafety: () => void;
  isAdmin: boolean;
  onRequestNakesAccess: () => void;
  onExitNakesMode: () => void;
  onOpenPatientAuth?: (reason?: string) => void;
  onLogoutPatient?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  appointments,
  progressNotes = [],
  setActiveTab,
  onOpenSafety,
  isAdmin,
  onRequestNakesAccess,
  onExitNakesMode,
  onOpenPatientAuth,
  onLogoutPatient
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [address, setAddress] = useState(user.address);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedNoteDetail, setSelectedNoteDetail] = useState<ClinicalProgressNote | null>(null);

  const isGuestUser = Boolean(user.isGuest || !user.email);

  const userAppointments = filterUserAppointments(appointments, user);
  const completedAppointments = userAppointments.filter((a) => a.status === 'Selesai');
  const activeAppointments = userAppointments.filter(
    (a) => a.status === 'Terjadwal' || a.status === 'Menunggu'
  );

  // Real-time synchronization of progress notes for this active patient
  const userProgressNotes = useMemo(() => {
    return filterProgressNotesForUser(progressNotes, user, userAppointments);
  }, [progressNotes, user, userAppointments]);

  const handlePrintNote = () => {
    window.print();
  };

  const handleEditClick = () => {
    if (isGuestUser) {
      if (onOpenPatientAuth) {
        onOpenPatientAuth('Silakan masuk (login) atau daftar akun pasien terlebih dahulu untuk mengedit dan memperbarui data profil.');
      }
      return;
    }
    setIsEditing(!isEditing);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuestUser) {
      if (onOpenPatientAuth) {
        onOpenPatientAuth('Silakan masuk (login) atau daftar akun pasien terlebih dahulu untuk menyimpan perubahan profil.');
      }
      return;
    }
    const updated: UserProfile = {
      ...user,
      name,
      phone,
      email,
      address
    };
    onUpdateUser(updated);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Profile Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-200 text-emerald-950 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white/30 shrink-0">
            {user.name.charAt(0)}
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {user.name}
              </h1>
              {isGuestUser ? (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Mode Tamu (Belum Login)</span>
                </span>
              ) : (
                <span className="bg-emerald-700 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/50">
                  Pasien Terverifikasi
                </span>
              )}
            </div>

            <p className="text-xs text-emerald-200 font-mono">
              No. Pasien: <strong className="text-white">{user.patientNumber}</strong>
            </p>

            <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-2 text-xs text-emerald-100/90">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-300" />
                {user.phone || 'Nomor HP belum diisi'}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-emerald-300" />
                {user.email || 'Email belum diatur (Mode Tamu)'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={handleEditClick}
              className={`border text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isGuestUser
                  ? 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 border-amber-400/30'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title={isGuestUser ? 'Masuk akun untuk mengedit data' : 'Edit data profil'}
            >
              {isGuestUser ? (
                <Lock className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Edit3 className="w-3.5 h-3.5" />
              )}
              <span>{isEditing && !isGuestUser ? 'Batal' : isGuestUser ? 'Edit Data (Perlu Login)' : 'Edit Data'}</span>
            </button>

            {onOpenPatientAuth && (
              <button
                onClick={() => onOpenPatientAuth()}
                className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isGuestUser ? 'Masuk / Daftar' : 'Ganti Akun'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guest Notice Banner */}
      {isGuestUser && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950">Anda Sedang Menggunakan Akun Tamu</h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Pengubahan data profil dinonaktifkan untuk akun tamu. Masuk atau daftarkan akun pasien agar data rekam medis Anda tersimpan dan dapat diedit.
              </p>
            </div>
          </div>
          {onOpenPatientAuth && (
            <button
              onClick={() => onOpenPatientAuth('Silakan masuk atau daftar akun pasien terlebih dahulu untuk mengedit dan menyimpan rekam medis.')}
              className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Sekarang</span>
            </button>
          )}
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profil berhasil diperbarui dan tersimpan dalam data lokal.</span>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 text-center shadow-xs">
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-800">
            {completedAppointments.length}
          </span>
          <p className="text-[11px] text-stone-500 font-medium mt-0.5">Sesi Selesai</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 text-center shadow-xs">
          <span className="text-xl sm:text-2xl font-extrabold text-teal-800">
            {activeAppointments.length}
          </span>
          <p className="text-[11px] text-stone-500 font-medium mt-0.5">Jadwal Aktif</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 text-center shadow-xs">
          <span className="text-xl sm:text-2xl font-extrabold text-amber-700">
            {appointments.length}
          </span>
          <p className="text-[11px] text-stone-500 font-medium mt-0.5">Total Reservasi</p>
        </div>
      </div>

      {/* Profile Edit Form / View */}
      {isEditing && !isGuestUser ? (
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-700" />
            Edit Data Pasien
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">Alamat Domisili</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4 text-xs sm:text-sm">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <FileBadge className="w-4 h-4 text-emerald-700" />
            Informasi Rekam Pasien
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-700">
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/60">
              <span className="text-[10px] text-stone-400 block font-semibold uppercase">Nomor Pasien / ID Rekam Medis</span>
              <span className="font-mono font-bold text-stone-900">{user.patientNumber || '-'}</span>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/60">
              <span className="text-[10px] text-stone-400 block font-semibold uppercase">Nomor Telepon / WhatsApp</span>
              <span className="font-medium text-stone-900">{user.phone || '-'}</span>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/60">
              <span className="text-[10px] text-stone-400 block font-semibold uppercase">Email Terdaftar</span>
              <span className="font-medium text-stone-900">{user.email || 'Mode Tamu (Belum Login)'}</span>
            </div>
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/60">
              <span className="text-[10px] text-stone-400 block font-semibold uppercase">Alamat Domisili</span>
              <span className="font-medium text-stone-900">
                {isGuestUser ? (user.address || 'Belum Diisi / Silakan Login') : (user.address || 'Semarang')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Catatan Perkembangan Kontrol Pasien (Dari Nakes) */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-sm">
                  Catatan Perkembangan & Tindak Lanjut Medis ({userProgressNotes.length})
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Real-Time Sync
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Dokumentasi asuhan keperawatan holistik, asesmen fisik, intervensi, dan evaluasi berkala dari perawat
              </p>
            </div>
          </div>
        </div>

        {userProgressNotes.length === 0 ? (
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-stone-200/70 text-stone-500 flex items-center justify-center mx-auto">
              <ClipboardList className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-stone-700">Belum Ada Catatan Perkembangan Tersimpan</p>
            <p className="text-[11px] text-stone-500 max-w-md mx-auto">
              Ketika Anda menjalani sesi terapi di klinik, tenaga kesehatan (nakes) akan mendokumentasikan evaluasi tanda vital, respon terapi, serta rekomendasi pemulihan Anda yang langsung tersinkronisasi ke sini.
            </p>
            {isGuestUser && onOpenPatientAuth && (
              <button
                onClick={() => onOpenPatientAuth('Masuk ke akun Anda untuk melihat riwayat lengkap rekam medis Anda.')}
                className="mt-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
              >
                Sudah pernah periksa? Masuk Akun Pasien di sini
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {userProgressNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all space-y-3 cursor-pointer shadow-2xs"
                onClick={() => setSelectedNoteDetail(note)}
              >
                <div className="flex items-start justify-between gap-2 border-b border-stone-200/60 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-xs sm:text-sm">{note.therapyName}</span>
                      {note.bookingCode && (
                        <span className="font-mono text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          {note.bookingCode}
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-medium text-stone-500 bg-stone-200/80 px-1.5 py-0.5 rounded">
                        {note.patientNumber}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-1">
                      <CalendarCheck className="w-3.5 h-3.5 text-emerald-700" />
                      {formatIndonesianDate(note.visitDate)}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200 font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0 transition">
                    Lihat Evaluasi Lengkap <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                {note.vitalSigns && (
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-stone-600 bg-white p-2 rounded-xl border border-stone-200/70">
                    <span className="font-bold text-stone-500 text-[10px] uppercase">Tanda Vital:</span>
                    <span className="bg-stone-100 px-2 py-0.5 rounded font-medium">TD: {note.vitalSigns.bloodPressure || '-'}</span>
                    <span className="bg-stone-100 px-2 py-0.5 rounded font-medium">Nadi: {note.vitalSigns.pulseRate || '-'}</span>
                    <span className="bg-stone-100 px-2 py-0.5 rounded font-medium">Nyeri: {note.vitalSigns.painScale !== undefined ? `${note.vitalSigns.painScale}/10` : '-'}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Keluhan Saat Kunjungan:</span>
                    <p className="text-stone-700 line-clamp-2 mt-0.5 font-medium">{note.chiefComplaint}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
                    <span className="text-[10px] font-bold text-purple-800 uppercase block">Tindak Lanjut & Anjuran:</span>
                    <p className="text-stone-700 line-clamp-2 mt-0.5 font-medium">{note.progressFollowUp}</p>
                  </div>
                </div>

                <div className="text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-200/40">
                  <span>Nakes Penanggung Jawab: <strong className="text-stone-800">{note.nurseName}</strong></span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Tervalidasi Klinis
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Detail Catatan untuk Pasien */}
      {selectedNoteDetail && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">Catatan Perkembangan Medis Pasien</h4>
                  <p className="text-[11px] text-stone-500">{formatIndonesianDate(selectedNoteDetail.visitDate)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNoteDetail(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Tindakan Terapi</span>
                  <span className="font-bold text-emerald-900 text-sm">{selectedNoteDetail.therapyName}</span>
                </div>
                {selectedNoteDetail.bookingCode && (
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedNoteDetail.bookingCode}
                  </span>
                )}
              </div>

              {selectedNoteDetail.vitalSigns && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/70 text-blue-950 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-blue-600 block">Tekanan Darah</span>
                    <span className="font-bold">{selectedNoteDetail.vitalSigns.bloodPressure || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-600 block">Nadi</span>
                    <span className="font-bold">{selectedNoteDetail.vitalSigns.pulseRate || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-600 block">Skala Nyeri</span>
                    <span className="font-bold">{selectedNoteDetail.vitalSigns.painScale !== undefined ? `${selectedNoteDetail.vitalSigns.painScale}/10` : '-'}</span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 space-y-1">
                <span className="text-[10px] font-bold text-amber-900 uppercase block">1. Keluhan Utama</span>
                <p className="text-stone-800 leading-relaxed">{selectedNoteDetail.chiefComplaint}</p>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/70 space-y-1">
                <span className="text-[10px] font-bold text-blue-900 uppercase block">2. Hasil Pengkajian Fisik</span>
                <p className="text-stone-800 leading-relaxed">{selectedNoteDetail.assessment}</p>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/70 space-y-1">
                <span className="text-[10px] font-bold text-emerald-900 uppercase block">3. Intervensi yang Diberikan</span>
                <p className="text-stone-800 leading-relaxed whitespace-pre-line">{selectedNoteDetail.intervention}</p>
              </div>

              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/70 space-y-1">
                <span className="text-[10px] font-bold text-purple-900 uppercase block">4. Catatan Perkembangan & Tindak Lanjut</span>
                <p className="text-stone-800 leading-relaxed">{selectedNoteDetail.progressFollowUp}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-stone-200 gap-2">
              <span className="text-stone-500">Perawat: <strong className="text-stone-800">{selectedNoteDetail.nurseName}</strong></span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintNote}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  onClick={() => setSelectedNoteDetail(null)}
                  className="px-4 py-1.5 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Settings & Navigation Menu */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 space-y-2">
        <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-stone-500 mb-2 px-2">
          Pusat Bantuan & Pengaturan
        </h3>

        {onOpenPatientAuth && (
          <button
            onClick={onOpenPatientAuth}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-50/50 border border-emerald-100 bg-emerald-50/20 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm">Manajemen Akun Pasien</h4>
                <p className="text-[11px] text-stone-500">Masuk, daftar akun baru, atau ganti profil pasien keluarga</p>
              </div>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-lg">
              Kelola Akun
            </span>
          </button>
        )}

        <button
          onClick={onOpenSafety}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-xs sm:text-sm">Panduan Keselamatan Terapi</h4>
              <p className="text-[11px] text-stone-500">Prinsip keamanan, indikasi & kontraindikasi medis</p>
            </div>
          </div>
          <span className="text-xs text-emerald-700 font-bold">Buka</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-xs sm:text-sm">Riwayat Jadwal Terapi</h4>
              <p className="text-[11px] text-stone-500">Lihat semua tiket dan status konfirmasi</p>
            </div>
          </div>
          <span className="text-xs text-emerald-700 font-bold">Lihat</span>
        </button>

        {/* Switcher to Admin / Tenaga Kesehatan mode */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <button
            onClick={() => {
              if (isAdmin) {
                onExitNakesMode();
              } else {
                onRequestNakesAccess();
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                  {isAdmin ? 'Mode Tenaga Kesehatan (Aktif)' : 'Beralih ke Dashboard Nakes'}
                </h4>
                <p className="text-[11px] text-amber-800">
                  {isAdmin ? 'Klik untuk keluar dari akun Nakes' : 'Khusus perawat & staf (Perlu Username & Password)'}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-amber-500 text-stone-950 px-2.5 py-1 rounded-lg">
              {isAdmin ? 'Keluar Mode Nakes' : 'Masuk Nakes'}
            </span>
          </button>

          {/* Log Out button for patient session */}
          {!user.isGuest && onLogoutPatient && (
            <button
              onClick={onLogoutPatient}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/80 transition cursor-pointer text-left text-rose-900"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-950 text-xs sm:text-sm">Keluar dari Akun Ini (Log Out)</h4>
                  <p className="text-[11px] text-rose-700">Hapus token aktif dan amankan sesi rekam medis di perangkat</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg">
                Keluar
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

