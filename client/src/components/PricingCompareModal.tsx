import { useI18n } from '../i18n/I18n';
import type { TranslationKey } from '../i18n/translations';

interface PricingCompareModalProps {
  onClose: () => void;
}

// Each row lists the translation keys for the three columns: 14-Day Trial, Free Starter, Pro.
const ROWS: { label: TranslationKey; cells: TranslationKey[] }[] = [
  { label: 'pricing.row_price', cells: ['pricing.price_trial', 'pricing.price_free', 'pricing.price_pro'] },
  { label: 'pricing.row_invoices', cells: ['pricing.inv_trial', 'pricing.inv_free', 'pricing.inv_pro'] },
  { label: 'pricing.row_watermark', cells: ['pricing.wm_trial', 'pricing.wm_free', 'pricing.wm_pro'] },
];

const COLUMNS: TranslationKey[] = ['pricing.col_trial', 'pricing.col_free', 'pricing.col_pro'];
const PRO_INDEX = 2;

export default function PricingCompareModal({ onClose }: PricingCompareModalProps) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-compare-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#1E1B4B] px-5 py-4 text-white sm:rounded-t-2xl">
          <h2 id="pricing-compare-title" className="text-lg font-bold">
            {t('pricing.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('pricing.close')}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/10 font-bold text-white"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          {COLUMNS.map((col, i) => {
            const pro = i === PRO_INDEX;
            return (
              <section
                key={col}
                className={`flex flex-col gap-3 rounded-2xl border-2 border-[#1E1B4B] p-4 shadow-[4px_4px_0_#F59E0B] ${
                  pro ? 'bg-[#1E1B4B] text-white' : 'bg-white text-[#1E1B4B]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold">{t(col)}</h3>
                  {pro && (
                    <span className="rounded-full bg-[#F59E0B] px-2 py-0.5 text-xs font-bold text-[#0F172A]">{t('pricing.save16')}</span>
                  )}
                </div>
                <ul className="flex flex-col gap-3 text-sm">
                  {ROWS.map((row) => (
                    <li key={row.label} className="flex gap-2">
                      <span aria-hidden="true" className={`font-bold ${pro ? 'text-[#22C55E]' : 'text-slate-400'}`}>
                        {pro ? '✓' : '•'}
                      </span>
                      <span className="flex flex-col">
                        <span className={`text-xs ${pro ? 'text-white/70' : 'text-slate-500'}`}>{t(row.label)}</span>
                        <span className="font-semibold">{t(row.cells[i])}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {pro && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-auto min-h-[44px] w-full rounded-xl bg-[#F59E0B] px-4 font-bold text-[#0F172A]"
                  >
                    {t('pricing.cta')}
                  </button>
                )}
              </section>
            );
          })}
        </div>

        <div className="px-5 pb-5">
          <p className="text-center text-xs text-slate-500">{t('pricing.upgradeNote')}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 min-h-[44px] w-full rounded-xl border-2 border-[#1E1B4B] px-4 font-bold text-[#1E1B4B]"
          >
            {t('pricing.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
