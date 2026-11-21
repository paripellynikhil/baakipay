import { useI18n } from '../i18n/I18n';
import type { TranslationKey } from '../i18n/translations';
import { formatRupees } from '../lib/invoiceMath';

export interface WhatIfToggles {
  delayTop: boolean;
  badDay5: boolean;
  extraCredit15k: boolean;
}

export interface WhatIfCardProps {
  available: boolean;
  toggles: WhatIfToggles;
  onChange: (next: WhatIfToggles) => void;
  normalLowest: number;
  simLowest: number | null;
  onUpgrade?: () => void;
}

const TOGGLE_ROWS: { key: keyof WhatIfToggles; label: TranslationKey }[] = [
  { key: 'delayTop', label: 'forecast.whatif_late_top' },
  { key: 'badDay5', label: 'forecast.whatif_bad_day' },
  { key: 'extraCredit15k', label: 'forecast.whatif_extra_credit' },
];

export default function WhatIfCard({ available, toggles, onChange, normalLowest, simLowest, onUpgrade }: WhatIfCardProps) {
  const { t } = useI18n();

  if (!available) {
    const note = t('forecast.upgrade_note');
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
        {onUpgrade ? (
          <button type="button" onClick={onUpgrade} className="min-h-[44px] text-left text-sm font-semibold text-[#1E1B4B] underline">
            {note}
          </button>
        ) : (
          <p className="text-sm text-slate-500">{note}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('forecast.whatif_title')}</h2>

      {TOGGLE_ROWS.map(({ key, label }) => (
        <div key={key} className="flex flex-col">
          <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3">
            <span className="text-sm text-[#1E1B4B]">{t(label)}</span>
            <span className="relative h-6 w-11 shrink-0">
              <input
                type="checkbox"
                role="switch"
                className="peer sr-only"
                checked={toggles[key]}
                onChange={(e) => onChange({ ...toggles, [key]: e.target.checked })}
              />
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-[#16A34A]" />
              <span
                aria-hidden="true"
                className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"
              />
            </span>
          </label>
          {key === 'extraCredit15k' && (
            <p className="text-xs text-slate-500">{t('forecast.whatif_extra_credit_help')}</p>
          )}
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3 border-t border-[#E2E8F0] pt-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{t('forecast.normal_vs_sim')}</p>
          <p className="text-base font-bold text-[#1E1B4B]">{formatRupees(normalLowest)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">{t('forecast.lowest_cash')}</p>
          <p className="text-base font-bold text-[#F59E0B]">{simLowest === null ? '—' : formatRupees(simLowest)}</p>
        </div>
      </div>
    </div>
  );
}
