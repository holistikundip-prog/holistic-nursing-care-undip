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
  return !!localStorage.getItem('gmail_access_token');
}

export function connectGmail(): Promise<string> {
  return new Promise((resolve, reject) => {
    const loadGIS = () => {
      const globalWin = window as any;
      if (!globalWin.google?.accounts?.oauth2) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => triggerAuth();
        script.onerror = () => reject(new Error('Gagal memuat Google SDK'));
        document.body.appendChild(script);
      } else {
        triggerAuth();
      }
    };

    const triggerAuth = () => {
      try {
        const globalWin = window as any;
        const client = globalWin.google.accounts.oauth2.initTokenClient({
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
              reject(new Error('Token tidak ditemukan dari Google.'));
            }
          },
        });
        client.requestAccessToken();
      } catch (err) {
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
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(data.subject)))}?=`;
    const messageParts = [
      `To: ${data.to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      data.htmlBody
    ];

    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedMessage })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error?.message || 'Gagal mengirim email.' };
    }

    const result = await res.json();
    return { success: true, messageId: result.id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Terjadi kesalahan jaringan.' };
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
