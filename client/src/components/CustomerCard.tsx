import { useI18n } from '../i18n/I18n';
import type { Customer } from '../lib/customersApi';

// Credit-limit bar colour: green under 60%, amber 60–79%, red 80%+.
export function limitPercent(owed: number, limit: number): number {
  if (limit <= 0) return owed > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (owed / limit) * 100));
}

export function limitTone(pct: number): string {
  if (pct >= 80) return 'bg-[#DC2626]';
  if (pct >= 60) return 'bg-[#F59E0B]';
  return 'bg-[#16A34A]';
}

interface CustomerCardProps {
  customer: Customer;
  onAddBill: (customer: Customer) => void;
  onGotMoney: () => void;
  onWhatsApp: (customer: Customer) => void;
}

export function CustomerCard({ customer, onAddBill, onGotMoney, onWhatsApp }: CustomerCardProps) {
  const { t } = useI18n();
  const owed = Number(customer.totalOwed);
  const limit = Number(customer.creditLimit);
  const pct = limitPercent(owed, limit);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-[#0F172A]">{customer.name}</h3>
          <p className="text-sm text-slate-500">{customer.phone}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {customer.maxDaysOverdue > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              {customer.maxDaysOverdue} {t('customers.daysLate')}
            </span>
          )}
          {customer.remindedToday && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
              {t('customers.remindedToday')}
            </span>
          )}
        </div>
      </div>

      {(customer.open_invoice_codes ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(customer.open_invoice_codes ?? []).map((code) => (
            <span key={code} className="text-xs rounded-full px-2 py-0.5 bg-slate-100">
              {code}
            </span>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs text-slate-500">{t('customers.owed')}</p>
        <p className="text-lg font-bold text-[#0F172A]">₹{owed.toLocaleString('en-IN')}</p>
      </div>

      {limit > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-500">
            {t('customers.limit')}: ₹{limit.toLocaleString('en-IN')}
          </p>
          <div
            role="progressbar"
            aria-label={t('customers.limit')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
          >
            <div className={`h-full ${limitTone(pct)}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onAddBill(customer)}
          className="min-h-[44px] rounded-xl bg-[#1E1B4B] px-2 text-sm font-semibold text-white"
        >
          {t('customers.bill')}
        </button>
        <button
          type="button"
          onClick={onGotMoney}
          className="min-h-[44px] rounded-xl border border-[#E2E8F0] bg-white px-2 text-sm font-semibold text-[#1E1B4B]"
        >
          {t('customers.gotMoney')}
        </button>
        <button
          type="button"
          onClick={() => onWhatsApp(customer)}
          className="min-h-[44px] rounded-xl bg-[#16A34A] px-2 text-sm font-semibold text-white"
        >
          {t('customers.whatsapp')}
        </button>
      </div>
    </article>
  );
}
