import { useI18n } from '../i18n/I18n';
import { formatRupees } from '../lib/invoiceMath';

interface Props {
  cashInHand: number;
  toCollect: number;
  upcomingBills: number;
}

function KpiCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} aria-hidden="true" />
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#1E1B4B]">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function HomeKpis({ cashInHand, toCollect, upcomingBills }: Props) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCard label={t('home.kpi_cash_in_hand')} value={formatRupees(cashInHand)} accent="#16A34A" />
      <KpiCard label={t('home.kpi_to_collect')} value={formatRupees(toCollect)} accent="#F59E0B" />
      <KpiCard
        label={t('home.kpi_upcoming_bills')}
        value={formatRupees(upcomingBills)}
        hint={t('home.kpi_upcoming_hint')}
        accent="#E5484D"
      />
    </div>
  );
}
