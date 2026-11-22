import { useI18n } from '../i18n/I18n';
import type { TranslationKey } from '../i18n/translations';
import { linkClass } from './FormControls';

interface PricingCompareModalProps {
  onClose: () => void;
}

// Each row lists the translation keys for the three columns: 14-Day Trial, Free Starter, Pro.
const ROWS: { label: TranslationKey; cells: TranslationKey[] }[] = [
  { label: 'pricing.row_price', cells: ['pricing.price_trial', 'pricing.price_free', 'pricing.price_pro'] },
  { label: 'pricing.row_invoices', cells: ['pricing.inv_trial', 'pricing.inv_free', 'pricing.inv_pro'] },
  { label: 'pricing.row_watermark', cells: ['pricing.wm_trial', 'pricing.wm_free', 'pricing.wm_pro'] },
];

export default function PricingCompareModal({ onClose }: PricingCompareModalProps) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-compare-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="pricing-compare-title" className="text-lg font-bold text-[#1E1B4B]">
            {t('pricing.title')}
          </h2>
          <button type="button" onClick={onClose} className={linkClass} aria-label={t('pricing.close')}>
            ✕
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm text-[#1E1B4B]">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th scope="col" className="p-2" />
                <th scope="col" className="p-2 font-bold">{t('pricing.col_trial')}</th>
                <th scope="col" className="p-2 font-bold">{t('pricing.col_free')}</th>
                <th scope="col" className="p-2 font-bold">{t('pricing.col_pro')}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-[#E2E8F0]">
                  <th scope="row" className="p-2 font-semibold">{t(row.label)}</th>
                  {row.cells.map((cell) => (
                    <td key={cell} className="p-2">{t(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">{t('pricing.upgradeNote')}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 min-h-[44px] w-full rounded-xl border border-[#E2E8F0] px-4 font-bold text-[#1E1B4B]"
        >
          {t('pricing.close')}
        </button>
      </div>
    </div>
  );
}
