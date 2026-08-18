import { Appointment, Therapy, Video, UserProfile, LocationItem, ClinicalProgressNote } from '../types';
import { INITIAL_APPOINTMENTS, INITIAL_LOCATIONS, INITIAL_THERAPIES, INITIAL_USER, INITIAL_VIDEOS, INITIAL_PROGRESS_NOTES } from '../data/mockData';

const STORAGE_KEYS = {
  APPOINTMENTS: 'hnc_appointments_v1',
  THERAPIES: 'hnc_therapies_v1',
  VIDEOS: 'hnc_videos_v1',
  USER: 'hnc_user_profile_v1',
  REGISTERED_PATIENTS: 'hnc_registered_patients_v1',
  LOCATIONS: 'hnc_locations_v1',
  ONBOARDED: 'hnc_onboarded_flag',
  PROGRESS_NOTES: 'hnc_progress_notes_v1'
};

export const getStoredAppointments = (): Appointment[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load appointments from localStorage', e);
  }
  return INITIAL_APPOINTMENTS;
};

export const saveAppointments = (appointments: Appointment[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  } catch (e) {
    console.error('Failed to save appointments', e);
  }
};

export const isAppointmentForUser = (appointment: Appointment | null | undefined, user: UserProfile | null | undefined): boolean => {
  if (!appointment || !user) return false;

  // Strict check by user ID
  if (appointment.userId && user.id && appointment.userId === user.id) {
    return true;
  }

  // Strict check by email
  if (
    appointment.userEmail &&
    user.email &&
    appointment.userEmail.trim().toLowerCase() === user.email.trim().toLowerCase()
  ) {
    return true;
  }

  // Strict check by Patient Registration Number
  if (
    appointment.patientNumber &&
    user.patientNumber &&
    appointment.patientNumber.trim().toLowerCase() === user.patientNumber.trim().toLowerCase()
  ) {
    return true;
  }

  return false;
};

export const filterUserAppointments = (appointments: Appointment[], user: UserProfile): Appointment[] => {
  if (!user || !Array.isArray(appointments)) return [];
  return appointments.filter(app => isAppointmentForUser(app, user));
};

export const getRegisteredPatients = (): UserProfile[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_PATIENTS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load registered patients', e);
  }
  return [INITIAL_USER];
};

export const saveRegisteredPatient = (patient: UserProfile): UserProfile => {
  try {
    const patients = getRegisteredPatients();
    const existingIndex = patients.findIndex(
      p => (patient.id && p.id === patient.id) || (p.email && patient.email && p.email.toLowerCase() === patient.email.toLowerCase())
    );

    let updatedList: UserProfile[];
    if (existingIndex >= 0) {
      updatedList = [...patients];
      updatedList[existingIndex] = { ...patients[existingIndex], ...patient };
    } else {
      updatedList = [...patients, patient];
    }
    localStorage.setItem(STORAGE_KEYS.REGISTERED_PATIENTS, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Failed to save registered patient', e);
  }
  return patient;
};

export const removeRegisteredPatient = (patientIdOrEmail: string): UserProfile[] => {
  try {
    const patients = getRegisteredPatients();
    const target = patientIdOrEmail.toLowerCase();
    const updatedList = patients.filter(
      p => p.id !== patientIdOrEmail && (!p.email || p.email.toLowerCase() !== target)
    );
    localStorage.setItem(STORAGE_KEYS.REGISTERED_PATIENTS, JSON.stringify(updatedList));
    return updatedList;
  } catch (e) {
    console.error('Failed to remove registered patient', e);
    return [];
  }
};

export const createGuestPatient = (): UserProfile => {
  return {
    id: `guest_${Date.now()}`,
    name: 'Pengunjung / Pasien Tamu',
    patientNumber: generatePatientNumber(),
    phone: '',
    email: '',
    address: 'Belum Diisi / Silakan Login',
    emergencyContact: '-',
    medicalNotes: 'Belum Ada Data (Masuk ke akun Anda untuk melihat rekam medis)',
    joinedDate: new Date().toISOString().split('T')[0],
    isGuest: true
  };
};

export const getStoredUser = (): UserProfile => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed) {
        // If it's a guest user with old/test placeholder names, normalize to clean guest profile
        if (parsed.isGuest || !parsed.email) {
          return {
            ...createGuestPatient(),
            ...parsed,
            name: (parsed.name && !parsed.name.includes('ss') && parsed.name !== 'Tamu / Pasien Baru') ? parsed.name : 'Pengunjung / Pasien Tamu',
            address: parsed.address || 'Belum Diisi / Silakan Login',
            emergencyContact: parsed.emergencyContact || '-',
            medicalNotes: parsed.medicalNotes || 'Belum Ada Data (Masuk ke akun Anda untuk melihat rekam medis)',
            isGuest: true
          };
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load user', e);
  }
  return createGuestPatient();
};

export const saveUser = (user: UserProfile) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (!user.isGuest) {
      saveRegisteredPatient(user);
    }
  } catch (e) {
    console.error('Failed to save user', e);
  }
};

export const clearUserSession = (): UserProfile => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch (e) {
    console.error('Failed to clear user session', e);
  }
  return createGuestPatient();
};

export const verifyPatientPassword = (patient: UserProfile, inputPassword: string): boolean => {
  if (!patient.password || patient.password.trim() === '') {
    // If account doesn't have a password yet, accept default 1234 or any non-empty
    return inputPassword.trim() === '1234' || inputPassword.trim().length > 0;
  }
  return patient.password.trim() === inputPassword.trim();
};

export const generatePatientNumber = (): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `RM-HNC-${randomNum}`;
};

export const getStoredTherapies = (): Therapy[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.THERAPIES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: Therapy) => {
          const initial = INITIAL_THERAPIES.find((it) => it.id === item.id);
          return initial
            ? {
                ...initial,
                ...item,
                image: item.id === 'dry-cupping' ? initial.image : item.image || initial.image,
                scheduleNote: initial.scheduleNote,
                allowedDays: initial.allowedDays
              }
            : item;
        });
      }
    }
  } catch (e) {
    console.error('Failed to load therapies', e);
  }
  return INITIAL_THERAPIES;
};

export const saveTherapies = (therapies: Therapy[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.THERAPIES, JSON.stringify(therapies));
  } catch (e) {
    console.error('Failed to save therapies', e);
  }
};

export const getStoredVideos = (): Video[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VIDEOS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load videos', e);
  }
  return INITIAL_VIDEOS;
};

export const saveVideos = (videos: Video[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
  } catch (e) {
    console.error('Failed to save videos', e);
  }
};

export const getStoredLocations = (): LocationItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load locations', e);
  }
  return INITIAL_LOCATIONS;
};

export const hasSeenOnboarding = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
  } catch (e) {
    return false;
  }
};

export const setOnboardingSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
  } catch (e) {
    console.error('Failed to set onboarding', e);
  }
};

export const generateBookingCode = (): string => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `HNC-${year}-${randomNum}`;
};

export const getIndonesianDayName = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const dayIndex = date.getDay(); // 0 is Sunday
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[dayIndex] || '';
};

export const formatIndonesianDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const getStoredProgressNotes = (): ClinicalProgressNote[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS_NOTES);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load progress notes from localStorage', e);
  }
  return INITIAL_PROGRESS_NOTES;
};

export const saveProgressNotes = (notes: ClinicalProgressNote[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS_NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save progress notes', e);
  }
};

export const filterProgressNotesForUser = (
  notes: ClinicalProgressNote[],
  user: UserProfile,
  userAppointments?: Appointment[]
): ClinicalProgressNote[] => {
  if (!user || !Array.isArray(notes)) return [];

  const cleanUserPhone = (user.phone || '').replace(/\D/g, '');
  const normalizedUserName = (user.name || '').trim().toLowerCase();
  const userBookingCodes = new Set<string>();
  const userAppIds = new Set<string>();

  if (Array.isArray(userAppointments)) {
    userAppointments.forEach((a) => {
      if (a.bookingCode) userBookingCodes.add(a.bookingCode.trim().toUpperCase());
      if (a.id) userAppIds.add(a.id);
    });
  }

  const matched = notes.filter((n) => {
    // 1. Direct ID match
    if (n.patientId && user.id && n.patientId === user.id) return true;

    // 2. Patient Number (Nomor Rekam Medis) match
    if (
      n.patientNumber &&
      user.patientNumber &&
      n.patientNumber.trim().toLowerCase() === user.patientNumber.trim().toLowerCase()
    ) {
      return true;
    }

    // 3. Email match
    if (
      n.patientEmail &&
      user.email &&
      n.patientEmail.trim().toLowerCase() === user.email.trim().toLowerCase()
    ) {
      return true;
    }

    // 4. Normalized Phone match
    if (n.patientPhone && cleanUserPhone.length >= 7) {
      const cleanNotePhone = n.patientPhone.replace(/\D/g, '');
      if (
        cleanNotePhone.length >= 7 &&
        (cleanNotePhone === cleanUserPhone ||
          cleanNotePhone.endsWith(cleanUserPhone) ||
          cleanUserPhone.endsWith(cleanNotePhone))
      ) {
        return true;
      }
    }

    // 5. Normalized Patient Name exact match
    if (
      n.patientName &&
      normalizedUserName &&
      n.patientName.trim().toLowerCase() === normalizedUserName
    ) {
      return true;
    }

    // 6. Booking Code or Appointment ID cross-check
    if (n.bookingCode && userBookingCodes.has(n.bookingCode.trim().toUpperCase())) {
      return true;
    }
    if (n.appointmentId && userAppIds.has(n.appointmentId)) {
      return true;
    }

    return false;
  });

  // Sort newest visit date first
  return matched.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
};

