import { useI18n } from '../i18n/I18n';
import { formatRupees } from '../lib/invoiceMath';
import type { AnalyticsResponse } from '../lib/analyticsApi';

export function HealthPdfModal({
  data,
  shopName,
  isFreePlan,
  onClose,
}: {
  data: AnalyticsResponse;
  shopName: string;
  isFreePlan: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const displayShop = shopName || data.shop?.shop_name || '';

  return (
    <div
      className="health-pdf-root fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="health-pdf-card print-only-card w-full max-w-lg rounded-2xl bg-white text-[#1E1B4B] shadow-xl">
        <header className="print:hidden flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold">{t('analytics.pdf_title')}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden rounded-lg bg-[#1E1B4B] px-3 py-1.5 text-sm font-medium text-white"
            >
              {t('analytics.pdf_print')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="print:hidden rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium"
            >
              {t('analytics.pdf_close')}
            </button>
          </div>
        </header>

        <div className="space-y-5 px-5 py-5">
          <section>
            <p className="text-xs uppercase tracking-wide text-slate-500">{t('analytics.pdf_shop')}</p>
            <p className="text-xl font-bold">{displayShop}</p>
          </section>

          <section>
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">{t('analytics.pdf_metrics')}</p>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-slate-500">{t('analytics.kpi_on_time')}</dt>
                <dd className="text-lg font-semibold tabular">{data.onTimeRate}%</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-slate-500">{t('analytics.kpi_avg_days')}</dt>
                <dd className="text-lg font-semibold tabular">{data.avgDaysToCollect}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="text-slate-500">{t('analytics.kpi_outstanding')}</dt>
                <dd className="text-lg font-semibold tabular">{formatRupees(data.totalOutstanding)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wide text-slate-500">{t('analytics.pdf_hash')}</p>
            <p className="font-mono text-xs break-all">{data.summaryHash}</p>
          </section>

          <p className="text-[11px] leading-snug text-slate-500">{t('analytics.pdf_disclaimer')}</p>

          {isFreePlan && (
            <footer className="border-t border-slate-200 pt-3 text-center text-xs text-slate-500">
              {t('analytics.powered_by')}
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
