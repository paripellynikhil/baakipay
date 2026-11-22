import { useI18n } from '../i18n/I18n';
import { BUFFER_PILLS, inr, parseBuffer } from '../lib/safeBuffer';

export interface SafeBufferControlProps {
  value: number;
  onChange: (next: number) => void;
}

// Compact safe-cash-buffer picker: quick pills plus a custom rupee input.
export default function SafeBufferControl({ value, onChange }: SafeBufferControlProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-500">{t('forecast.buffer_label')}</p>
      <div className="flex flex-wrap items-center gap-2">
        {BUFFER_PILLS.map((amt) => {
          const active = amt === value;
          return (
            <button
              key={amt}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(amt)}
              className={`inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold ${
                active ? 'bg-[#1E1B4B] text-white' : 'border border-[#E2E8F0] bg-white text-[#1E1B4B]'
              }`}
            >
              ₹{inr(amt)}
            </button>
          );
        })}
        <label className="flex items-center gap-1 text-sm text-slate-600">
          <span aria-hidden="true">₹</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            value={value}
            aria-label={t('forecast.buffer_custom')}
            onChange={(e) => onChange(parseBuffer(e.target.value))}
            className="min-h-[44px] w-28 rounded-xl border border-[#E2E8F0] bg-white px-2 text-sm text-[#1E1B4B]"
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">{t('forecast.buffer_help')}</p>
    </div>
  );
}
