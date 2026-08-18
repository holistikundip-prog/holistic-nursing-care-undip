import { Appointment, ClinicalProgressNote, UserProfile } from '../types';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

export interface DriveUploadOptions {
  name: string;
  mimeType: string;
  content: string;
  folderId?: string;
  description?: string;
}

const CLINIC_FOLDER_NAME = 'Holistic Nursing Care UNDIP - Rekam Medis & Arsip';

/**
 * Memeriksa apakah Google Drive terhubung di browser
 */
export function isDriveConnected(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('google_drive_access_token');
}

/**
 * Membuka Popup OAuth Google Drive untuk otorisasi
 */
export function connectDrive(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window Object Tidak Ditemukan.'));
      return;
    }

    const loadGIS = () => {
      const win = window as unknown as Record<string, any>;
      if (!win.google?.accounts?.oauth2) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => triggerAuth();
        script.onerror = () => reject(new Error('Gagal memuat Google OAuth SDK'));
        document.body.appendChild(script);
      } else {
        triggerAuth();
      }
    };

    const triggerAuth = () => {
      try {
        const win = window as unknown as Record<string, any>;
        const client = win.google.accounts.oauth2.initTokenClient({
          client_id: '502787877148-vk6hfg5tquc3tnsvhkf3de11v0as9e97.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            if (response.access_token) {
              localStorage.setItem('google_drive_access_token', response.access_token);
              resolve(response.access_token);
            } else {
              reject(new Error('Token OAuth Google Drive tidak ditemukan.'));
            }
          },
        });
        client.requestAccessToken();
      } catch (err: unknown) {
        reject(err);
      }
    };

    loadGIS();
  });
}

/**
 * Mencari atau membuat folder root klinik di Google Drive
 */
export async function getOrCreateClinicFolder(accessToken: string): Promise<string | null> {
  try {
    if (!accessToken) return null;

    // 1. Cari folder yang sudah ada
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `mimeType='application/vnd.google-apps.folder' and name='${CLINIC_FOLDER_NAME}' and trashed=false`
      )}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // 2. Buat folder baru jika belum ada
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: CLINIC_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Folder penyimpanan otomatis data klinik, rekam medis, dan cadangan Holistic Nursing Care UNDIP'
      })
    });

    if (createRes.ok) {
      const newFolder = await createRes.json();
      return newFolder.id;
    }

    return null;
  } catch (err) {
    console.error('Error getting or creating Clinic Google Drive folder:', err);
    return null;
  }
}

/**
 * Menampilkan daftar file dari Google Drive
 */
export async function listDriveFiles(
  accessToken: string,
  options?: { folderId?: string; query?: string; pageSize?: number }
): Promise<DriveFileItem[]> {
  try {
    if (!accessToken) return [];

    let q = 'trashed=false';
    if (options?.folderId) {
      q += ` and '${options.folderId}' in parents`;
    }
    if (options?.query) {
      q += ` and name contains '${options.query.replace(/'/g, "\\'")}'`;
    }

    const pageSize = options?.pageSize || 25;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&pageSize=${pageSize}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,iconLink,thumbnailLink)`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn('Drive list files error:', err);
      return [];
    }

    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.error('Error listing Drive files:', err);
    return [];
  }
}

/**
 * Unggah file Teks / JSON / Markdown ke Google Drive menggunakan Multipart Upload
 */
export async function uploadFileToDrive(
  accessToken: string,
  options: DriveUploadOptions
): Promise<{ success: boolean; file?: DriveFileItem; error?: string }> {
  try {
    if (!accessToken) {
      throw new Error('Token akses Google tidak tersedia. Silakan hubungkan akun Google Anda.');
    }

    let folderId = options.folderId;
    if (!folderId) {
      folderId = (await getOrCreateClinicFolder(accessToken)) || undefined;
    }

    const metadata: Record<string, any> = {
      name: options.name,
      mimeType: options.mimeType,
      description: options.description || 'Dokumen Holistic Nursing Care UNDIP'
    };

    if (folderId) {
      metadata.parents = [folderId];
    }

    const boundary = `-------drive_upload_boundary_${Date.now()}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${options.mimeType}\r\n\r\n` +
      options.content +
      closeDelimiter;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,createdTime', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Google Drive Upload error: ${response.statusText}`);
    }

    const file = await response.json();
    return { success: true, file };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal mengunggah file ke Google Drive';
    console.error('Error uploading file to Drive:', err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Membuat file Cadangan Database JSON penuh ke Google Drive
 */
export async function backupDatabaseToDrive(
  accessToken: string,
  backupData: {
    appointments: Appointment[];
    progressNotes: ClinicalProgressNote[];
    therapies: any[];
    user: UserProfile;
  }
): Promise<{ success: boolean; file?: DriveFileItem; error?: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `HNC_Backup_Database_${timestamp}.json`;

  const payload = {
    exportedAt: new Date().toISOString(),
    clinic: 'Holistic Nursing Care UNDIP',
    version: '2.0-cloud',
    summary: {
      totalAppointments: backupData.appointments.length,
      totalProgressNotes: backupData.progressNotes.length,
      totalTherapies: backupData.therapies.length
    },
    data: backupData
  };

  return uploadFileToDrive(accessToken, {
    name: fileName,
    mimeType: 'application/json',
    content: JSON.stringify(payload, null, 2),
    description: `Cadangan data rekam medis dan jadwal terapi Holistic Nursing Care UNDIP (${new Date().toLocaleString('id-ID')})`
  });
}

/**
 * Ekspor E-Tiket Reservasi Tunggal ke Google Drive
 */
export async function exportAppointmentToDrive(
  accessToken: string,
  appointment: Appointment
): Promise<{ success: boolean; file?: DriveFileItem; error?: string }> {
  const fileName = `E-Tiket_${appointment.bookingCode}_${appointment.userName.replace(/\s+/g, '_')}.md`;

  const content = `# E-TIKET RESERVASI TERAPI HOLISTIK UNDIP
**Kode Booking:** ${appointment.bookingCode}
**Tanggal Dibuat:** ${appointment.createdAt || new Date().toISOString()}

---

### Informasi Pasien
- **Nama Pasien:** ${appointment.userName}
- **Nomor Rekam Medis (RM):** ${appointment.patientNumber || '-'}
- **Kontak WhatsApp:** ${appointment.userPhone}
- **Email:** ${appointment.userEmail}

---

### Rincian Tindakan Terapi
- **Layanan Terapi:** ${appointment.therapyName}
- **Jadwal:** ${appointment.dayName}, ${appointment.date}
- **Jam/Sesi:** ${appointment.timeSlot} WIB
- **Lokasi Klinik:** ${appointment.locationName}
- **Status Reservasi:** ${appointment.status}
${appointment.notes ? `- **Keluhan/Catatan:** ${appointment.notes}` : ''}

---

*Departemen Ilmu Keperawatan, Fakultas Kedokteran Universitas Diponegoro*
*Arsip Otomatis Google Drive*
`;

  return uploadFileToDrive(accessToken, {
    name: fileName,
    mimeType: 'text/markdown',
    content,
    description: `E-Tiket Reservasi Terapi ${appointment.bookingCode} (${appointment.userName})`
  });
}

/**
 * Ekspor Catatan Rekam Medis SOAP ke Google Drive
 */
export async function exportClinicalNotesToDrive(
  accessToken: string,
  notes: ClinicalProgressNote[],
  patientName: string
): Promise<{ success: boolean; file?: DriveFileItem; error?: string }> {
  const cleanName = patientName.replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Rekam_Medis_SOAP_${cleanName}_${dateStr}.md`;

  let content = `# DOKUMENTASI REKAM MEDIS ASUHAN KEPERAWATAN HOLISTIK
**Klinik Keperawatan Komplementer UNDIP**
**Nama Pasien:** ${patientName}
**Tanggal Cetak Arsip:** ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
**Jumlah Catatan Perkembangan:** ${notes.length} sesi

---

`;

  notes.forEach((note, index) => {
    content += `## Kunjungan #${index + 1}: ${note.visitDate} - ${note.therapyName}
- **Kode Booking / Kunjungan:** ${note.bookingCode || '-'}
- **No. Rekam Medis:** ${note.patientNumber || '-'}
- **Perawat / Nakes:** ${note.nurseName}

### Evaluasi SOAP
- **S (Subjective - Keluhan Utama):**
  ${note.chiefComplaint}

- **O (Objective - Pengkajian & Tanda Vital):**
  ${note.assessment}
  ${note.vitalSigns ? `*TD: ${note.vitalSigns.bloodPressure || '-'}, Nadi: ${note.vitalSigns.pulseRate || '-'}, Skala Nyeri: ${note.vitalSigns.painScale ?? '-'}/10*` : ''}

- **A & I (Assessment & Intervention):**
  ${note.intervention}

- **P (Plan & Progress Follow-Up):**
  ${note.progressFollowUp}

---

`;
  });

  content += `\n*Dokumen Rahasia Medis - Disimpan di Google Drive Klinik Holistic Nursing Care UNDIP.*`;

  return uploadFileToDrive(accessToken, {
    name: fileName,
    mimeType: 'text/markdown',
    content,
    description: `Rangkuman Catatan SOAP Klinis Pasien ${patientName}`
  });
}

/**
 * Ekspor Catatan Perkembangan Klinis Tunggal
 */
export async function exportProgressNoteToDrive(
  accessToken: string,
  noteData: any
): Promise<{ success: boolean; file?: DriveFileItem; error?: string }> {
  return exportAppointmentToDrive(accessToken, noteData);
}

/**
 * Menghapus file dari Google Drive
 */
export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!accessToken) {
      throw new Error('Token akses tidak tersedia.');
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok && response.status !== 204) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal menghapus file dari Drive (${response.status})`);
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus file dari Google Drive';
    console.error('Error deleting Drive file:', err);
    return { success: false, error: errorMsg };
  }
}
