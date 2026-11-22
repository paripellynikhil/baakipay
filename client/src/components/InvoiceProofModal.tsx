import { QRCodeSVG } from 'qrcode.react';
import { useI18n } from '../i18n/I18n';
import type { EffectivePlan, Shop } from '../lib/shopApi';
import type { Invoice } from '../lib/invoicesApi';
import { balanceDueOf, formatRupees, lineAmount, toNum } from '../lib/invoiceMath';
import { buildWhatsAppUrl } from '../lib/whatsappUrl';
import { ProofItemsTable } from './ProofItemsTable';
import { linkClass } from './FormControls';

export type ProofShop = Pick<Shop, 'shop_name' | 'bio' | 'address' | 'upi_id'> & { plan: EffectivePlan };

interface InvoiceProofModalProps {
  invoice: Invoice;
  shop: ProofShop;
  customerName: string;
  customerPhone: string;
  onClose: () => void;
}

export function buildUpiUrl(upiId: string, shopName: string, amount: number, invoiceCode: string): string {
  return (
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}` +
    `&am=${encodeURIComponent(String(amount))}&cu=INR&tn=${encodeURIComponent(invoiceCode)}`
  );
}

export default function InvoiceProofModal({ invoice, shop, customerName, customerPhone, onClose }: InvoiceProofModalProps) {
  const { t } = useI18n();
  const shopName = shop.shop_name ?? '';
  const upiId = shop.upi_id?.trim() ?? '';
  const total = toNum(invoice.totalAmount);
  const balanceDue = balanceDueOf(total, toNum(invoice.paidAmount));
  const dueDate = invoice.dueDate ? invoice.dueDate.slice(0, 10) : '—';
  const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('en-IN');
  const phoneDigits = customerPhone.replace(/\D/g, '');
  const waLines = [
    shopName,
    `${t('invoices.code')}: ${invoice.invoiceCode}`,
    '',
    ...invoice.items.map((item) => {
      const qty = toNum(item.qty);
      const amount = lineAmount({
        name: item.name,
        qty,
        unitPrice: toNum(item.unitPrice),
        discount: toNum(item.discount),
      });
      return `${item.name} × ${qty} = ${formatRupees(amount)}`;
    }),
    '',
    `${t('invoices.balanceDue')}: ${formatRupees(balanceDue)}`,
    `${t('invoices.dueDate')}: ${dueDate}`,
  ];
  if (upiId) waLines.push(`UPI ID: ${upiId}`);
  if (shop.plan !== 'pro') waLines.push(t('share.sentVia'));
  const summary = waLines.join('\n');
  const waHref = buildWhatsAppUrl(customerPhone, summary);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 print:static print:block print:bg-white sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-proof-title"
        className="print-only-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl print:max-h-none print:overflow-visible print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between print:hidden">
          <h2 id="invoice-proof-title" className="text-lg font-bold text-[#1E1B4B]">
            {t('invoices.proofTitle')}
          </h2>
          <button type="button" onClick={onClose} className={linkClass} aria-label={t('invoices.close')}>
            ✕
          </button>
        </div>

        <header className="mb-4 flex flex-col gap-1 border-b border-[#E2E8F0] pb-3 text-[#1E1B4B]">
          <p className="text-lg font-bold">{shopName}</p>
          {shop.bio && <p className="text-sm text-slate-600">{shop.bio}</p>}
          {shop.address && <p className="text-sm text-slate-600">{shop.address}</p>}
        </header>

        <div className="mb-4 flex flex-wrap justify-between gap-2 text-sm text-[#1E1B4B]">
          <div>
            <p className="font-semibold">{t('invoices.billTo')}</p>
            <p>{customerName}</p>
          </div>
          <div className="text-right">
            <p>
              {t('invoices.code')}: <span className="font-semibold">{invoice.invoiceCode}</span>
            </p>
            <p>
              {t('invoices.invoiceDate')}: {invoiceDate}
            </p>
            <p>
              {t('invoices.dueDate')}: {dueDate}
            </p>
          </div>
        </div>

        <ProofItemsTable items={invoice.items} />

        <div className="mt-4 flex flex-col gap-1 text-sm text-[#1E1B4B]">
          <div className="flex justify-between">
            <span>{t('invoices.subtotal')}</span>
            <span>{formatRupees(toNum(invoice.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('invoices.invoiceDiscount')}</span>
            <span>{formatRupees(toNum(invoice.discount))}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>{t('invoices.grandTotal')}</span>
            <span>{formatRupees(total)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>{t('invoices.balanceDue')}</span>
            <span>{formatRupees(balanceDue)}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-[#E2E8F0] p-4">
          {upiId ? (
            <>
              <p className="text-sm font-semibold text-[#1E1B4B]">{t('invoices.upiTitle')}</p>
              <QRCodeSVG
                value={buildUpiUrl(upiId, shopName, balanceDue, invoice.invoiceCode)}
                size={160}
                role="img"
                aria-label={t('invoices.upiTitle')}
              />
            </>
          ) : (
            <p className="text-center text-sm text-slate-600">{t('invoices.noUpi')}</p>
          )}
        </div>

        {shop.plan !== 'pro' && <p className="mt-4 text-center text-xs text-slate-500">{t('analytics.powered_by')}</p>}

        <div className="mt-5 flex flex-col gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] w-full rounded-xl bg-[#F59E0B] px-4 font-bold text-[#0F172A] shadow-sm"
          >
            {t('invoices.print')}
          </button>
          {phoneDigits ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#E2E8F0] px-4 font-semibold text-[#1E1B4B]"
            >
              {t('invoices.sendWhatsApp')}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
