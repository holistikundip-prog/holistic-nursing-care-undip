import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Sparkles,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CalendarCheck2,
  QrCode,
  Share2,
  Check,
  ShieldCheck,
  LogIn
} from 'lucide-react';
import { Therapy, LocationItem, Appointment, UserProfile } from '../types';
import { GENERATE_TIME_SLOTS, INITIAL_LOCATIONS } from '../data/mockData';
import { generateBookingCode, getIndonesianDayName, formatIndonesianDate } from '../utils/storage';
import { appendAppointmentToSheet } from '../services/googleSheets';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapies: Therapy[];
  locations: LocationItem[];
  preSelectedTherapy?: Therapy | null;
  existingAppointments: Appointment[];
  currentUser: UserProfile;
  accessToken?: string | null;
  googleUser?: any | null;
  onAuthSuccess?: (user: any, token: string) => void;
  onBookingSuccess: (appointment: Appointment) => void;
  onGoToMyAppointments: () => void;
  onRequestAuth?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  therapies,
  locations,
  preSelectedTherapy,
  existingAppointments,
  currentUser,
  accessToken,
  googleUser,
  onAuthSuccess,
  onBookingSuccess,
  onGoToMyAppointments,
  onRequestAuth
}) => {
  const [step, setStep] = useState<number>(1);

  const [selectedTherapyId, setSelectedTherapyId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  
  const [patientName, setPatientName] = useState<string>('');
  const [patientNumber, setPatientNumber] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preSelectedTherapy) {
        setSelectedTherapyId(preSelectedTherapy.id);
        setStep(2);
      } else {
        setSelectedTherapyId(therapies[0]?.id || '');
        setStep(1);
      }
      setSelectedLocationId(locations[0]?.id || 'undip-nursing');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (tomorrow.getDay() === 0) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      const dateStr = tomorrow.toISOString().split('T')[0];
      setSelectedDate(dateStr);
      setSelectedTimeSlot('09:00');

      setPatientName(currentUser.name);
      setPatientNumber(currentUser.patientNumber);
      setPatientPhone(currentUser.phone);
      setPatientEmail(currentUser.email || '');
      setNotes('');
      setErrorMessage('');
      setCreatedAppointment(null);
    }
  }, [isOpen, preSelectedTherapy, therapies, locations, currentUser]);

  const allTimeSlots = useMemo(() => GENERATE_TIME_SLOTS(), []);

  const bookedSlots = useMemo(() => {
    if (!selectedDate || !selectedLocationId) return new Set<string>();
    const booked = new Set<string>();
    existingAppointments.forEach(app => {
      if (app.date === selectedDate && app.locationId === selectedLocationId && app.status !== 'Dibatalkan') {
        booked.add(app.timeSlot);
      }
    });
    return booked;
  }, [selectedDate, selectedLocationId, existingAppointments]);

  const selectedTherapy = therapies.find(t => t.id === selectedTherapyId);
  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  const isSunday = useMemo(() => {
    if (!selectedDate) return false;
    const d = new Date(selectedDate + 'T00:00:00');
    return d.getDay() === 0;
  }, [selectedDate]);

  const selectedDayOfWeek = useMemo(() => {
    if (!selectedDate) return null;
    const d = new Date(selectedDate + 'T00:00:00');
    return d.getDay();
  }, [selectedDate]);

  const isInvalidDayForTherapy = useMemo(() => {
    if (selectedDayOfWeek === null || !selectedTherapy?.allowedDays) return false;
    return !selectedTherapy.allowedDays.includes(selectedDayOfWeek);
  }, [selectedDayOfWeek, selectedTherapy]);

  const handleNextStep = () => {
    setErrorMessage('');
    
    if (step === 1) {
      if (!selectedTherapyId) {
        setErrorMessage('Silakan pilih salah satu terapi holistik terlebih dahulu.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedLocationId) {
        setErrorMessage('Silakan pilih lokasi tindakan layanan.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedDate) {
        setErrorMessage('Silakan pilih tanggal tindakan.');
        return;
      }
      if (isSunday) {
        setErrorMessage('Layanan tidak beroperasi pada hari Minggu. Silakan pilih hari operasional (Senin – Sabtu).');
        return;
      }
      if (isInvalidDayForTherapy && selectedTherapy) {
        setErrorMessage(`Sesi terapi ${selectedTherapy.name} hanya tersedia pada hari Jumat dan Sabtu. Silakan pilih tanggal di hari Jumat atau Sabtu.`);
        return;
      }
      if (!selectedTimeSlot) {
        setErrorMessage('Silakan pilih slot waktu tindakan.');
        return;
      }
      if (bookedSlots.has(selectedTimeSlot)) {
        setErrorMessage('Slot waktu ini sudah terisi. Silakan pilih jam lainnya.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!patientName.trim()) {
        setErrorMessage('Nama lengkap pasien wajib diisi.');
        return;
      }
      if (!patientPhone.trim()) {
        setErrorMessage('Nomor telepon / WhatsApp wajib diisi.');
        return;
      }
      setStep(5);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedTherapy || !selectedLocation) return;

    const dayName = getIndonesianDayName(selectedDate);
    const newAppointment: Appointment = {
      id: 'app-' + Date.now(),
      bookingCode: generateBookingCode(),
      userId: currentUser.id,
      userName: patientName.trim(),
      userEmail: (patientEmail.trim() || currentUser.email || '').toLowerCase(),
      userPhone: patientPhone.trim(),
      patientNumber: patientNumber.trim() || 'HNC-PASIEN-' + Math.floor(100000 + Math.random() * 900000),
      therapyId: selectedTherapy.id,
      therapyName: selectedTherapy.name,
      locationId: selectedLocation.id,
      locationName: selectedLocation.name,
      date: selectedDate,
      dayName: dayName,
      timeSlot: selectedTimeSlot,
      notes: notes.trim(),
      status: 'Terjadwal',
      createdAt: new Date().toISOString()
    };

    setCreatedAppointment(newAppointment);
    onBookingSuccess(newAppointment);
    setStep(6);

    const activeToken = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('hnc_google_access_token') : null);
    if (activeToken) {
      appendAppointmentToSheet(activeToken, newAppointment).catch((err) => {
        console.warn('Background sync log info:', err);
      });
    }
  };

  if (!isOpen) return null;

  if (currentUser.isGuest || !currentUser.email) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-stone-200 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
              Autentikasi Diperlukan
            </span>
            <h3 className="text-lg font-black text-stone-900 mt-2">Wajib Masuk / Daftar Akun Pasien</h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Untuk menjamin privasi riwayat kesehatan, kepemilikan e-tiket, serta keamanan data rekam medis Anda, setiap pemesanan jadwal terapi wajib dilakukan melalui akun pasien yang terdaftar.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => {
                onClose();
                if (onRequestAuth) onRequestAuth();
              }}
              className="flex-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <User className="w-4 h-4 text-emerald-300" />
              <span>Masuk / Daftar Akun</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 relative overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-emerald-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-emerald-300" />
              PILIH JADWAL TINDAKAN
            </h2>
            <p className="text-xs text-emerald-200">
              Layanan Keperawatan Holistik Terjadwal (Senin – Sabtu, 08.00–19.30)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator (Steps 1 to 5) */}
        {step <= 5 && (
          <div className="px-6 pt-4 pb-2 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-[11px] font-semibold text-stone-500">
            <span className={step >= 1 ? 'text-emerald-800 font-bold' : ''}>1. Terapi</span>
            <span>›</span>
            <span className={step >= 2 ? 'text-emerald-800 font-bold' : ''}>2. Lokasi</span>
            <span>›</span>
            <span className={step >= 3 ? 'text-emerald-800 font-bold' : ''}>3. Waktu</span>
            <span>›</span>
            <span className={step >= 4 ? 'text-emerald-800 font-bold' : ''}>4. Data</span>
            <span>›</span>
            <span className={step >= 5 ? 'text-emerald-800 font-bold' : ''}>5. Konfirmasi</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-sm text-stone-700 space-y-4">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Pilih Terapi */}
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="font-bold text-stone-900 text-sm">Langkah 1: Pilih Jenis Terapi Holistik</h3>
              <div className="grid gap-2.5">
                {therapies.map((therapy) => (
                  <div
                    key={therapy.id}
                    onClick={() => setSelectedTherapyId(therapy.id)}
                    className={`p-3.5 rounded-2xl border transition flex items-center gap-3 cursor-pointer ${
                      selectedTherapyId === therapy.id
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-stone-200 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    <img
                      src={therapy.image}
                      alt={therapy.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-stone-900 text-sm truncate">{therapy.name}</h4>
                          {therapy.scheduleNote && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                              Jumat & Sabtu
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                          {therapy.durationText}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{therapy.tagline}</p>
                      {therapy.scheduleNote && (
                        <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Sesi hanya tersedia pada hari <strong>Jumat & Sabtu</strong></span>
                        </p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedTherapyId === therapy.id ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300'
                    }`}>
                      {selectedTherapyId === therapy.id && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Pilih Lokasi */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-sm">Langkah 2: Pilih Lokasi Tindakan</h3>
                {selectedTherapy && (
                  <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                    {selectedTherapy.name} ({selectedTherapy.durationText})
                  </span>
                )}
              </div>

              <div className="grid gap-3">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLocationId(loc.id)}
                    className={`p-4 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${
                      selectedLocationId === loc.id
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-stone-200 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      selectedLocationId === loc.id ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'
                    }`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-900 text-sm leading-snug">{loc.name}</h4>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">{loc.address}</p>
                      {loc.buildingRoom && (
                        <p className="text-[11px] text-emerald-700 font-medium mt-1">
                          Ruang: {loc.buildingRoom}
                        </p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                      selectedLocationId === loc.id ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300'
                    }`}>
                      {selectedLocationId === loc.id && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Pilih Tanggal & Jam */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-sm">Langkah 3: Pilih Hari, Tanggal & Slot Waktu</h3>
                {selectedTherapy && (
                  <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                    {selectedTherapy.name}
                  </span>
                )}
              </div>

              {selectedTherapy?.scheduleNote && (
                <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-amber-950 text-xs">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-amber-900">
                      Jadwal Operasional Terapi {selectedTherapy.name}:
                    </strong>
                    <span>
                      Pelaksanaan sesi terapi <strong>{selectedTherapy.name}</strong> hanya tersedia pada hari <strong>Jumat dan Sabtu</strong>.
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <label className="text-xs font-bold text-stone-700 block">
                  {selectedTherapy?.allowedDays
                    ? 'Pilih Tanggal Tindakan (Khusus Hari Jumat & Sabtu)'
                    : 'Pilih Tanggal Tindakan (Senin – Sabtu)'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setErrorMessage('');
                    }}
                    className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isInvalidDayForTherapy || isSunday ? 'border-rose-400' : 'border-stone-300'
                    }`}
                  />
                  <div className="shrink-0 text-right">
                    <span className={`text-xs font-bold px-3 py-2 rounded-xl block ${
                      isInvalidDayForTherapy || isSunday
                        ? 'text-rose-800 bg-rose-100'
                        : selectedDate
                        ? 'text-emerald-800 bg-emerald-100'
                        : 'text-stone-600 bg-stone-200'
                    }`}>
                      {selectedDate ? getIndonesianDayName(selectedDate) : 'Hari'}
                    </span>
                  </div>
                </div>

                {isSunday && (
                  <p className="text-xs text-rose-600 font-medium">
                    ⚠️ Layanan tutup pada hari Minggu. Mohon pilih hari operasional.
                  </p>
                )}

                {selectedDate && !isSunday && isInvalidDayForTherapy && selectedTherapy && (
                  <p className="text-xs text-rose-600 font-medium">
                    ⚠️ Hari <strong>{getIndonesianDayName(selectedDate)}</strong> tidak tersedia untuk sesi <strong>{selectedTherapy.name}</strong>. Silakan pilih hari <strong>Jumat</strong> atau <strong>Sabtu</strong>.
                  </p>
                )}

                {selectedDate && !isSunday && !isInvalidDayForTherapy && (
                  <p className="text-xs text-stone-600 flex items-center gap-1">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>
                      Tanggal terpilih: <strong className="text-stone-800">{formatIndonesianDate(selectedDate)}</strong> ({getIndonesianDayName(selectedDate)})
                    </span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    Pilih Jam Tindakan (08.00 – 19.30)
                  </label>
                  <span className="text-[11px] text-stone-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>Tersedia
                    <span className="inline-block w-2 h-2 rounded-full bg-stone-300 ml-2 mr-1"></span>Penuh
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border border-stone-200 rounded-2xl bg-stone-50/60">
                  {allTimeSlots.map((slot) => {
                    const isBooked = bookedSlots.has(slot);
                    const isSelected = selectedTimeSlot === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked || isSunday}
                        onClick={() => {
                          setSelectedTimeSlot(slot);
                          setErrorMessage('');
                        }}
                        className={`py-2 px-1 text-xs rounded-xl font-bold transition text-center cursor-pointer ${
                          isBooked || isSunday
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500'
                            : 'bg-white hover:bg-emerald-50 text-stone-800 border border-stone-200/80'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Isi Data Pasien */}
          {step === 4 && (
            <div className="space-y-3.5">
              <h3 className="font-bold text-stone-900 text-sm">Langkah 4: Lengkapi Data Pasien</h3>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Nama Lengkap Pasien *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Contoh: Bpk. Hendra Pratama"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Nomor Pasien / Rekam Medis (Jika Ada)</label>
                <input
                  type="text"
                  value={patientNumber}
                  onChange={(e) => setPatientNumber(e.target.value)}
                  placeholder="Contoh: HNC-PASIEN-2026081"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Nomor Telepon / WhatsApp Aktif *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Email Pasien</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="contoh: pasien@gmail.com"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Catatan Tambahan / Keluhan Utama (Opsional)</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Tuliskan keluhan seperti leher kaku, kelelahan, dll..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Ringkasan / Konfirmasi */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Konfirmasi Booking
                </span>
                <h3 className="text-lg font-extrabold text-stone-900 mt-2">
                  DETAIL JADWAL TINDAKAN
                </h3>
              </div>

              <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Nama Pasien</span>
                  <span className="font-bold text-stone-900 text-right">{patientName}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Nomor Telepon</span>
                  <span className="font-bold text-stone-900 text-right">{patientPhone}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Pilihan Terapi</span>
                  <span className="font-bold text-emerald-800 text-right">
                    {selectedTherapy?.name} ({selectedTherapy?.durationText})
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Lokasi Tindakan</span>
                  <span className="font-semibold text-stone-900 text-right max-w-[65%]">
                    {selectedLocation?.name}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Hari & Tanggal</span>
                  <span className="font-bold text-stone-900 text-right">
                    {getIndonesianDayName(selectedDate)}, {formatIndonesianDate(selectedDate)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Jam Tindakan</span>
                  <span className="font-extrabold text-emerald-800 text-right bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedTimeSlot} WIB
                  </span>
                </div>
                {notes && (
                  <div className="flex justify-between pt-1">
                    <span className="text-stone-500">Catatan</span>
                    <span className="font-medium text-stone-800 text-right italic max-w-[65%]">
                      "{notes}"
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Berhasil Booking / e-Tiket */}
          {step === 6 && createdAppointment && (
            <div className="space-y-4 text-center py-2 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  Booking Berhasil Disimpan
                </span>
                <h3 className="text-lg font-black text-stone-900 mt-2">
                  e-Tiket Tindakan Holistik
                </h3>
              </div>

              {/* e-Ticket Card Simulator */}
              <div className="bg-gradient-to-br from-emerald-900 to-stone-900 text-white rounded-2xl p-5 text-left relative overflow-hidden shadow-lg border border-emerald-700/50">
                <div className="absolute -right-6 -bottom-6 opacity-10">
                  <QrCode className="w-36 h-36" />
                </div>

                <div className="flex justify-between items-start border-b border-emerald-700/60 pb-3 mb-3 relative z-10">
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase font-semibold">Kode Booking</span>
                    <h4 className="text-base font-black tracking-wider text-white">
                      {createdAppointment.bookingCode}
                    </h4>
                  </div>
                  <span className="text-[10px] bg-emerald-700/80 text-emerald-100 font-bold px-2.5 py-1 rounded-lg border border-emerald-600">
                    {createdAppointment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs relative z-10 mb-3">
                  <div>
                    <span className="text-emerald-300 text-[10px] block">Nama Pasien</span>
                    <span className="font-bold text-white truncate block">{createdAppointment.userName}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 text-[10px] block">No. Rekam Medis</span>
                    <span className="font-bold text-white truncate block">{createdAppointment.patientNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-emerald-300 text-[10px] block">Jenis Terapi</span>
                    <span className="font-bold text-white text-sm">{createdAppointment.therapyName}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 text-[10px] block">Hari & Tanggal</span>
                    <span className="font-semibold text-white">{createdAppointment.dayName}, {formatIndonesianDate(createdAppointment.date)}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 text-[10px] block">Waktu Sesi</span>
                    <span className="font-extrabold text-emerald-200">{createdAppointment.timeSlot} WIB</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-emerald-700/40">
                    <span className="text-emerald-300 text-[10px] block">Lokasi Tindakan</span>
                    <span className="font-semibold text-white">{createdAppointment.locationName}</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-2.5 text-[11px] text-emerald-100 flex items-center justify-between relative z-10">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Harap hadir 10 menit sebelum jadwal sesi dimulai.</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-3">
          {step > 1 && step < 6 && (
            <button
              onClick={() => {
                setStep(step - 1);
                setErrorMessage('');
              }}
              className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          )}

          {step === 1 && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer"
            >
              Batal
            </button>
          )}

          {step > 1 && step < 6 && <div></div>}

          {step < 5 && (
            <button
              onClick={handleNextStep}
              className="ml-auto bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 5 && (
            <button
              onClick={handleConfirmBooking}
              className="ml-auto bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Konfirmasi & Buat Booking</span>
            </button>
          )}

          {step === 6 && (
            <div className="flex w-full gap-2.5">
              <button
                onClick={() => {
                  onClose();
                  onGoToMyAppointments();
                }}
                className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CalendarCheck2 className="w-4 h-4 text-emerald-800" />
                <span>Lihat Janji Temu Saya</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
