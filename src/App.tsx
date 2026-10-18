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
import { supabase } from './supabaseClient';
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

  // Load appointments from Supabase on mount
  useEffect(() => {
    const fetchAppointmentsFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && !error && data.length > 0) {
          const mappedAppointments: Appointment[] = data.map((item: any) => ({
            id: item.id ? item.id.toString() : 'app-' + Date.now(),
            bookingCode: item.kode_booking || 'HNC-2026-0000',
            userId: item.user_id || 'user-guest',
            userName: item.nama_pasien || 'Pasien',
            userEmail: item.email || '',
            userPhone: item.no_hp || item.phone || '0812-3456-7890',
            patientNumber: item.no_rm || 'HNC-PASIEN-001',
            therapyId: 'therapy-1',
            therapyName: item.terapi || 'Head Massage',
            locationId: 'undip-nursing',
            locationName: item.lokasi || 'Departemen Ilmu Keperawatan Universitas Diponegoro',
            date: item.tanggal || new Date().toISOString().split('T')[0],
            dayName: item.hari || 'Senin',
            timeSlot: item.waktu || '09:00 WIB',
            notes: item.catatan || '',
            status: item.status || 'Terjadwal',
            createdAt: item.created_at || new Date().toISOString()
          }));

          setAppointments(mappedAppointments);
          saveAppointments(mappedAppointments);
        }
      } catch (err) {
        console.warn('Gagal mengambil data dari Supabase:', err);
      }
    };

    fetchAppointmentsFromSupabase();
  }, []);

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

    setIsAdmin(true);
    setActiveTab('admin');
  };

  const handleExitNakesMode = async () => {
    localStorage.removeItem('hnc_nakes_authenticated');
    localStorage.removeItem('hnc_nakes_user');
    setIsAdmin(false);

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
    setSelectedAppointmentForDetail(null);
    setPatientAuthPromptReason(null);

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

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingSeen();
  };

  const handleOpenBooking = (therapy?: Therapy) => {
    if (!user || user.isGuest || !user.email) {
      setPendingBookingTherapy(therapy || null);
      setPatientAuthPromptReason('Silakan masuk (login) atau daftar akun pasien terlebih dahulu untuk melakukan reservasi.');
      setShowPatientAuthModal(true);
      return;
    }
    setPreSelectedTherapyForBooking(therapy || null);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = async (newAppointment: Appointment) => {
    const updated = [newAppointment, ...appointments];
    handleAppointmentsChange(updated);

    const activeToken = accessToken || (await getAccessToken()) || localStorage.getItem('hnc_google_access_token');
    if (activeToken) {
      try {
        await appendAppointmentToSheet(activeToken, newAppointment);
      } catch (err) {
        console.warn('Auto append to Google Sheet in App:', err);
      }
    }
  };

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

  const handleUpdateAppointmentStatus = (id: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map((app) => {
      if (app.id === id) {
        return { ...app, status: newStatus };
      }
      return app;
    });
    handleAppointmentsChange(updated);
  };

  const handleDeleteAppointment = (id: string) => {
