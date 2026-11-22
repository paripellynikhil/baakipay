import { useState } from 'react';
import WhatsAppModal from './WhatsAppModal';
import { useI18n } from '../i18n/I18n';
import { formatRupees } from '../lib/invoiceMath';
import type { Invoice } from '../lib/invoicesApi';

export interface QueueRow {
  invoice: Invoice;
  customer: { name: string; phone: string };
  balance: number;
}

interface Props {
  rows: QueueRow[];
  shopName: string;
  onReminded: (invoiceId: string, lastRemindedAt: string) => void;
}

export default function HomeReminderQueue({ rows, shopName, onReminded }: Props) {
  const { t } = useI18n();
  const [active, setActive] = useState<QueueRow | null>(null);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-[#1E1B4B]">{t('home.reminder_queue_title')}</h2>
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">{t('home.reminder_empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.invoice.id} className="soft-brutal-card flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800">{row.customer.name}</p>
                <p className="text-sm text-slate-500">{formatRupees(row.balance)}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(row)}
                className="shrink-0 rounded-full bg-[#16A34A] px-3 py-2 text-xs font-semibold text-white"
              >
                {t('home.whatsapp_btn')}
              </button>
            </li>
          ))}
        </ul>
      )}
      {active && (
        <WhatsAppModal
          customer={active.customer}
          invoice={active.invoice}
          shopName={shopName}
          onClose={() => setActive(null)}
          onReminded={onReminded}
        />
      )}
    </section>
  );
}
