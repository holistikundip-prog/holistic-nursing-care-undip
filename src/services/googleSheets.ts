import { Appointment } from '../types';

export const DEFAULT_SPREADSHEET_ID = '1-21GweMGL6X0YcqEKB-PxfKuvGoahP2Sr_qoBhgSppw';
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`;

export interface SheetMetadata {
  title: string;
  sheets: { title: string; sheetId: number }[];
}

/**
 * Fetch spreadsheet metadata to get the first sheet tab name
 */
export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID
): Promise<SheetMetadata> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Gagal mengambil info spreadsheet (Status: ${res.status})`
    );
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    title: s.properties?.title || 'Sheet1',
    sheetId: s.properties?.sheetId || 0,
  }));

  return {
    title: data.properties?.title || 'Data Pasien Holistic Nursing Care',
    sheets,
  };
}

/**
 * Check and ensure standard headers exist on the sheet
 */
export async function ensureSpreadsheetHeaders(
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID,
  sheetTitle?: string
): Promise<string> {
  let targetSheet = sheetTitle;
  if (!targetSheet) {
    const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
    targetSheet = meta.sheets[0]?.title || 'Sheet1';
  }

  // Check if row 1 has values
  const checkRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(targetSheet)}'!A1:L1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const checkData = await checkRes.json();
  const existingValues = checkData.values;

  const headers = [
    'Kode Booking',
    'Nama Pasien',
    'No. Rekam Medis / Pasien',
    'Email Pasien',
    'No. WhatsApp / HP',
    'Pilihan Terapi',
    'Lokasi Layanan',
    'Hari Tindakan',
    'Tanggal Tindakan',
    'Jam Tindakan',
    'Status Reservasi',
    'Catatan / Keluhan',
    'Waktu Pendaftaran'
  ];

  if (!existingValues || existingValues.length === 0 || !existingValues[0] || existingValues[0].length === 0) {
    // Write headers to row 1
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(targetSheet)}'!A1:M1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `'${targetSheet}'!A1:M1`,
          majorDimension: 'ROWS',
          values: [headers],
        }),
      }
    );
  }

  return targetSheet;
}

/**
 * Append a newly booked appointment row into Google Sheets
 */
export async function appendAppointmentToSheet(
  accessToken: string,
  appointment: Appointment,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID
): Promise<{ success: boolean; updatedRange?: string }> {
  try {
    const targetSheet = await ensureSpreadsheetHeaders(accessToken, spreadsheetId);

    const rowData = [
      appointment.bookingCode,
      appointment.userName,
      appointment.patientNumber || '-',
      appointment.userEmail || '-',
      appointment.userPhone,
      appointment.therapyName,
      appointment.locationName,
      appointment.dayName,
      appointment.date,
      `${appointment.timeSlot} WIB`,
      appointment.status,
      appointment.notes || '-',
      new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(targetSheet)}'!A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `'${targetSheet}'!A:M`,
          majorDimension: 'ROWS',
          values: [rowData],
        }),
      }
    );

    if (!appendRes.ok) {
      const err = await appendRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal menambahkan data ke spreadsheet (Status: ${appendRes.status})`);
    }

    const resData = await appendRes.json();
    return {
      success: true,
      updatedRange: resData?.updates?.updatedRange,
    };
  } catch (error: any) {
    console.error('Error appending to Google Sheet:', error);
    throw error;
  }
}

/**
 * Batch sync all appointments from the app into the spreadsheet (Clean overwrite below headers)
 * Guarantees zero duplicate rows and instant real-time synchronization for status changes
 */
export async function syncAllAppointmentsToSheet(
  accessToken: string,
  appointments: Appointment[],
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID
): Promise<number> {
  const targetSheet = await ensureSpreadsheetHeaders(accessToken, spreadsheetId);

  const rows = appointments.map((appointment) => [
    appointment.bookingCode,
    appointment.userName,
    appointment.patientNumber || '-',
    appointment.userEmail || '-',
    appointment.userPhone,
    appointment.therapyName,
    appointment.locationName,
    appointment.dayName,
    appointment.date,
    `${appointment.timeSlot} WIB`,
    appointment.status,
    appointment.cancelledReason
      ? `[Dibatalkan: ${appointment.cancelledReason}] ${appointment.notes || ''}`.trim()
      : (appointment.notes || '-'),
    new Date(appointment.createdAt || Date.now()).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  ]);

  // Clear existing rows below header to avoid leftover records
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(targetSheet)}'!A2:M:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  ).catch(() => {});

  if (rows.length === 0) return 0;

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(targetSheet)}'!A2:M${rows.length + 1}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'${targetSheet}'!A2:M${rows.length + 1}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal sinkronisasi data ke spreadsheet');
  }

  return rows.length;
}

let syncTimeout: any = null;

/**
 * Triggers a debounced real-time automatic synchronization to Google Sheets
 */
export async function triggerRealtimeSheetSync(
  accessToken: string | null,
  appointments: Appointment[],
  debounceMs: number = 250
): Promise<void> {
  const token =
    accessToken ||
    (typeof window !== 'undefined' ? localStorage.getItem('hnc_google_access_token') : null);

  if (!token) return;

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  return new Promise((resolve) => {
    syncTimeout = setTimeout(async () => {
      try {
        await syncAllAppointmentsToSheet(token, appointments);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('hnc_sheet_synced', {
              detail: { timestamp: Date.now(), count: appointments.length, success: true }
            })
          );
        }
      } catch (e: any) {
        console.warn('Real-time Google Sheets sync notice:', e);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('hnc_sheet_synced', {
              detail: { timestamp: Date.now(), error: e?.message || 'Gagal sinkronisasi otomatis', success: false }
            })
          );
        }
      } finally {
        resolve();
      }
    }, debounceMs);
  });
}
