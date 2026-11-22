import { useCallback, useEffect, useState } from 'react';
import { Toast } from './Toast';
import { useI18n } from '../i18n/I18n';
import { remindInvoice, type Invoice } from '../lib/invoicesApi';
import { buildWhatsAppUrl } from '../lib/whatsappUrl';
import { buildReminder, formatRupees, type ReminderLang, type ReminderTone } from '../i18n/reminders';
import type { TranslationKey } from '../i18n/translations';

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const TONES: { value: ReminderTone; label: TranslationKey }[] = [
  { value: 'gentle', label: 'reminders.toneGentle' },
  { value: 'firm', label: 'reminders.toneFirm' },
  { value: 'urgent', label: 'reminders.toneUrgent' },
];

const LANGS: { value: ReminderLang; label: TranslationKey }[] = [
  { value: 'en', label: 'reminders.langEn' },
  { value: 'te', label: 'reminders.langTe' },
  { value: 'hi', label: 'reminders.langHi' },
];

// Digits-only, with a 91 country prefix for 10-digit numbers. Returns null when unusable.
function toWhatsAppNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return null;
}

interface Props {
  customer: { name: string; phone: string };
  invoice: Invoice;
  shopName: string;
  onClose: () => void;
  onReminded?: (invoiceId: string, lastRemindedAt: string) => void;
}

type ToastState = { kind: 'ok' | 'err'; text: string } | null;

function pillClass(active: boolean): string {
  return `rounded-full px-3 py-1.5 text-xs font-semibold ${active ? 'bg-[#16A34A] text-white' : 'bg-gray-100 text-gray-700'}`;
}

export default function WhatsAppModal({ customer, invoice, shopName, onClose, onReminded }: Props) {
  const { t } = useI18n();
  const balance = Math.max(0, Number(invoice.totalAmount) - Number(invoice.paidAmount));

  const [tone, setTone] = useState<ReminderTone>('gentle');
  const [lang, setLang] = useState<ReminderLang>('en');
  const [lastReminded, setLastReminded] = useState<string | null>(invoice.lastRemindedAt);

  const build = (nextTone: ReminderTone, nextLang: ReminderLang) =>
    buildReminder({
      tone: nextTone,
      lang: nextLang,
      customerName: customer.name,
      invoiceCode: invoice.invoiceCode,
      amount: balance,
      dueDate: invoice.dueDate,
      shopName,
    });

  const [message, setMessage] = useState<string>(() => build('gentle', 'en'));
  const [toast, setToast] = useState<ToastState>(null);
  const clearToast = useCallback(() => setToast(null), []);

  // Auto-dismiss for the error toast (the green Toast component has its own timer).
  useEffect(() => {
    if (toast?.kind !== 'err') return undefined;
    const timer = window.setTimeout(clearToast, 2500);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  const cooling = lastReminded !== null && Date.now() - Date.parse(lastReminded) < COOLDOWN_MS;

  const pickTone = (next: ReminderTone) => {
    setTone(next);
    setMessage(build(next, lang));
  };

  const pickLang = (next: ReminderLang) => {
    setLang(next);
    setMessage(build(tone, next));
  };

  // Records the reminder on the server, then confirms with the green toast.
  const recordReminder = async () => {
    try {
      const res = await remindInvoice(invoice.id);
      setLastReminded(res.lastRemindedAt);
      onReminded?.(invoice.id, res.lastRemindedAt);
      setToast({ kind: 'ok', text: t('reminders.done') });
    } catch {
      setToast({ kind: 'err', text: t('reminders.remindError') });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      setToast({ kind: 'err', text: t('reminders.copyError') });
      return;
    }
    await recordReminder();
  };

  const handleOpenWhatsApp = async () => {
    const number = toWhatsAppNumber(customer.phone);
    if (!number) {
      setToast({ kind: 'err', text: t('reminders.noPhone') });
      return;
    }
    window.open(buildWhatsAppUrl(customer.phone, message), '_blank', 'noopener');
    await recordReminder();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('reminders.title')}</h2>
            <p className="text-sm text-gray-500">
              {customer.name} · {invoice.invoiceCode} · {formatRupees(balance)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-gray-500">
            {t('reminders.close')}
          </button>
        </div>

        {cooling && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t('reminders.cooldown')}</p>
        )}

        <p className="mb-1 text-xs font-semibold text-gray-600">{t('reminders.tone')}</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {TONES.map((opt) => (
            <button key={opt.value} type="button" className={pillClass(tone === opt.value)} onClick={() => pickTone(opt.value)}>
              {t(opt.label)}
            </button>
          ))}
        </div>

        <p className="mb-1 text-xs font-semibold text-gray-600">{t('reminders.language')}</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {LANGS.map((opt) => (
            <button key={opt.value} type="button" className={pillClass(lang === opt.value)} onClick={() => pickLang(opt.value)}>
              {t(opt.label)}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs font-semibold text-gray-600" htmlFor="reminder-preview">
          {t('reminders.preview')}
        </label>
        <textarea
          id="reminder-preview"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mb-4 w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#16A34A] focus:outline-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={handleCopy} className="rounded-xl border border-[#16A34A] px-4 py-3 text-sm font-semibold text-[#16A34A]">
            {t('reminders.copy')}
          </button>
          <button type="button" onClick={handleOpenWhatsApp} className="rounded-xl bg-[#16A34A] px-4 py-3 text-sm font-semibold text-white">
            {t('reminders.openWhatsApp')}
          </button>
        </div>
      </div>

      <Toast message={toast?.kind === 'ok' ? toast.text : null} onDone={clearToast} />
      {toast?.kind === 'err' && (
        <div role="alert" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toast.text}
        </div>
      )}
    </div>
  );
}
