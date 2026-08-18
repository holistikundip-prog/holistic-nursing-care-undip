import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  RefreshCw,
  Folder,
  FileText,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Sparkles,
  ShieldCheck,
  FileCode,
  Archive
} from 'lucide-react';
import { Appointment, ClinicalProgressNote, UserProfile, Therapy } from '../types';
import {
  listDriveFiles,
  uploadFileToDrive,
  backupDatabaseToDrive,
  deleteDriveFile,
  DriveFileItem,
  getOrCreateClinicFolder
} from '../services/googleDrive';
import { googleSignIn } from '../services/firebaseAuth';

interface GoogleDriveHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  currentUser: UserProfile;
  appointments: Appointment[];
  progressNotes: ClinicalProgressNote[];
  therapies: Therapy[];
  onAuthSuccess?: (user: any, token: string) => void;
}

export const GoogleDriveHubModal: React.FC<GoogleDriveHubModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  currentUser,
  appointments,
  progressNotes,
  therapies,
  onAuthSuccess
}) => {
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload custom file state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // File Deletion Confirmation State (Mandatory Workspace Mutation Safeguard)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadDriveFiles();
    }
  }, [isOpen, accessToken]);

  const loadDriveFiles = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const folderId = await getOrCreateClinicFolder(accessToken);
      const list = await listDriveFiles(accessToken, { folderId: folderId || undefined });
      setFiles(list);
    } catch (err: any) {
      console.error('Error loading Drive files:', err);
      setStatusMessage({ type: 'error', text: 'Gagal memuat daftar file dari Google Drive.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res && res.accessToken && onAuthSuccess) {
        onAuthSuccess(res.user, res.accessToken);
        setStatusMessage({ type: 'success', text: 'Akun Google Drive berhasil terhubung!' });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menghubungkan Google Drive.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBackupToDrive = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Silakan hubungkan akun Google Anda terlebih dahulu.' });
      return;
    }

    setIsBackingUp(true);
    setStatusMessage(null);

    const res = await backupDatabaseToDrive(accessToken, {
      appointments,
      progressNotes,
      therapies,
      user: currentUser
    });

    setIsBackingUp(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Cadangan database berhasil disimpan ke Google Drive (${res.file?.name})!`
      });
      loadDriveFiles();
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Gagal membuat cadangan di Google Drive.'
      });
    }
  };

  const handleUploadCustomDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!uploadFileName.trim() || !uploadContent.trim()) {
      setStatusMessage({ type: 'error', text: 'Nama file dan isi dokumen wajib diisi.' });
      return;
    }

    setIsUploading(true);
    const fileName = uploadFileName.endsWith('.md') || uploadFileName.endsWith('.txt')
      ? uploadFileName
      : `${uploadFileName}.md`;

    const res = await uploadFileToDrive(accessToken, {
      name: fileName,
      mimeType: 'text/markdown',
      content: uploadContent,
      description: 'Dokumen Catatan Klinis / Edukasi Terapi'
    });

    setIsUploading(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `File "${fileName}" berhasil diunggah ke Google Drive!`
      });
      setUploadFileName('');
      setUploadContent('');
      setShowUploadForm(false);
      loadDriveFiles();
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Gagal mengunggah file ke Google Drive.'
      });
    }
  };

  const handleExecuteDeleteFile = async () => {
    if (!fileToDelete || !accessToken) return;
    setIsDeleting(true);

    const res = await deleteDriveFile(accessToken, fileToDelete.id);
    setIsDeleting(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `File "${fileToDelete.name}" berhasil dihapus dari Google Drive.`
      });
      setFileToDelete(null);
      loadDriveFiles();
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Gagal menghapus file dari Drive.'
      });
      setFileToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-stone-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-sky-950 to-stone-900 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center font-bold shadow-md">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                  Google Workspace API
                </span>
                <span className="text-[10px] text-stone-400">• Google Drive Sync</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Penyimpanan & Cadangan Google Drive
              </h2>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Connection Banner */}
          {!accessToken ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-blue-950 block">Hubungkan Akun Google Drive</span>
                  <span className="text-blue-800 text-[11px]">
                    Otorisasi Google Drive untuk menyimpan rekam medis dan mencadangkan data secara terenkripsi.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Menghubungkan...' : 'Hubungkan Drive'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Action 1: Instant Backup */}
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Archive className="w-4 h-4 text-sky-700" />
                    <span className="text-xs font-bold text-sky-950">Cadangkan Database ke Drive</span>
                  </div>
                  <p className="text-[11px] text-sky-800 mb-3">
                    Simpan seluruh data reservasi ({appointments.length}), catatan SOAP ({progressNotes.length}), dan profil ke Google Drive.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBackupToDrive}
                  disabled={isBackingUp}
                  className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isBackingUp ? 'Menyimpan ke Drive...' : 'Buat File Cadangan Sekarang'}</span>
                </button>
              </div>

              {/* Action 2: Upload Custom Doc */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Upload className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950">Unggah Dokumen Baru</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mb-3">
                    Tulis atau unggah dokumen rekam medis, laporan edukasi terapi, atau panduan langsung ke Drive.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showUploadForm ? 'Tutup Form' : 'Tulis & Unggah File'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Custom Upload Form */}
          {showUploadForm && (
            <form onSubmit={handleUploadCustomDoc} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 text-xs">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Form Dokumen Google Drive Baru</span>
              </h4>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nama File:</label>
                <input
                  type="text"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="contoh: Ringkasan_Terapi_Bekam_Agustus"
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Konten / Isi Dokumen:</label>
                <textarea
                  rows={4}
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="Tuliskan catatan medis atau laporan asuhan keperawatan di sini..."
                  className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-3 py-1.5 font-bold text-stone-600 hover:bg-stone-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Mengunggah...' : 'Simpan ke Drive'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Files List Header */}
          <div className="pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-extrabold text-stone-900">
                  Berkas di Folder &quot;Holistic Nursing Care UNDIP&quot; Google Drive
                </h4>
              </div>
              {accessToken && (
                <button
                  type="button"
                  onClick={loadDriveFiles}
                  className="text-blue-700 hover:text-blue-900 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Segarkan</span>
                </button>
              )}
            </div>

            {/* Files List */}
            {isLoading ? (
              <div className="p-8 text-center text-stone-400 text-xs">Memuat file dari Google Drive...</div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-400 text-xs">
                <Folder className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                <p>Belum ada file tersimpan di folder klinik Google Drive Anda.</p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Klik tombol &quot;Buat File Cadangan Sekarang&quot; di atas untuk mengarsipkan data.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 bg-stone-50 hover:bg-blue-50/40 border border-stone-200 rounded-xl transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        {file.mimeType?.includes('json') ? (
                          <FileCode className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-stone-900 block truncate">{file.name}</span>
                        <span className="text-[10px] text-stone-400 block">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('id-ID') : 'Tersimpan'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                          title="Buka di Google Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setFileToDelete(file)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer"
                        title="Hapus Berkas dari Google Drive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* EXPLICIT CONFIRMATION DIALOG FOR FILE DELETION (Mandatory Workspace Mutation Safeguard) */}
        {fileToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm">Hapus File dari Google Drive?</h3>
                  <p className="text-xs text-stone-500">Google Drive Workspace Action</p>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5 text-stone-700">
                <div>
                  <strong>Nama File:</strong> <span className="text-rose-900 font-bold">{fileToDelete.name}</span>
                </div>
                <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                  Tindakan ini akan menghapus file dari akun Google Drive Anda secara permanen.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteFile}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Menghapus...' : 'Hapus File'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
