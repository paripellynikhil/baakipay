import { useI18n } from '../../i18n/I18n';

interface LandingPricingProps {
  onStartTrial: () => void;
}

interface BulletProps {
  marker: '✓' | '•';
  text: string;
  dark?: boolean;
}

// One feature line: ✓ = included (green), • = limit (muted). Marker is its own span so text stays translatable.
function Bullet({ marker, text, dark = false }: BulletProps) {
  const markerTone = marker === '✓'
    ? (dark ? 'text-[#4ADE80]' : 'text-[#16A34A]')
    : (dark ? 'text-white/60' : 'text-[#94A3B8]');
  return (
    <li className="flex items-start gap-2 text-sm">
      <span aria-hidden="true" className={`font-bold ${markerTone}`}>{marker}</span>
      <span className={dark ? 'text-white/90' : 'text-[#334155]'}>{text}</span>
    </li>
  );
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
          <ul className="mt-4 flex flex-col gap-2">
            <Bullet marker="✓" text={t('landing_price_trial_inc_1')} />
            <Bullet marker="✓" text={t('landing_price_trial_inc_2')} />
            <Bullet marker="•" text={t('landing_price_trial_lim_1')} />
            <Bullet marker="•" text={t('landing_price_trial_lim_2')} />
          </ul>
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
          <ul className="mt-4 flex flex-col gap-2">
            <Bullet marker="✓" text={t('landing_price_free_inc_1')} />
            <Bullet marker="✓" text={t('landing_price_free_inc_2')} />
            <Bullet marker="•" text={t('landing_price_free_lim_1')} />
            <Bullet marker="•" text={t('landing_price_free_lim_2')} />
          </ul>
        </article>
        <article className="soft-brutal-card flex flex-col rounded-2xl bg-[#1E1B4B] p-5 text-white">
          <h3 className="text-base font-bold">{t('landing_price_pro_name')}</h3>
          <p className="tabular mt-3 text-3xl font-extrabold">{t('landing_price_pro_price')}</p>
          <p className="mt-1 text-sm text-white/80">{t('landing_price_pro_yearly')}</p>
          <span className="mt-2 w-fit rounded-full bg-[#F59E0B] px-2 py-0.5 text-xs font-bold text-[#0F172A]">
            {t('landing_price_pro_badge')}
          </span>
          <ul className="mt-4 flex flex-col gap-2">
            <Bullet marker="✓" text={t('landing_price_pro_inc_1')} dark />
            <Bullet marker="✓" text={t('landing_price_pro_inc_2')} dark />
            <Bullet marker="✓" text={t('landing_price_pro_inc_3')} dark />
            <Bullet marker="✓" text={t('landing_price_pro_inc_4')} dark />
          </ul>
        </article>
      </div>
      <details className="mt-6 rounded-2xl border border-[#1E1B4B]/10 bg-white p-4">
        <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-bold text-[#1E1B4B]">
          {t('landing_terms_toggle')}
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#475569]">
          <li>{t('landing_terms_1')}</li>
          <li>{t('landing_terms_2')}</li>
          <li>{t('landing_terms_3')}</li>
          <li>{t('landing_terms_4')}</li>
        </ul>
      </details>
    </section>
  );
}
