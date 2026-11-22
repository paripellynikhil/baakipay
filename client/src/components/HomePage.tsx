import { useEffect, useMemo, useState } from 'react';
import HomeKpis from './HomeKpis';
import HomeReminderQueue, { type QueueRow } from './HomeReminderQueue';
import { SkeletonList } from './Skeletons';
import { useI18n } from '../i18n/I18n';
import { getCustomers, type Customer } from '../lib/customersApi';
import { listExpenses, type Expense } from '../lib/expensesApi';
import { fetchForecast, type ForecastResponse } from '../lib/forecastApi';
import { balanceDueOf, CREDIT_WARN_RATIO, dateAfterDays, formatRupees, toNum } from '../lib/invoiceMath';
import { listInvoices, type Invoice } from '../lib/invoicesApi';
import type { Shop } from '../lib/shopApi';

const DAY_MS = 24 * 60 * 60 * 1000;
const UPCOMING_DAYS = 30;
const QUEUE_SIZE = 3;

interface HomePageProps {
  shop: Shop;
  onOpenForecast: () => void;
  onOpenCustomers: () => void;
}

const SPARK_W = 120;
const SPARK_H = 32;

// Maps a balance series onto the sparkline box, first point at left, last at right.
function buildSparkPath(values: number[]): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = SPARK_W / (values.length - 1);
  return values
    .map((v, i) => {
      const x = (i * step).toFixed(1);
      const y = (SPARK_H - 2 - ((v - min) / range) * (SPARK_H - 4) + 1).toFixed(1);
      return `${x},${y}`;
    })
    .join(' ');
}

function isOpen(inv: Invoice): boolean {
  return inv.status === 'UNPAID' || inv.status === 'PARTIAL';
}

export default function HomePage({ shop, onOpenForecast, onOpenCustomers }: HomePageProps) {
  const { t } = useI18n();
  const shopName = shop.shop_name ?? t('appName');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([getCustomers(), listInvoices(), listExpenses(), fetchForecast({ days: 30 })]).then(
      ([c, i, e, f]) => {
        if (cancelled) return;
        setCustomers(c.status === 'fulfilled' ? c.value.data : []);
        setInvoices(i.status === 'fulfilled' ? i.value : []);
        setExpenses(e.status === 'fulfilled' ? e.value.data : []);
        setForecast(f.status === 'fulfilled' ? f.value.data : null);
        setLoadError(c.status === 'rejected' || i.status === 'rejected' || e.status === 'rejected');
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const toCollect = useMemo(
    () =>
      invoices
        .filter(isOpen)
        .reduce((sum, inv) => sum + balanceDueOf(toNum(inv.totalAmount), toNum(inv.paidAmount)), 0),
    [invoices],
  );

  const upcomingBills = useMemo(() => {
    const today = dateAfterDays(0);
    const end = dateAfterDays(UPCOMING_DAYS);
    return expenses
      .filter((e) => e.status === 'unpaid' && e.dueDate >= today && e.dueDate <= end)
      .reduce((sum, e) => sum + toNum(e.amount), 0);
  }, [expenses]);

  const creditWarn = customers.some(
    (c) =>
      c.nearLimit || (toNum(c.creditLimit) > 0 && toNum(c.totalOwed) / toNum(c.creditLimit) >= CREDIT_WARN_RATIO),
  );

  const queueRows = useMemo<QueueRow[]>(() => {
    const now = Date.now();
    const todayMs = Date.parse(dateAfterDays(0));
    const customerById = new Map(customers.map((c) => [c.id, c]));
    return invoices
      .filter((inv) => isOpen(inv) && (!inv.lastRemindedAt || Date.parse(inv.lastRemindedAt) <= now - DAY_MS))
      .map((inv) => {
        const balance = balanceDueOf(toNum(inv.totalAmount), toNum(inv.paidAmount));
        const dueMs = inv.dueDate ? Date.parse(inv.dueDate) : todayMs;
        const daysOverdue = Math.max(0, Math.floor((todayMs - (Number.isNaN(dueMs) ? todayMs : dueMs)) / DAY_MS));
        const c = customerById.get(inv.customerId);
        const row: QueueRow = {
          invoice: inv,
          customer: { name: c?.name ?? inv.customerName, phone: c?.phone ?? '' },
          balance,
        };
        return { row, score: balance * (daysOverdue + 1) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, QUEUE_SIZE)
      .map((x) => x.row);
  }, [invoices, customers]);

  function handleReminded(invoiceId: string, lastRemindedAt: string) {
    setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? { ...inv, lastRemindedAt } : inv)));
  }

  const sparkBalances = forecast?.points.map((p) => p.balance).filter((b) => Number.isFinite(b)) ?? [];
  const sparkPath = sparkBalances.length >= 2 ? buildSparkPath(sparkBalances) : null;

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-xl font-bold text-[#1E1B4B]">{t('home.section_title')}</h1>
        <SkeletonList rows={3} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-[#1E1B4B]">{t('home.section_title')}</h1>
      {loadError && <p className="rounded-xl bg-[#FEE2E2] p-3 text-sm text-[#991B1B]">{t('networkError')}</p>}
      {creditWarn && (
        <button
          type="button"
          onClick={onOpenCustomers}
          className="cursor-pointer rounded-xl bg-[#FEF3C7] p-3 text-left text-sm text-[#92400E]"
        >
          {t('home.credit_warning')}
        </button>
      )}

      <HomeKpis cashInHand={toNum(shop.cash_in_hand)} toCollect={toCollect} upcomingBills={upcomingBills} />

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[#1E1B4B]">{t('home.forecast_preview')}</h2>
          <button type="button" onClick={onOpenForecast} className="text-xs font-semibold text-[#16A34A]">
            {t('forecast.view_full')}
          </button>
        </div>
        {forecast ? (
          <div className="mt-2 flex flex-col gap-1 text-sm">
            <p className="text-slate-600">
              {t('forecast.lowest_cash')}: <strong>{formatRupees(forecast.lowestBalance)}</strong>
            </p>
            <p className={forecast.hasCashGap ? 'font-semibold text-[#DC2626]' : 'text-slate-600'}>
              {forecast.hasCashGap ? t('forecast.cash_gap_alert') : t('forecast.no_gap')}
            </p>
            {sparkPath && (
              <svg width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} className="mt-1" aria-hidden="true">
                <defs>
                  <linearGradient id="forecast-spark-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={SPARK_W} y2="0">
                    <stop offset="0" stopColor="#16A34A" />
                    <stop offset="1" stopColor="#E5484D" />
                  </linearGradient>
                </defs>
                <polyline
                  points={sparkPath}
                  fill="none"
                  stroke="url(#forecast-spark-grad)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">{t('forecast.error')}</p>
        )}
      </section>

      <HomeReminderQueue rows={queueRows} shopName={shopName} onReminded={handleReminded} />
    </div>
  );
}
