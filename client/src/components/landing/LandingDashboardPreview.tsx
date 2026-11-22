import { useI18n } from '../../i18n/I18n';

// Static sample numbers for the marketing mock. Not real shop data.
const KPIS = [
  { key: 'landing_preview_cash', value: '₹42,300', accent: 'bg-[#1E1B4B]' },
  { key: 'landing_preview_collect', value: '₹18,750', accent: 'bg-[#F59E0B]' },
  { key: 'landing_preview_bills', value: '₹9,200', accent: 'bg-[#64748B]' },
] as const;

const BARS = [38, 52, 44, 66, 58, 74, 62, 81, 70, 88, 76, 94];

export default function LandingDashboardPreview() {
  const { t } = useI18n();
  return (
    <div
      aria-hidden="true"
      className="soft-brutal-card w-full max-w-md rounded-2xl bg-white p-4"
      style={{ border: '1.5px solid #1E1B4B', boxShadow: '4px 4px 0 #F59E0B' }}
    >
      <p className="mb-3 text-sm font-bold text-[#1E1B4B]">{t('landing_preview_title')}</p>
      <div className="grid grid-cols-3 gap-2">
        {KPIS.map((k) => (
          <div key={k.key} className="relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2">
            <span className={`absolute inset-x-0 top-0 h-1 ${k.accent}`} />
            <p className="mt-1 text-[11px] text-[#64748B]">{t(k.key)}</p>
            <p className="tabular text-sm font-bold text-[#1E1B4B]">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p className="mb-1 text-xs font-semibold text-[#64748B]">{t('landing_preview_forecast')}</p>
        <div className="flex h-24 items-end gap-1 rounded-xl bg-[#F8FAFC] p-2">
          {BARS.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${i === BARS.length - 1 ? 'bg-[#F59E0B]' : 'bg-[#1E1B4B]/80'}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

