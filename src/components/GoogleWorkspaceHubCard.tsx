import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Mail,
  HardDrive,
  Sparkles,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Database,
  Send,
  Folder,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Appointment, ClinicalProgressNote, UserProfile, Therapy } from '../types';
import { googleSignIn, logoutGoogle } from '../services/firebaseAuth';
import { ensureSpreadsheetHeaders, triggerRealtimeSheetSync, SPREADSHEET_URL } from '../services/googleSheets';
import { backupDatabaseToDrive } from '../services/googleDrive';

interface GoogleWorkspaceHubCardProps {
  googleUser: any | null;
  accessToken: string | null;
  onAuthSuccess: (user: any, token: string) => void;
  onLogout: () => void;
  appointments: Appointment[];
  progressNotes: ClinicalProgressNote[];
  therapies: Therapy[];
  onOpenGmailModal: () => void;
  onOpenDriveModal: () => void;
}

export const GoogleWorkspaceHubCard: React.FC<GoogleWorkspaceHubCardProps> = ({
  googleUser,
  accessToken,
  onAuthSuccess,
  onLogout,
  appointments,
  progressNotes,
  therapies,
  onOpenGmailModal,
  onOpenDriveModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sheets' | 'gmail' | 'drive'>('sheets');
  const [isLoading, setIsLoading] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('hnc_google_sheet_url') || null;
  });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res && res.accessToken) {
        onAuthSuccess(res.user, res.accessToken);
        setStatusMessage({
          type: 'success',
          text: 'Google Workspace (Sheets, Gmail, Drive) berhasil terhubung!'
        });
      }
    } catch (err: any) {
      console.error('Google Workspace Connect Error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menghubungkan Google Workspace.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSheets = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await ensureSpreadsheetHeaders(accessToken);
      setSpreadsheetUrl(SPREADSHEET_URL);
      localStorage.setItem('hnc_google_sheet_url', SPREADSHEET_URL);
      await triggerRealtimeSheetSync(accessToken, appointments);
      setStatusMessage({
        type: 'success',
        text: `Sinkronisasi Google Sheets berhasil! Total ${appointments.length} data tersinkron.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal melakukan sinkronisasi Google Sheets.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupToDrive = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const dummyUser: UserProfile = {
        id: 'admin-backup',
        name: 'Admin Nakes UNDIP',
        patientNumber: 'NAKES-001',
        email: googleUser?.email || 'holistikundip@gmail.com',
        phone: '0812-3456-7890',
        address: 'Klinik Keperawatan Holistik F.Kep UNDIP',
        joinedDate: new Date().toISOString().split('T')[0],
        isGuest: false
      };

      const res = await backupDatabaseToDrive(accessToken, {
        appointments,
        progressNotes,
        therapies,
        user: dummyUser
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Cadangan database berhasil disimpan ke Google Drive (${res.file?.name})!`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Gagal menyimpan cadangan ke Drive.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal mencadangkan data ke Google Drive.'
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
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-sky-600 text-white flex items-center justify-center shadow-md">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Google Workspace Suite
              </span>
              <span className="text-[10px] text-stone-400">• Official Integrations</span>
            </div>
            <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
              Pusat Integrasi Google Workspace (Sheets, Gmail, Drive)
            </h3>
          </div>
        </div>

        {/* Connect / User status button */}
        {accessToken ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Terhubung ({googleUser?.email || 'Akun Google'})</span>
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
            <span>{isLoading ? 'Menghubungkan...' : 'Hubungkan Google Workspace'}</span>
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
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Integration Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
        {/* 1. Google Sheets Card */}
        <div className="p-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col justify-between transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-emerald-950">Google Sheets</h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Tabel Real-time
              </span>
            </div>
            <p className="text-[11px] text-stone-600 mb-3 leading-relaxed">
              Mencatat seluruh data pemesanan, rekam medis ringkas, dan jadwal pasien secara live ke spreadsheet.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-emerald-200/60">
            <button
              type="button"
              onClick={handleSyncSheets}
              disabled={isLoading || !accessToken}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sinkronkan ke Spreadsheet</span>
            </button>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs py-1.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Google Sheet</span>
              </a>
            )}
          </div>
        </div>

        {/* 2. Gmail Integration Card */}
        <div className="p-4 bg-rose-50/50 hover:bg-rose-50 border border-rose-200 rounded-2xl flex flex-col justify-between transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-rose-950">Gmail Hub</h4>
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                Surat Elektronik
              </span>
            </div>
            <p className="text-[11px] text-stone-600 mb-3 leading-relaxed">
              Kirim e-tiket resmi, pengingat jadwal, hasil pengkajian SOAP, atau komunikasi langsung via Gmail.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-rose-200/60">
            <button
              type="button"
              onClick={onOpenGmailModal}
              className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Buka Gmail Hub & Kirim Email</span>
            </button>
          </div>
        </div>

        {/* 3. Google Drive Integration Card */}
        <div className="p-4 bg-sky-50/50 hover:bg-sky-50 border border-sky-200 rounded-2xl flex flex-col justify-between transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                  <HardDrive className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-sky-950">Google Drive</h4>
              </div>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                Cloud Backup & Arsip
              </span>
            </div>
            <p className="text-[11px] text-stone-600 mb-3 leading-relaxed">
              Arsipkan lembar rekam medis SOAP, file cadangan database sistem, dan dokumen klinis secara aman di Drive.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-sky-200/60">
            <button
              type="button"
              onClick={onOpenDriveModal}
              className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Kelola Berkas Google Drive</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
