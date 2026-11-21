import { useI18n } from '../i18n/I18n';
import { formatRupees, lineAmount, toNum } from '../lib/invoiceMath';
import type { InvoiceItemInput } from '../lib/invoicesApi';

export function ProofItemsTable({ items }: { items: InvoiceItemInput[] }) {
  const { t } = useI18n();
  return (
    <table className="w-full text-left text-sm text-[#1E1B4B]">
      <thead>
        <tr className="border-b border-[#E2E8F0] text-xs uppercase text-slate-500">
          <th className="py-2 font-semibold">{t('invoices.colItem')}</th>
          <th className="py-2 text-right font-semibold">{t('invoices.qty')}</th>
          <th className="py-2 text-right font-semibold">{t('invoices.unitPrice')}</th>
          <th className="py-2 text-right font-semibold">{t('invoices.discount')}</th>
          <th className="py-2 text-right font-semibold">{t('invoices.colAmount')}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => {
          const line = { name: item.name, qty: toNum(item.qty), unitPrice: toNum(item.unitPrice), discount: toNum(item.discount) };
          return (
            <tr key={i} className="border-b border-[#F1F5F9]">
              <td className="py-2">{item.name}</td>
              <td className="py-2 text-right">{line.qty}</td>
              <td className="py-2 text-right">{formatRupees(line.unitPrice)}</td>
              <td className="py-2 text-right">{formatRupees(line.discount)}</td>
              <td className="py-2 text-right">{formatRupees(lineAmount(line))}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
