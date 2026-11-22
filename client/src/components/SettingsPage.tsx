import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react';
import { useI18n } from '../i18n/I18n';
import type { TranslationKey } from '../i18n/translations';
import { updateProfile, type Shop } from '../lib/shopApi';
import { downloadShopBackup } from '../lib/shopBackup';
import { Field, inputClass, linkClass, primaryClass } from './FormControls';
import PricingCompareModal from './PricingCompareModal';
import SettingsHelpCard from './SettingsHelpCard';
import ShopBusinessCard from './ShopBusinessCard';
import { Toast } from './Toast';

interface SettingsPageProps {
  shop: Shop;
  onLogout: () => void;
}

interface ProfileForm {
  shop_name: string;
  owner_name: string;
  bio: string;
  address: string;
  upi_id: string;
  cash_in_hand: string;
  default_due_days: string;
  default_credit_limit: string;
}

// Trial wins while it is running; otherwise a pro plan shows Pro, anything else is Free Starter.
function planLabelKey(shop: Shop): TranslationKey {
  const trialEnd = Date.parse(shop.trial_expires_at);
  if (!Number.isNaN(trialEnd) && trialEnd > Date.now()) return 'settings.plan_trial';
  if (shop.plan === 'pro') return 'settings.plan_pro';
  return 'settings.plan_free';
}

function toForm(shop: Shop): ProfileForm {
  return {
    shop_name: shop.shop_name ?? '',
    owner_name: shop.owner_name ?? '',
    bio: shop.bio ?? '',
    address: shop.address ?? '',
    upi_id: shop.upi_id ?? '',
    cash_in_hand: String(shop.cash_in_hand),
    default_due_days: String(shop.default_due_days),
    default_credit_limit: String(shop.default_credit_limit),
  };
}

function hasValidNumbers(f: ProfileForm): boolean {
  const filled = [f.cash_in_hand, f.default_due_days, f.default_credit_limit].every((v) => v.trim() !== '');
  const cash = Number(f.cash_in_hand);
  const limit = Number(f.default_credit_limit);
  const days = Number(f.default_due_days);
  return filled && cash >= 0 && limit >= 0 && Number.isInteger(days) && days >= 0 && days <= 365;
}

export default function SettingsPage({ shop, onLogout }: SettingsPageProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<ProfileForm>(() => toForm(shop));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const clearToast = useCallback(() => setToast(null), []);

  function setField(key: keyof ProfileForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  // Plan and trial are never sent; the server treats them as read-only.
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hasValidNumbers(form)) {
      setError(t('settings.invalid_number'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        shop_name: form.shop_name.trim(),
        owner_name: form.owner_name.trim(),
        bio: form.bio.trim(),
        address: form.address.trim(),
        upi_id: form.upi_id.trim(),
        cash_in_hand: Number(form.cash_in_hand),
        default_due_days: Number(form.default_due_days),
        default_credit_limit: Number(form.default_credit_limit),
      });
      setToast(t('saved'));
    } catch {
      setError(t('settings.save_error'));
    } finally {
      setSaving(false);
    }
  }

  const address = form.address.trim();
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">{t('settings.plan_label')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-fit rounded-full bg-[#1E1B4B] px-3 py-1 text-sm font-semibold text-white">{t(planLabelKey(shop))}</span>
          <button type="button" onClick={() => setCompareOpen(true)} className={`${linkClass} w-fit`}>{t('pricing.compare')}</button>
        </div>
        <p className="text-xs text-slate-500">{t('settings.plan_readonly')}</p>
      </div>

      <ShopBusinessCard info={form} phone={shop.email_or_phone} />

      <form onSubmit={(e) => void handleSave(e)} className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <Field id="settings-shop-name" label={t('settings.shop_name')} value={form.shop_name} onChange={setField('shop_name')} />
        <Field id="settings-owner-name" label={t('settings.owner_name')} value={form.owner_name} onChange={setField('owner_name')} />
        <div className="flex flex-col gap-1">
          <label htmlFor="settings-bio" className="text-sm font-semibold text-[#1E1B4B]">
            {t('settings.bio')}
          </label>
          <textarea
            id="settings-bio"
            rows={3}
            className={`${inputClass} py-2`}
            value={form.bio}
            onChange={setField('bio')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Field id="settings-address" label={t('settings.address')} value={form.address} onChange={setField('address')} />
          {address !== '' && (
            <a href={mapsHref} target="_blank" rel="noopener noreferrer" className={`${linkClass} w-fit`}>
              {t('settings.address_maps')}
            </a>
          )}
        </div>
        <Field id="settings-upi-id" label={t('settings.upi_id')} value={form.upi_id} onChange={setField('upi_id')} />
        <Field
          id="settings-cash-in-hand"
          label={t('settings.cash_in_hand')}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={form.cash_in_hand}
          onChange={setField('cash_in_hand')}
        />
        <Field
          id="settings-due-days"
          label={t('settings.due_days')}
          type="number"
          inputMode="numeric"
          min={0}
          max={365}
          step={1}
          value={form.default_due_days}
          onChange={setField('default_due_days')}
        />
        <Field
          id="settings-credit-limit"
          label={t('settings.credit_limit')}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={form.default_credit_limit}
          onChange={setField('default_credit_limit')}
        />
        {error && (
          <p role="alert" className="text-sm font-semibold text-[#DC2626]">
            {error}
          </p>
        )}
        <button type="submit" disabled={saving} className={primaryClass}>
          {saving ? t('settings.saving') : t('settings.save')}
        </button>
      </form>

      <SettingsHelpCard />

      <button type="button" onClick={() => void downloadShopBackup().catch(() => setError(t('settings.backup_error')))} className="min-h-[44px] w-full rounded-xl border border-[#E2E8F0] bg-white px-4 font-bold text-[#1E1B4B] shadow-sm">{t('settings.backup_button')}</button>

      <button
        type="button"
        onClick={onLogout}
        className="min-h-[44px] w-full rounded-xl border border-[#E2E8F0] bg-white px-4 font-bold text-[#DC2626] shadow-sm"
      >
        {t('settings_logout')}
      </button>

      {compareOpen && <PricingCompareModal onClose={() => setCompareOpen(false)} />}
      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
