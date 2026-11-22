import { useI18n } from '../../i18n/I18n';

export default function LandingAbout() {
  const { t } = useI18n();
  return (
    <section id="about" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-12">
      <div className="soft-brutal-card rounded-2xl bg-white p-6">
        <h2 className="text-2xl font-extrabold text-[#1E1B4B]">{t('landing_about_title')}</h2>
        <p className="mt-2 text-sm text-[#475569]">{t('landing_about_text')}</p>
        <ul className="mt-4 space-y-2 text-sm font-semibold text-[#1E1B4B]">
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-[#F59E0B]">■</span>
            {t('landing_privacy_1')}
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-[#F59E0B]">■</span>
            {t('landing_privacy_2')}
          </li>
        </ul>
      </div>
    </section>
  );
}

