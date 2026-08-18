import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Sparkles,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Radio,
  Zap
} from 'lucide-react';
import { Appointment } from '../types';
import { googleSignIn } from '../services/firebaseAuth';
import {
  ensureSpreadsheetHeaders,
  triggerRealtimeSheetSync,
  syncAllAppointmentsToSheet,
  SPREADSHEET_URL
} from '../services/googleSheets';

interface GoogleWorkspaceHubCardProps {
  googleUser: any | null;
  accessToken: string | null;
  onAuthSuccess: (user: any, token: string) => void;
  onLogout: () => void;
  appointments: Appointment[];
}

export const GoogleWorkspaceHubCard: React.FC<GoogleWorkspaceHubCardProps> = ({
  googleUser,
  accessToken,
  onAuthSuccess,
  onLogout,
  appointments
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [spreadsheetUrl] = useState<string>(SPREADSHEET_URL);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Listen to background real-time sync events
  useEffect(() => {
    const handleSyncEvent = (e: any) => {
      const detail = e?.detail;
      if (detail?.success !== false) {
        setLastSyncTime(
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
        );
      } else if (detail?.error) {
        setStatusMessage({
          type: 'error',
          text: `Sinkronisasi otomatis: ${detail.error}`
        });
      }
    };

    window.addEventListener('hnc_sheet_synced', handleSyncEvent);
    return () => window.removeEventListener('hnc_sheet_synced', handleSyncEvent);
  }, []);

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res && res.accessToken) {
        onAuthSuccess(res.user, res.accessToken);
        setStatusMessage({
          type: 'success',
          text: 'Google Workspace (Google Sheets) berhasil terhubung!'
        });
      }
    } catch (err: any) {
      console.error('Google Workspace Connect Error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menghubungkan Google Sheets.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSheets = async () => {
    if (!accessToken) {
      await handleConnectGoogle();
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await ensureSpreadsheetHeaders(accessToken);
      const count = await syncAllAppointmentsToSheet(accessToken, appointments);
      setLastSyncTime(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
      setStatusMessage({
        type: 'success',
        text: `Sinkronisasi Google Sheets berhasil! Total ${count} baris data reservasi pasien telah diperbarui.`
      });
    } catch (err: any) {
      console.error('Sheet sync error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal melakukan sinkronisasi Google Sheets.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-stone-200 space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Google Sheets Integration
              </span>
              <span className="text-[10px] text-stone-400">• Sinkronisasi Tabel Real-Time</span>
            </div>
            <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
              Integrasi Google Sheets (Sinkronisasi Tabel Real-Time)
            </h3>
          </div>
        </div>

        {/* Connect / User status button */}
        {accessToken ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Terhubung ({googleUser?.email || 'Akun Google Nakes'})</span>
            </div>
            <button
              onClick={onLogout}
              className="text-stone-400 hover:text-rose-600 text-xs font-semibold px-2 py-1 transition cursor-pointer"
            >
              Putuskan
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectGoogle}
            disabled={isLoading}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isLoading ? 'Menghubungkan...' : 'Hubungkan Google Sheets'}</span>
          </button>
        )}
      </div>

      {/* Status Feedback */}
      {statusMessage && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Google Sheets Panel */}
      <div className="p-4 sm:p-5 bg-emerald-50/40 border border-emerald-200 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                Live Sync Aktif
              </span>
              {lastSyncTime && (
                <span className="text-[11px] text-stone-500 font-medium">
                  Terakhir diperbarui: <strong>{lastSyncTime}</strong>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-700 leading-relaxed font-normal">
              Setiap kali pasien memesan jadwal, perawat memperbarui status, atau membatalkan sesi, data langsung disinkronkan secara otomatis ke lembar spreadsheet resmi klinik.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-white px-3 py-2 rounded-xl border border-emerald-200 text-center shadow-2xs">
              <span className="text-sm font-black text-emerald-950 block">{appointments.length}</span>
              <span className="text-[10px] text-stone-500">Total Baris</span>
            </div>
            <div className="bg-white px-3 py-2 rounded-xl border border-emerald-200 text-center shadow-2xs">
              <span className="text-sm font-black text-emerald-700 block">
                {appointments.filter(a => a.status === 'Terjadwal').length}
              </span>
              <span className="text-[10px] text-stone-500">Terjadwal</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-emerald-200/70">
          <button
            type="button"
            onClick={handleSyncSheets}
            disabled={isLoading}
            className="w-full sm:w-auto bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-300 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Sedang Menyinkronkan...' : 'Sinkronkan Tabel Sekarang (Manual)'}</span>
          </button>

          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto bg-white hover:bg-emerald-100/70 border border-emerald-300 text-emerald-950 font-bold text-xs py-2.5 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-2xs"
          >
            <ExternalLink className="w-4 h-4 text-emerald-700" />
            <span>Buka Google Spreadsheet</span>
          </a>
        </div>
      </div>
    </div>
  );
};
