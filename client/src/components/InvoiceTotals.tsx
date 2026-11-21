import { useI18n } from '../i18n/I18n';
import { formatRupees } from '../lib/invoiceMath';

interface InvoiceTotalsProps {
  subtotal: number;
  grandTotal: number;
  creditWarning: boolean;
}

// Live subtotal / grand total plus the BR-003 80% credit-limit banner (warns, never blocks).
export function InvoiceTotals({ subtotal, grandTotal, creditWarning }: InvoiceTotalsProps) {
  const { t } = useI18n();
  return (
    <>
      <div className="flex flex-col gap-1 rounded-xl bg-[#F8FAFC] p-3 text-sm text-[#1E1B4B]">
        <div className="flex justify-between">
          <span>{t('invoices.subtotal')}</span>
          <span>{formatRupees(subtotal)}</span>
        </div>
        <div className="flex justify-between text-base font-bold">
          <span>{t('invoices.grandTotal')}</span>
          <span>{formatRupees(grandTotal)}</span>
        </div>
      </div>

      {creditWarning && (
        <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {t('invoices.creditWarning')}
        </div>
      )}
    </>
  );
}
