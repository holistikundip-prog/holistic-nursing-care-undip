import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, ExternalLink, CheckCircle2, RefreshCw, AlertCircle, LogIn, LogOut, Radio, Zap } from 'lucide-react';
import { googleSignIn, logoutGoogle } from '../services/firebaseAuth';
import { syncAllAppointmentsToSheet, SPREADSHEET_URL, DEFAULT_SPREADSHEET_ID } from '../services/googleSheets';
import { Appointment } from '../types';

interface GoogleSheetsCardProps {
  googleUser: any | null;
  accessToken: string | null;
  onAuthSuccess: (user: any, token: string) => void;
  onLogout: () => void;
  appointments: Appointment[];
  compact?: boolean;
}

export const GoogleSheetsCard: React.FC<GoogleSheetsCardProps> = ({
  googleUser,
  accessToken,
  onAuthSuccess,
  onLogout,
  appointments,
  compact = false
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Listen to background real-time sync events
  useEffect(() => {
    const handleSyncEvent = (e: any) => {
      const detail = e?.detail;
      if (detail?.success !== false) {
        setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      } else if (detail?.error) {
        setSyncStatus({
          success: false,
          message: `Sinkronisasi otomatis: ${detail.error}`
        });
      }
    };

    window.addEventListener('hnc_sheet_synced', handleSyncEvent);
    return () => window.removeEventListener('hnc_sheet_synced', handleSyncEvent);
  }, []);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setSyncStatus(null);
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
        setSyncStatus({
          success: true,
          message: 'Berhasil terhubung! Sinkronisasi otomatis & real-time kini aktif.'
        });
        setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      }
    } catch (e: any) {
      setSyncStatus({
        success: false,
        message: e?.message || 'Gagal login dengan Google'
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleManualSync = async () => {
    if (!accessToken) {
      handleSignIn();
      return;
    }

    try {
      setIsSyncing(true);
      setSyncStatus(null);
      const count = await syncAllAppointmentsToSheet(accessToken, appointments);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      setSyncStatus({
        success: true,
        message: `Berhasil menyinkronkan seluruh ${count} data jadwal pasien ke Google Spreadsheet!`
      });
    } catch (e: any) {
      setSyncStatus({
        success: false,
        message: e?.message || 'Gagal menyinkronkan ke Spreadsheet'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (compact) {
    return (
      <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-2xl p-3.5 text-xs text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-emerald-200">Google Sheets:</span>
              {googleUser ? (
                <span className="text-[10px] bg-emerald-700 text-emerald-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-Sync Realtime Aktif
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-semibold">
                  Perlu Otorisasi
                </span>
              )}
            </div>
            <a
              href={SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1 underline mt-0.5"
            >
              <span>Buka Dokumen Spreadsheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {googleUser ? (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 font-semibold px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer text-[11px]"
              title="Sinkronkan Ulang Manual"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Ulang'}</span>
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="bg-white text-stone-900 hover:bg-stone-100 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isSigningIn ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-emerald-200/90 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-stone-900 text-base">
                Sinkronisasi Otomatis & Real-Time Google Spreadsheet
              </h3>
              {googleUser ? (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Real-Time Live Aktif
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                  Belum Terhubung
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Setiap pendaftaran janji temu baru maupun perubahan status tindakan (<strong>Menunggu</strong> ➔ <strong>Terjadwal</strong> ➔ <strong>Selesai</strong> / <strong>Dibatalkan</strong>) secara otomatis langsung tercatat ke Google Spreadsheet pengelola:
            </p>
            <a
              href={SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1.5 mt-1.5 underline bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono text-[11px]">{DEFAULT_SPREADSHEET_ID}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {googleUser ? (
            <button
              onClick={onLogout}
              className="text-stone-500 hover:text-rose-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-stone-200 transition flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Putus Akses</span>
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isSigningIn ? 'Menghubungkan...' : 'Aktifkan Auto-Sync Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            syncStatus.success
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          {syncStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{syncStatus.message}</span>
        </div>
      )}

      {/* Realtime Status Indicator Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 text-xs">
        <div className="flex items-center gap-2 text-stone-600">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Mode Otomatis & Real-Time</span>
          </div>
          <span>Total: <strong className="text-stone-900">{appointments.length} Jadwal</strong></span>
          {lastSyncTime && (
            <span className="text-stone-400 text-[11px] hidden md:inline">
              • Sinkronisasi terakhir: <strong className="text-stone-600">{lastSyncTime}</strong>
            </span>
          )}
        </div>

        {googleUser && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="text-stone-500 hover:text-emerald-800 text-xs font-semibold py-1 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 transition flex items-center gap-1.5 cursor-pointer ml-auto"
            title="Opsional: sinkronkan ulang secara manual jika diperlukan"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-400 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Ulang Manual'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
