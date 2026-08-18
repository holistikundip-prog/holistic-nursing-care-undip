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

import { HomeView } from './views/HomeView';
import { TherapyListView } from './views/TherapyListView';
import { VideoListView } from './views/VideoListView';
import { MyAppointmentsView } from './views/MyAppointmentsView';
import { ProfileView } from './views/ProfileView';
import { AdminDashboardView } from './views/AdminDashboardView';

import { ActiveTab, Therapy, Video, Appointment, UserProfile, AppointmentStatus, ClinicalProgressNote } from './types';
import { initAuth, logoutGoogle, getAccessToken } from './services/firebaseAuth';
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
  saveProgressNotes
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
    // 1. Otomatis bersihkan / reset sesi profil pasien yang sedang login saat Nakes aktif
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

  // Check onboarding and Google auth on mount
  useEffect(() => {
    if (!hasSeenOnboarding()) {
      setShowOnboarding(true);
    }

    const unsubscribe = initAuth(
      (u, token) => {
        setGoogleUser(u);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

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

  // Sync state changes with local storage & real-time auto-sync to Google Sheets
  const handleAppointmentsChange = (updated: Appointment[]) => {
    setAppointments(updated);
    saveAppointments(updated);

    // Otomatis tersinkronisasi real-time ke Google Spreadsheet
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

  const handleUserChange = (updated: UserProfile) => {
    setUser(updated);
    saveUser(updated);
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

    // Otomatis langsung append ke Google Sheets terhubung jika token tersedia
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
  const handleCancelAppointment = (id: string, reason: string) => {
    const updated = appointments.map((app) => {
      if (app.id === id) {
        return {
          ...app,
          status: 'Dibatalkan' as AppointmentStatus,
          cancelledReason: reason
        };
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
  };

  // Update appointment status from Admin console
  const handleUpdateAppointmentStatus = (id: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map((app) => {
      if (app.id === id) {
        return { ...app, status: newStatus };
      }
      return app;
    });
    handleAppointmentsChange(updated);
  };

  // Admin Delete Appointment with automatic Google Sheets re-sync
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
  const handleAddProgressNote = (newNote: ClinicalProgressNote) => {
    const updated = [newNote, ...progressNotes];
    setProgressNotes(updated);
    saveProgressNotes(updated);
  };

  const handleUpdateProgressNote = (updatedNote: ClinicalProgressNote) => {
    const updated = progressNotes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    setProgressNotes(updated);
    saveProgressNotes(updated);
  };

  const handleDeleteProgressNote = (id: string) => {
    const updated = progressNotes.filter((n) => n.id !== id);
    setProgressNotes(updated);
    saveProgressNotes(updated);
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
            onDeleteTherapy={handleDeleteTherapy}
            onAddVideo={handleAddVideo}
            onDeleteVideo={handleDeleteVideo}
            onAddProgressNote={handleAddProgressNote}
            onUpdateProgressNote={handleUpdateProgressNote}
            onDeleteProgressNote={handleDeleteProgressNote}
          />
        )}
      </main>

      {/* Bottom Navigation for Mobile / Tablet */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appointmentsCount={activeAppointmentsCount}
        isAdmin={isAdmin}
      />

      {/* Modals */}
      <PatientAuthModal
        isOpen={showPatientAuthModal}
        onClose={() => {
          setShowPatientAuthModal(false);
          setPatientAuthPromptReason(null);
          setPendingBookingTherapy(null);
        }}
        currentUser={user}
        onPatientAuthSuccess={(updatedPatient) => {
          handleUserChange(updatedPatient);
        }}
        onGoogleAuthSuccess={handleGoogleAuthSuccess}
        onLogout={handlePatientLogout}
        authPromptReason={patientAuthPromptReason}
      />

      <NakesLoginModal
        isOpen={showNakesLoginModal}
        onClose={() => setShowNakesLoginModal(false)}
        onLoginSuccess={handleNakesLoginSuccess}
      />
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
      />

      <SafetyModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
      />

      <TherapyDetailModal
        therapy={selectedTherapyForDetail}
        isOpen={!!selectedTherapyForDetail}
        onClose={() => setSelectedTherapyForDetail(null)}
        onSelectSchedule={(th) => {
          setSelectedTherapyForDetail(null);
          handleOpenBooking(th);
        }}
      />

      <VideoPlayerModal
        video={selectedVideoForPlayer}
        isOpen={!!selectedVideoForPlayer}
        onClose={() => setSelectedVideoForPlayer(null)}
      />

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setPreSelectedTherapyForBooking(null);
        }}
        therapies={therapies}
        locations={locations}
        preSelectedTherapy={preSelectedTherapyForBooking}
        existingAppointments={appointments}
        currentUser={user}
        accessToken={accessToken}
        googleUser={googleUser}
        onAuthSuccess={handleGoogleAuthSuccess}
        onBookingSuccess={handleBookingSuccess}
        onGoToMyAppointments={() => {
          setShowBookingModal(false);
          setActiveTab('appointments');
        }}
        onRequestAuth={() => {
          setPendingBookingTherapy(preSelectedTherapyForBooking || null);
          setPatientAuthPromptReason('Silakan masuk (login) atau daftar akun pasien terlebih dahulu untuk melakukan reservasi.');
          setShowPatientAuthModal(true);
        }}
      />

      <AppointmentDetailModal
        appointment={selectedAppointmentForDetail}
        isOpen={!!selectedAppointmentForDetail}
        onClose={() => setSelectedAppointmentForDetail(null)}
        onCancelAppointment={handleCancelAppointment}
        currentUser={user}
        isAdmin={isAdmin}
      />
    </div>
  );
}
