import { useI18n } from '../../i18n/I18n';

const FEATURES = [
  { title: 'landing_feat_forecast_title', text: 'landing_feat_forecast_text' },
  { title: 'landing_feat_upi_title', text: 'landing_feat_upi_text' },
  { title: 'landing_feat_sms_title', text: 'landing_feat_sms_text' },
  { title: 'landing_feat_whatsapp_title', text: 'landing_feat_whatsapp_text' },
] as const;

export default function LandingFeatures() {
  const { t } = useI18n();
  return (
    <section id="features" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-12">
      <h2 className="mb-6 text-2xl font-extrabold text-[#1E1B4B]">{t('landing_features_title')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <article key={f.title} className="soft-brutal-card rounded-2xl bg-white p-5">
            <span aria-hidden="true" className="mb-3 block h-1 w-12 rounded-full bg-[#F59E0B]" />
            <h3 className="text-lg font-bold text-[#1E1B4B]">{t(f.title)}</h3>
            <p className="mt-1 text-sm text-[#475569]">{t(f.text)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

