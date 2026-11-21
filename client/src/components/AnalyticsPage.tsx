import { useEffect, useState } from 'react';
import { HealthPdfModal } from './HealthPdfModal';
import { buildSmartTips } from './analyticsTips';
import { SkeletonList } from './Skeletons';
import { useI18n } from '../i18n/I18n';
import { fetchAnalytics, type AnalyticsResponse } from '../lib/analyticsApi';
import { formatRupees } from '../lib/invoiceMath';
import { getProfile } from '../lib/shopApi';

export function AnalyticsPage() {
  const { t } = useI18n();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState('');
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Profile is optional for this screen: if it fails, the analytics still render.
    Promise.all([fetchAnalytics(), getProfile().catch(() => null)])
      .then(([res, profile]) => {
        if (cancelled) return;
        setData(res.data);
        setOffline(res.offline);
        if (profile) {
          setShopName(profile.data.shop.shop_name ?? '');
          setIsFreePlan(profile.data.effectivePlan === 'free');
        }
      })
      .catch(() => {
        // Nothing cached and the request failed: the page stays empty.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <SkeletonList rows={4} />;
  if (!data) return null;

  const kpis = [
    { label: t('analytics.kpi_on_time'), value: `${data.onTimeRate}%` },
    { label: t('analytics.kpi_avg_days'), value: String(data.avgDaysToCollect) },
    { label: t('analytics.kpi_outstanding'), value: formatRupees(data.totalOutstanding) },
  ];
  const maxBar = Math.max(1, ...data.months.flatMap((m) => [m.invoiced, m.collected]));
  const smartTips = buildSmartTips(data, t);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-[#1E1B4B]">{t('analytics.pill_health')}</h1>

      {offline && (
        <p className="rounded-xl bg-[#FEF3C7] p-3 text-sm text-[#92400E]">{t('analytics.offline')}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <p className="text-xs font-semibold text-[#64748B]">{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1E1B4B]">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-[#1E1B4B]">{t('analytics.chart_title')}</h2>
        <div className="flex h-40 items-end gap-3">
          {data.months.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end justify-center gap-1">
                <div
                  className="w-3 rounded-t bg-[#1E1B4B]"
                  style={{ height: `${(m.invoiced / maxBar) * 100}%` }}
                  title={`${formatRupees(m.invoiced)}`}
                />
                <div
                  className="w-3 rounded-t bg-[#16A34A]"
                  style={{ height: `${(m.collected / maxBar) * 100}%` }}
                  title={`${formatRupees(m.collected)}`}
                />
              </div>
              <span className="text-xs text-[#64748B]">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-[#1E1B4B]">{t('analytics.overdue_title')}</h2>
        {data.topOverdue.length === 0 ? (
          <p className="text-sm text-[#64748B]">{t('analytics.overdue_empty')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-[#E2E8F0]">
            {data.topOverdue.map((c) => (
              <li key={c.customer_id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-[#1E1B4B]">{c.name}</span>
                <span className="font-semibold text-[#DC2626]">{formatRupees(c.outstanding)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-[#1E1B4B]">{t('analytics.tips_title')}</h2>
        <ul className="list-disc pl-5 text-sm text-[#334155]">
          {smartTips.map((tip) => (
            <li key={tip.id}>{tip.text}</li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] rounded-xl bg-[#1E1B4B] px-4 text-sm font-semibold text-white"
      >
        {t('analytics.pdf_button')}
      </button>

      {open && (
        <HealthPdfModal
          data={data}
          shopName={shopName}
          isFreePlan={isFreePlan}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}
