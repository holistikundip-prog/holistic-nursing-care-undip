import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Inbox
} from 'lucide-react';
import { Appointment, ClinicalProgressNote, UserProfile } from '../types';
import { sendGmailMessage, listGmailMessages, connectGmail, GmailMessageSummary } from '../services/googleGmail';

interface GmailHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  currentUser: UserProfile;
  appointments: Appointment[];
  progressNotes: ClinicalProgressNote[];
  onAuthSuccess?: (user: any, token: string) => void;
  defaultRecipient?: string;
  defaultSubject?: string;
  defaultContent?: string;
}

export const GmailHubModal: React.FC<GmailHubModalProps> = ({
  isOpen,
  onClose,
  accessToken: propsAccessToken,
  currentUser,
  appointments,
  onAuthSuccess,
  defaultRecipient = '',
  defaultSubject = '',
  defaultContent = ''
}) => {
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [subject, setSubject] = useState(defaultSubject || 'Pemberitahuan Layanan Holistic Nursing Care UNDIP');
  const [messageBody, setMessageBody] = useState(defaultContent || '');
  const [templateType, setTemplateType] = useState<string>('custom');

  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(propsAccessToken || localStorage.getItem('gmail_access_token'));
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sentMessages, setSentMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (propsAccessToken) setCurrentAccessToken(propsAccessToken);
    else setCurrentAccessToken(localStorage.getItem('gmail_access_token'));
  }, [propsAccessToken, isOpen]);

  useEffect(() => {
    if (defaultRecipient) setRecipient(defaultRecipient);
    if (defaultSubject) setSubject(defaultSubject);
    if (defaultContent) setMessageBody(defaultContent);
  }, [defaultRecipient, defaultSubject, defaultContent, isOpen]);

  useEffect(() => {
    if (isOpen && currentAccessToken && activeTab === 'history') {
      loadHistory();
    }
  }, [isOpen, currentAccessToken, activeTab]);

  const loadHistory = async () => {
    if (!currentAccessToken) return;
    setIsLoadingHistory(true);
    try {
      const list = await listGmailMessages(currentAccessToken, 'subject:Holistic OR subject:E-Tiket OR subject:Rekam', 8);
      setSentMessages(list);
    } catch (err) {
      console.warn('Gagal memuat riwayat Gmail:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const token = await connectGmail();
      setCurrentAccessToken(token);
      setStatusMessage({ type: 'success', text: 'Akun Gmail berhasil terhubung!' });
      if (onAuthSuccess) {
        onAuthSuccess(currentUser, token);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menghubungkan akun Google Gmail.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleApplyTemplate = (type: string) => {
    setTemplateType(type);
    if (type === 'custom') return;

    if (type === 'reminder') {
      const app = appointments[0];
      setSubject(`[Pengingat Sesi Terapi] Holistic Nursing Care UNDIP`);
      setMessageBody(`Yth. ${app ? app.userName : currentUser.name || 'Pasien'},

Mengingatkan kembali jadwal sesi tindakan terapi komplementer Anda:
- Layanan: ${app ? app.therapyName : 'Terapi Komplementer'}
- Jadwal: ${app ? `${app.dayName}, ${app.date} (Pukul ${app.timeSlot} WIB)` : 'Sesuai Jadwal Reservasi'}
- Lokasi: ${app ? app.locationName : 'Klinik Keperawatan Holistik UNDIP'}

Mohon hadir 15 menit lebih awal. Pastikan kondisi tubuh dalam keadaan bugar dan terhidrasi dengan baik.

Salam Sehat,
Tim Keperawatan Holistik UNDIP`);
    } else if (type === 'general_info') {
      setSubject(`[Informasi Layanan & Edukasi Kesehatan] Holistic Nursing Care UNDIP`);
      setMessageBody(`Halo ${currentUser.name || 'Sahabat Sehat'},

Terima kasih telah mempercayakan pemulihan dan pemeliharaan kesehatan Anda di Holistic Nursing Care UNDIP.

Klinik kami menyediakan berbagai modalitas terapi komplementer terstandar keperawatan:
1. Terapi Bekam Medis (Cupping Therapy)
2. Akupresur & Refleksologi Holistik
3. Terapi Pijat Relaksasi Aromaterapi
4. Meditasi & Relaksasi Guided Imagery

Silakan hubungi kami untuk informasi dan konsultasi kesehatan lebih lanjut.

Salam Hangat,
Klinik Holistic Nursing Care UNDIP`);
    }
  };

  const handlePromptSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !recipient.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Mohon masukkan alamat email tujuan yang valid.' });
      return;
    }
    if (!subject.trim() || !messageBody.trim()) {
      setStatusMessage({ type: 'error', text: 'Subjek dan isi pesan tidak boleh kosong.' });
      return;
    }
    setShowConfirmSend(true);
  };

  const handleExecuteSend = async () => {
    setShowConfirmSend(false);
    const token = currentAccessToken || localStorage.getItem('gmail_access_token');
    
    if (!token) {
      setStatusMessage({ type: 'error', text: 'Silakan hubungkan akun Google Gmail Anda terlebih dahulu.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const htmlFormatted = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1c1917; max-width: 600px; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px;">
        <div style="background-color: #064e3b; color: #ffffff; padding: 14px 18px; border-radius: 8px; margin-bottom: 18px;">
          <h2 style="margin: 0; font-size: 18px;">Holistic Nursing Care UNDIP</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #a7f3d0;">Pelayanan Keperawatan Holistik & Terapi Komplementer</p>
        </div>
        <div style="white-space: pre-line;">${messageBody}</div>
        <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e7e5e4; font-size: 11px; color: #78716c;">
          Email ini dikirim secara resmi dari Sistem Terintegrasi Gmail & Cloud Holistic Nursing Care UNDIP.
        </div>
      </div>
    `;

    try {
      const res = await sendGmailMessage(token, {
        to: recipient.trim(),
        subject: subject.trim(),
        htmlBody: htmlFormatted,
        textBody: messageBody
      });

      setIsLoading(false);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Email berhasil terkirim melalui Gmail ke ${recipient.trim()} (ID: ${res.messageId})`
        });
        if (templateType === 'custom') {
          setMessageBody('');
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Gagal mengirim email. Silakan coba lagi.'
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Terjadi kesalahan saat mengirim pesan.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-red-950 via-rose-950 to-stone-900 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                  Google Workspace API
                </span>
                <span className="text-[10px] text-stone-400">• Gmail Hub</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Komunikasi & Pengiriman Email Gmail
              </h2>
            </div>
          </div>
        </div>

        <div className="flex border-b border-stone-200 bg-stone-50 px-4">
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'compose'
                ? 'border-rose-600 text-rose-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Pesan (Compose)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-rose-600 text-rose-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Riwayat Surat Gmail</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
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

          {!currentAccessToken && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold text-rose-950 block">Hubungkan Akun Gmail Google</span>
                  <span className="text-rose-800 text-[11px]">
                    Otorisasi Google Workspace diperlukan untuk mengirim konfirmasi dan notifikasi langsung.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl transition text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Menghubungkan...' : 'Hubungkan'}</span>
              </button>
            </div>
          )}

          {activeTab === 'compose' && (
            <form onSubmit={handlePromptSend} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Pilih Templat Email:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('reminder')}
                    className={`p-2 rounded-xl border text-left font-medium transition text-[11px] ${
                      templateType === 'reminder'
                        ? 'border-rose-500 bg-rose-50/80 text-rose-900 font-bold'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    ⏰ Pengingat Terapi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('general_info')}
                    className={`p-2 rounded-xl border text-left font-medium transition text-[11px] ${
                      templateType === 'general_info'
                        ? 'border-rose-500 bg-rose-50/80 text-rose-900 font-bold'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    🏥 Info Layanan Klinik
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('custom')}
                    className={`p-2 rounded-xl border text-left font-medium transition text-[11px] ${
                      templateType === 'custom'
                        ? 'border-rose-500 bg-rose-50/80 text-rose-900 font-bold'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    ✏️ Tulis Bebas
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Alamat Email Penerima:</label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="contoh: pasien@gmail.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Subjek Email:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subjek email..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Isi Pesan:</label>
                <textarea
                  rows={6}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Tuliskan pesan lengkap yang akan dikirimkan..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !currentAccessToken}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-rose-200" />
                <span>{isLoading ? 'Mengirim via Gmail...' : 'Kirim Email via Akun Gmail'}</span>
              </button>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-700">Aktivitas Surat Terkait Klinik di Gmail:</span>
                <button
                  type="button"
                  onClick={loadHistory}
                  className="text-rose-700 hover:text-rose-900 font-semibold text-[11px] flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  <span>Perbarui</span>
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="p-6 text-center text-stone-400">Memuat riwayat dari Gmail API...</div>
              ) : sentMessages.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-400">
                  <Mail className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                  <p>Belum ada rekaman surat dengan kata kunci klinik di Gmail Anda.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {sentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 bg-stone-50 hover:bg-rose-50/50 border border-stone-200 rounded-xl transition space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-stone-900">
                        <span className="truncate max-w-[280px]">{msg.subject}</span>
                        <span className="text-[10px] text-stone-400 font-normal">{msg.date ? new Date(msg.date).toLocaleDateString('id-ID') : ''}</span>
                      </div>
                      <div className="text-[11px] text-stone-600 truncate">
                        <strong>Ke:</strong> {msg.to || '-'} | <strong>Dari:</strong> {msg.from || '-'}
                      </div>
                      {msg.snippet && (
                        <p className="text-[11px] text-stone-500 line-clamp-2 italic">{msg.snippet}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {showConfirmSend && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm">Konfirmasi Kirim Email</h3>
                  <p className="text-xs text-stone-500">Google Gmail Workspace Action</p>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5 text-stone-700">
                <div>
                  <strong>Penerima:</strong> <span className="text-rose-900 font-bold">{recipient}</span>
                </div>
                <div>
                  <strong>Subjek:</strong> {subject}
                </div>
                <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                  Email ini akan dikirimkan secara langsung menggunakan akun Gmail Anda.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSend(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSend}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
