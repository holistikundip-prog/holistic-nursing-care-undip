// src/services/googleGmail.ts

const CLIENT_ID = '502787877148-vk6hfg5tquc3tnsvhkf3de11v0as9e97.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly';

export interface GmailMessageSummary {
  id: string;
  threadId?: string;
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
}

export function isGmailConnected(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('gmail_access_token');
}

// Fungsi pembantu Base64 murni Browser (Aman untuk Vercel & Vite)
function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function connectGmail(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window Object Tidak Ditemukan.'));
      return;
    }

    const loadGIS = () => {
      const win = window as any;
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
        const win = window as any;
        const client = win.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            if (response.access_token) {
              localStorage.setItem('gmail_access_token', response.access_token);
              resolve(response.access_token);
            } else {
              reject(new Error('Token OAuth tidak dikembalikan oleh Google.'));
            }
          },
        });
        client.requestAccessToken();
      } catch (err: any) {
        reject(err);
      }
    };

    loadGIS();
  });
}

export async function sendGmailMessage(
  token: string,
  data: { to: string; subject: string; htmlBody: string; textBody: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const rawContent = [
      `To: ${data.to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${data.subject}`,
      '',
      data.htmlBody
    ].join('\r\n');

    const encodedMessage = utf8ToBase64Url(rawContent);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedMessage })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { 
        success: false, 
        error: errData.error?.message || `Error status ${res.status}: Gagal mengirim via Gmail API.` 
      };
    }

    const result = await res.json();
    return { success: true, messageId: result.id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Terjadi kesalahan jaringan saat menghubungi server Gmail.' };
  }
}

export async function listGmailMessages(
  token: string,
  query: string = '',
  maxResults: number = 8
): Promise<GmailMessageSummary[]> {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

// Export Alias
export const sendGmailNotification = sendGmailMessage;
export const authenticateGmail = connectGmail;
