import { useI18n } from '../../i18n/I18n';
import LandingDashboardPreview from './LandingDashboardPreview';

interface LandingHeroProps {
  onLogin: () => void;
  onStartTrial: () => void;
}

export default function LandingHero({ onLogin, onStartTrial }: LandingHeroProps) {
  const { t } = useI18n();
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
      <div>
        <h1 className="text-4xl font-extrabold leading-tight text-[#1E1B4B] md:text-5xl">
          {t('landing_hero_title')}
        </h1>
        <p className="mt-4 max-w-md text-base text-[#475569]">{t('landing_hero_subtitle')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onStartTrial}
            className="min-h-[44px] rounded-xl bg-[#F59E0B] px-5 font-bold text-[#0F172A] shadow-sm"
          >
            {t('landing_start_trial')}
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="min-h-[44px] rounded-xl border-[1.5px] border-[#1E1B4B] bg-white px-5 font-bold text-[#1E1B4B]"
          >
            {t('landing_login')}
          </button>
        </div>
      </div>
      <div className="flex justify-center md:justify-end">
        <LandingDashboardPreview />
      </div>
    </section>
  );
}

