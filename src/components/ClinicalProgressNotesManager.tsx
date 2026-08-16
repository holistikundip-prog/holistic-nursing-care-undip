import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit3,
  Eye,
  Calendar,
  User,
  Stethoscope,
  Activity,
  HeartPulse,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Printer,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Users,
  Layers,
  List,
  TrendingDown,
  TrendingUp,
  Phone,
  Mail,
  History,
  X
} from 'lucide-react';
import { ClinicalProgressNote, Appointment, UserProfile, Therapy } from '../types';
import { formatIndonesianDate, getRegisteredPatients } from '../utils/storage';

interface ClinicalProgressNotesManagerProps {
  progressNotes: ClinicalProgressNote[];
  onAddNote: (note: ClinicalProgressNote) => void;
  onUpdateNote: (note: ClinicalProgressNote) => void;
  onDeleteNote: (id: string) => void;
  appointments: Appointment[];
  therapies: Therapy[];
  initialSelectedPatient?: string | null;
  onClearInitialPatient?: () => void;
}

interface PatientGroup {
  key: string;
  patientName: string;
  patientNumber: string;
  patientPhone: string;
  patientEmail: string;
  patientId: string;
  notes: ClinicalProgressNote[];
  totalVisits: number;
  latestVisitDate: string;
  latestTherapy: string;
  latestChiefComplaint: string;
  latestProgressFollowUp: string;
  latestPainScale?: number;
  initialPainScale?: number;
  painTrend?: number;
  latestVitalSigns?: ClinicalProgressNote['vitalSigns'];
  uniqueTherapies: string[];
  uniqueNurses: string[];
}

export const ClinicalProgressNotesManager: React.FC<ClinicalProgressNotesManagerProps> = ({
  progressNotes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  appointments,
  therapies,
  initialSelectedPatient,
  onClearInitialPatient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>(initialSelectedPatient || 'Semua');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [expandedPatientKeys, setExpandedPatientKeys] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<ClinicalProgressNote | null>(null);
  const [detailNote, setDetailNote] = useState<ClinicalProgressNote | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<ClinicalProgressNote | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formPatientId, setFormPatientId] = useState<string>('');
  const [formPatientName, setFormPatientName] = useState('');
  const [formPatientNumber, setFormPatientNumber] = useState('');
  const [formPatientPhone, setFormPatientPhone] = useState('');
  const [formPatientEmail, setFormPatientEmail] = useState('');
  const [formTherapyName, setFormTherapyName] = useState('');
  const [formVisitDate, setFormVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [formBookingCode, setFormBookingCode] = useState('');
  const [formChiefComplaint, setFormChiefComplaint] = useState('');
  const [formAssessment, setFormAssessment] = useState('');
  const [formIntervention, setFormIntervention] = useState('');
  const [formProgressFollowUp, setFormProgressFollowUp] = useState('');
  const [formNurseName, setFormNurseName] = useState('Ns. Staf Keperawatan Komplementer, S.Kep.');
  const [formBP, setFormBP] = useState('120/80 mmHg');
  const [formPulse, setFormPulse] = useState('78 x/menit');
  const [formRR, setFormRR] = useState('18 x/menit');
  const [formPainScale, setFormPainScale] = useState<number>(3);

  // Registered Patients List for seamless profile linkage
  const registeredPatientsList = useMemo(() => {
    return getRegisteredPatients();
  }, []);

  // Unique list of patients for filter
  const patientOptions = useMemo(() => {
    const names = new Set<string>();
    progressNotes.forEach(n => names.add(n.patientName));
    appointments.forEach(a => names.add(a.userName));
    registeredPatientsList.forEach(p => names.add(p.name));
    return Array.from(names);
  }, [progressNotes, appointments, registeredPatientsList]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return progressNotes.filter(note => {
      const matchPatient = selectedPatientFilter === 'Semua' || note.patientName === selectedPatientFilter;
      const query = searchQuery.toLowerCase();
      const matchSearch =
        note.patientName.toLowerCase().includes(query) ||
        note.patientNumber.toLowerCase().includes(query) ||
        note.therapyName.toLowerCase().includes(query) ||
        note.chiefComplaint.toLowerCase().includes(query) ||
        note.assessment.toLowerCase().includes(query) ||
        note.intervention.toLowerCase().includes(query) ||
        note.progressFollowUp.toLowerCase().includes(query) ||
        note.nurseName.toLowerCase().includes(query) ||
        (note.bookingCode && note.bookingCode.toLowerCase().includes(query)) ||
        (note.patientPhone && note.patientPhone.includes(query)) ||
        (note.patientEmail && note.patientEmail.toLowerCase().includes(query));

      return matchPatient && matchSearch;
    });
  }, [progressNotes, selectedPatientFilter, searchQuery]);

  // Group notes per patient
  const patientGroups = useMemo(() => {
    const map = new Map<string, PatientGroup>();

    // Sort filteredNotes by visit date descending first
    const sorted = [...filteredNotes].sort(
      (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    );

    sorted.forEach((note) => {
      const key = (note.patientNumber || note.patientName).trim().toLowerCase();
      
      if (!map.has(key)) {
        map.set(key, {
          key,
          patientName: note.patientName,
          patientNumber: note.patientNumber || 'RM-HNC',
          patientPhone: note.patientPhone || '',
          patientEmail: note.patientEmail || '',
          patientId: note.patientId || '',
          notes: [note],
          totalVisits: 1,
          latestVisitDate: note.visitDate,
          latestTherapy: note.therapyName,
          latestChiefComplaint: note.chiefComplaint,
          latestProgressFollowUp: note.progressFollowUp,
          latestPainScale: note.vitalSigns?.painScale,
          latestVitalSigns: note.vitalSigns,
          uniqueTherapies: [note.therapyName],
          uniqueNurses: [note.nurseName]
        });
      } else {
        const group = map.get(key)!;
        group.notes.push(note);
        group.totalVisits = group.notes.length;
        if (!group.patientPhone && note.patientPhone) group.patientPhone = note.patientPhone;
        if (!group.patientEmail && note.patientEmail) group.patientEmail = note.patientEmail;
        if (!group.patientId && note.patientId) group.patientId = note.patientId;
        if (!group.uniqueTherapies.includes(note.therapyName)) group.uniqueTherapies.push(note.therapyName);
        if (!group.uniqueNurses.includes(note.nurseName)) group.uniqueNurses.push(note.nurseName);
      }
    });

    // Calculate initial pain scale and improvement trend
    return Array.from(map.values()).map((g) => {
      const oldestNote = g.notes[g.notes.length - 1];
      g.initialPainScale = oldestNote?.vitalSigns?.painScale;
      if (g.initialPainScale !== undefined && g.latestPainScale !== undefined) {
        g.painTrend = g.initialPainScale - g.latestPainScale;
      }
      return g;
    });
  }, [filteredNotes]);

  // Expand all / collapse all handlers
  const handleToggleExpandPatient = (key: string) => {
    setExpandedPatientKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleExpandAll = () => {
    setExpandedPatientKeys(patientGroups.map((g) => g.key));
  };

  const handleCollapseAll = () => {
    setExpandedPatientKeys([]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenAddModal = (fromAppointment?: Appointment) => {
    if (fromAppointment) {
      setFormPatientId(fromAppointment.userId || '');
      setFormPatientName(fromAppointment.userName);
      setFormPatientNumber(fromAppointment.patientNumber || `RM-HNC-${Math.floor(1000 + Math.random() * 9000)}`);
      setFormPatientPhone(fromAppointment.userPhone || '');
      setFormPatientEmail(fromAppointment.userEmail || '');
      setFormTherapyName(fromAppointment.therapyName);
      setFormVisitDate(fromAppointment.date || new Date().toISOString().split('T')[0]);
      setFormBookingCode(fromAppointment.bookingCode);
      setFormChiefComplaint(fromAppointment.notes ? `Keluhan saat reservasi: ${fromAppointment.notes}` : '');
    } else {
      setFormPatientId('');
      setFormPatientName('');
      setFormPatientNumber(`RM-HNC-${Math.floor(1000 + Math.random() * 9000)}`);
      setFormPatientPhone('');
      setFormPatientEmail('');
      setFormTherapyName(therapies[0]?.name || 'Akupresur Relaksasi');
      setFormVisitDate(new Date().toISOString().split('T')[0]);
      setFormBookingCode('');
      setFormChiefComplaint('');
    }

    setFormAssessment('');
    setFormIntervention('');
    setFormProgressFollowUp('');
    setFormNurseName('Ns. Staf Keperawatan Komplementer, S.Kep.');
    setFormBP('120/80 mmHg');
    setFormPulse('78 x/menit');
    setFormRR('18 x/menit');
    setFormPainScale(3);
    setEditingNote(null);
    setShowAddModal(true);
  };

  const handleOpenAddModalForPatientGroup = (group: PatientGroup) => {
    setFormPatientId(group.patientId || '');
    setFormPatientName(group.patientName);
    setFormPatientNumber(group.patientNumber);
    setFormPatientPhone(group.patientPhone || '');
    setFormPatientEmail(group.patientEmail || '');
    setFormTherapyName(group.latestTherapy || therapies[0]?.name || 'Akupresur Relaksasi');
    setFormVisitDate(new Date().toISOString().split('T')[0]);
    setFormBookingCode('');
    setFormChiefComplaint('');
    setFormAssessment('');
    setFormIntervention('');
    setFormProgressFollowUp('');
    setFormNurseName('Ns. Staf Keperawatan Komplementer, S.Kep.');
    setFormBP('120/80 mmHg');
    setFormPulse('78 x/menit');
    setFormRR('18 x/menit');
    setFormPainScale(3);
    setEditingNote(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (note: ClinicalProgressNote) => {
    setEditingNote(note);
    setFormPatientId(note.patientId || '');
    setFormPatientName(note.patientName);
    setFormPatientNumber(note.patientNumber);
    setFormPatientPhone(note.patientPhone || '');
    setFormPatientEmail(note.patientEmail || '');
    setFormTherapyName(note.therapyName);
    setFormVisitDate(note.visitDate);
    setFormBookingCode(note.bookingCode || '');
    setFormChiefComplaint(note.chiefComplaint);
    setFormAssessment(note.assessment);
    setFormIntervention(note.intervention);
    setFormProgressFollowUp(note.progressFollowUp);
    setFormNurseName(note.nurseName);
    setFormBP(note.vitalSigns?.bloodPressure || '120/80 mmHg');
    setFormPulse(note.vitalSigns?.pulseRate || '78 x/menit');
    setFormRR(note.vitalSigns?.respiratoryRate || '18 x/menit');
    setFormPainScale(note.vitalSigns?.painScale ?? 3);
    setShowAddModal(true);
  };

  const handleQuickSelectPatientOrApp = (selectedValue: string) => {
    if (!selectedValue) return;

    if (selectedValue.startsWith('app:')) {
      const appId = selectedValue.replace('app:', '');
      const found = appointments.find(a => a.id === appId);
      if (found) {
        setFormPatientId(found.userId || '');
        setFormPatientName(found.userName);
        setFormPatientNumber(found.patientNumber || `RM-HNC-${Math.floor(1000 + Math.random() * 9000)}`);
        setFormPatientPhone(found.userPhone || '');
        setFormPatientEmail(found.userEmail || '');
        setFormTherapyName(found.therapyName);
        setFormVisitDate(found.date);
        setFormBookingCode(found.bookingCode);
        if (found.notes && !formChiefComplaint) {
          setFormChiefComplaint(`Keluhan: ${found.notes}`);
        }
      }
    } else if (selectedValue.startsWith('patient:')) {
      const patientId = selectedValue.replace('patient:', '');
      const found = registeredPatientsList.find(p => p.id === patientId || p.email === patientId);
      if (found) {
        setFormPatientId(found.id || '');
        setFormPatientName(found.name);
        setFormPatientNumber(found.patientNumber || `RM-HNC-${Math.floor(1000 + Math.random() * 9000)}`);
        setFormPatientPhone(found.phone || '');
        setFormPatientEmail(found.email || '');
      }
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientName.trim() || !formChiefComplaint.trim() || !formAssessment.trim() || !formIntervention.trim() || !formProgressFollowUp.trim()) {
      alert('Mohon lengkapi kolom Tanggal Kunjungan, Nama Pasien, Keluhan Utama, Hasil Pengkajian, Intervensi, dan Catatan Perkembangan.');
      return;
    }

    // Auto-resolve patient ID and RM from registered directory if not filled
    let finalPatientId = formPatientId;
    let finalPatientNumber = formPatientNumber.trim();
    let finalPatientEmail = formPatientEmail.trim();
    let finalPatientPhone = formPatientPhone.trim();

    const matchedRegistered = registeredPatientsList.find(
      p =>
        (finalPatientEmail && p.email && p.email.toLowerCase() === finalPatientEmail.toLowerCase()) ||
        (finalPatientPhone && p.phone && p.phone.replace(/\D/g, '') === finalPatientPhone.replace(/\D/g, '')) ||
        (p.name && p.name.trim().toLowerCase() === formPatientName.trim().toLowerCase())
    );

    if (matchedRegistered) {
      if (!finalPatientId && matchedRegistered.id) finalPatientId = matchedRegistered.id;
      if (!finalPatientNumber && matchedRegistered.patientNumber) finalPatientNumber = matchedRegistered.patientNumber;
      if (!finalPatientEmail && matchedRegistered.email) finalPatientEmail = matchedRegistered.email;
      if (!finalPatientPhone && matchedRegistered.phone) finalPatientPhone = matchedRegistered.phone;
    }

    if (editingNote) {
      const updated: ClinicalProgressNote = {
        ...editingNote,
        patientId: finalPatientId || editingNote.patientId,
        patientName: formPatientName.trim(),
        patientNumber: finalPatientNumber || editingNote.patientNumber,
        patientPhone: finalPatientPhone,
        patientEmail: finalPatientEmail,
        therapyName: formTherapyName.trim(),
        visitDate: formVisitDate,
        bookingCode: formBookingCode.trim() || undefined,
        chiefComplaint: formChiefComplaint.trim(),
        assessment: formAssessment.trim(),
        vitalSigns: {
          bloodPressure: formBP.trim(),
          pulseRate: formPulse.trim(),
          respiratoryRate: formRR.trim(),
          painScale: formPainScale
        },
        intervention: formIntervention.trim(),
        progressFollowUp: formProgressFollowUp.trim(),
        nurseName: formNurseName.trim()
      };
      onUpdateNote(updated);
      showToast(`Catatan perkembangan pasien ${updated.patientName} berhasil diperbarui & langsung tersinkronisasi ke profil pasien.`);
    } else {
      const newNote: ClinicalProgressNote = {
        id: `cpn-${Date.now()}`,
        patientId: finalPatientId || `patient-${Date.now()}`,
        patientName: formPatientName.trim(),
        patientNumber: finalPatientNumber || `RM-HNC-${Math.floor(1000 + Math.random() * 9000)}`,
        patientPhone: finalPatientPhone,
        patientEmail: finalPatientEmail,
        therapyName: formTherapyName.trim(),
        visitDate: formVisitDate,
        bookingCode: formBookingCode.trim() || undefined,
        chiefComplaint: formChiefComplaint.trim(),
        assessment: formAssessment.trim(),
        vitalSigns: {
          bloodPressure: formBP.trim(),
          pulseRate: formPulse.trim(),
          respiratoryRate: formRR.trim(),
          painScale: formPainScale
        },
        intervention: formIntervention.trim(),
        progressFollowUp: formProgressFollowUp.trim(),
        nurseName: formNurseName.trim(),
        createdAt: new Date().toISOString()
      };
      onAddNote(newNote);
      showToast(`Catatan perkembangan kontrol baru untuk ${newNote.patientName} berhasil disimpan & langsung tampil di profil pasien.`);
    }

    setShowAddModal(false);
    setEditingNote(null);
  };

  const handleConfirmDeleteNote = () => {
    if (!noteToDelete) return;
    const name = noteToDelete.patientName;
    onDeleteNote(noteToDelete.id);
    setNoteToDelete(null);
    if (detailNote && detailNote.id === noteToDelete.id) {
      setDetailNote(null);
    }
    showToast(`Catatan perkembangan pasien ${name} telah dihapus.`);
  };

  const handlePrintNote = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="bg-emerald-900 text-white px-4 py-3 rounded-2xl text-xs flex items-center justify-between shadow-xl animate-fadeIn border border-emerald-700">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-300 hover:text-white text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold uppercase tracking-wider">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Dokumentasi Rekam Klinis Keperawatan</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Catatan Perkembangan Kontrol Kunjungan Lanjutan
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Pencatatan asuhan keperawatan holistik komplementer berkelanjutan. Pantau perkembangan subjektif, tanda vital, intervensi, dan evaluasi medis per pasien secara terstruktur.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenAddModal()}
              className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs sm:text-sm px-4 py-3 rounded-2xl transition flex items-center gap-2 shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tulis Catatan Perkembangan Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Clinical Metrics Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-emerald-800/60 text-xs">
          <div className="bg-emerald-950/50 backdrop-blur-xs p-3 rounded-2xl border border-emerald-700/40">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Total Pasien Terpantau</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-white">{patientGroups.length}</span>
              <span className="text-[11px] text-emerald-200">Orang</span>
            </div>
          </div>

          <div className="bg-emerald-950/50 backdrop-blur-xs p-3 rounded-2xl border border-emerald-700/40">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Total Catatan SOAP</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-white">{filteredNotes.length}</span>
              <span className="text-[11px] text-emerald-200">Rekam Kunjungan</span>
            </div>
          </div>

          <div className="bg-emerald-950/50 backdrop-blur-xs p-3 rounded-2xl border border-emerald-700/40">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Rata-Rata Sesi Kontrol</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-white">
                {patientGroups.length > 0 ? (filteredNotes.length / patientGroups.length).toFixed(1) : '0'}
              </span>
              <span className="text-[11px] text-emerald-200">Sesi/Pasien</span>
            </div>
          </div>

          <div className="bg-emerald-950/50 backdrop-blur-xs p-3 rounded-2xl border border-emerald-700/40">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Sinkronisasi Profil</span>
            <div className="flex items-center gap-1.5 mt-1 text-emerald-300 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Aktif Real-Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter, Search, & View Mode Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari pasien, no. RM, keluhan, terapi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap justify-between lg:justify-end">
          {/* Patient Selector Filter */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedPatientFilter}
              onChange={(e) => {
                setSelectedPatientFilter(e.target.value);
                if (onClearInitialPatient) onClearInitialPatient();
              }}
              className="bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Semua">Semua Pasien ({progressNotes.length} Catatan)</option>
              {patientOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200/80">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-white text-emerald-900 shadow-xs border border-stone-200/50'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Kelompokkan Catatan Berdasarkan Pasien"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Daftar Per Pasien</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono">
                {patientGroups.length}
              </span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-emerald-900 shadow-xs border border-stone-200/50'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Tampilkan Semua Kunjungan Berurutan"
            >
              <List className="w-3.5 h-3.5 text-emerald-700" />
              <span>Garis Waktu Kunjungan</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono">
                {filteredNotes.length}
              </span>
            </button>
          </div>

          {/* Expand / Collapse All (For Grouped View) */}
          {viewMode === 'grouped' && patientGroups.length > 0 && (
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={handleExpandAll}
                className="px-2.5 py-1.5 text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold transition border border-emerald-200 cursor-pointer"
              >
                Buka Semua
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-2.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-xl font-bold transition border border-stone-200 cursor-pointer"
              >
                Tutup Semua
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Section: Grouped vs Flat List */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-stone-800 text-base">Belum Ada Catatan Perkembangan</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {searchQuery || selectedPatientFilter !== 'Semua'
              ? 'Tidak ditemukan catatan perkembangan yang sesuai dengan kata kunci pencarian atau filter pasien.'
              : 'Mulai dokumentasikan hasil kunjungan kontrol dan intervensi holistik pasien untuk memantau kemajuan klinis.'}
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Catatan Pertama</span>
          </button>
        </div>
      ) : viewMode === 'grouped' ? (
        /* ========================================================================= */
        /* MODE 1: KELOMPOK PER PASIEN (PATIENT-CENTRIC GROUPED CARDS)               */
        /* ========================================================================= */
        <div className="space-y-4">
          {patientGroups.map((group) => {
            const isExpanded = expandedPatientKeys.includes(group.key);

            return (
              <div
                key={group.key}
                className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  isExpanded ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Patient Summary Card Header */}
                <div className="p-5 sm:p-6 bg-stone-50/60 border-b border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                      {group.patientName.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-stone-900 text-base sm:text-lg">
                          {group.patientName}
                        </h3>
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-white text-emerald-800 rounded-lg border border-emerald-200 shadow-2xs">
                          {group.patientNumber}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full flex items-center gap-1">
                          <History className="w-3 h-3 text-emerald-700" />
                          {group.totalVisits} Catatan Kontrol
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                        {group.patientPhone && (
                          <span className="flex items-center gap-1 font-medium text-stone-600">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {group.patientPhone}
                          </span>
                        )}
                        {group.patientEmail && (
                          <span className="flex items-center gap-1 text-stone-500">
                            <Mail className="w-3 h-3 text-stone-400" />
                            {group.patientEmail}
                          </span>
                        )}
                        <span className="text-stone-300">•</span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-800">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          Kunjungan Terakhir: {formatIndonesianDate(group.latestVisitDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Pain Scale Trend Preview */}
                  <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                    {/* Pain Trend Pill */}
                    {group.latestPainScale !== undefined && (
                      <div className="px-3 py-1.5 bg-white rounded-xl border border-stone-200 text-xs flex items-center gap-2 shadow-2xs">
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 uppercase font-bold block">Skala Nyeri Terkini</span>
                          <span className="font-extrabold text-blue-900">{group.latestPainScale}/10</span>
                        </div>
                        {group.painTrend !== undefined && group.painTrend > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            <TrendingDown className="w-3 h-3 text-emerald-600" />
                            Turun {group.painTrend} poin
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quick Add Note for This Patient */}
                    <button
                      onClick={() => handleOpenAddModalForPatientGroup(group)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs hover:shadow-md cursor-pointer"
                      title={`Tambah Catatan SOAP Baru untuk ${group.patientName}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Catatan Baru</span>
                    </button>

                    {/* Expand / Collapse Accordion Toggle */}
                    <button
                      onClick={() => handleToggleExpandPatient(group.key)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isExpanded
                          ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                      }`}
                    >
                      <span>{isExpanded ? 'Tutup Riwayat' : 'Lihat Riwayat'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Chronological Visits Section */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-white space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-bold text-stone-800 text-xs sm:text-sm">
                          Riwayat Kunjungan & Catatan Perkembangan ({group.notes.length} Sesi)
                        </h4>
                      </div>
                      <span className="text-[11px] text-stone-400 font-medium">
                        Diurutkan dari kunjungan terbaru
                      </span>
                    </div>

                    <div className="space-y-4">
                      {group.notes.map((note, idx) => (
                        <div
                          key={note.id}
                          className="bg-stone-50/70 hover:bg-stone-50 rounded-2xl border border-stone-200/90 p-4 sm:p-5 space-y-3.5 transition"
                        >
                          {/* Visit Sub-Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-xs px-2.5 py-1 bg-emerald-800 text-white rounded-lg">
                                Kunjungan #{group.notes.length - idx}
                              </span>
                              <span className="font-bold text-stone-900 text-xs sm:text-sm">
                                {note.therapyName}
                              </span>
                              <span className="text-xs text-stone-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-stone-400" />
                                {formatIndonesianDate(note.visitDate)}
                              </span>
                              {note.bookingCode && (
                                <span className="font-mono text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                  {note.bookingCode}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <button
                                onClick={() => setDetailNote(note)}
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Lihat Lembar Rekam Medis Lengkap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(note)}
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-800 border border-stone-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Edit Catatan Ini"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => setNoteToDelete(note)}
                                className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-stone-200 text-xs transition cursor-pointer"
                                title="Hapus Catatan Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 4 SOAP Dimensions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* 1. Keluhan Utama */}
                            <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 space-y-1">
                              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase">
                                <AlertCircle className="w-3 h-3 text-amber-700 shrink-0" />
                                <span>1. Keluhan Utama (Subjective)</span>
                              </div>
                              <p className="text-xs text-stone-800 font-medium leading-relaxed">
                                {note.chiefComplaint}
                              </p>
                            </div>

                            {/* 2. Hasil Pengkajian */}
                            <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px] uppercase">
                                  <Activity className="w-3 h-3 text-blue-700 shrink-0" />
                                  <span>2. Pengkajian Klinis & TTV (Objective)</span>
                                </div>
                                {note.vitalSigns?.painScale !== undefined && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-200 text-blue-900">
                                    Nyeri: {note.vitalSigns.painScale}/10
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-800 font-medium leading-relaxed">
                                {note.assessment}
                              </p>
                              {note.vitalSigns && (
                                <div className="flex items-center gap-2 pt-1 border-t border-blue-200/50 text-[10px] text-blue-950 font-bold flex-wrap">
                                  {note.vitalSigns.bloodPressure && <span>TD: {note.vitalSigns.bloodPressure}</span>}
                                  {note.vitalSigns.pulseRate && <span>Nadi: {note.vitalSigns.pulseRate}</span>}
                                  {note.vitalSigns.respiratoryRate && <span>RR: {note.vitalSigns.respiratoryRate}</span>}
                                </div>
                              )}
                            </div>

                            {/* 3. Intervensi */}
                            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 space-y-1">
                              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[11px] uppercase">
                                <Sparkles className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>3. Intervensi yang Diberikan</span>
                              </div>
                              <p className="text-xs text-stone-800 font-medium leading-relaxed whitespace-pre-line">
                                {note.intervention}
                              </p>
                            </div>

                            {/* 4. Tindak Lanjut */}
                            <div className="bg-purple-50/70 border border-purple-200/70 rounded-xl p-3 space-y-1">
                              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-[11px] uppercase">
                                <HeartPulse className="w-3 h-3 text-purple-700 shrink-0" />
                                <span>4. Perkembangan & Tindak Lanjut Medis</span>
                              </div>
                              <p className="text-xs text-stone-800 font-medium leading-relaxed">
                                {note.progressFollowUp}
                              </p>
                            </div>
                          </div>

                          {/* Footer Info */}
                          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1.5 border-t border-stone-200/50">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-stone-400" />
                              Nakes Penanggung Jawab: <strong className="text-stone-800">{note.nurseName}</strong>
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Tersinkronisasi ke Profil Pasien
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: GARIS WAKTU SEMUA KUNJUNGAN (FLAT CHRONOLOGICAL TIMELINE)         */
        /* ========================================================================= */
        <div className="grid grid-cols-1 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition space-y-4 relative group"
            >
              {/* Note Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-black">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-stone-900 text-sm sm:text-base">
                        {note.patientName}
                      </h4>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md border border-stone-200">
                        {note.patientNumber}
                      </span>
                      {note.bookingCode && (
                        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                          {note.bookingCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-emerald-800">{note.therapyName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {formatIndonesianDate(note.visitDate)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => setDetailNote(note)}
                    className="p-2 rounded-xl text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Lihat Detail SOAP / Rekam Klinis"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Detail Lengkap</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(note)}
                    className="p-2 rounded-xl text-stone-600 hover:text-amber-700 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Edit Catatan Perkembangan"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => setNoteToDelete(note)}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4 Clinical Dimensions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Keluhan Utama */}
                <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wide">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>1. Keluhan Utama (Subjective)</span>
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed font-medium">
                    {note.chiefComplaint}
                  </p>
                </div>

                {/* 2. Hasil Pengkajian */}
                <div className="bg-blue-50/70 border border-blue-200/70 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs uppercase tracking-wide">
                      <Activity className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>2. Hasil Pengkajian (Objective)</span>
                    </div>
                    {note.vitalSigns?.painScale !== undefined && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900">
                        Skala Nyeri: {note.vitalSigns.painScale}/10
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed font-medium">
                    {note.assessment}
                  </p>
                  {note.vitalSigns && (
                    <div className="flex items-center gap-3 pt-1 border-t border-blue-200/50 text-[11px] text-blue-900 font-semibold flex-wrap">
                      {note.vitalSigns.bloodPressure && <span>TD: {note.vitalSigns.bloodPressure}</span>}
                      {note.vitalSigns.pulseRate && <span>Nadi: {note.vitalSigns.pulseRate}</span>}
                      {note.vitalSigns.respiratoryRate && <span>RR: {note.vitalSigns.respiratoryRate}</span>}
                    </div>
                  )}
                </div>

                {/* 3. Intervensi yang Diberikan */}
                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>3. Intervensi yang Diberikan</span>
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line font-medium">
                    {note.intervention}
                  </p>
                </div>

                {/* 4. Catatan Perkembangan & Tindak Lanjut */}
                <div className="bg-purple-50/70 border border-purple-200/70 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs uppercase tracking-wide">
                    <HeartPulse className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span>4. Perkembangan / Tindak Lanjut Medis</span>
                  </div>
                  <p className="text-xs text-stone-800 leading-relaxed font-medium">
                    {note.progressFollowUp}
                  </p>
                </div>
              </div>

              {/* Note Footer */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>Tenaga Perawat Penanggung Jawab: <strong className="text-stone-800">{note.nurseName}</strong></span>
                </div>
                <span className="text-stone-400">
                  Tercatat: {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Tambah / Edit Catatan Perkembangan */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-scaleUp border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-lg">
                    {editingNote ? 'Edit Catatan Perkembangan Pasien' : 'Catatan Perkembangan Kontrol Kunjungan'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Dokumentasi SOAP & evaluasi asuhan keperawatan holistik komplementer
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingNote(null);
                }}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Quick Select from Appointments or Registered Patients */}
              {!editingNote && (appointments.length > 0 || registeredPatientsList.length > 0) && (
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-700" />
                      Pilih Cepat dari Jadwal / Akun Pasien Terdaftar:
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Sinkronisasi Otomatis ke Profil
                    </span>
                  </div>
                  <select
                    onChange={(e) => handleQuickSelectPatientOrApp(e.target.value)}
                    defaultValue=""
                    className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">-- Isi Manual atau Pilih Pasien untuk Tarik Data Otomatis --</option>
                    {appointments.length > 0 && (
                      <optgroup label="📋 Dari Jadwal Reservasi Klinik">
                        {appointments.map((a) => (
                          <option key={`app-${a.id}`} value={`app:${a.id}`}>
                            {a.userName} ({a.bookingCode}) - {a.therapyName} ({a.dayName}, {a.date})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {registeredPatientsList.length > 0 && (
                      <optgroup label="👤 Dari Direktori Akun Pasien">
                        {registeredPatientsList.map((p) => (
                          <option key={`patient-${p.id || p.email}`} value={`patient:${p.id || p.email}`}>
                            {p.name} (RM: {p.patientNumber || 'HNC'}) - {p.phone || p.email}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}

              {/* Patient Basic Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Tanggal Kunjungan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formVisitDate}
                    onChange={(e) => setFormVisitDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Nama Lengkap Pasien <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bpk. Hendra Pratama, S.T."
                    value={formPatientName}
                    onChange={(e) => setFormPatientName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    No. Rekam Medis (RM)
                  </label>
                  <input
                    type="text"
                    placeholder="RM-HNC-2026..."
                    value={formPatientNumber}
                    onChange={(e) => setFormPatientNumber(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="0812-xxxx-xxxx"
                    value={formPatientPhone}
                    onChange={(e) => setFormPatientPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Jenis Terapi yang Dilakukan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Akupresur / Pijat Relaksasi"
                    value={formTherapyName}
                    onChange={(e) => setFormTherapyName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tanda Vital & Skala Nyeri Grid */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Tanda-Tanda Vital & Skala Nyeri Pasien
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-stone-500 block">Tekanan Darah</label>
                    <input
                      type="text"
                      placeholder="120/80 mmHg"
                      value={formBP}
                      onChange={(e) => setFormBP(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg p-1.5 text-xs text-stone-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block">Frekuensi Nadi</label>
                    <input
                      type="text"
                      placeholder="78 x/menit"
                      value={formPulse}
                      onChange={(e) => setFormPulse(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg p-1.5 text-xs text-stone-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block">Laju Pernapasan</label>
                    <input
                      type="text"
                      placeholder="18 x/menit"
                      value={formRR}
                      onChange={(e) => setFormRR(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg p-1.5 text-xs text-stone-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block">Skala Nyeri (0 - 10)</label>
                    <select
                      value={formPainScale}
                      onChange={(e) => setFormPainScale(Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded-lg p-1.5 text-xs text-stone-800 font-bold text-blue-900"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 0 ? '(Bebas Nyeri)' : num <= 3 ? '(Nyeri Ringan)' : num <= 6 ? '(Nyeri Sedang)' : '(Nyeri Berat)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 1. Keluhan Utama */}
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">
                  1. Keluhan Utama Pasien <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Deskripsikan keluhan subjektif yang dirasakan pasien (misal: rasa kaku tengkuk, nyeri pinggang bawah, kelelahan, sulit tidur)..."
                  value={formChiefComplaint}
                  onChange={(e) => setFormChiefComplaint(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 resize-none font-medium"
                />
              </div>

              {/* 2. Hasil Pengkajian */}
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">
                  2. Hasil Pengkajian Klinis / Asesmen <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Hasil pemeriksaan fisik objektif, palpasi spasme otot, respon verbal, keadaan umum pasien..."
                  value={formAssessment}
                  onChange={(e) => setFormAssessment(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 resize-none font-medium"
                />
              </div>

              {/* 3. Intervensi */}
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">
                  3. Intervensi yang Diberikan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tindakan keperawatan komplementer yang dilakukan (misal: titik akupresur yang ditekan, bekam kering dengan 4 cup, durasi pemijatan, edukasi relaksasi)..."
                  value={formIntervention}
                  onChange={(e) => setFormIntervention(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 resize-none font-medium"
                />
              </div>

              {/* 4. Catatan Perkembangan & Tindak Lanjut */}
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">
                  4. Catatan Perkembangan & Tindak Lanjut Medis <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Evaluasi respon pasca-terapi, penurunan skala nyeri, anjuran perawatan mandiri di rumah, dan rekomendasi jadwal kontrol lanjutan..."
                  value={formProgressFollowUp}
                  onChange={(e) => setFormProgressFollowUp(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 resize-none font-medium"
                />
              </div>

              {/* Nurse In Charge */}
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">
                  Nama Tenaga Perawat / Medis Penanggung Jawab <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ns. Rahmat Hidayat, S.Kep."
                  value={formNurseName}
                  onChange={(e) => setFormNurseName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingNote(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingNote ? 'Simpan Perubahan' : 'Simpan Catatan Perkembangan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail SOAP / Rekam Klinis */}
      {detailNote && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-scaleUp border border-stone-200 print:shadow-none print:border-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Departemen Keperawatan Komplementer UNDIP
                  </span>
                  <h3 className="font-extrabold text-stone-900 text-lg">
                    Lembar Catatan Perkembangan Kontrol Pasien
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrintNote}
                  className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Cetak Dokumen"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button
                  onClick={() => setDetailNote(null)}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Patient Header Details */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold uppercase">Nama Pasien:</span>
                <span className="font-bold text-stone-900 text-sm">{detailNote.patientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold uppercase">Nomor Rekam Medis (RM):</span>
                <span className="font-mono font-bold text-stone-900">{detailNote.patientNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold uppercase">Tanggal Kunjungan / Kontrol:</span>
                <span className="font-semibold text-stone-800">{formatIndonesianDate(detailNote.visitDate)}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block font-semibold uppercase">Tindakan Terapi:</span>
                <span className="font-semibold text-emerald-800">{detailNote.therapyName}</span>
              </div>
              {detailNote.bookingCode && (
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold uppercase">Kode Booking:</span>
                  <span className="font-mono font-semibold text-stone-800">{detailNote.bookingCode}</span>
                </div>
              )}
              {detailNote.patientPhone && (
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold uppercase">Kontak Telepon:</span>
                  <span className="font-medium text-stone-800">{detailNote.patientPhone}</span>
                </div>
              )}
            </div>

            {/* Tanda Vital Box */}
            {detailNote.vitalSigns && (
              <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 text-xs space-y-2">
                <span className="font-bold text-blue-900 flex items-center gap-1.5 uppercase text-[11px]">
                  <Activity className="w-4 h-4 text-blue-700" />
                  Pengukuran Tanda-Tanda Vital & Skala Nyeri
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-blue-950 font-semibold">
                  <div className="p-2 bg-white/80 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-600 block">Tekanan Darah:</span>
                    <span>{detailNote.vitalSigns.bloodPressure || '-'}</span>
                  </div>
                  <div className="p-2 bg-white/80 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-600 block">Nadi:</span>
                    <span>{detailNote.vitalSigns.pulseRate || '-'}</span>
                  </div>
                  <div className="p-2 bg-white/80 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-600 block">Laju Napas:</span>
                    <span>{detailNote.vitalSigns.respiratoryRate || '-'}</span>
                  </div>
                  <div className="p-2 bg-white/80 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-600 block">Skala Nyeri (NRS):</span>
                    <span>{detailNote.vitalSigns.painScale !== undefined ? `${detailNote.vitalSigns.painScale}/10` : '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* SOAP Detailed Columns */}
            <div className="space-y-3.5 text-xs">
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 space-y-1">
                <h5 className="font-bold text-amber-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  1. Keluhan Utama (Subjective)
                </h5>
                <p className="text-stone-800 leading-relaxed font-medium pl-5">{detailNote.chiefComplaint}</p>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/70 space-y-1">
                <h5 className="font-bold text-blue-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-700" />
                  2. Hasil Pengkajian & Asesmen Klinis (Objective & Assessment)
                </h5>
                <p className="text-stone-800 leading-relaxed font-medium pl-5">{detailNote.assessment}</p>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/70 space-y-1">
                <h5 className="font-bold text-emerald-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  3. Intervensi Keperawatan yang Diberikan (Plan & Implementation)
                </h5>
                <p className="text-stone-800 leading-relaxed font-medium pl-5 whitespace-pre-line">{detailNote.intervention}</p>
              </div>

              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200/70 space-y-1">
                <h5 className="font-bold text-purple-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-purple-700" />
                  4. Catatan Perkembangan & Tindak Lanjut Medis (Evaluation & Follow-Up)
                </h5>
                <p className="text-stone-800 leading-relaxed font-medium pl-5 whitespace-pre-line">{detailNote.progressFollowUp}</p>
              </div>
            </div>

            {/* Signature & Officer Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pt-4 border-t border-stone-200 text-xs">
              <div className="text-[11px] text-stone-500">
                <span>Status Dokumen: <strong className="text-emerald-700">Tervalidasi & Terarsip</strong></span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 block uppercase">Perawat Penanggung Jawab:</span>
                <span className="font-bold text-stone-900 text-sm block mt-0.5">{detailNote.nurseName}</span>
                <span className="text-[10px] text-stone-500">Klinik Keperawatan Holistik</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailNote(null)}
                className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Catatan */}
      {noteToDelete && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp border border-stone-200">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-stone-900 text-base">
                  Hapus Catatan Perkembangan Pasien?
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                  Apakah Anda yakin ingin menghapus catatan kunjungan klinis ini? Tindakan ini akan menghapus rekaman riwayat SOAP pasien secara permanen.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between border-b border-stone-200/80 pb-1.5">
                <span className="text-stone-500">Nama Pasien:</span>
                <span className="font-bold text-stone-900">{noteToDelete.patientName}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/80 pb-1.5">
                <span className="text-stone-500">Tanggal Kunjungan:</span>
                <span className="font-medium text-stone-800">{formatIndonesianDate(noteToDelete.visitDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Jenis Terapi:</span>
                <span className="font-semibold text-emerald-800">{noteToDelete.therapyName}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteNote}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Catatan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
