import { useState, type FormEvent } from 'react';
import { Field } from '../components/FormControls';
import { useI18n } from '../i18n/I18n';
import type { TranslationKey } from '../i18n/translations';
import { updateProfile, type RecurringBillInput, type Shop } from '../lib/shopApi';

type RecurringKey = 'rent' | 'staff' | 'supplier';

const BILL_SPECS: { key: RecurringKey; title: string; category: string; label: TranslationKey }[] = [
  { key: 'rent', title: 'Shop Rent', category: 'Rent', label: 'onb_rent' },
  { key: 'staff', title: 'Staff Salary', category: 'Staff', label: 'onb_staff' },
  { key: 'supplier', title: 'Main Supplier', category: 'Supplier', label: 'onb_supplier' },
];


// Local-date YYYY-MM-DD for `days` from today (avoids the UTC shift of toISOString).
function dateFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const isNonNegative = (s: string) => s.trim() !== '' && Number.isFinite(Number(s)) && Number(s) >= 0;
const isDays = (s: string) => s.trim() !== '' && Number.isInteger(Number(s)) && Number(s) >= 0 && Number(s) <= 365;


export default function OnboardingPage({ shop, onDone }: { shop: Shop; onDone: (shop: Shop) => void }) {
  const { t } = useI18n();
  const [shopName, setShopName] = useState(shop.shop_name ?? '');
  const [ownerName, setOwnerName] = useState(shop.owner_name ?? '');
  const [startingCash, setStartingCash] = useState('0');
  const [creditLimit, setCreditLimit] = useState('15000');
  const [dueDays, setDueDays] = useState('30');
  const [amounts, setAmounts] = useState<Record<RecurringKey, string>>({ rent: '', staff: '', supplier: '' });
  const [dueDate, setDueDate] = useState(() => dateFromToday(7));
  const [shopError, setShopError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Numeric validity drives the disabled state; shopName is checked on submit so its message can show.
  const cashOk = isNonNegative(startingCash);
  const creditOk = isNonNegative(creditLimit);
  const dueDaysOk = isDays(dueDays);
  const billsOk = BILL_SPECS.every((s) => amounts[s.key].trim() === '' || isNonNegative(amounts[s.key]));
  const hasBill = BILL_SPECS.some((s) => Number(amounts[s.key]) > 0);
  const dateOk = !hasBill || dueDate !== '';
  const formValid = cashOk && creditOk && dueDaysOk && billsOk && dateOk;

  function buildRecurring(): RecurringBillInput[] {
    return BILL_SPECS.filter((s) => Number(amounts[s.key]) > 0).map((s) => ({
      title: s.title,
      category: s.category,
      amount: Number(amounts[s.key]),
      dueDate,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (shopName.trim() === '') {
      setShopError(t('auth_required'));
      return;
    }
    if (!formValid) return;

    setShopError(null);
    setError(null);
    setBusy(true);
    try {
      const res = await updateProfile({
        shop_name: shopName.trim(),
        owner_name: ownerName.trim(),
        cash_in_hand: Number(startingCash),
        default_credit_limit: Number(creditLimit),
        default_due_days: Number(dueDays),
        onboarded: true,
        recurringBills: buildRecurring(),
      });
      onDone(res.shop);
    } catch {
      setError(t('networkError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-[#F8FAFC] px-4 py-6">
      <section className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-extrabold text-[#1E1B4B]">{t('onb_title')}</h1>
        <p className="mb-5 text-sm text-slate-600">{t('onb_subtitle')}</p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Field id="shopName" label={t('auth_shopName')} value={shopName}
              onChange={(e) => setShopName(e.target.value)} autoComplete="organization" />
            {shopError && <p className="text-sm font-semibold text-[#DC2626]">{shopError}</p>}
          </div>
          <Field id="ownerName" label={t('auth_ownerName')} value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)} autoComplete="name" />

          <Field id="startingCash" label={t('onb_startingCash')} type="number" inputMode="numeric" min={0}
            value={startingCash} onChange={(e) => setStartingCash(e.target.value)} />
          <Field id="creditLimit" label={t('onb_creditLimit')} type="number" inputMode="numeric" min={0}
            value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
          <Field id="dueDays" label={t('onb_dueDays')} type="number" inputMode="numeric" min={0} max={365}
            value={dueDays} onChange={(e) => setDueDays(e.target.value)} />

          <fieldset className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] p-4">
            <legend className="px-1 text-sm font-bold text-[#1E1B4B]">{t('onb_recurring')}</legend>
            {BILL_SPECS.map((s) => (
              <Field key={s.key} id={`recurring-${s.key}`} label={t(s.label)} type="number" inputMode="numeric"
                min={0} value={amounts[s.key]}
                onChange={(e) => setAmounts((prev) => ({ ...prev, [s.key]: e.target.value }))} />
            ))}
            <Field id="dueDate" label={t('onb_dueDate')} type="date" value={dueDate}
              onChange={(e) => setDueDate(e.target.value)} />
          </fieldset>

          {error && (
            <p role="alert" className="text-sm font-semibold text-[#DC2626]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !formValid}
            className="min-h-[44px] w-full rounded-xl bg-[#F59E0B] px-4 font-bold text-[#0F172A] shadow-sm disabled:opacity-60"
          >
            {busy ? t('onb_saving') : t('onb_save')}
          </button>
        </form>
      </section>
    </main>
  );
}
