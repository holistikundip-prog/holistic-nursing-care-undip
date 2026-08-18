import { Appointment, ClinicalProgressNote, UserProfile } from '../types';

export interface GmailSendPayload {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
}

/**
 * Encodes string to RFC 2822 standard base64url format for Gmail API
 */
function createRawEmail(to: string, subject: string, htmlBody: string, textBody?: string): string {
  const boundary = `====boundary_${Date.now()}====`;
  const plainText = textBody || htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    plainText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`
  ];

  const raw = emailLines.join('\r\n');
  // Safe base64url encoding
  const base64 = btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64;
}

/**
 * Sends an email via Gmail API
 */
export async function sendGmailMessage(
  accessToken: string,
  payload: GmailSendPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!accessToken) {
      throw new Error('Token akses Google tidak tersedia. Silakan hubungkan akun Google Anda.');
    }

    const raw = createRawEmail(payload.to, payload.subject, payload.htmlBody, payload.textBody);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gmail API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (err: any) {
    console.error('Error sending email via Gmail API:', err);
    return { success: false, error: err?.message || 'Gagal mengirim email melalui Gmail' };
  }
}

/**
 * Lists recent messages from Gmail
 */
export async function listGmailMessages(
  accessToken: string,
  query: string = '',
  maxResults: number = 10
): Promise<GmailMessageSummary[]> {
  try {
    if (!accessToken) return [];

    let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
    if (query) {
      url += `&q=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.messages || !Array.isArray(data.messages)) return [];

    // Fetch basic metadata for each message
    const detailedList: GmailMessageSummary[] = await Promise.all(
      data.messages.slice(0, maxResults).map(async (msg: { id: string; threadId: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId };

          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(Tanpa Subjek)';
          const from = headers.find((h: any) => h.name === 'From')?.value || '';
          const to = headers.find((h: any) => h.name === 'To')?.value || '';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';

          return {
            id: msg.id,
            threadId: msg.threadId,
            snippet: detail.snippet,
            subject,
            from,
            to,
            date
          };
        } catch {
          return { id: msg.id, threadId: msg.threadId };
        }
      })
    );

    return detailedList;
  } catch (err) {
    console.error('Error listing Gmail messages:', err);
    return [];
  }
}

/**
 * Sends a structured Appointment E-Ticket confirmation email to the patient
 */
export async function sendAppointmentConfirmationEmail(
  accessToken: string,
  appointment: Appointment
): Promise<{ success: boolean; error?: string }> {
  const recipient = appointment.userEmail;
  if (!recipient || !recipient.includes('@')) {
    return { success: false, error: 'Alamat email pasien tidak valid.' };
  }

  const subject = `[E-Tiket] Konfirmasi Jadwal Terapi: ${appointment.therapyName} (${appointment.bookingCode})`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f4; color: #1c1917; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #022c22 0%, #134e4a 100%); color: #ffffff; padding: 30px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #5eead4; }
        .badge { display: inline-block; background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-top: 12px; }
        .content { padding: 24px; }
        .booking-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
        .field-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 13px; }
        .field-row:last-child { border-bottom: none; }
        .label { color: #64748b; font-weight: 600; }
        .value { color: #0f172a; font-weight: 700; text-align: right; }
        .instructions { background-color: #ecfdf5; border-left: 4px solid #059669; padding: 14px; border-radius: 0 8px 8px 0; font-size: 12px; color: #065f46; margin-bottom: 20px; line-height: 1.6; }
        .footer { background-color: #f5f5f4; padding: 16px; text-align: center; font-size: 11px; color: #78716c; border-top: 1px solid #e7e5e4; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HOLISTIC NURSING CARE UNDIP</h1>
          <p>Pelayanan Keperawatan Holistik & Terapi Komplementer</p>
          <div class="badge">E-TIKET RESERVASI RESMI</div>
        </div>
        <div class="content">
          <p style="font-size: 14px; margin-top: 0;">Halo, <strong>${appointment.userName}</strong>,</p>
          <p style="font-size: 13px; color: #44403c;">Pemesanan jadwal tindakan terapi komplementer Anda telah tercatat dengan rincian sebagai berikut:</p>
          
          <div class="booking-card">
            <div class="field-row">
              <span class="label">Kode Booking:</span>
              <span class="value" style="color: #047857; font-size: 15px;">${appointment.bookingCode}</span>
            </div>
            <div class="field-row">
              <span class="label">Nomor Rekam Medis (RM):</span>
              <span class="value">${appointment.patientNumber || '-'}</span>
            </div>
            <div class="field-row">
              <span class="label">Tindakan Terapi:</span>
              <span class="value">${appointment.therapyName}</span>
            </div>
            <div class="field-row">
              <span class="label">Hari & Tanggal:</span>
              <span class="value">${appointment.dayName}, ${appointment.date}</span>
            </div>
            <div class="field-row">
              <span class="label">Waktu / Sesi:</span>
              <span class="value">${appointment.timeSlot} WIB</span>
            </div>
            <div class="field-row">
              <span class="label">Lokasi Klinik:</span>
              <span class="value">${appointment.locationName}</span>
            </div>
            <div class="field-row">
              <span class="label">Status:</span>
              <span class="value" style="color: #d97706;">${appointment.status}</span>
            </div>
            ${appointment.notes ? `
            <div class="field-row">
              <span class="label">Keluhan / Catatan:</span>
              <span class="value">${appointment.notes}</span>
            </div>` : ''}
          </div>

          <div class="instructions">
            <strong>Petunjuk Kedatangan & Persiapan:</strong><br>
            • Harap hadir 10–15 menit sebelum jam sesi dimulai.<br>
            • Tunjukkan kode reservasi ini kepada perawat jaga di resepsionis klinik.<br>
            • Pastikan kondisi tubuh dalam keadaan bersih dan telah beristirahat cukup.<br>
            • Jika perlu mengubah jadwal atau membatalkan, silakan lakukan minimal 3 jam sebelumnya melalui aplikasi.
          </div>

          <p style="font-size: 12px; color: #78716c; margin-bottom: 0;">
            Semoga tindakan terapi ini memberikan manfaat kesembuhan, kebugaran, dan keseimbangan bagi tubuh serta pikiran Anda.
          </p>
        </div>
        <div class="footer">
          Departemen Ilmu Keperawatan | Fakultas Kedokteran Universitas Diponegoro<br>
          Email: holistikundip@gmail.com | Kontak WhatsApp Klinik: 0812-3456-7890
        </div>
      </div>
    </body>
    </html>
  `;

  return sendGmailMessage(accessToken, {
    to: recipient,
    subject,
    htmlBody
  });
}

/**
 * Sends a Clinical Progress Note (SOAP) report via Gmail
 */
export async function sendClinicalProgressNoteEmail(
  accessToken: string,
  note: ClinicalProgressNote,
  recipientEmail?: string
): Promise<{ success: boolean; error?: string }> {
  const recipient = recipientEmail || note.patientEmail;
  if (!recipient || !recipient.includes('@')) {
    return { success: false, error: 'Email tujuan tidak valid untuk pengiriman catatan klinis.' };
  }

  const subject = `[Rekam Medis & Evaluasi Klinis] Sesi Terapi ${note.therapyName} - ${note.patientName} (${note.visitDate})`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f4; margin: 0; padding: 0; color: #1c1917; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
        .header p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
        .content { padding: 24px; font-size: 13px; line-height: 1.6; }
        .soap-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0; }
        .soap-title { font-weight: 800; color: #0f172a; margin-bottom: 6px; font-size: 13px; }
        .soap-section { margin-bottom: 12px; }
        .soap-label { font-weight: 700; color: #047857; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        .soap-text { margin-top: 2px; color: #334155; }
        .vitals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 6px; font-size: 11px; text-align: center; }
        .footer { background-color: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CATATAN PERKEMBANGAN KLINIS KEPERAWATAN</h1>
          <p>Holistic Nursing Care UNDIP • Dokumentasi Asuhan Keperawatan Komplementer</p>
        </div>
        <div class="content">
          <p>Yth. <strong>${note.patientName}</strong> (No. RM: ${note.patientNumber || '-'}),</p>
          <p>Berikut adalah rangkuman evaluasi perkembangan klinis dan asuhan terapi yang telah dilaksanakan:</p>

          <div class="soap-box">
            <div class="soap-title">Rincian Tindakan & Evaluasi SOAP (${note.visitDate})</div>
            
            <div class="soap-section">
              <div class="soap-label">Tindakan Terapi:</div>
              <div class="soap-text"><strong>${note.therapyName}</strong></div>
            </div>

            <div class="soap-section">
              <div class="soap-label">S - Subjective (Keluhan Utama Pasien):</div>
              <div class="soap-text">${note.chiefComplaint}</div>
            </div>

            <div class="soap-section">
              <div class="soap-label">O - Objective (Hasil Pengkajian & Tanda Vital):</div>
              <div class="soap-text">${note.assessment}</div>
              ${note.vitalSigns ? `
                <div class="vitals-grid">
                  <div><strong>TD:</strong> ${note.vitalSigns.bloodPressure || '-'}</div>
                  <div><strong>Nadi:</strong> ${note.vitalSigns.pulseRate || '-'}</div>
                  <div><strong>Skala Nyeri:</strong> ${note.vitalSigns.painScale ?? '-'}/10</div>
                </div>
              ` : ''}
            </div>

            <div class="soap-section">
              <div class="soap-label">A & I - Intervensi Keperawatan yang Diberikan:</div>
              <div class="soap-text">${note.intervention}</div>
            </div>

            <div class="soap-section">
              <div class="soap-label">P - Evaluasi Perkembangan & Anjuran Lanjutan:</div>
              <div class="soap-text">${note.progressFollowUp}</div>
            </div>

            <div style="margin-top: 14px; border-top: 1px dashed #cbd5e1; pt-2; font-size: 12px; color: #475569;">
              <strong>Tenaga Kesehatan / Perawat:</strong> ${note.nurseName}
            </div>
          </div>

          <p style="font-size: 12px; color: #64748b;">
            Dokumen ini diarsipkan secara otomatis di database rekam medis elektronik klinik dan Google Workspace terintegrasi.
          </p>
        </div>
        <div class="footer">
          Klinik Keperawatan Holistik & Terapi Komplementer UNDIP<br>
          Email: holistikundip@gmail.com
        </div>
      </div>
    </body>
    </html>
  `;

  return sendGmailMessage(accessToken, {
    to: recipient,
    subject,
    htmlBody
  });
}
