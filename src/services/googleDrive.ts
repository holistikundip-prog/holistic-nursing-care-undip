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
 * Searches or creates the default root clinic folder in Google Drive
 */
export async function getOrCreateClinicFolder(accessToken: string): Promise<string | null> {
  try {
    if (!accessToken) return null;

    // 1. Search for existing folder
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

    // 2. Create if not found
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
 * Lists files from Google Drive
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
 * Uploads a text/JSON/Markdown file to Google Drive using multipart upload
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
  } catch (err: any) {
    console.error('Error uploading file to Drive:', err);
    return { success: false, error: err?.message || 'Gagal mengunggah file ke Google Drive' };
  }
}

/**
 * Creates a full JSON Backup file of the database in Google Drive
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
 * Exports single appointment report into Google Drive
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
 * Exports Clinical Progress Notes (SOAP) compilation for a patient into Google Drive
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
 * Deletes a file from Google Drive
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
  } catch (err: any) {
    console.error('Error deleting Drive file:', err);
    return { success: false, error: err?.message || 'Gagal menghapus file dari Google Drive' };
  }
}
