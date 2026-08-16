import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  CalendarCheck,
  Users,
  Video,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  Eye,
  Settings,
  AlertCircle,
  FileSpreadsheet,
  Download,
  ClipboardList,
  FileText
} from 'lucide-react';
import { Appointment, Therapy, Video as VideoType, AppointmentStatus, UserProfile, ClinicalProgressNote } from '../types';
import { formatIndonesianDate } from '../utils/storage';
import { GoogleSheetsCard } from '../components/GoogleSheetsCard';
import { ClinicalProgressNotesManager } from '../components/ClinicalProgressNotesManager';

interface AdminDashboardViewProps {
  appointments: Appointment[];
  therapies: Therapy[];
  videos: VideoType[];
  progressNotes: ClinicalProgressNote[];
  googleUser: any | null;
  accessToken: string | null;
  onGoogleAuthSuccess: (user: any, token: string) => void;
  onGoogleLogout: () => void;
  onExitNakesMode: () => void;
  onUpdateAppointmentStatus: (id: string, newStatus: AppointmentStatus) => void;
  onDeleteAppointment: (id: string) => void;
  onAddTherapy: (therapy: Therapy) => void;
  onDeleteTherapy: (id: string) => void;
  onAddVideo: (video: VideoType) => void;
  onDeleteVideo: (id: string) => void;
  onAddProgressNote: (note: ClinicalProgressNote) => void;
  onUpdateProgressNote: (note: ClinicalProgressNote) => void;
  onDeleteProgressNote: (id: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  appointments,
  therapies,
  videos,
  progressNotes,
  googleUser,
  accessToken,
  onGoogleAuthSuccess,
  onGoogleLogout,
  onExitNakesMode,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onAddTherapy,
  onDeleteTherapy,
  onAddVideo,
  onDeleteVideo,
  onAddProgressNote,
  onUpdateProgressNote,
  onDeleteProgressNote
}) => {
  const [adminTab, setAdminTab] = useState<'appointments' | 'progressNotes' | 'patients' | 'therapies' | 'videos'>('appointments');
  const [selectedPatientForProgressFilter, setSelectedPatientForProgressFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusUpdateToast, setStatusUpdateToast] = useState<{ code: string; status: string } | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [deleteToast, setDeleteToast] = useState<{ code: string; patientName: string } | null>(null);

  const handleStatusChangeWithFeedback = (appId: string, bookingCode: string, newStatus: AppointmentStatus) => {
    onUpdateAppointmentStatus(appId, newStatus);
    setStatusUpdateToast({ code: bookingCode, status: newStatus });
    setTimeout(() => {
      setStatusUpdateToast(null);
    }, 4000);
  };

  const handleConfirmDelete = () => {
    if (!appointmentToDelete) return;
    const { id, bookingCode, userName } = appointmentToDelete;
    onDeleteAppointment(id);
    setAppointmentToDelete(null);
    setDeleteToast({ code: bookingCode, patientName: userName });
    setTimeout(() => {
      setDeleteToast(null);
    }, 4000);
  };

  // Add therapy modal form state
  const [showAddTherapyModal, setShowAddTherapyModal] = useState(false);
  const [newTherapyName, setNewTherapyName] = useState('');
  const [newTherapyTagline, setNewTherapyTagline] = useState('');
  const [newTherapyCategory, setNewTherapyCategory] = useState<'massage' | 'cupping' | 'exercise' | 'spa' | 'mind-body'>('massage');
  const [newTherapyDuration, setNewTherapyDuration] = useState('30 Menit');
  const [newTherapyDesc, setNewTherapyDesc] = useState('');
  const [newTherapyDef, setNewTherapyDef] = useState('');
  const [newTherapyBenefits, setNewTherapyBenefits] = useState('');
  const [newTherapyIndications, setNewTherapyIndications] = useState('');
  const [newTherapyContra, setNewTherapyContra] = useState('');
  const [newTherapyImage, setNewTherapyImage] = useState('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80');

  // Add video modal form state
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [newVidTitle, setNewVidTitle] = useState('');
  const [newVidCategory, setNewVidCategory] = useState<'Massage' | 'Cupping' | 'Akupresur' | 'Relaksasi' | 'Mind-body therapy'>('Massage');
  const [newVidYoutubeUrl, setNewVidYoutubeUrl] = useState('');
  const [newVidDuration, setNewVidDuration] = useState('10:00');
  const [newVidDesc, setNewVidDesc] = useState('');
  const [newVidAuthor, setNewVidAuthor] = useState('Tim Keperawatan Holistik');

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const matchStatus = statusFilter === 'Semua' || app.status === statusFilter;
      const matchSearch =
        app.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.therapyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.locationName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [appointments, statusFilter, searchQuery]);

  // Unique Patients from appointments
  const patientsList = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; patientNumber: string; appointmentsCount: number; lastDate: string }>();
    appointments.forEach((a) => {
      const existing = map.get(a.userId || a.userName);
      if (existing) {
        existing.appointmentsCount += 1;
        existing.lastDate = a.date;
      } else {
        map.set(a.userId || a.userName, {
          name: a.userName,
          phone: a.userPhone,
          patientNumber: a.patientNumber,
          appointmentsCount: 1,
          lastDate: a.date
        });
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  // Extract YouTube ID from string
  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : 'bRVXr5ujWDY';
  };

  const handleCreateTherapy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTherapyName.trim()) return;

    const t: Therapy = {
      id: 'therapy-' + Date.now(),
      name: newTherapyName.trim(),
      category: newTherapyCategory,
      tagline: newTherapyTagline.trim() || 'Perawatan holistik komplementer',
      description: newTherapyDesc.trim() || newTherapyTagline,
      definition: newTherapyDef.trim() || newTherapyDesc,
      benefits: newTherapyBenefits.split('\n').filter(b => b.trim().length > 0),
      indications: newTherapyIndications.split('\n').filter(i => i.trim().length > 0),
      precautions: ['Pastikan kondisi pasien stabil dan nyaman selama tindakan.'],
      contraindications: newTherapyContra.split('\n').filter(c => c.trim().length > 0),
      durationMinutes: 30,
      durationText: newTherapyDuration,
      image: newTherapyImage,
      iconName: 'Sparkles'
    };

    onAddTherapy(t);
    setShowAddTherapyModal(false);
    // reset
    setNewTherapyName('');
    setNewTherapyTagline('');
    setNewTherapyDesc('');
    setNewTherapyDef('');
  };

  const handleCreateVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVidTitle.trim() || !newVidYoutubeUrl.trim()) return;

    const ytId = extractYoutubeId(newVidYoutubeUrl);
    const v: VideoType = {
      id: 'vid-' + Date.now(),
      title: newVidTitle.trim(),
      category: newVidCategory,
      youtubeId: ytId,
      youtubeUrl: newVidYoutubeUrl.trim(),
      duration: newVidDuration.trim(),
      description: newVidDesc.trim() || 'Video pembelajaran keperawatan holistik.',
      thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      author: newVidAuthor.trim()
    };

    onAddVideo(v);
    setShowAddVideoModal(false);
    setNewVidTitle('');
    setNewVidYoutubeUrl('');
    setNewVidDesc('');
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-stone-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
              Nakes & Admin Console
            </span>
            <span className="text-emerald-400 text-xs font-semibold">
              Holistic Nursing Care
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 text-white">
            Dashboard Pengelola Layanan
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-light mt-1">
            Pantau reservasi pasien, kelola status tindakan, ketersediaan slot, dan materi edukasi.
          </p>
        </div>

        {/* Quick Stats & Logout Button in Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-center px-2">
              <span className="text-base sm:text-lg font-black text-amber-300">
                {appointments.filter(a => a.status === 'Menunggu').length}
              </span>
              <span className="text-[10px] text-stone-300 block">Menunggu</span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div className="text-center px-2">
              <span className="text-base sm:text-lg font-black text-emerald-300">
                {appointments.filter(a => a.status === 'Terjadwal').length}
              </span>
              <span className="text-[10px] text-stone-300 block">Terjadwal</span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div className="text-center px-2">
              <span className="text-base sm:text-lg font-black text-blue-300">
                {appointments.filter(a => a.status === 'Selesai').length}
              </span>
              <span className="text-[10px] text-stone-300 block">Selesai</span>
            </div>
          </div>

          <button
            onClick={onExitNakesMode}
            className="w-full sm:w-auto bg-stone-800/90 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl border border-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            title="Keluar dari Portal Nakes"
          >
            <span>Keluar Mode Nakes</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Integration Card */}
      <GoogleSheetsCard
        googleUser={googleUser}
        accessToken={accessToken}
        onAuthSuccess={onGoogleAuthSuccess}
        onLogout={onGoogleLogout}
        appointments={appointments}
      />

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-stone-200">
        <button
          onClick={() => setAdminTab('appointments')}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            adminTab === 'appointments'
              ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-emerald-700" />
          <span>Daftar Jadwal ({appointments.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('progressNotes')}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            adminTab === 'progressNotes'
              ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-emerald-700" />
          <span>Catatan Perkembangan ({progressNotes.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('patients')}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            adminTab === 'patients'
              ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-700" />
          <span>Data Pasien ({patientsList.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('therapies')}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            adminTab === 'therapies'
              ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>Kelola Terapi ({therapies.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('videos')}
          className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            adminTab === 'videos'
              ? 'bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Video className="w-4 h-4 text-emerald-700" />
          <span>Kelola Video ({videos.length})</span>
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS MANAGEMENT */}
      {adminTab === 'appointments' && (
        <div className="space-y-4">
          {/* Controls: Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari pasien, kode, atau terapi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['Semua', 'Menunggu', 'Terjadwal', 'Selesai', 'Dibatalkan'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-emerald-800 text-white'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Status Update Notification Toast */}
          {statusUpdateToast && (
            <div className="bg-emerald-900 text-white px-4 py-2.5 rounded-2xl text-xs flex items-center justify-between shadow-lg animate-fadeIn border border-emerald-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  Status <strong>{statusUpdateToast.code}</strong> berhasil diubah menjadi <strong>{statusUpdateToast.status}</strong> & otomatis tersinkronisasi ke Google Spreadsheet.
                </span>
              </div>
              <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Real-Time Synced
              </span>
            </div>
          )}

          {/* Delete Schedule Toast */}
          {deleteToast && (
            <div className="bg-rose-900 text-white px-4 py-2.5 rounded-2xl text-xs flex items-center justify-between shadow-lg animate-fadeIn border border-rose-700">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-300 shrink-0" />
                <span>
                  Data jadwal pasien <strong>{deleteToast.patientName}</strong> (Kode: <strong>{deleteToast.code}</strong>) berhasil dihapus dan otomatis disinkronkan ke Google Spreadsheet.
                </span>
              </div>
              <span className="text-[10px] bg-rose-800 text-rose-200 px-2 py-0.5 rounded-full font-bold">
                Data Dihapus
              </span>
            </div>
          )}

          {/* Appointments Table / List */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 text-stone-500 font-bold uppercase text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="py-3.5 px-4">Kode & Tanggal</th>
                    <th className="py-3.5 px-4">Nama Pasien</th>
                    <th className="py-3.5 px-4">Terapi & Waktu</th>
                    <th className="py-3.5 px-4">Lokasi Tindakan</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Ubah Status & Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-stone-50/80 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-stone-800 block">
                          {app.bookingCode}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {app.dayName}, {formatIndonesianDate(app.date)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-900 block">{app.userName}</span>
                        <span className="text-[11px] text-stone-500">{app.userPhone}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-900 block">{app.therapyName}</span>
                        <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          {app.timeSlot} WIB
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px] truncate">
                        {app.locationName}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'Terjadwal'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : app.status === 'Menunggu'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : app.status === 'Selesai'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-stone-100 text-stone-600 border border-stone-300'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatientForProgressFilter(app.userName);
                              setAdminTab('progressNotes');
                            }}
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Tulis / Lihat Catatan Perkembangan Klinis (SOAP)"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Catatan SOAP</span>
                          </button>
                          <select
                            value={app.status}
                            onChange={(e) =>
                              handleStatusChangeWithFeedback(app.id, app.bookingCode, e.target.value as AppointmentStatus)
                            }
                            className="bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold py-1 px-2 text-stone-800 focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="Menunggu">Menunggu</option>
                            <option value="Terjadwal">Terjadwal</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Dibatalkan">Dibatalkan</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setAppointmentToDelete(app)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition cursor-pointer"
                            title="Hapus Data Jadwal Pasien"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAppointments.length === 0 && (
              <div className="text-center py-12 text-stone-500 text-xs">
                Tidak ada data jadwal yang sesuai filter pencarian.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: CLINICAL PROGRESS NOTES (SOAP) */}
      {adminTab === 'progressNotes' && (
        <ClinicalProgressNotesManager
          progressNotes={progressNotes}
          onAddNote={onAddProgressNote}
          onUpdateNote={onUpdateProgressNote}
          onDeleteNote={onDeleteProgressNote}
          appointments={appointments}
          therapies={therapies}
          initialSelectedPatient={selectedPatientForProgressFilter}
          onClearInitialPatient={() => setSelectedPatientForProgressFilter('Semua')}
        />
      )}

      {/* TAB 2: PATIENT DIRECTORY */}
      {adminTab === 'patients' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-base">Direktori Pasien Terdaftar</h3>
              <p className="text-xs text-stone-500">Daftar pengguna yang telah melakukan reservasi terapi dan memiliki rekam kunjungan.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {patientsList.map((pat, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{pat.name}</h4>
                      <span className="text-[11px] text-emerald-800 font-mono font-semibold">
                        {pat.patientNumber || 'Pasien Umum'}
                      </span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pat.appointmentsCount} Sesi
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 space-y-0.5 pt-1">
                    <p>Telepon: <span className="font-semibold text-stone-800">{pat.phone}</span></p>
                    <p>Kunjungan Terakhir: <span className="font-semibold text-stone-800">{formatIndonesianDate(pat.lastDate)}</span></p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/70 flex items-center justify-end">
                  <button
                    onClick={() => {
                      setSelectedPatientForProgressFilter(pat.name);
                      setAdminTab('progressNotes');
                    }}
                    className="w-full text-center bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-300 font-bold text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Lihat Catatan Perkembangan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: THERAPIES MANAGEMENT */}
      {adminTab === 'therapies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-base">Manajemen Modalitas Terapi</h3>
              <p className="text-xs text-stone-500">Tambah atau sesuaikan jenis layanan holistik.</p>
            </div>
            <button
              onClick={() => setShowAddTherapyModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Terapi Baru</span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {therapies.map((th) => (
              <div key={th.id} className="bg-white p-4 rounded-2xl border border-stone-200 flex items-start justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <img
                    src={th.image}
                    alt={th.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">{th.name}</h4>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded">
                      {th.durationText}
                    </span>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-1">{th.tagline}</p>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteTherapy(th.id)}
                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg transition"
                  title="Hapus Terapi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: VIDEOS MANAGEMENT */}
      {adminTab === 'videos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-base">Manajemen Video Edukasi</h3>
              <p className="text-xs text-stone-500">Tambah tautan YouTube materi pembelajaran keperawatan.</p>
            </div>
            <button
              onClick={() => setShowAddVideoModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Video Baru</span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {videos.map((vid) => (
              <div key={vid.id} className="bg-white p-4 rounded-2xl border border-stone-200 flex items-start justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    className="w-20 h-14 rounded-xl object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.2 rounded">
                      {vid.category}
                    </span>
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 line-clamp-1">{vid.title}</h4>
                    <p className="text-[11px] text-stone-400">Durasi: {vid.duration}</p>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteVideo(vid.id)}
                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg transition"
                  title="Hapus Video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD THERAPY MODAL */}
      {showAddTherapyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/75 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-stone-200">
            <h3 className="font-extrabold text-stone-900 text-base">Tambah Jenis Terapi Holistik Baru</h3>
            <form onSubmit={handleCreateTherapy} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nama Terapi *</label>
                <input
                  type="text"
                  value={newTherapyName}
                  onChange={(e) => setNewTherapyName(e.target.value)}
                  placeholder="Contoh: Aromatherapy Massage"
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Kategori</label>
                  <select
                    value={newTherapyCategory}
                    onChange={(e) => setNewTherapyCategory(e.target.value as any)}
                    className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  >
                    <option value="massage">Massage</option>
                    <option value="cupping">Cupping</option>
                    <option value="spa">Spa</option>
                    <option value="exercise">Exercise / Olah Tubuh</option>
                    <option value="mind-body">Mind-Body</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Durasi Tindakan</label>
                  <input
                    type="text"
                    value={newTherapyDuration}
                    onChange={(e) => setNewTherapyDuration(e.target.value)}
                    placeholder="30 Menit"
                    className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tagline Ringkas</label>
                <input
                  type="text"
                  value={newTherapyTagline}
                  onChange={(e) => setNewTherapyTagline(e.target.value)}
                  placeholder="Deskripsi satu kalimat yang menarik..."
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Pengertian & Penjelasan</label>
                <textarea
                  value={newTherapyDef}
                  onChange={(e) => setNewTherapyDef(e.target.value)}
                  rows={2}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tujuan / Manfaat (1 baris per poin)</label>
                <textarea
                  value={newTherapyBenefits}
                  onChange={(e) => setNewTherapyBenefits(e.target.value)}
                  placeholder="Meningkatkan relaksasi&#10;Melancarkan sirkulasi darah"
                  rows={2}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Indikasi (1 baris per poin)</label>
                <textarea
                  value={newTherapyIndications}
                  onChange={(e) => setNewTherapyIndications(e.target.value)}
                  placeholder="Otot tegang&#10;Stres pikiran"
                  rows={2}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Kontraindikasi (1 baris per poin)</label>
                <textarea
                  value={newTherapyContra}
                  onChange={(e) => setNewTherapyContra(e.target.value)}
                  placeholder="Luka terbuka&#10;Fraktur akut"
                  rows={2}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddTherapyModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold"
                >
                  Simpan Terapi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD VIDEO MODAL */}
      {showAddVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/75 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <h3 className="font-extrabold text-stone-900 text-base">Tambah Video Pembelajaran</h3>
            <form onSubmit={handleCreateVideo} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Judul Video *</label>
                <input
                  type="text"
                  value={newVidTitle}
                  onChange={(e) => setNewVidTitle(e.target.value)}
                  placeholder="Contoh: Panduan Terapi Akupresur Mandiri"
                  className="w-full border border-stone-300 rounded-xl p-2.5 text-stone-800"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Kategori</label>
                  <select
                    value={newVidCategory}
                    onChange={(e) => setNewVidCategory(e.target.value as any)}
                    className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  >
                    <option value="Massage">Massage</option>
                    <option value="Cupping">Cupping</option>
                    <option value="Akupresur">Akupresur</option>
                    <option value="Relaksasi">Relaksasi</option>
                    <option value="Mind-body therapy">Mind-body therapy</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Durasi Video</label>
                  <input
                    type="text"
                    value={newVidDuration}
                    onChange={(e) => setNewVidDuration(e.target.value)}
                    placeholder="12:00"
                    className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tautan YouTube URL *</label>
                <input
                  type="text"
                  value={newVidYoutubeUrl}
                  onChange={(e) => setNewVidYoutubeUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                  className="w-full border border-stone-300 rounded-xl p-2.5 text-stone-800"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Deskripsi Singkat</label>
                <textarea
                  value={newVidDesc}
                  onChange={(e) => setNewVidDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Narasumber / Instansi</label>
                <input
                  type="text"
                  value={newVidAuthor}
                  onChange={(e) => setNewVidAuthor(e.target.value)}
                  placeholder="Tim Keperawatan Komplementer UNDIP"
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddVideoModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold"
                >
                  Simpan Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus Data Jadwal Pasien */}
      {appointmentToDelete && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp border border-stone-200">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-stone-900 text-base">
                  Hapus Data Jadwal Pasien?
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data jadwal ini? Tindakan ini akan menghapus data pendaftaran pasien secara permanen.
                </p>
              </div>
            </div>

            {/* Target Appointment Details Summary */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs space-y-2.5">
              <div className="flex justify-between border-b border-stone-200/80 pb-1.5">
                <span className="text-stone-500">Kode Booking:</span>
                <span className="font-mono font-bold text-stone-900">{appointmentToDelete.bookingCode}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/80 pb-1.5">
                <span className="text-stone-500">Nama Pasien:</span>
                <span className="font-bold text-stone-900">{appointmentToDelete.userName}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/80 pb-1.5">
                <span className="text-stone-500">Nomor Kontak:</span>
                <span className="font-medium text-stone-800">{appointmentToDelete.userPhone}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/80 pb-1.5">
                <span className="text-stone-500">Jenis Terapi:</span>
                <span className="font-semibold text-emerald-800">{appointmentToDelete.therapyName}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/80 pb-1.5">
                <span className="text-stone-500">Waktu Tindakan:</span>
                <span className="font-medium text-stone-800">
                  {appointmentToDelete.dayName}, {formatIndonesianDate(appointmentToDelete.date)} • {appointmentToDelete.timeSlot} WIB
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-200/80 pb-1.5">
                <span className="text-stone-500">Lokasi:</span>
                <span className="font-medium text-stone-800 text-right max-w-[60%] truncate">
                  {appointmentToDelete.locationName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Status Tindakan:</span>
                <span className="font-bold text-stone-700">{appointmentToDelete.status}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Penghapusan ini akan otomatis memperbarui daftar rekaman jadwal di <strong>Google Spreadsheet</strong> (Real-time Synced).
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setAppointmentToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Data Jadwal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
