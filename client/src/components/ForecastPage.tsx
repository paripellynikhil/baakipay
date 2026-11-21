import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { AnalyticsPage } from './AnalyticsPage';
import ForecastChart from '../components/ForecastChart';
import { SkeletonList } from '../components/Skeletons';
import WhatIfCard, { type WhatIfToggles } from '../components/WhatIfCard';
import { useI18n } from '../i18n/I18n';
import type { TranslationKey } from '../i18n/translations';
import { fetchForecast, type ForecastResponse } from '../lib/forecastApi';
import { formatRupees } from '../lib/invoiceMath';

const HORIZONS: { days: number; label: TranslationKey }[] = [
  { days: 7, label: 'forecast.horizon_7' },
  { days: 30, label: 'forecast.horizon_30' },
  { days: 60, label: 'forecast.horizon_60' },
  { days: 90, label: 'forecast.horizon_90' },
];
const PRO_DAYS = [30, 60, 90];
const FREE_DAYS = 7;
const DEFAULT_TOGGLES: WhatIfToggles = { delayTop: false, badDay5: false, extraCredit15k: false };

export default function ForecastPage() {
  const { t } = useI18n();
  const [days, setDays] = useState(30);
  const [toggles, setToggles] = useState<WhatIfToggles>(DEFAULT_TOGGLES);
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<'forecast' | 'health'>('forecast');

  const { delayTop, badDay5, extraCredit15k } = toggles;
  // Lock state is known only after a response; the server reports the effective plan.
  const isFree = data?.effectivePlan === 'free';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetchForecast({ days, delayTop, badDay5, extraCredit15k })
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setOffline(res.offline);
        // Free plan: the server clamps to 7 days, so follow it.
        if (res.data.effectivePlan === 'free' && days !== FREE_DAYS) setDays(FREE_DAYS);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days, delayTop, badDay5, extraCredit15k]);

  function selectDays(next: number) {
    if (isFree && PRO_DAYS.includes(next)) return;
    setDays(next);
  }

  const hasGap = data?.hasCashGap ?? false;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(['forecast', 'health'] as const).map((key) => {
          const active = view === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => setView(key)}
              className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl px-3 text-sm font-semibold ${
                active ? 'bg-[#1E1B4B] text-white' : 'border border-[#E2E8F0] bg-white text-[#1E1B4B]'
              }`}
            >
              {t(key === 'forecast' ? 'analytics.pill_forecast' : 'analytics.pill_health')}
            </button>
          );
        })}
      </div>

      {view === 'health' ? (
        <AnalyticsPage />
      ) : (
        <>
          <h1 className="text-xl font-bold text-[#1E1B4B]">{t('forecast.title')}</h1>

          <div className="flex flex-wrap gap-2">
            {HORIZONS.map(({ days: d, label }) => {
              const locked = isFree && PRO_DAYS.includes(d);
              const active = d === days;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  aria-disabled={locked || undefined}
                  onClick={() => selectDays(d)}
                  className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl px-3 text-sm font-semibold ${
                    active ? 'bg-[#1E1B4B] text-white' : 'border border-[#E2E8F0] bg-white text-[#1E1B4B]'
                  } ${locked ? 'opacity-60' : ''}`}
                >
                  {t(label)}
                  {locked && <Lock size={14} aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {offline && <p className="text-xs text-slate-500">{t('offlineBanner')}</p>}
          {isFree && <p className="text-sm text-slate-600">{t('forecast.pro_lock')}</p>}

          {loading ? (
            <SkeletonList rows={4} />
          ) : failed || !data ? (
            <p role="alert" className="text-sm font-semibold text-[#DC2626]">
              {t('forecast.error')}
            </p>
          ) : (
            <>
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3">
                <ForecastChart points={data.points} simulated={data.simulated?.points ?? null} />
              </div>

              <div
                role="status"
                className={`flex flex-col gap-1 rounded-2xl border p-4 ${
                  hasGap ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                }`}
              >
                <p className={`text-sm font-bold ${hasGap ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {hasGap ? t('forecast.cash_gap_alert') : t('forecast.no_gap')}
                </p>
                <p className="text-sm text-slate-700">
                  {t('forecast.lowest_cash')}: <strong>{formatRupees(data.lowestBalance)}</strong> · {t('forecast.lowest_on')}{' '}
                  {data.lowestDate}
                </p>
              </div>

              {data.noExpenses && (
                <p className="rounded-xl bg-[#FEF3C7] p-3 text-sm text-[#92400E]">{t('forecast.no_expenses_banner')}</p>
              )}

              <WhatIfCard
                available={data.whatIfAvailable}
                toggles={toggles}
                onChange={setToggles}
                normalLowest={data.lowestBalance}
                simLowest={data.simulated?.lowestBalance ?? null}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}
