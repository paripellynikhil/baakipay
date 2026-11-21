import { useMemo, useState, type FormEvent } from 'react';
import { Field, inputClass, linkClass, primaryClass } from './FormControls';
import { useI18n } from '../i18n/I18n';
import { payInvoice } from '../lib/invoicesApi';

type PayMode = 'upi' | 'cash';

const MODES: { id: PayMode; label: 'gotMoney.cash' | 'gotMoney.upi' }[] = [
  { id: 'cash', label: 'gotMoney.cash' },
  { id: 'upi', label: 'gotMoney.upi' },
];

export interface GotMoneyModalProps {
  customer: { id: string; name: string };
  invoices: Array<{ id: string; invoice_code: string; total: number; paid_amount: number; status: string }>;
  onClose: () => void;
  onPaid: (message: string) => void;
}

export function GotMoneyModal({ customer, invoices, onClose, onPaid }: GotMoneyModalProps) {
  const { t } = useI18n();
  const unpaid = useMemo(
    () => invoices.filter((inv) => inv.status === 'unpaid' || inv.status === 'partial'),
    [invoices],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(unpaid[0]?.id);
  const selected = unpaid.find((inv) => inv.id === selectedId) ?? unpaid[0];
  const remaining = selected ? Math.max(0, selected.total - selected.paid_amount) : 0;
  const [amount, setAmount] = useState(String(remaining));
  const [mode, setMode] = useState<PayMode>('cash');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const entered = Number(amount);
  const amountValid = amount.trim() !== '' && Number.isFinite(entered) && entered > 0;
  const isFull = amountValid && entered >= remaining;
  const overMax = amountValid && entered > remaining;

  function handleBillChange(id: string) {
    setSelectedId(id);
    const inv = unpaid.find((i) => i.id === id);
    if (inv) setAmount(String(Math.max(0, inv.total - inv.paid_amount)));
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || !amountValid) {
      setFormError(t('gotMoney.error'));
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await payInvoice(selected.id, { amount: entered, mode });
      onPaid(t('gotMoney.success'));
      onClose();
    } catch {
      setFormError(t('gotMoney.error'));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="got-money-title"
        className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="got-money-title" className="mb-1 text-lg font-bold text-[#1E1B4B]">
          {t('gotMoney.title')}
        </h2>
        <p className="mb-4 text-sm text-slate-500">{customer.name}</p>

        {unpaid.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p role="status" className="py-4 text-center text-sm text-slate-500">
              {t('gotMoney.noUnpaid')}
            </p>
            <button type="button" onClick={onClose} className={linkClass}>
              {t('gotMoney.cancel')}
            </button>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="gm-bill" className="text-sm font-semibold text-[#1E1B4B]">
                {t('gotMoney.pickBill')}
              </label>
              <select
                id="gm-bill"
                value={selected?.id ?? ''}
                onChange={(e) => handleBillChange(e.target.value)}
                className={inputClass}
              >
                {unpaid.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_code} · ₹{Math.max(0, inv.total - inv.paid_amount).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-slate-500">
              {t('gotMoney.remaining')}: ₹{remaining.toLocaleString('en-IN')}
            </p>

            <div>
              <Field
                id="gm-amount"
                label={t('gotMoney.amount')}
                type="number"
                inputMode="decimal"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="mt-1 text-sm font-semibold text-[#1E1B4B]">
                {isFull ? t('gotMoney.full') : t('gotMoney.partial')}
              </p>
              {overMax && <p className="mt-1 text-sm text-amber-700">{t('gotMoney.overMax')}</p>}
            </div>

            <div role="group" aria-label={t('gotMoney.mode')} className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={mode === m.id}
                  onClick={() => setMode(m.id)}
                  className={`min-h-[44px] rounded-xl border px-3 text-sm font-semibold ${
                    mode === m.id ? 'border-[#1E1B4B] bg-[#1E1B4B] text-white' : 'border-[#E2E8F0] bg-white text-[#1E1B4B]'
                  }`}
                >
                  {t(m.label)}
                </button>
              ))}
            </div>

            {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

            <div className="mt-2 flex flex-col gap-2">
              <button type="submit" disabled={saving || !amountValid} className={primaryClass}>
                {t('gotMoney.confirm')}
              </button>
              <button type="button" onClick={onClose} className={linkClass}>
                {t('gotMoney.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
