import { useI18n } from '../../i18n/I18n';

interface LandingPricingProps {
  onStartTrial: () => void;
}

export default function LandingPricing({ onStartTrial }: LandingPricingProps) {
  const { t } = useI18n();
  return (
    <section id="pricing" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-12">
      <h2 className="mb-6 text-2xl font-extrabold text-[#1E1B4B]">{t('landing_pricing_title')}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="soft-brutal-card flex flex-col rounded-2xl bg-white p-5">
          <h3 className="text-base font-bold text-[#1E1B4B]">{t('landing_price_trial_name')}</h3>
          <p className="tabular mt-3 text-3xl font-extrabold text-[#1E1B4B]">{t('landing_price_trial_price')}</p>
          <p className="mt-1 text-sm text-[#475569]">{t('landing_price_trial_note')}</p>
          <button
            type="button"
            onClick={onStartTrial}
            className="mt-auto min-h-[44px] rounded-xl bg-[#F59E0B] px-4 pt-0 font-bold text-[#0F172A] shadow-sm"
          >
            {t('landing_start_trial')}
          </button>
        </article>
        <article className="soft-brutal-card flex flex-col rounded-2xl bg-white p-5">
          <h3 className="text-base font-bold text-[#1E1B4B]">{t('landing_price_free_name')}</h3>
          <p className="tabular mt-3 text-3xl font-extrabold text-[#1E1B4B]">{t('landing_price_free_price')}</p>
          <p className="mt-1 text-sm text-[#475569]">{t('landing_price_free_note')}</p>
        </article>
        <article className="soft-brutal-card flex flex-col rounded-2xl bg-[#1E1B4B] p-5 text-white">
          <h3 className="text-base font-bold">{t('landing_price_pro_name')}</h3>
          <p className="tabular mt-3 text-3xl font-extrabold">{t('landing_price_pro_price')}</p>
          <p className="mt-1 text-sm text-white/80">{t('landing_price_pro_yearly')}</p>
        </article>
      </div>
    </section>
  );
}

