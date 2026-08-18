/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { SafetyModal } from './components/SafetyModal';
import { TherapyDetailModal } from './components/TherapyDetailModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { BookingModal } from './components/BookingModal';
import { AppointmentDetailModal } from './components/AppointmentDetailModal';
import { NakesLoginModal } from './components/NakesLoginModal';
import { PatientAuthModal } from './components/PatientAuthModal';
import { GmailHubModal } from './components/GmailHubModal';
import { GoogleDriveHubModal } from './components/GoogleDriveHubModal';

import { HomeView } from './views/HomeView';
import { TherapyListView } from './views/TherapyListView';
import { VideoListView } from './views/VideoListView';
import { MyAppointmentsView } from './views/MyAppointmentsView';
import { ProfileView } from './views/ProfileView';
import { AdminDashboardView } from './views/AdminDashboardView';

import { ActiveTab, Therapy, Video, Appointment, UserProfile, AppointmentStatus, ClinicalProgressNote } from './types';
import { initAuth, logoutGoogle, getAccessToken } from './services/firebaseAuth';
import {
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  subscribeUserProfile,
  saveAppointmentToFirestore,
  subscribeAppointments,
  saveProgressNoteToFirestore,
  deleteProgressNoteFromFirestore,
  subscribeProgressNotes
} from './services/firebaseFirestore';
import { appendAppointmentToSheet, triggerRealtimeSheetSync } from './services/googleSheets';
import {
  getStoredAppointments,
  saveAppointments,
  getStoredTherapies,
  saveTherapies,
  getStoredVideos,
  saveVideos,
  getStoredUser,
  saveUser,
  getStoredLocations,
  hasSeenOnboarding,
  setOnboardingSeen,
  filterUserAppointments,
  clearUserSession,
  createGuestPatient,
  getStoredProgressNotes,
  saveProgressNotes,
  generatePatientNumber
} from './utils/storage';

export default function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('hnc_nakes_authenticated') === 'true';
  });
  const [showNakesLoginModal, setShowNakesLoginModal] = useState<boolean>(false);

  // Google OAuth & Sheets State
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('hnc_google_access_token') : null;
  });

  // Core Data States
  const [therapies, setTherapies] = useState<Therapy[]>(getStoredTherapies);
  const [videos, setVideos] = useState<Video[]>(getStoredVideos);
  const [appointments, setAppointments] = useState<Appointment[]>(getStoredAppointments);
  const [progressNotes, setProgressNotes] = useState<ClinicalProgressNote[]>(getStoredProgressNotes);
  const [user, setUser] = useState<UserProfile>(getStoredUser);
  const locations = getStoredLocations();

  // Modals
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [selectedTherapyForDetail, setSelectedTherapyForDetail] = useState<Therapy | null>(null);
  const [selectedVideoForPlayer, setSelectedVideoForPlayer] = useState<Video | null>(null);
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [showPatientAuthModal, setShowPatientAuthModal] = useState<boolean>(false);
  const [patientAuthPromptReason, setPatientAuthPromptReason] = useState<string | null>(null);
  const [pendingBookingTherapy, setPendingBookingTherapy] = useState<Therapy | null>(null);
  const [preSelectedTherapyForBooking, setPreSelectedTherapyForBooking] = useState<Therapy | null>(null);
  const [selectedAppointmentForDetail, setSelectedAppointmentForDetail] = useState<Appointment | null>(null);
  const [showGmailModal, setShowGmailModal] = useState<boolean>(false);
  const [showDriveModal, setShowDriveModal] = useState<boolean>(false);

  // Nakes Mode authentication handlers
  const handleRequestNakesAccess = () => {
    const isAuthenticated = localStorage.getItem('hnc_nakes_authenticated') === 'true';
    if (isAuthenticated) {
      handleNakesLoginSuccess();
    } else {
      setShowNakesLoginModal(true);
    }
  };

  const handleNakesLoginSuccess = async () => {
    // 1. Reset sesi pasien saat Nakes login
    try {
      await logoutGoogle();
    } catch (e) {
      console.warn('Google logout during Nakes login:', e);
    }
    setGoogleUser(null);
    setAccessToken(null);
    const guestUser = clearUserSession();
    setUser(guestUser);
    setSelectedAppointmentForDetail(null);
    setShowBookingModal(false);
    setPendingBookingTherapy(null);
    setPreSelectedTherapyForBooking(null);
    setPatientAuthPromptReason(null);

    // 2. Aktifkan Mode Nakes & alihkan ke tab Admin
    setIsAdmin(true);
    setActiveTab('admin');
  };

  const handleExitNakesMode = async () => {
    // 1. Hapus token otentikasi Nakes
    localStorage.removeItem('hnc_nakes_authenticated');
    localStorage.removeItem('hnc_nakes_user');
    setIsAdmin(false);

    // 2. Bersihkan sesi dan kembalikan ke status Tamu
    try {
      await logoutGoogle();
    } catch (e) {
      console.warn('Google logout during Nakes exit:', e);
    }
    setGoogleUser(null);
    setAccessToken(null);
    const guestUser = clearUserSession();
    setUser(guestUser);
    setSelectedAppointmentForDetail(null);
    setShowBookingModal(false);
    setPendingBookingTherapy(null);
    setPreSelectedTherapyForBooking(null);

    // 3. Kembalikan ke halaman utama & buka form Login / Masuk Akun Pasien
    setActiveTab('home');
    setPatientAuthPromptReason('Anda telah keluar dari Mode Tenaga Kesehatan. Silakan masuk ke akun Pasien atau lanjutkan sebagai Tamu.');
    setShowPatientAuthModal(true);
  };

  // Check onboarding and Firebase auth on mount
  useEffect(() => {
    if (!hasSeenOnboarding()) {
      setShowOnboarding(true);
    }

    const unsubscribe = initAuth(
      async (authUser, token) => {
        setGoogleUser(authUser);
        if (token) setAccessToken(token);

        // Fetch or sync user profile from Firestore if authenticated
        if (authUser && authUser.uid) {
          try {
            const firestoreProfile = await getUserProfileFromFirestore(authUser.uid);
            if (firestoreProfile) {
              setUser(firestoreProfile);
              saveUser(firestoreProfile);
            }
          } catch (err) {
            console.warn('Could not fetch user profile on initAuth:', err);
          }
        }
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore listeners for Appointments and Clinical Progress Notes
  useEffect(() => {
    const unsubAppointments = subscribeAppointments(user, isAdmin, (remoteAppointments) => {
      if (remoteAppointments && remoteAppointments.length > 0) {
        setAppointments((prev) => {
          // Merge remote appointments with local to avoid losing offline un-synced items
          const map = new Map<string, Appointment>();
          remoteAppointments.forEach((item) => map.set(item.id, item));
          prev.forEach((item) => {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          saveAppointments(merged);
          return merged;
        });
      }
    });

    const unsubNotes = subscribeProgressNotes(user, isAdmin, (remoteNotes) => {
      if (remoteNotes && remoteNotes.length > 0) {
        setProgressNotes((prev) => {
          const map = new Map<string, ClinicalProgressNote>();
          remoteNotes.forEach((item) => map.set(item.id, item));
          prev.forEach((item) => {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
          );
          saveProgressNotes(merged);
          return merged;
        });
      }
    });

    // Real-time listener for current user profile changes in Firestore
    let unsubProfile: (() => void) | undefined;
    if (user && user.id && !user.isGuest) {
      unsubProfile = subscribeUserProfile(user.id, (updatedProfile) => {
        if (updatedProfile) {
          setUser(updatedProfile);
          saveUser(updatedProfile);
        }
      });
    }

    return () => {
      unsubAppointments();
      unsubNotes();
      if (unsubProfile) unsubProfile();
    };
  }, [user.id, user.email, isAdmin]);

  const handleGoogleAuthSuccess = (u: any, token: string) => {
    setGoogleUser(u);
    setAccessToken(token);
    // Sinkronkan seluruh data secara otomatis dan instan saat berhasil otorisasi Google
    triggerRealtimeSheetSync(token, appointments, 100);
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setAccessToken(null);
  };

  const handlePatientLogout = async () => {
    try {
      await logoutGoogle();
    } catch (e) {
      console.warn('Google logout warning:', e);
    }
    setGoogleUser(null);
    setAccessToken(null);
    const guestUser = clearUserSession();
    setUser(guestUser);
    setSelectedAppointmentForDetail(null);
    setShowBookingModal(false);
    setPreSelectedTherapyForBooking(null);
  };

  // Sync state changes with local storage, Firestore & Google Sheets
  const handleAppointmentsChange = (updated: Appointment[]) => {
    setAppointments(updated);
    saveAppointments(updated);

    // Otomatis tersinkronisasi real-time ke Google Spreadsheet jika token tersedia
    const activeToken =
      accessToken ||
      (typeof window !== 'undefined' ? localStorage.getItem('hnc_google_access_token') : null);
    if (activeToken) {
      triggerRealtimeSheetSync(activeToken, updated, 250);
    }
  };

  const handleTherapiesChange = (updated: Therapy[]) => {
    setTherapies(updated);
    saveTherapies(updated);
  };

  const handleVideosChange = (updated: Video[]) => {
    setVideos(updated);
    saveVideos(updated);
  };

  const handleUserChange = async (updated: UserProfile) => {
    setUser(updated);
    saveUser(updated);

    // Persist to Cloud Firestore if registered user
    if (!updated.isGuest && updated.id) {
      try {
        await saveUserProfileToFirestore(updated);
      } catch (err) {
        console.warn('Failed to update user profile in Firestore:', err);
      }
    }

    // Reset selected states so previous session/patient data is not retained
    setSelectedAppointmentForDetail(null);
    setPatientAuthPromptReason(null);

    // If patient was attempting to book before authenticating, smoothly resume booking
    if (pendingBookingTherapy !== null) {
      const therapyToBook = pendingBookingTherapy;
      setPendingBookingTherapy(null);
      setPreSelectedTherapyForBooking(therapyToBook);
      setShowBookingModal(true);
    } else {
      setShowBookingModal(false);
      setPreSelectedTherapyForBooking(null);
    }
  };

  // Close Onboarding and remember
  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingSeen();
  };

  // Open booking with optional pre-selected therapy (strictly requires logged in patient)
  const handleOpenBooking = (therapy?: Therapy) => {
    // If current patient is guest or has no email/unauthenticated
    if (!user || user.isGuest || !user.email) {
      setPendingBookingTherapy(therapy || null);
      setPatientAuthPromptReason('Silakan masuk (login) atau daftar akun pasien terlebih dahulu untuk melakukan reservasi.');
      setShowPatientAuthModal(true);
      return;
    }
    setPreSelectedTherapyForBooking(therapy || null);
    setShowBookingModal(true);
  };

  // Add new appointment from booking modal
  const handleBookingSuccess = async (newAppointment: Appointment) => {
    const updated = [newAppointment, ...appointments];
    handleAppointmentsChange(updated);

    // 1. Simpan permanen ke Cloud Firestore
    try {
      await saveAppointmentToFirestore(newAppointment);
    } catch (err) {
      console.warn('Failed saving appointment to Firestore:', err);
    }

    // 2. Otomatis langsung append ke Google Sheets terhubung jika token tersedia
    const activeToken = accessToken || (await getAccessToken()) || localStorage.getItem('hnc_google_access_token');
    if (activeToken) {
      try {
        await appendAppointmentToSheet(activeToken, newAppointment);
      } catch (err) {
        console.warn('Auto append to Google Sheet in App:', err);
      }
    }
  };

  // Cancel appointment with reason
  const handleCancelAppointment = async (id: string, reason: string) => {
    let cancelledApp: Appointment | undefined;
    const updated = appointments.map((app) => {
      if (app.id === id) {
        cancelledApp = {
          ...app,
          status: 'Dibatalkan' as AppointmentStatus,
          cancelledReason: reason
        };
        return cancelledApp;
      }
      return app;
    });
    handleAppointmentsChange(updated);
    if (selectedAppointmentForDetail && selectedAppointmentForDetail.id === id) {
      setSelectedAppointmentForDetail({
        ...selectedAppointmentForDetail,
        status: 'Dibatalkan',
        cancelledReason: reason
      });
    }

    // Update in Cloud Firestore
    if (cancelledApp) {
      try {
        await saveAppointmentToFirestore(cancelledApp);
      } catch (err) {
        console.warn('Failed to update cancelled appointment in Firestore:', err);
      }
    }
  };

  // Update appointment status from Admin console
  const handleUpdateAppointmentStatus = async (id: string, newStatus: AppointmentStatus) => {
    let updatedItem: Appointment | undefined;
    const updated = appointments.map((app) => {
      if (app.id === id) {
        updatedItem = { ...app, status: newStatus };
        return updatedItem;
      }
      return app;
    });
    handleAppointmentsChange(updated);

    // Sync to Cloud Firestore
    if (updatedItem) {
      try {
        await saveAppointmentToFirestore(updatedItem);
      } catch (err) {
        console.warn('Failed to update appointment status in Firestore:', err);
      }
    }
  };

  // Admin Delete Appointment with automatic Google Sheets & Firestore re-sync
  const handleDeleteAppointment = (id: string) => {
    const updated = appointments.filter((app) => app.id !== id);
    handleAppointmentsChange(updated);
    if (selectedAppointmentForDetail && selectedAppointmentForDetail.id === id) {
      setSelectedAppointmentForDetail(null);
    }
  };

  // Admin Add, Update & Delete Therapies
  const handleAddTherapy = (newTherapy: Therapy) => {
    const updated = [newTherapy, ...therapies];
    handleTherapiesChange(updated);
  };

  const handleUpdateTherapy = (updatedTherapy: Therapy) => {
    const updated = therapies.map((t) => (t.id === updatedTherapy.id ? updatedTherapy : t));
    handleTherapiesChange(updated);
  };

  const handleDeleteTherapy = (id: string) => {
    const updated = therapies.filter((t) => t.id !== id);
    handleTherapiesChange(updated);
  };

  // Admin Add, Update & Delete Videos
  const handleAddVideo = (newVideo: Video) => {
    const updated = [newVideo, ...videos];
    handleVideosChange(updated);
  };

  const handleUpdateVideo = (updatedVideo: Video) => {
    const updated = videos.map((v) => (v.id === updatedVideo.id ? updatedVideo : v));
    handleVideosChange(updated);
  };

  const handleDeleteVideo = (id: string) => {
    const updated = videos.filter((v) => v.id !== id);
    handleVideosChange(updated);
  };

  // Clinical Progress Notes (SOAP) Handlers
  const handleAddProgressNote = async (newNote: ClinicalProgressNote) => {
    const updated = [newNote, ...progressNotes];
    setProgressNotes(updated);
    saveProgressNotes(updated);

    // Save to Cloud Firestore permanently
    try {
      await saveProgressNoteToFirestore(newNote);
    } catch (err) {
      console.warn('Failed to save progress note to Firestore:', err);
    }
  };

  const handleUpdateProgressNote = async (updatedNote: ClinicalProgressNote) => {
    const updated = progressNotes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    setProgressNotes(updated);
    saveProgressNotes(updated);

    // Update in Cloud Firestore
    try {
      await saveProgressNoteToFirestore(updatedNote);
    } catch (err) {
      console.warn('Failed to update progress note in Firestore:', err);
    }
  };

  const handleDeleteProgressNote = async (id: string) => {
    const updated = progressNotes.filter((n) => n.id !== id);
    setProgressNotes(updated);
    saveProgressNotes(updated);

    // Delete in Cloud Firestore
    try {
      await deleteProgressNoteFromFirestore(id);
    } catch (err) {
      console.warn('Failed to delete progress note from Firestore:', err);
    }
  };

  // Active appointments counter for badges (scoped strictly to current active patient, or all for admin)
  const activeAppointmentsCount = useMemo(() => {
    const list = isAdmin ? appointments : filterUserAppointments(appointments, user);
    return list.filter(
      (a) => a.status === 'Terjadwal' || a.status === 'Menunggu'
    ).length;
  }, [appointments, isAdmin, user]);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900 text-stone-800">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSafety={() => setShowSafetyModal(true)}
        isAdmin={isAdmin}
        onRequestNakesAccess={handleRequestNakesAccess}
        onExitNakesMode={handleExitNakesMode}
        pendingAppointmentsCount={activeAppointmentsCount}
        currentUser={user}
        onOpenPatientAuth={() => setShowPatientAuthModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-6 pb-24 md:pb-20">
        {activeTab === 'home' && (
          <HomeView
            therapies={therapies}
            onOpenDetail={(th) => setSelectedTherapyForDetail(th)}
            onOpenBooking={handleOpenBooking}
            setActiveTab={setActiveTab}
            onOpenSafety={() => setShowSafetyModal(true)}
            upcomingAppointments={filterUserAppointments(appointments, user)}
          />
        )}

        {activeTab === 'therapies' && (
          <TherapyListView
            therapies={therapies}
            onOpenDetail={(th) => setSelectedTherapyForDetail(th)}
            onOpenBooking={(th) => handleOpenBooking(th)}
          />
        )}

        {activeTab === 'videos' && (
          <VideoListView
            videos={videos}
            onSelectVideo={(vid) => setSelectedVideoForPlayer(vid)}
          />
        )}

        {activeTab === 'appointments' && (
          <MyAppointmentsView
            appointments={appointments}
            currentUser={user}
            onOpenBooking={() => handleOpenBooking()}
            onViewDetail={(app) => setSelectedAppointmentForDetail(app)}
            onCancelAppointment={handleCancelAppointment}
            onOpenPatientAuth={() => setShowPatientAuthModal(true)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            onUpdateUser={handleUserChange}
            appointments={appointments}
            progressNotes={progressNotes}
            setActiveTab={setActiveTab}
            onOpenSafety={() => setShowSafetyModal(true)}
            isAdmin={isAdmin}
            onRequestNakesAccess={handleRequestNakesAccess}
            onExitNakesMode={handleExitNakesMode}
            onOpenPatientAuth={(reason) => {
              if (reason) setPatientAuthPromptReason(reason);
              setShowPatientAuthModal(true);
            }}
            onLogoutPatient={handlePatientLogout}
            onOpenGmailHub={() => setShowGmailModal(true)}
            onOpenDriveHub={() => setShowDriveModal(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboardView
            appointments={appointments}
            therapies={therapies}
            videos={videos}
            progressNotes={progressNotes}
            googleUser={googleUser}
            accessToken={accessToken}
            onGoogleAuthSuccess={handleGoogleAuthSuccess}
            onGoogleLogout={handleGoogleLogout}
            onExitNakesMode={handleExitNakesMode}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onDeleteAppointment={handleDeleteAppointment}
            onAddTherapy={handleAddTherapy}
            onUpdateTherapy={handleUpdateTherapy}
            onDeleteTherapy={handleDeleteTherapy}
            onAddVideo={handleAddVideo}
            onUpdateVideo={handleUpdateVideo}
            onDeleteVideo={handleDeleteVideo}
            onAddProgressNote={handleAddProgressNote}
            onUpdateProgressNote={handleUpdateProgressNote}
            onDeleteProgressNote={handleDeleteProgressNote}
            onOpenGmailModal={() => setShowGmailModal(true)}
            onOpenDriveModal={() => setShowDriveModal(true)}
          />
        )}
      </main>

      {/* Persistent Bottom Bar Navigation (Mobile) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={activeAppointmentsCount}
        isAdmin={isAdmin}
      />

      {/* MODALS */}
      {/* 1. Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
      />

      {/* 2. Safety Guidelines Modal */}
      <SafetyModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
      />

      {/* 3. Therapy Detail Modal */}
      <TherapyDetailModal
        therapy={selectedTherapyForDetail}
        onClose={() => setSelectedTherapyForDetail(null)}
        onBookNow={(th) => {
          setSelectedTherapyForDetail(null);
          handleOpenBooking(th);
        }}
        onOpenSafety={() => {
          setSelectedTherapyForDetail(null);
          setShowSafetyModal(true);
        }}
      />

      {/* 4. Video Player Modal */}
      <VideoPlayerModal
        video={selectedVideoForPlayer}
        onClose={() => setSelectedVideoForPlayer(null)}
      />

      {/* 5. Booking Modal (Requires logged in user profile) */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setPreSelectedTherapyForBooking(null);
        }}
        therapies={therapies}
        locations={locations}
        currentUser={user}
        onBookingSuccess={handleBookingSuccess}
        initialTherapy={preSelectedTherapyForBooking}
      />

      {/* 6. Appointment Detail & Ticket Modal */}
      <AppointmentDetailModal
        appointment={selectedAppointmentForDetail}
        onClose={() => setSelectedAppointmentForDetail(null)}
        onCancelAppointment={handleCancelAppointment}
        currentUser={user}
        isAdmin={isAdmin}
        googleAccessToken={accessToken}
      />

      {/* 7. Tenaga Kesehatan (Nakes) Login Modal */}
      <NakesLoginModal
        isOpen={showNakesLoginModal}
        onClose={() => setShowNakesLoginModal(false)}
        onLoginSuccess={handleNakesLoginSuccess}
        onGoogleAuthSuccess={handleGoogleAuthSuccess}
      />

      {/* 8. Patient Account / Authentication Modal */}
      <PatientAuthModal
        isOpen={showPatientAuthModal}
        onClose={() => {
          setShowPatientAuthModal(false);
          setPatientAuthPromptReason(null);
        }}
        currentUser={user}
        onPatientAuthSuccess={handleUserChange}
        onGoogleAuthSuccess={handleGoogleAuthSuccess}
        onLogout={handlePatientLogout}
        authPromptReason={patientAuthPromptReason}
      />

      {/* 9. Gmail Hub Modal */}
      <GmailHubModal
        isOpen={showGmailModal}
        onClose={() => setShowGmailModal(false)}
        googleAccessToken={accessToken}
        currentUser={user}
        onRequireGoogleAuth={handleGoogleAuthSuccess}
      />

      {/* 10. Google Drive Cloud Hub Modal */}
      <GoogleDriveHubModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        googleAccessToken={accessToken}
        currentUser={user}
        appointments={appointments}
        progressNotes={progressNotes}
        therapies={therapies}
        onRequireGoogleAuth={handleGoogleAuthSuccess}
      />
    </div>
  );
}
