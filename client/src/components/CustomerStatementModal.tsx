import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18n';
import type { TranslationKey } from '../i18n/translations';
import type { Customer } from '../lib/customersApi';
import { balanceDueOf, formatRupees, toNum } from '../lib/invoiceMath';
import { listInvoices, type Invoice } from '../lib/invoicesApi';
import { linkClass } from './FormControls';
import type { ProofShop } from './InvoiceProofModal';

interface CustomerStatementModalProps {
  customer: Customer;
  shop: ProofShop;
  onClose: () => void;
}

interface StatementRow {
  id: string;
  date: string;
  code: string;
  total: number;
  paid: number;
  balance: number;
  statusKey: TranslationKey;
}

function toRow(inv: Invoice): StatementRow {
  const total = toNum(inv.totalAmount);
  const paid = toNum(inv.paidAmount);
  const balance = balanceDueOf(total, paid);
  let statusKey: TranslationKey = 'statement.statusUnpaid';
  if (inv.status.toUpperCase() === 'PAID' || balance <= 0) statusKey = 'statement.statusPaid';
  else if (paid > 0) statusKey = 'statement.statusPartial';
  return {
    id: inv.id,
    date: new Date(inv.createdAt).toLocaleDateString('en-IN'),
    code: inv.invoiceCode,
    total,
    paid,
    balance,
    statusKey,
  };
}

export function CustomerStatementModal({ customer, shop, onClose }: CustomerStatementModalProps) {
  const { t } = useI18n();
  const [rows, setRows] = useState<StatementRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listInvoices()
      .then((all) => {
        if (cancelled) return;
        const mine = all
          .filter((inv) => String(inv.customerId) === String(customer.id))
          .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
        setRows(mine.map(toRow));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [customer.id]);

  const totalOwed = (rows ?? []).reduce((sum, r) => sum + r.balance, 0);
  const shopName = shop.shop_name ?? '';

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 print:static print:block print:bg-white sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-statement-title"
        className="print-only-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl print:max-h-none print:overflow-visible print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between print:hidden">
          <h2 id="customer-statement-title" className="text-lg font-bold text-[#1E1B4B]">
            {t('statement.title')}
          </h2>
          <button type="button" onClick={onClose} className={linkClass} aria-label={t('statement.close')}>
            ✕
          </button>
        </div>

        <header className="mb-4 flex flex-col gap-1 border-b border-[#E2E8F0] pb-3 text-[#1E1B4B]">
          <p className="text-lg font-bold">{shopName}</p>
          <p className="text-sm text-slate-600">
            {t('statement.customer')}: {customer.name} · {customer.phone}
          </p>
        </header>

        {rows === null && !failed && <p className="py-6 text-center text-sm text-slate-500">{t('statement.loading')}</p>}
        {failed && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {t('statement.loadError')}
          </p>
        )}
        {rows !== null && rows.length === 0 && <p className="py-6 text-center text-sm text-slate-500">{t('statement.empty')}</p>}

        {rows !== null && rows.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1E1B4B] sm:text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-slate-500">
                    <th className="py-2 pr-2 font-semibold">{t('statement.date')}</th>
                    <th className="py-2 pr-2 font-semibold">{t('statement.code')}</th>
                    <th className="py-2 pr-2 text-right font-semibold">{t('statement.total')}</th>
                    <th className="py-2 pr-2 text-right font-semibold">{t('statement.paid')}</th>
                    <th className="py-2 pr-2 text-right font-semibold">{t('statement.balance')}</th>
                    <th className="py-2 font-semibold">{t('statement.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-[#F1F5F9]">
                      <td className="py-2 pr-2 whitespace-nowrap">{r.date}</td>
                      <td className="py-2 pr-2 font-semibold">{r.code}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{formatRupees(r.total)}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{formatRupees(r.paid)}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{formatRupees(r.balance)}</td>
                      <td className="py-2">{t(r.statusKey)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between border-t border-[#E2E8F0] pt-3 text-base font-bold text-[#1E1B4B]">
              <span>{t('statement.totalOwed')}</span>
              <span>{formatRupees(totalOwed)}</span>
            </div>
          </>
        )}

        {shop.plan !== 'pro' && <p className="mt-4 text-center text-xs text-slate-500">{t('analytics.powered_by')}</p>}

        <div className="mt-5 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] w-full rounded-xl bg-[#F59E0B] px-4 font-bold text-[#0F172A] shadow-sm"
          >
            {t('statement.print')}
          </button>
        </div>
      </div>
    </div>
  );
}
