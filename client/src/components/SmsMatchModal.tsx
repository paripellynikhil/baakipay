import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18n';
import { ApiError, apiFetch } from '../lib/api';
import { payInvoice } from '../lib/invoicesApi';
import { formatRupees } from '../lib/invoiceMath';
import type { TranslationKey } from '../i18n/translations';
import { linkClass, primaryClass } from './FormControls';

export interface SmsMatchModalProps {
  open: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
}

// Mirrors POST /api/invoices/match-sms in server/routes/invoices.js.
interface SmsCandidate {
  id: string;
  invoice_code: string;
  customer_name: string;
  remaining: number;
  tag: string; // 'Full Payment Match' | 'Possible Partial Payment' | 'Name Match'
  name_match: boolean;
}

interface MatchSmsResponse {
  amount: number;
  senderName: string;
  invoiceCode: string | null;
  step: 'code' | 'name';
  candidates: SmsCandidate[];
  multi_match: boolean;
  requires_confirmation: boolean;
}

const SAMPLE_1 = 'Rs.5000 received from Rahul via UPI on 12-05-2025. Ref 412998877654.';
const SAMPLE_2 = 'INR 2,000.00 credited from Priya Sharma via UPI, Ref 556677889900';

// Keyed by the server's tag text. Tags without a label key (e.g. 'Name Match') show no tag line.
const TAG_KEY: Record<string, TranslationKey | undefined> = {
  'Full Payment Match': 'sms.fullMatch',
  'Possible Partial Payment': 'sms.partialMatch',
};

export function SmsMatchModal({ open, onClose, onDone }: SmsMatchModalProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pasteText, setPasteText] = useState('');
  const [result, setResult] = useState<MatchSmsResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the wizard every time it opens.
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setPasteText('');
    setResult(null);
    setSelectedIndex(null);
    setBusy(false);
    setError(null);
  }, [open]);

  if (!open) return null;

  const candidates = result?.candidates ?? [];
  const selected = selectedIndex !== null ? candidates[selectedIndex] ?? null : null;

  // Parse only: no payment is made here.
  async function handleFind() {
    const text = pasteText.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<MatchSmsResponse>('/api/invoices/match-sms', {
        method: 'POST',
        body: { text },
      });
      setResult(res);
      setSelectedIndex(null);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 400 ? t('sms.noAmount') : t('networkError'));
    } finally {
      setBusy(false);
    }
  }

  // Money moves only on this explicit click.
  async function handleConfirm() {
    if (!selected || !result) return;
    setBusy(true);
    setError(null);
    try {
      await payInvoice(selected.id, { amount: result.amount, mode: 'upi' });
      onDone(t('sms.done'));
      onClose();
    } catch {
      setError(t('networkError'));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sms-match-title"
        className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="sms-match-title" className="mb-1 text-lg font-bold text-[#1E1B4B]">
          {t('sms.title')}
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          {step === 1 && t('sms.step1')}
          {step === 2 && t('sms.step2')}
          {step === 3 && t('sms.step3')}
        </p>

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <textarea
              aria-label={t('sms.paste')}
              placeholder={t('sms.paste')}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setPasteText(SAMPLE_1)} className={linkClass}>
                {t('sms.sample1')}
              </button>
              <button type="button" onClick={() => setPasteText(SAMPLE_2)} className={linkClass}>
                {t('sms.sample2')}
              </button>
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="button" onClick={handleFind} disabled={busy || !pasteText.trim()} className={primaryClass}>
              {t('sms.parse')}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            {result?.multi_match && (
              <p role="alert" className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                {t('sms.multi')}
              </p>
            )}
            {candidates.length === 0 ? (
              <p className="text-sm text-gray-600">{t('sms.none')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {candidates.map((c, i) => (
                  <li key={`${c.id}-${i}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedIndex(i)}
                      aria-pressed={selectedIndex === i}
                      className={`w-full rounded-lg border p-3 text-left text-sm ${
                        selectedIndex === i ? 'border-[#16A34A] bg-green-50' : 'border-gray-300 bg-white'
                      }`}
                    >
                      <span className="block font-semibold text-[#1E1B4B]">{c.customer_name}</span>
                      <span className="block text-gray-600">{c.invoice_code}</span>
                      <span className="block text-gray-600">{formatRupees(c.remaining)}</span>
                      {TAG_KEY[c.tag] && (
                        <span className="block text-xs text-gray-500">{t(TAG_KEY[c.tag] as TranslationKey)}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setStep(1)} className={linkClass}>
                {t('sms.back')}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!selected}
                className={primaryClass}
              >
                {t('sms.next')}
              </button>
            </div>
          </div>
        )}

        {step === 3 && selected && result && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-gray-300 p-3 text-sm">
              <span className="block font-semibold text-[#1E1B4B]">{selected.customer_name}</span>
              <span className="block text-gray-600">{selected.invoice_code}</span>
              <span className="block text-gray-600">{formatRupees(result.amount)}</span>
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setStep(2)} disabled={busy} className={linkClass}>
                {t('sms.back')}
              </button>
              <button type="button" onClick={handleConfirm} disabled={busy} className={primaryClass}>
                {t('sms.confirmPay')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
