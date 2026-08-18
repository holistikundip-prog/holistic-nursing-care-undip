// Google Gmail API Integration Service

const CLIENT_ID = '502787877148-vk6hfg5tquc3tnsvhkf3de11v0as9e97.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly';

let tokenClient: any = null;
let accessToken: string | null = null;

// Initialize Google OAuth Token Client
export function initGmailClient(onSuccess?: () => void, onError?: (err: any) => void) {
  if (typeof window === 'undefined') return;

  // Load Google Identity Services script dynamically if not present
  if (!(window as any).google?.accounts?.oauth2) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setupTokenClient(onSuccess, onError);
    document.body.appendChild(script);
  } else {
    setupTokenClient(onSuccess, onError);
  }
}

function setupTokenClient(onSuccess?: () => void, onError?: (err: any) => void) {
  try {
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) {
          console.error('Google Auth Error:', response);
          if (onError) onError(response);
          return;
        }
        accessToken = response.access_token;
        localStorage.setItem('gmail_access_token', response.access_token);
        if (onSuccess) onSuccess();
      },
    });
  } catch (err) {
    console.error('Failed to init token client:', err);
    if (onError) onError(err);
  }
}

// Request Token / Authenticate
export function connectGmail(): Promise<string> {
  return new Promise((resolve, reject) => {
    const savedToken = localStorage.getItem('gmail_access_token');
    if (savedToken) {
      accessToken = savedToken;
      return resolve(savedToken);
    }

    if (!tokenClient) {
      setupTokenClient(
        () => resolve(accessToken || ''),
        (err) => reject(err)
      );
    }

    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      reject(new Error('Google Identity Client tidak siap. Silakan coba beberapa saat lagi.'));
    }
  });
}

// Check if currently connected
export function isGmailConnected(): boolean {
  return Boolean(accessToken || localStorage.getItem('gmail_access_token'));
}

// Disconnect
export function disconnectGmail() {
  accessToken = null;
  localStorage.removeItem('gmail_access_token');
}

// Send Email via Gmail REST API
export async function sendGmailMessage(to: string, subject: string, bodyText: string): Promise<any> {
  const token = accessToken || localStorage.getItem('gmail_access_token');
  if (!token) {
    throw new Error('Akun Gmail belum terhubung. Silakan hubungkan akun terlebih dahulu.');
  }

  // Construct MIME Message
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyText.replace(/\n/g, '<br/>')
  ];
  
  const rawMessage = messageParts.join('\r\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedMessage })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      disconnectGmail();
      throw new Error('Sesi Gmail telah kadaluarsa. Silakan klik "Hubungkan" kembali.');
    }
    throw new Error(errData.error?.message || 'Gagal mengirim email via Gmail API.');
  }

  return response.json();
}
