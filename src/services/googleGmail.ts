// src/services/googleGmail.ts

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export function isGmailConnected(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('google_gmail_access_token');
}

export function connectGmail(): Promise<string> {
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
          scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly',
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            if (response.access_token) {
              localStorage.setItem('google_gmail_access_token', response.access_token);
              resolve(response.access_token);
            } else {
              reject(new Error('Token OAuth Gmail tidak ditemukan.'));
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
 * Mengirim email mentah via Gmail API
 */
export async function sendGmailMessage(
  accessToken: string,
  toEmail: string,
  subject: string,
  bodyText: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!accessToken) {
      throw new Error('Token Gmail tidak tersedia.');
    }

    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
      `To: ${toEmail}`,
      `Subject: ${utf8Subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      bodyText,
    ];

    const message = messageParts.join('\r\n');
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gagal mengirim email (${response.status})`);
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim email via Gmail';
    return { success: false, error: errorMsg };
  }
}

/**
 * Mengirim Email Konfirmasi Jadwal/Reservasi Pasien
 */
export async function sendAppointmentConfirmationEmail(
  accessToken: string,
  appointment: any
): Promise<{ success: boolean; id?: string; error?: string }> {
  const subject = `[Holistic Nursing Care UNDIP] Konfirmasi Reservasi Terapi ${appointment?.bookingCode || ''}`;
  const body = `Halo ${appointment?.userName || 'Pasien'},\n\n` +
    `Reservasi layanan terapi komplementer Anda telah berhasil dijadwalkan.\n\n` +
    `Rincian Reservasi:\n` +
    `- Kode Booking: ${appointment?.bookingCode || '-'}\n` +
    `- Layanan: ${appointment?.therapyName || '-'}\n` +
    `- Jadwal: ${appointment?.dayName || ''}, ${appointment?.date || ''}\n` +
    `- Sesi/Jam: ${appointment?.timeSlot || '-'} WIB\n` +
    `- Lokasi: ${appointment?.locationName || 'Klinik Keperawatan UNDIP'}\n\n` +
    `Silakan datang 10 menit sebelum jadwal sesi terapi Anda.\n\n` +
    `Salam,\n` +
    `Tim Holistic Nursing Care UNDIP`;

  return sendGmailMessage(accessToken, appointment?.userEmail || '', subject, body);
}

/**
 * Menampilkan daftar pesan Gmail
 */
export async function listGmailMessages(
  accessToken: string,
  maxResults = 10
): Promise<GmailMessageSummary[]> {
  try {
    if (!accessToken) return [];

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.messages || [];
  } catch (err) {
    console.error('Error listing Gmail messages:', err);
    return [];
  }
}
