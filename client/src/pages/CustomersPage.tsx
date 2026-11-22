import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddCustomerModal } from '../components/AddCustomerModal';
import InfoTip from '../components/InfoTip';
import { SmsMatchModal } from '../components/SmsMatchModal';
import { CustomerCard } from '../components/CustomerCard';
import { CustomerDocModals } from '../components/CustomerDocModals';
import { inputClass } from '../components/FormControls';
import { SkeletonList } from '../components/Skeletons';
import { Toast } from '../components/Toast';
import { useI18n } from '../i18n/I18n';
import type { TranslationKey } from '../i18n/translations';
import { ApiError, readCache } from '../lib/api';
import { getCustomers, type Customer } from '../lib/customersApi';
import { useCustomerDocs } from '../lib/useCustomerDocs';

type Filter = 'all' | 'late' | 'near';

const FILTERS: { id: Filter; label: TranslationKey }[] = [
  { id: 'all', label: 'customers.filterAll' },
  { id: 'late', label: 'customers.filterLate' },
  { id: 'near', label: 'customers.filterNearLimit' },
];

interface CustomersPageProps {
  onAddBill: (customer: Customer) => void;
  onWhatsApp: (customer: Customer) => void;
}

export default function CustomersPage({ onAddBill, onWhatsApp }: CustomersPageProps) {
  const { t } = useI18n();
  // Seed from the offline cache so the list is visible while the live request is in flight.
  const [customers, setCustomers] = useState<Customer[] | null>(() => readCache<Customer[]>('customers'));
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const docs = useCustomerDocs(t, setToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers();
      setCustomers(res.data);
      setOffline(res.offline);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError && err.code === 'OFFLINE' ? t('networkError') : t('customers.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (customers ?? []).filter((c) => {
      if (filter === 'late' && !(c.maxDaysOverdue > 0)) return false;
      if (filter === 'near' && !c.nearLimit) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || (c.open_invoice_codes ?? []).some((code) => code.toLowerCase().includes(q));
    });
  }, [customers, query, filter]);

  function handlePaid(message: string) {
    setToast(message);
    void load();
  }

  function handleSaved() {
    setAdding(false);
    setToast(t('saved'));
    void load();
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#1E1B4B]">{t('customers_title')}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSmsOpen(true)}
            className="min-h-[44px] rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-bold text-[#1E1B4B] shadow-sm"
          >
            {t('sms.title')}
          </button>
          <InfoTip text={t('info.customers_sms')} />
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="min-h-[44px] rounded-xl bg-[#F59E0B] px-4 text-sm font-bold text-[#0F172A] shadow-sm"
          >
            {t('customers.add')}
          </button>
        </div>
      </header>

      <input
        type="search"
        aria-label={t('customers.search')}
        placeholder={t('customers.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={inputClass}
      />

      <div role="group" aria-label={t('customers.filters')} className="flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-semibold ${
              filter === f.id ? 'border-[#1E1B4B] bg-[#1E1B4B] text-white' : 'border-[#E2E8F0] bg-white text-[#1E1B4B]'
            }`}
          >
            {t(f.label)}
          </button>
        ))}
      </div>

      {offline && (
        <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t('offlineBanner')}
        </p>
      )}
      {loadError && customers === null && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {loading && customers === null && <SkeletonList rows={4} />}

      {customers !== null && !(loading && customers === null) && visible.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">{t('customers.empty')}</p>
      )}

      <div className="flex flex-col gap-3">
        {visible.map((c) => (
          <CustomerCard
            key={c.id}
            customer={c}
            onAddBill={onAddBill}
            onGotMoney={() => void docs.openGotMoney(c)}
            onWhatsApp={onWhatsApp}
            onOpenInvoice={(code) => void docs.openInvoice(c, code)}
            onStatement={() => void docs.openStatement(c)}
          />
        ))}
      </div>

      {adding && <AddCustomerModal onClose={() => setAdding(false)} onSaved={handleSaved} />}
      <SmsMatchModal
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        onDone={(msg) => {
          setToast(msg);
          void load();
        }}
      />
      <CustomerDocModals docs={docs} onPaid={handlePaid} />
      <Toast message={toast} onDone={clearToast} />
    </section>
  );
}
